"""
Unit tests for the dynamic wait time feature.

Covers:
  1. Order.get_dynamic_wait_time() — model method
     - Returns 0 for terminal states (READY, COMPLETED, REJECTED, REFUNDED)
     - Returns 0 when no orders are ahead
     - Returns correct value based on FIFO queue position
     - Correctly isolates orders per canteen
     - Only counts PENDING and ACCEPTED orders (not READY/COMPLETED/etc.)
     - WAIT_TIME_PER_ORDER constant is respected

  2. GET /api/orders/<order_id>/wait-time/ — API view
     - 404 when order does not exist
     - 403 when a customer requests another customer's order
     - 403 when a manager requests an order from another canteen
     - 200 with correct payload for the owning customer
     - 200 with correct payload for the correct manager
"""

import datetime
"""
Unit and component tests for the orders app.

Covers:
  - Order model (state machine transitions, calculate_total)
  - Order service (place_order, accept, reject+refund, cancel flow, complete, rate)
  - Payment service (authorize, process, refund)
  - API endpoints (place, history, pending, active, accept, reject, ready, complete, cancel, rate)
"""

from decimal import Decimal

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from apps.users.models import User, CustomerProfile, CanteenManagerProfile
from apps.canteens.models import Canteen
from apps.orders.models import Order


# ---------------------------------------------------------------------------
# Helper factories
# ---------------------------------------------------------------------------

def make_user(email, role=User.Role.CUSTOMER, password="pass1234"):
    user = User.objects.create_user(email=email, password=password, role=role)
    user.is_verified = True
    user.save()
    return user


def make_customer(email):
    user = make_user(email, role=User.Role.CUSTOMER)
    profile = CustomerProfile.objects.create(user=user, name=email.split("@")[0])
    return user, profile


def make_manager(email):
    user = make_user(email, role=User.Role.MANAGER)
    profile = CanteenManagerProfile.objects.create(user=user)
    return user, profile


def make_canteen(manager_profile, name="Test Canteen"):
    return Canteen.objects.create(
        name=name,
        location="Block A",
        opening_time=datetime.time(8, 0),
        closing_time=datetime.time(22, 0),
        status=Canteen.Status.ACTIVE,
        manager=manager_profile,
    )


def make_order(customer_profile, canteen, status=Order.Status.PENDING, minutes_ago=0):
    """Create an Order, optionally backdating book_time."""
    order = Order.objects.create(
        customer=customer_profile,
        canteen=canteen,
        status=status,
    )
    if minutes_ago:
        # Override auto_now_add by using update()
        back = timezone.now() - datetime.timedelta(minutes=minutes_ago)
        Order.objects.filter(pk=order.pk).update(book_time=back)
        order.refresh_from_db()
    return order


# ---------------------------------------------------------------------------
# 1. Model unit tests — Order.get_dynamic_wait_time()
# ---------------------------------------------------------------------------

class GetDynamicWaitTimeModelTest(TestCase):
    """Tests for Order.get_dynamic_wait_time()."""

    def setUp(self):
        _, self.manager_profile = make_manager("manager@test.com")
        self.canteen = make_canteen(self.manager_profile)
        _, self.customer = make_customer("customer@test.com")

    # --- Terminal states return 0 ---

    def test_returns_zero_for_ready_status(self):
        order = make_order(self.customer, self.canteen, status=Order.Status.READY)
        self.assertEqual(order.get_dynamic_wait_time(), 0)

    def test_returns_zero_for_completed_status(self):
        order = make_order(self.customer, self.canteen, status=Order.Status.COMPLETED)
        self.assertEqual(order.get_dynamic_wait_time(), 0)

    def test_returns_zero_for_rejected_status(self):
        order = make_order(self.customer, self.canteen, status=Order.Status.REJECTED)
        self.assertEqual(order.get_dynamic_wait_time(), 0)

    def test_returns_zero_for_refunded_status(self):
        order = make_order(self.customer, self.canteen, status=Order.Status.REFUNDED)
        self.assertEqual(order.get_dynamic_wait_time(), 0)

    # --- Queue position math ---

    def test_returns_zero_when_no_orders_ahead(self):
        """First order in queue — nothing is ahead of it."""
        order = make_order(self.customer, self.canteen, status=Order.Status.PENDING)
        self.assertEqual(order.get_dynamic_wait_time(), 0)

    def test_single_pending_order_ahead(self):
        """One PENDING order placed before → 1 × 5 = 5 minutes."""
        _, c2 = make_customer("c2@test.com")
        older = make_order(c2, self.canteen, status=Order.Status.PENDING, minutes_ago=10)
        newer = make_order(self.customer, self.canteen, status=Order.Status.PENDING)
        self.assertEqual(newer.get_dynamic_wait_time(), Order.WAIT_TIME_PER_ORDER)

    def test_single_accepted_order_ahead(self):
        """One ACCEPTED order placed before → 1 × 5 = 5 minutes."""
        _, c2 = make_customer("c2@test.com")
        make_order(c2, self.canteen, status=Order.Status.ACCEPTED, minutes_ago=10)
        newer = make_order(self.customer, self.canteen, status=Order.Status.PENDING)
        self.assertEqual(newer.get_dynamic_wait_time(), Order.WAIT_TIME_PER_ORDER)

    def test_multiple_orders_ahead(self):
        """Two orders ahead → 2 × 5 = 10 minutes."""
        _, c2 = make_customer("c2@test.com")
        _, c3 = make_customer("c3@test.com")
        make_order(c2, self.canteen, status=Order.Status.PENDING, minutes_ago=20)
        make_order(c3, self.canteen, status=Order.Status.ACCEPTED, minutes_ago=10)
        newest = make_order(self.customer, self.canteen, status=Order.Status.PENDING)
        self.assertEqual(newest.get_dynamic_wait_time(), 2 * Order.WAIT_TIME_PER_ORDER)

    def test_does_not_count_own_order(self):
        """An order should not count itself in the queue."""
        order = make_order(self.customer, self.canteen, status=Order.Status.PENDING)
        # Only this order exists → nothing ahead
        self.assertEqual(order.get_dynamic_wait_time(), 0)

    def test_does_not_count_orders_placed_after(self):
        """Orders placed *after* the target order are not ahead."""
        order = make_order(self.customer, self.canteen, status=Order.Status.PENDING,
                           minutes_ago=10)
        _, c2 = make_customer("c2@test.com")
        # c2's order is newer → should NOT be counted
        make_order(c2, self.canteen, status=Order.Status.PENDING)
        self.assertEqual(order.get_dynamic_wait_time(), 0)

    def test_terminal_orders_ahead_not_counted(self):
        """READY / COMPLETED / REJECTED orders placed earlier are NOT in the queue."""
        _, c2 = make_customer("c2@test.com")
        _, c3 = make_customer("c3@test.com")
        _, c4 = make_customer("c4@test.com")
        make_order(c2, self.canteen, status=Order.Status.READY,     minutes_ago=30)
        make_order(c3, self.canteen, status=Order.Status.COMPLETED,  minutes_ago=25)
        make_order(c4, self.canteen, status=Order.Status.REJECTED,   minutes_ago=20)
        order = make_order(self.customer, self.canteen, status=Order.Status.PENDING)
        self.assertEqual(order.get_dynamic_wait_time(), 0)

    # --- Canteen isolation ---

    def test_orders_from_different_canteen_not_counted(self):
        """Active orders at a *different* canteen must not affect wait time."""
        _, mgr2 = make_manager("mgr2@test.com")
        other_canteen = make_canteen(mgr2, name="Other Canteen")
        _, c2 = make_customer("c2@test.com")
        # Place orders at other canteen
        make_order(c2, other_canteen, status=Order.Status.PENDING, minutes_ago=20)
        make_order(c2, other_canteen, status=Order.Status.ACCEPTED, minutes_ago=10)

        order = make_order(self.customer, self.canteen, status=Order.Status.PENDING)
        self.assertEqual(order.get_dynamic_wait_time(), 0)

    # --- Constant verification ---

    def test_wait_time_per_order_constant(self):
        """WAIT_TIME_PER_ORDER should equal 5 minutes as documented."""
        self.assertEqual(Order.WAIT_TIME_PER_ORDER, 5)

    def test_accepted_order_wait_time_is_zero(self):
        """An ACCEPTED order (being prepared) should still return a positive wait."""
        _, c2 = make_customer("c2@test.com")
        make_order(c2, self.canteen, status=Order.Status.PENDING, minutes_ago=10)
        order = make_order(self.customer, self.canteen, status=Order.Status.ACCEPTED)
        self.assertEqual(order.get_dynamic_wait_time(), 1 * Order.WAIT_TIME_PER_ORDER)


# ---------------------------------------------------------------------------
# 2. API view tests — GET /api/orders/<order_id>/wait-time/
# ---------------------------------------------------------------------------

class OrderWaitTimeViewTest(TestCase):
    """Tests for the order_wait_time API endpoint."""

    def setUp(self):
        self.client = APIClient()

        # Customer 1 (owns the order under test)
        self.cust1_user, self.cust1 = make_customer("cust1@test.com")

        # Customer 2 (a different customer)
        self.cust2_user, self.cust2 = make_customer("cust2@test.com")

        # Manager for canteen 1
        self.mgr1_user, self.mgr1_profile = make_manager("mgr1@test.com")
        self.canteen1 = make_canteen(self.mgr1_profile, name="Canteen 1")

        # Manager for canteen 2 (different canteen)
        self.mgr2_user, self.mgr2_profile = make_manager("mgr2@test.com")
        self.canteen2 = make_canteen(self.mgr2_profile, name="Canteen 2")

        # The order under test — belongs to cust1 at canteen1
        self.order = make_order(self.cust1, self.canteen1, status=Order.Status.PENDING)

    def _url(self, order_id=None):
        oid = order_id if order_id is not None else self.order.pk
        return f"/api/orders/{oid}/wait-time/"

    # --- 404 ---

    def test_404_for_nonexistent_order(self):
        self.client.force_authenticate(user=self.cust1_user)
        response = self.client.get(self._url(order_id=99999))
        self.assertEqual(response.status_code, 404)

    # --- Unauthenticated ---

    def test_401_for_unauthenticated_request(self):
        response = self.client.get(self._url())
        self.assertIn(response.status_code, [401, 403])

    # --- 403 authorization ---

    def test_403_customer_cannot_see_another_customers_order(self):
        self.client.force_authenticate(user=self.cust2_user)
        response = self.client.get(self._url())
        self.assertEqual(response.status_code, 403)

    def test_403_manager_cannot_see_order_from_different_canteen(self):
        self.client.force_authenticate(user=self.mgr2_user)
        response = self.client.get(self._url())
        self.assertEqual(response.status_code, 403)

    # --- 200 success ---

    def test_200_owner_customer_gets_correct_payload(self):
        self.client.force_authenticate(user=self.cust1_user)
        response = self.client.get(self._url())
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["order_id"], self.order.pk)
        self.assertEqual(data["status"], Order.Status.PENDING)
        self.assertIn("estimated_wait_minutes", data)
        self.assertIsInstance(data["estimated_wait_minutes"], int)

    def test_200_canteen_manager_gets_correct_payload(self):
        self.client.force_authenticate(user=self.mgr1_user)
        response = self.client.get(self._url())
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["order_id"], self.order.pk)
        self.assertIn("estimated_wait_minutes", data)

    def test_200_wait_time_value_matches_model(self):
        """API-returned wait time must match Order.get_dynamic_wait_time()."""
        # Add one order ahead
        _, c3 = make_customer("c3@test.com")
        make_order(c3, self.canteen1, status=Order.Status.PENDING, minutes_ago=10)

        self.client.force_authenticate(user=self.cust1_user)
        response = self.client.get(self._url())
        self.assertEqual(response.status_code, 200)

        expected = self.order.get_dynamic_wait_time()
        self.assertEqual(response.json()["estimated_wait_minutes"], expected)

    def test_200_terminal_order_returns_zero_wait(self):
        """Completed orders should return 0 wait time via the API."""
        # Bypass state machine and set status directly for test isolation
        Order.objects.filter(pk=self.order.pk).update(status=Order.Status.COMPLETED)
        self.order.refresh_from_db()

        self.client.force_authenticate(user=self.cust1_user)
        response = self.client.get(self._url())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["estimated_wait_minutes"], 0)

    def test_response_contains_required_keys(self):
        """Response JSON must include order_id, status, estimated_wait_minutes."""
        self.client.force_authenticate(user=self.cust1_user)
        response = self.client.get(self._url())
        self.assertEqual(response.status_code, 200)
        keys = set(response.json().keys())
        self.assertSetEqual(keys, {"order_id", "status", "estimated_wait_minutes"})
from rest_framework.test import APIClient

from apps.users.models import User, CustomerProfile, CanteenManagerProfile
from apps.users.services.auth_service import hash_wallet_pin
from apps.canteens.models import Canteen, Dish
from apps.orders.models import Order, OrderItem, Payment
from apps.orders.services import order_service, payment_service


# ============================================================
# Model-level unit tests
# ============================================================

class OrderModelTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.cust_user = User.objects.create_user("om@iitk.ac.in", "pw", role="CUSTOMER")
        cls.cust = CustomerProfile.objects.create(user=cls.cust_user, name="OM", wallet_balance=Decimal("1000"))
        cls.mgr_user = User.objects.create_user("omm@iitk.ac.in", "pw", role="MANAGER")
        cls.mgr = CanteenManagerProfile.objects.create(user=cls.mgr_user)
        cls.canteen = Canteen.objects.create(
            name="Order Canteen", location="H1",
            opening_time="08:00", closing_time="22:00",
            manager=cls.mgr, status=Canteen.Status.OPEN,
        )

    def test_create_order(self):
        order = Order.create_order(self.cust, self.canteen)
        self.assertEqual(order.status, Order.Status.PENDING)

    def test_valid_transition_accept(self):
        order = Order.create_order(self.cust, self.canteen)
        order.update_order_status(Order.Status.ACCEPTED)
        self.assertEqual(order.status, Order.Status.ACCEPTED)

    def test_invalid_transition(self):
        order = Order.create_order(self.cust, self.canteen)
        with self.assertRaises(ValueError):
            order.update_order_status(Order.Status.COMPLETED)

    def test_full_lifecycle(self):
        order = Order.create_order(self.cust, self.canteen)
        order.update_order_status(Order.Status.ACCEPTED)
        order.update_order_status(Order.Status.READY)
        order.update_order_status(Order.Status.COMPLETED)
        self.assertEqual(order.status, Order.Status.COMPLETED)
        self.assertIsNotNone(order.receive_time)

    def test_calculate_total(self):
        dish = Dish.objects.create(canteen=self.canteen, name="T", price=Decimal("50"), is_veg=True)
        order = Order.create_order(self.cust, self.canteen)
        OrderItem.objects.create(order=order, dish=dish, quantity=3, price_at_order=Decimal("50"))
        self.assertEqual(order.calculate_total(), Decimal("150"))


# ============================================================
# Service-level unit tests
# ============================================================

class OrderServiceTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.cust_user = User.objects.create_user("os@iitk.ac.in", "pw", role="CUSTOMER")
        cls.cust = CustomerProfile.objects.create(
            user=cls.cust_user, name="OS",
            wallet_balance=Decimal("1000"),
            wallet_pin_hash=hash_wallet_pin("1234"),
        )
        cls.mgr_user = User.objects.create_user("osm@iitk.ac.in", "pw", role="MANAGER")
        cls.mgr = CanteenManagerProfile.objects.create(user=cls.mgr_user)
        cls.canteen = Canteen.objects.create(
            name="Service Canteen", location="H2",
            opening_time="00:00", closing_time="23:59",
            manager=cls.mgr, status=Canteen.Status.OPEN,
        )
        cls.dish = Dish.objects.create(
            canteen=cls.canteen, name="Poha", price=Decimal("40"),
            is_available=True, is_veg=True,
        )

    def _place(self):
        return order_service.place_order(
            self.cust, self.canteen,
            [{"dish_id": self.dish.pk, "quantity": 2}],
            "1234",
        )

    def test_place_order(self):
        order = self._place()
        self.assertEqual(order.status, Order.Status.PENDING)
        self.assertEqual(order.items.count(), 1)
        self.assertTrue(hasattr(order, "payment"))
        self.cust.refresh_from_db()
        self.assertEqual(self.cust.wallet_balance, Decimal("920.00"))

    def test_place_order_wrong_pin(self):
        with self.assertRaises(ValueError):
            order_service.place_order(
                self.cust, self.canteen,
                [{"dish_id": self.dish.pk, "quantity": 1}],
                "0000",
            )

    def test_place_order_unavailable_dish(self):
        self.dish.is_available = False
        self.dish.save()
        with self.assertRaises(ValueError):
            self._place()
        self.dish.is_available = True
        self.dish.save()

    def test_accept_order(self):
        order = self._place()
        order = order_service.accept_order(order)
        self.assertEqual(order.status, Order.Status.ACCEPTED)

    def test_reject_order_refund(self):
        initial = self.cust.wallet_balance
        order = self._place()
        self.cust.refresh_from_db()
        after_place = self.cust.wallet_balance
        order = order_service.reject_order(order, "Out of stock")
        self.assertEqual(order.status, Order.Status.REFUNDED)
        self.cust.refresh_from_db()
        self.assertEqual(self.cust.wallet_balance, after_place + order.payment.amount)

    def test_cancel_flow(self):
        order = self._place()
        order = order_service.request_cancel(order, self.cust)
        self.assertEqual(order.status, Order.Status.CANCEL_REQUESTED)
        order = order_service.approve_cancel(order)
        self.assertEqual(order.status, Order.Status.REFUNDED)

    def test_reject_cancel(self):
        order = self._place()
        order = order_service.request_cancel(order, self.cust)
        order = order_service.reject_cancel(order, "Already preparing")
        self.assertEqual(order.status, Order.Status.PENDING)
        self.assertEqual(order.cancel_rejection_reason, "Already preparing")

    def test_complete_order_credits_manager(self):
        order = self._place()
        order_service.accept_order(order)
        order_service.mark_order_ready(order)
        order_service.mark_order_completed(order)
        self.mgr.refresh_from_db()
        self.assertTrue(self.mgr.wallet_balance > 0)

    def test_rate_order(self):
        order = self._place()
        order_service.accept_order(order)
        order_service.mark_order_ready(order)
        order_service.mark_order_completed(order)
        order = order_service.rate_order(
            order, self.cust,
            [{"dish_id": self.dish.pk, "rating": 5}],
        )
        self.assertTrue(order.is_rated)

    def test_rate_non_completed_fails(self):
        order = self._place()
        with self.assertRaises(ValueError):
            order_service.rate_order(
                order, self.cust,
                [{"dish_id": self.dish.pk, "rating": 5}],
            )

    def test_double_rate_fails(self):
        order = self._place()
        order_service.accept_order(order)
        order_service.mark_order_ready(order)
        order_service.mark_order_completed(order)
        order_service.rate_order(
            order, self.cust,
            [{"dish_id": self.dish.pk, "rating": 4}],
        )
        with self.assertRaises(ValueError):
            order_service.rate_order(
                order, self.cust,
                [{"dish_id": self.dish.pk, "rating": 4}],
            )


# ============================================================
# Payment service unit tests
# ============================================================

class PaymentServiceTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.cust_user = User.objects.create_user("pst@iitk.ac.in", "pw", role="CUSTOMER")
        cls.cust = CustomerProfile.objects.create(
            user=cls.cust_user, name="PST",
            wallet_balance=Decimal("500"),
            wallet_pin_hash=hash_wallet_pin("9999"),
        )

    def test_authorize_ok(self):
        self.assertTrue(payment_service.authorize_payment(self.cust, 100, "9999"))

    def test_authorize_wrong_pin(self):
        with self.assertRaises(ValueError):
            payment_service.authorize_payment(self.cust, 100, "0000")

    def test_authorize_insufficient(self):
        with self.assertRaises(ValueError):
            payment_service.authorize_payment(self.cust, 99999, "9999")

    def test_validate_and_deduct(self):
        payment_service.validate_and_deduct_funds(self.cust, 50, "9999")
        self.cust.refresh_from_db()
        self.assertEqual(self.cust.wallet_balance, Decimal("450"))


# ============================================================
# API-level component tests
# ============================================================

class OrderAPITest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.cust_user = User.objects.create_user("oapi@iitk.ac.in", "pw", role="CUSTOMER")
        cls.cust = CustomerProfile.objects.create(
            user=cls.cust_user, name="OAPI",
            wallet_balance=Decimal("5000"),
            wallet_pin_hash=hash_wallet_pin("1234"),
        )
        cls.mgr_user = User.objects.create_user("oapim@iitk.ac.in", "pw", role="MANAGER")
        cls.mgr = CanteenManagerProfile.objects.create(user=cls.mgr_user)
        cls.canteen = Canteen.objects.create(
            name="API Order Canteen", location="H3",
            opening_time="00:00", closing_time="23:59",
            manager=cls.mgr, status=Canteen.Status.OPEN,
        )
        cls.dish = Dish.objects.create(
            canteen=cls.canteen, name="API Dish", price=Decimal("100"),
            is_available=True, is_veg=True,
        )

    def setUp(self):
        self.client = APIClient()

    def _place_order(self):
        self.client.force_authenticate(user=self.cust_user)
        resp = self.client.post("/api/orders/place/", {
            "canteen_id": self.canteen.pk,
            "items": [{"dish_id": self.dish.pk, "quantity": 1}],
            "wallet_pin": "1234",
        }, format="json")
        return resp

    def test_place_order_api(self):
        resp = self._place_order()
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["order"]["status"], "PENDING")

    def test_place_order_manager_forbidden(self):
        self.client.force_authenticate(user=self.mgr_user)
        resp = self.client.post("/api/orders/place/", {
            "canteen_id": self.canteen.pk,
            "items": [{"dish_id": self.dish.pk, "quantity": 1}],
            "wallet_pin": "1234",
        }, format="json")
        self.assertEqual(resp.status_code, 403)

    def test_order_detail(self):
        resp = self._place_order()
        oid = resp.data["order"]["id"]
        resp2 = self.client.get(f"/api/orders/{oid}/")
        self.assertEqual(resp2.status_code, 200)

    def test_order_history(self):
        self.client.force_authenticate(user=self.cust_user)
        resp = self.client.get("/api/orders/history/")
        self.assertEqual(resp.status_code, 200)

    def test_pending_orders(self):
        self._place_order()
        self.client.force_authenticate(user=self.mgr_user)
        resp = self.client.get("/api/orders/pending/")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(len(resp.data) >= 1)

    def test_accept_order_api(self):
        resp = self._place_order()
        oid = resp.data["order"]["id"]
        self.client.force_authenticate(user=self.mgr_user)
        resp2 = self.client.post(f"/api/orders/{oid}/accept/")
        self.assertEqual(resp2.status_code, 200)
        self.assertEqual(resp2.data["status"], "ACCEPTED")

    def test_reject_order_api(self):
        resp = self._place_order()
        oid = resp.data["order"]["id"]
        self.client.force_authenticate(user=self.mgr_user)
        resp2 = self.client.post(f"/api/orders/{oid}/reject/", {"reason": "No stock"}, format="json")
        self.assertEqual(resp2.status_code, 200)
        self.assertEqual(resp2.data["status"], "REFUNDED")

    def test_full_lifecycle_api(self):
        resp = self._place_order()
        oid = resp.data["order"]["id"]
        self.client.force_authenticate(user=self.mgr_user)
        self.client.post(f"/api/orders/{oid}/accept/")
        self.client.post(f"/api/orders/{oid}/ready/")
        resp_c = self.client.post(f"/api/orders/{oid}/complete/")
        self.assertEqual(resp_c.status_code, 200)
        self.assertEqual(resp_c.data["status"], "COMPLETED")

    def test_cancel_flow_api(self):
        resp = self._place_order()
        oid = resp.data["order"]["id"]
        self.client.force_authenticate(user=self.cust_user)
        resp2 = self.client.post(f"/api/orders/{oid}/cancel/")
        self.assertEqual(resp2.status_code, 200)
        self.client.force_authenticate(user=self.mgr_user)
        resp3 = self.client.post(f"/api/orders/{oid}/approve-cancel/")
        self.assertEqual(resp3.status_code, 200)
        self.assertEqual(resp3.data["status"], "REFUNDED")

    def test_rate_order_api(self):
        resp = self._place_order()
        oid = resp.data["order"]["id"]
        self.client.force_authenticate(user=self.mgr_user)
        self.client.post(f"/api/orders/{oid}/accept/")
        self.client.post(f"/api/orders/{oid}/ready/")
        self.client.post(f"/api/orders/{oid}/complete/")
        self.client.force_authenticate(user=self.cust_user)
        resp2 = self.client.post(f"/api/orders/{oid}/rate/", {
            "ratings": [{"dish_id": self.dish.pk, "rating": 5}],
        }, format="json")
        self.assertEqual(resp2.status_code, 200)

    def test_manager_order_history(self):
        self._place_order()
        self.client.force_authenticate(user=self.mgr_user)
        resp = self.client.get("/api/orders/manager-history/")
        self.assertEqual(resp.status_code, 200)


# ============================================================
# Previous Order endpoint tests
# ============================================================

class PreviousOrderViewTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.cust_user = User.objects.create_user("prevord@iitk.ac.in", "pw", role="CUSTOMER")
        cls.cust = CustomerProfile.objects.create(
            user=cls.cust_user, name="PrevOrd",
            wallet_balance=Decimal("5000"),
            wallet_pin_hash=hash_wallet_pin("1234"),
        )
        cls.mgr_user = User.objects.create_user("prevmgr@iitk.ac.in", "pw", role="MANAGER")
        cls.mgr = CanteenManagerProfile.objects.create(user=cls.mgr_user)
        cls.canteen = Canteen.objects.create(
            name="PrevOrd Canteen", location="H4",
            opening_time="00:00", closing_time="23:59",
            manager=cls.mgr, status=Canteen.Status.OPEN,
        )
        cls.dish1 = Dish.objects.create(
            canteen=cls.canteen, name="Masala Dosa", price=Decimal("70"),
            is_available=True, is_veg=True,
        )
        cls.dish2 = Dish.objects.create(
            canteen=cls.canteen, name="Idli Sambar", price=Decimal("50"),
            is_available=True, is_veg=True,
        )

    def setUp(self):
        self.client = APIClient()

    def test_403_for_unauthenticated(self):
        resp = self.client.get("/api/orders/previous-order/")
        self.assertIn(resp.status_code, [401, 403])

    def test_403_for_manager(self):
        self.client.force_authenticate(user=self.mgr_user)
        resp = self.client.get("/api/orders/previous-order/")
        self.assertEqual(resp.status_code, 403)

    def test_404_when_no_orders(self):
        self.client.force_authenticate(user=self.cust_user)
        resp = self.client.get("/api/orders/previous-order/")
        self.assertEqual(resp.status_code, 404)

    def test_returns_last_completed_order(self):
        # Place an order and complete it
        self.client.force_authenticate(user=self.cust_user)
        resp = self.client.post("/api/orders/place/", {
            "canteen_id": self.canteen.pk,
            "items": [
                {"dish_id": self.dish1.pk, "quantity": 2},
                {"dish_id": self.dish2.pk, "quantity": 1},
            ],
            "wallet_pin": "1234",
        }, format="json")
        self.assertEqual(resp.status_code, 201)
        oid = resp.data["order"]["id"]

        # Complete the order lifecycle
        self.client.force_authenticate(user=self.mgr_user)
        self.client.post(f"/api/orders/{oid}/accept/")
        self.client.post(f"/api/orders/{oid}/ready/")
        self.client.post(f"/api/orders/{oid}/complete/")

        # Now fetch previous order
        self.client.force_authenticate(user=self.cust_user)
        resp = self.client.get("/api/orders/previous-order/")
        self.assertEqual(resp.status_code, 200)
        data = resp.data
        self.assertEqual(data["id"], oid)
        self.assertEqual(data["status"], "COMPLETED")
        self.assertFalse(data["is_rated"])
        self.assertEqual(len(data["items"]), 2)
        self.assertIn("canteen_name", data)
        self.assertIn("total_price", data)
        # Check dish details in items
        dish_names = {item["dish_name"] for item in data["items"]}
        self.assertIn("Masala Dosa", dish_names)
        self.assertIn("Idli Sambar", dish_names)


# ============================================================
# Detailed Order History endpoint tests
# ============================================================

class OrderHistoryDetailedViewTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.cust_user = User.objects.create_user("histdet@iitk.ac.in", "pw", role="CUSTOMER")
        cls.cust = CustomerProfile.objects.create(
            user=cls.cust_user, name="HistDet",
            wallet_balance=Decimal("10000"),
            wallet_pin_hash=hash_wallet_pin("1234"),
        )
        cls.mgr_user = User.objects.create_user("histmgr@iitk.ac.in", "pw", role="MANAGER")
        cls.mgr = CanteenManagerProfile.objects.create(user=cls.mgr_user)
        cls.canteen = Canteen.objects.create(
            name="HistDet Canteen", location="H5",
            opening_time="00:00", closing_time="23:59",
            manager=cls.mgr, status=Canteen.Status.OPEN,
        )
        cls.dish = Dish.objects.create(
            canteen=cls.canteen, name="Paratha", price=Decimal("60"),
            is_available=True, is_veg=True,
        )

    def setUp(self):
        self.client = APIClient()

    def test_403_for_unauthenticated(self):
        resp = self.client.get("/api/orders/history/detailed/")
        self.assertIn(resp.status_code, [401, 403])

    def test_403_for_manager(self):
        self.client.force_authenticate(user=self.mgr_user)
        resp = self.client.get("/api/orders/history/detailed/")
        self.assertEqual(resp.status_code, 403)

    def test_empty_history(self):
        self.client.force_authenticate(user=self.cust_user)
        resp = self.client.get("/api/orders/history/detailed/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 0)

    def test_returns_completed_orders_with_details(self):
        self.client.force_authenticate(user=self.cust_user)

        # Place and complete two orders
        for _ in range(2):
            resp = self.client.post("/api/orders/place/", {
                "canteen_id": self.canteen.pk,
                "items": [{"dish_id": self.dish.pk, "quantity": 1}],
                "wallet_pin": "1234",
            }, format="json")
            oid = resp.data["order"]["id"]
            self.client.force_authenticate(user=self.mgr_user)
            self.client.post(f"/api/orders/{oid}/accept/")
            self.client.post(f"/api/orders/{oid}/ready/")
            self.client.post(f"/api/orders/{oid}/complete/")
            self.client.force_authenticate(user=self.cust_user)

        resp = self.client.get("/api/orders/history/detailed/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 2)

        # Check each order has required fields
        for order_data in resp.data:
            self.assertIn("id", order_data)
            self.assertIn("canteen_name", order_data)
            self.assertIn("canteen_id", order_data)
            self.assertIn("status", order_data)
            self.assertIn("book_time", order_data)
            self.assertIn("is_rated", order_data)
            self.assertIn("total_price", order_data)
            self.assertIn("items", order_data)
            self.assertIn("payment", order_data)
            self.assertTrue(len(order_data["items"]) > 0)
            self.assertEqual(order_data["items"][0]["dish_name"], "Paratha")

    def test_is_rated_flag(self):
        self.client.force_authenticate(user=self.cust_user)

        # Place and complete an order
        resp = self.client.post("/api/orders/place/", {
            "canteen_id": self.canteen.pk,
            "items": [{"dish_id": self.dish.pk, "quantity": 1}],
            "wallet_pin": "1234",
        }, format="json")
        oid = resp.data["order"]["id"]
        self.client.force_authenticate(user=self.mgr_user)
        self.client.post(f"/api/orders/{oid}/accept/")
        self.client.post(f"/api/orders/{oid}/ready/")
        self.client.post(f"/api/orders/{oid}/complete/")

        # Before rating
        self.client.force_authenticate(user=self.cust_user)
        resp = self.client.get("/api/orders/history/detailed/")
        unrated = [o for o in resp.data if o["id"] == oid]
        self.assertEqual(len(unrated), 1)
        self.assertFalse(unrated[0]["is_rated"])

        # Rate the order
        self.client.post(f"/api/orders/{oid}/rate/", {
            "ratings": [{"dish_id": self.dish.pk, "rating": 5}],
        }, format="json")

        # After rating
        resp = self.client.get("/api/orders/history/detailed/")
        rated = [o for o in resp.data if o["id"] == oid]
        self.assertEqual(len(rated), 1)
        self.assertTrue(rated[0]["is_rated"])

    def test_orders_sorted_most_recent_first(self):
        self.client.force_authenticate(user=self.cust_user)

        order_ids = []
        for _ in range(2):
            resp = self.client.post("/api/orders/place/", {
                "canteen_id": self.canteen.pk,
                "items": [{"dish_id": self.dish.pk, "quantity": 1}],
                "wallet_pin": "1234",
            }, format="json")
            oid = resp.data["order"]["id"]
            order_ids.append(oid)
            self.client.force_authenticate(user=self.mgr_user)
            self.client.post(f"/api/orders/{oid}/accept/")
            self.client.post(f"/api/orders/{oid}/ready/")
            self.client.post(f"/api/orders/{oid}/complete/")
            self.client.force_authenticate(user=self.cust_user)

        resp = self.client.get("/api/orders/history/detailed/")
        returned_ids = [o["id"] for o in resp.data]
        # Most recent first (order_ids[-1] was created last)
        self.assertEqual(returned_ids[0], order_ids[-1])
