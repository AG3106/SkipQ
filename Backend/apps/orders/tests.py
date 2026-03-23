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
        order = order_service.rate_order(order, self.cust, 5, "Great!")
        self.assertTrue(order.is_rated)

    def test_rate_non_completed_fails(self):
        order = self._place()
        with self.assertRaises(ValueError):
            order_service.rate_order(order, self.cust, 5)

    def test_double_rate_fails(self):
        order = self._place()
        order_service.accept_order(order)
        order_service.mark_order_ready(order)
        order_service.mark_order_completed(order)
        order_service.rate_order(order, self.cust, 4)
        with self.assertRaises(ValueError):
            order_service.rate_order(order, self.cust, 4)


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
        resp2 = self.client.post(f"/api/orders/{oid}/rate/", {"rating": 5}, format="json")
        self.assertEqual(resp2.status_code, 200)

    def test_manager_order_history(self):
        self._place_order()
        self.client.force_authenticate(user=self.mgr_user)
        resp = self.client.get("/api/orders/manager-history/")
        self.assertEqual(resp.status_code, 200)
