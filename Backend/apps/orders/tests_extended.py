"""
Extended unit tests for the orders app — additional coverage.

Covers:
  - Order model — query_active_orders, add_to_order_history, __str__
  - Order service — edge cases (canteen closed, dish from wrong canteen, request_cancel edge cases)
  - Payment service — process_payment, process_refund edge cases
  - Payment model __str__
  - OrderItem model __str__
  - API — active orders, manager history, reject-cancel
"""

import datetime
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.users.models import User, CustomerProfile, CanteenManagerProfile
from apps.users.services.auth_service import hash_wallet_pin
from apps.canteens.models import Canteen, Dish
from apps.orders.models import Order, OrderItem, Payment
from apps.orders.services import order_service, payment_service


# ============================================================
# Helper factories
# ============================================================

def make_user(email, role=User.Role.CUSTOMER, password="pass1234"):
    user = User.objects.create_user(email=email, password=password, role=role)
    user.is_verified = True
    user.save()
    return user


def make_customer(email, balance=Decimal("1000"), pin="1234"):
    user = make_user(email, role=User.Role.CUSTOMER)
    profile = CustomerProfile.objects.create(
        user=user, name=email.split("@")[0],
        wallet_balance=balance,
        wallet_pin_hash=hash_wallet_pin(pin),
    )
    return user, profile


def make_manager(email):
    user = make_user(email, role=User.Role.MANAGER)
    profile = CanteenManagerProfile.objects.create(user=user)
    return user, profile


def make_canteen(manager_profile, name="Test Canteen", status=Canteen.Status.OPEN):
    return Canteen.objects.create(
        name=name,
        location="Block A",
        opening_time=datetime.time(0, 0),
        closing_time=datetime.time(23, 59),
        status=status,
        manager=manager_profile,
    )


def make_order_with_items(customer_profile, canteen, dish, qty=1, pin="1234"):
    """Place a real order through the service."""
    return order_service.place_order(
        customer_profile, canteen,
        [{"dish_id": dish.pk, "quantity": qty}],
        pin,
    )


# ============================================================
# Order model — additional tests
# ============================================================

class OrderModelExtendedTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        _, cls.mgr = make_manager("ome@test.com")
        cls.canteen = make_canteen(cls.mgr, status=Canteen.Status.OPEN)
        _, cls.cust = make_customer("omc@test.com")

    def test_order_str(self):
        order = Order.create_order(self.cust, self.canteen)
        self.assertIn(str(order.pk), str(order))
        self.assertIn("Pending", str(order))

    def test_query_active_orders(self):
        Order.create_order(self.cust, self.canteen, status=Order.Status.PENDING)
        Order.create_order(self.cust, self.canteen, status=Order.Status.ACCEPTED)
        active = Order.query_active_orders(self.canteen)
        self.assertTrue(active.count() >= 2)

    def test_add_to_order_history(self):
        """Should not raise; just logs."""
        order = Order.create_order(self.cust, self.canteen)
        order.add_to_order_history()  # should not raise

    def test_cancel_from_accepted(self):
        """Cancel request can come from ACCEPTED status."""
        order = Order.create_order(self.cust, self.canteen)
        order.update_order_status(Order.Status.ACCEPTED)
        order.update_order_status(Order.Status.CANCEL_REQUESTED)
        self.assertEqual(order.status, Order.Status.CANCEL_REQUESTED)


# ============================================================
# OrderItem and Payment model strings
# ============================================================

class OrderItemPaymentStrTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        _, cls.mgr = make_manager("oips@test.com")
        cls.canteen = make_canteen(cls.mgr)
        _, cls.cust = make_customer("oipc@test.com")
        cls.dish = Dish.objects.create(
            canteen=cls.canteen, name="StrDish", price=Decimal("40"), is_veg=True,
        )

    def test_order_item_str(self):
        order = Order.create_order(self.cust, self.canteen)
        item = OrderItem.objects.create(
            order=order, dish=self.dish, quantity=2, price_at_order=Decimal("40"),
        )
        self.assertIn("2×", str(item))
        self.assertIn("StrDish", str(item))

    def test_payment_str(self):
        order = Order.create_order(self.cust, self.canteen)
        payment = Payment.objects.create(order=order, amount=Decimal("80"), status=Payment.Status.COMPLETED)
        self.assertIn("80", str(payment))
        self.assertIn("Completed", str(payment))


# ============================================================
# Payment service — edge cases
# ============================================================

class PaymentServiceExtendedTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        _, cls.mgr = make_manager("pse@test.com")
        cls.canteen = make_canteen(cls.mgr)
        _, cls.cust = make_customer("psec@test.com", balance=Decimal("500"), pin="9999")

    def test_process_payment_already_completed(self):
        order = Order.create_order(self.cust, self.canteen)
        payment = Payment.objects.create(
            order=order, amount=Decimal("50"), status=Payment.Status.COMPLETED,
        )
        with self.assertRaises(ValueError):
            payment_service.process_payment(payment)

    def test_process_payment_pending_success(self):
        order = Order.create_order(self.cust, self.canteen)
        payment = Payment.objects.create(
            order=order, amount=Decimal("50"), status=Payment.Status.PENDING,
        )
        result = payment_service.process_payment(payment)
        self.assertTrue(result)
        payment.refresh_from_db()
        self.assertEqual(payment.status, Payment.Status.COMPLETED)

    def test_process_refund_already_refunded(self):
        order = Order.create_order(self.cust, self.canteen)
        payment = Payment.objects.create(
            order=order, amount=Decimal("50"), status=Payment.Status.REFUNDED,
        )
        with self.assertRaises(ValueError):
            payment_service.process_refund(payment)

    def test_process_refund_pending_fails(self):
        order = Order.create_order(self.cust, self.canteen)
        payment = Payment.objects.create(
            order=order, amount=Decimal("50"), status=Payment.Status.PENDING,
        )
        with self.assertRaises(ValueError):
            payment_service.process_refund(payment)


# ============================================================
# Order service — canteen status validation
# ============================================================

class OrderServiceEdgeCaseTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        _, cls.mgr = make_manager("osec@test.com")
        cls.canteen_closed = make_canteen(
            cls.mgr, name="Closed Canteen", status=Canteen.Status.CLOSED,
        )
        _, cls.cust = make_customer("osecc@test.com", balance=Decimal("1000"), pin="1234")
        cls.dish = Dish.objects.create(
            canteen=cls.canteen_closed, name="ClosedDish", price=Decimal("50"),
            is_available=True, is_veg=True,
        )

    def test_place_order_canteen_closed(self):
        with self.assertRaises(ValueError) as ctx:
            order_service.place_order(
                self.cust, self.canteen_closed,
                [{"dish_id": self.dish.pk, "quantity": 1}],
                "1234",
            )
        self.assertIn("not currently accepting", str(ctx.exception).lower())

    def test_request_cancel_wrong_customer(self):
        _, mgr2 = make_manager("osecm2@test.com")
        canteen = make_canteen(mgr2, name="CancelTest", status=Canteen.Status.OPEN)
        dish = Dish.objects.create(
            canteen=canteen, name="CancelDish", price=Decimal("30"),
            is_available=True, is_veg=True,
        )
        order = make_order_with_items(self.cust, canteen, dish, pin="1234")
        _, other_cust = make_customer("other@test.com")
        with self.assertRaises(ValueError):
            order_service.request_cancel(order, other_cust)

    def test_request_cancel_wrong_status(self):
        _, mgr2 = make_manager("osecm3@test.com")
        canteen = make_canteen(mgr2, name="CancelWS", status=Canteen.Status.OPEN)
        dish = Dish.objects.create(
            canteen=canteen, name="CancelWSD", price=Decimal("30"),
            is_available=True, is_veg=True,
        )
        order = make_order_with_items(self.cust, canteen, dish, pin="1234")
        order_service.accept_order(order)
        order_service.mark_order_ready(order)
        with self.assertRaises(ValueError):
            order_service.request_cancel(order, self.cust)

    def test_approve_cancel_wrong_status(self):
        _, mgr2 = make_manager("osecm4@test.com")
        canteen = make_canteen(mgr2, name="AppCWS", status=Canteen.Status.OPEN)
        dish = Dish.objects.create(
            canteen=canteen, name="AppCWSD", price=Decimal("30"),
            is_available=True, is_veg=True,
        )
        order = make_order_with_items(self.cust, canteen, dish, pin="1234")
        # Order is PENDING, not CANCEL_REQUESTED
        with self.assertRaises(ValueError):
            order_service.approve_cancel(order)

    def test_reject_cancel_wrong_status(self):
        _, mgr2 = make_manager("osecm5@test.com")
        canteen = make_canteen(mgr2, name="RejCWS", status=Canteen.Status.OPEN)
        dish = Dish.objects.create(
            canteen=canteen, name="RejCWSD", price=Decimal("30"),
            is_available=True, is_veg=True,
        )
        order = make_order_with_items(self.cust, canteen, dish, pin="1234")
        with self.assertRaises(ValueError):
            order_service.reject_cancel(order, "test")


# ============================================================
# Order service — rate_order edge cases
# ============================================================

class RateOrderEdgeCaseTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        _, cls.mgr = make_manager("roeec@test.com")
        cls.canteen = make_canteen(cls.mgr, name="RateEC", status=Canteen.Status.OPEN)
        cls.dish = Dish.objects.create(
            canteen=cls.canteen, name="RateECDish", price=Decimal("50"),
            is_available=True, is_veg=True,
        )
        _, cls.cust = make_customer("roeccust@test.com", balance=Decimal("5000"), pin="1234")

    def test_rate_others_order(self):
        order = make_order_with_items(self.cust, self.canteen, self.dish, pin="1234")
        order_service.accept_order(order)
        order_service.mark_order_ready(order)
        order_service.mark_order_completed(order)
        _, other = make_customer("roeother@test.com")
        with self.assertRaises(ValueError):
            order_service.rate_order(order, other, [{"dish_id": self.dish.pk, "rating": 5}])

    def test_rate_dish_not_in_order(self):
        order = make_order_with_items(self.cust, self.canteen, self.dish, pin="1234")
        order_service.accept_order(order)
        order_service.mark_order_ready(order)
        order_service.mark_order_completed(order)
        other_dish = Dish.objects.create(
            canteen=self.canteen, name="NotInOrder", price=Decimal("10"), is_veg=True,
        )
        with self.assertRaises(ValueError):
            order_service.rate_order(
                order, self.cust, [{"dish_id": other_dish.pk, "rating": 5}]
            )


# ============================================================
# Order service — query helpers
# ============================================================

class OrderQueryHelpersTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        _, cls.mgr = make_manager("oqh@test.com")
        cls.canteen = make_canteen(cls.mgr, name="QueryHelp", status=Canteen.Status.OPEN)
        cls.dish = Dish.objects.create(
            canteen=cls.canteen, name="QHDish", price=Decimal("50"),
            is_available=True, is_veg=True,
        )
        _, cls.cust = make_customer("oqhc@test.com", balance=Decimal("5000"), pin="1234")

    def test_get_order_history(self):
        order = make_order_with_items(self.cust, self.canteen, self.dish, pin="1234")
        order_service.accept_order(order)
        order_service.mark_order_ready(order)
        order_service.mark_order_completed(order)
        history = order_service.get_order_history(self.cust)
        self.assertTrue(history.count() >= 1)

    def test_get_last_order(self):
        order = make_order_with_items(self.cust, self.canteen, self.dish, pin="1234")
        order_service.accept_order(order)
        order_service.mark_order_ready(order)
        order_service.mark_order_completed(order)
        last = order_service.get_last_order(self.cust)
        self.assertIsNotNone(last)
        self.assertEqual(last.status, Order.Status.COMPLETED)

    def test_get_last_order_no_orders(self):
        _, new_cust = make_customer("nolast@test.com")
        last = order_service.get_last_order(new_cust)
        self.assertIsNone(last)

    def test_get_pending_orders(self):
        make_order_with_items(self.cust, self.canteen, self.dish, pin="1234")
        pending = order_service.get_pending_orders(self.canteen)
        self.assertTrue(pending.count() >= 1)

    def test_get_active_orders(self):
        order = make_order_with_items(self.cust, self.canteen, self.dish, pin="1234")
        order_service.accept_order(order)
        active = order_service.get_active_orders(self.canteen)
        self.assertTrue(active.count() >= 1)

    def test_get_detailed_order_history(self):
        order = make_order_with_items(self.cust, self.canteen, self.dish, pin="1234")
        order_service.accept_order(order)
        order_service.mark_order_ready(order)
        order_service.mark_order_completed(order)
        detailed = order_service.get_detailed_order_history(self.cust)
        self.assertTrue(detailed.count() >= 1)

    def test_get_manager_order_history(self):
        make_order_with_items(self.cust, self.canteen, self.dish, pin="1234")
        mgr_hist = order_service.get_manager_order_history(self.canteen)
        self.assertTrue(mgr_hist.count() >= 1)


# ============================================================
# API — active orders, reject-cancel
# ============================================================

class OrderAPIExtendedTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.cust_user, cls.cust = make_customer("oapiex@test.com", balance=Decimal("10000"), pin="1234")
        cls.mgr_user, cls.mgr = make_manager("oapimex@test.com")
        cls.canteen = make_canteen(cls.mgr, name="ExtAPICanteen", status=Canteen.Status.OPEN)
        cls.dish = Dish.objects.create(
            canteen=cls.canteen, name="ExtAPIDish", price=Decimal("50"),
            is_available=True, is_veg=True,
        )

    def setUp(self):
        self.client = APIClient()

    def _place(self):
        self.client.force_authenticate(user=self.cust_user)
        return self.client.post("/api/orders/place/", {
            "canteen_id": self.canteen.pk,
            "items": [{"dish_id": self.dish.pk, "quantity": 1}],
            "wallet_pin": "1234",
        }, format="json")

    def test_active_orders_api(self):
        self._place()
        self.client.force_authenticate(user=self.mgr_user)
        resp = self.client.get("/api/orders/active/")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(len(resp.data) >= 1)

    def test_reject_cancel_api(self):
        resp = self._place()
        oid = resp.data["order"]["id"]
        self.client.force_authenticate(user=self.cust_user)
        self.client.post(f"/api/orders/{oid}/cancel/")
        self.client.force_authenticate(user=self.mgr_user)
        resp2 = self.client.post(f"/api/orders/{oid}/reject-cancel/", {"reason": "No"}, format="json")
        self.assertEqual(resp2.status_code, 200)
        self.assertEqual(resp2.data["status"], "PENDING")
