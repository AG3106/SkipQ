"""
Unit and component tests for the cakes app.

Covers:
  - CakeReservation model (state machine transitions)
  - Cake service (check_availability, submit_reservation, accept, reject+refund, complete)
  - API endpoints (check-availability, reserve, my-reservations, pending, accept, reject, complete)
"""

import datetime
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.users.models import User, CustomerProfile, CanteenManagerProfile
from apps.users.services.auth_service import hash_wallet_pin
from apps.canteens.models import Canteen, CanteenHoliday
from apps.cakes.models import CakeReservation, CakeFlavor, CakeSizePrice
from apps.cakes.services import cake_service


# ---------------------------------------------------------------------------
# Helper factories (same conventions as orders/tests.py)
# ---------------------------------------------------------------------------

def make_user(email, role=User.Role.CUSTOMER, password="pass1234"):
    user = User.objects.create_user(email=email, password=password, role=role)
    user.is_verified = True
    user.save()
    return user


def make_customer(email, balance=Decimal("1000"), pin="1234"):
    user = make_user(email, role=User.Role.CUSTOMER)
    profile = CustomerProfile.objects.create(
        user=user,
        name=email.split("@")[0],
        wallet_balance=balance,
        wallet_pin_hash=hash_wallet_pin(pin),
    )
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
        lead_time_config=6,
    )


def _future_date(days=3):
    """Return a date far enough in the future to pass lead-time checks."""
    return (timezone.now() + datetime.timedelta(days=days)).date()


# ============================================================
# 1. Model-level unit tests — CakeReservation state machine
# ============================================================

class CakeReservationModelTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        _, cls.mgr = make_manager("cm_model@test.com")
        cls.canteen = make_canteen(cls.mgr)
        _, cls.customer = make_customer("cc_model@test.com")

    def _make_reservation(self, status=CakeReservation.Status.CONFIGURATION):
        return CakeReservation.objects.create(
            customer=self.customer,
            canteen=self.canteen,
            flavor="Chocolate",
            size="1kg",
            pickup_date=_future_date(),
            pickup_time=datetime.time(14, 0),
            advance_amount=Decimal("500"),
            status=status,
        )

    # --- Valid transitions ---

    def test_configuration_to_pending_approval(self):
        r = self._make_reservation(CakeReservation.Status.CONFIGURATION)
        r.update_status(CakeReservation.Status.PENDING_APPROVAL)
        self.assertEqual(r.status, CakeReservation.Status.PENDING_APPROVAL)

    def test_pending_approval_to_confirmed(self):
        r = self._make_reservation(CakeReservation.Status.PENDING_APPROVAL)
        r.update_status(CakeReservation.Status.CONFIRMED)
        self.assertEqual(r.status, CakeReservation.Status.CONFIRMED)

    def test_pending_approval_to_rejected(self):
        r = self._make_reservation(CakeReservation.Status.PENDING_APPROVAL)
        r.update_status(CakeReservation.Status.REJECTED)
        self.assertEqual(r.status, CakeReservation.Status.REJECTED)

    def test_confirmed_to_completed(self):
        r = self._make_reservation(CakeReservation.Status.CONFIRMED)
        r.update_status(CakeReservation.Status.COMPLETED)
        self.assertEqual(r.status, CakeReservation.Status.COMPLETED)

    def test_rejected_to_refunded(self):
        r = self._make_reservation(CakeReservation.Status.REJECTED)
        r.update_status(CakeReservation.Status.REFUNDED)
        self.assertEqual(r.status, CakeReservation.Status.REFUNDED)

    # --- Full lifecycle paths ---

    def test_full_happy_path(self):
        r = self._make_reservation(CakeReservation.Status.CONFIGURATION)
        r.update_status(CakeReservation.Status.PENDING_APPROVAL)
        r.update_status(CakeReservation.Status.CONFIRMED)
        r.update_status(CakeReservation.Status.COMPLETED)
        self.assertEqual(r.status, CakeReservation.Status.COMPLETED)

    def test_full_rejection_path(self):
        r = self._make_reservation(CakeReservation.Status.CONFIGURATION)
        r.update_status(CakeReservation.Status.PENDING_APPROVAL)
        r.update_status(CakeReservation.Status.REJECTED)
        r.update_status(CakeReservation.Status.REFUNDED)
        self.assertEqual(r.status, CakeReservation.Status.REFUNDED)

    # --- Invalid transitions ---

    def test_configuration_to_completed_raises(self):
        r = self._make_reservation(CakeReservation.Status.CONFIGURATION)
        with self.assertRaises(ValueError):
            r.update_status(CakeReservation.Status.COMPLETED)

    def test_configuration_to_confirmed_raises(self):
        r = self._make_reservation(CakeReservation.Status.CONFIGURATION)
        with self.assertRaises(ValueError):
            r.update_status(CakeReservation.Status.CONFIRMED)

    def test_confirmed_to_rejected_raises(self):
        r = self._make_reservation(CakeReservation.Status.CONFIRMED)
        with self.assertRaises(ValueError):
            r.update_status(CakeReservation.Status.REJECTED)

    def test_completed_no_transitions(self):
        r = self._make_reservation(CakeReservation.Status.COMPLETED)
        with self.assertRaises(ValueError):
            r.update_status(CakeReservation.Status.CONFIRMED)

    def test_refunded_no_transitions(self):
        r = self._make_reservation(CakeReservation.Status.REFUNDED)
        with self.assertRaises(ValueError):
            r.update_status(CakeReservation.Status.COMPLETED)

    # --- String representation ---

    def test_str(self):
        r = self._make_reservation()
        self.assertIn("Chocolate", str(r))
        self.assertIn("1kg", str(r))


# ============================================================
# 2. Service-level unit tests — cake_service
# ============================================================

class CakeServiceTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        _, cls.mgr = make_manager("cs_mgr@test.com")
        cls.canteen = make_canteen(cls.mgr)
        _, cls.customer = make_customer("cs_cust@test.com", balance=Decimal("2000"), pin="4321")
        CakeFlavor.objects.create(canteen=cls.canteen, name="Vanilla")
        CakeSizePrice.objects.create(canteen=cls.canteen, size="2kg", price=Decimal("500"))

    # --- check_availability ---

    def test_check_availability_success(self):
        result = cake_service.check_availability(self.canteen, _future_date(days=5))
        self.assertTrue(result["available"])

    def test_check_availability_holiday(self):
        holiday_date = _future_date(days=7)
        CanteenHoliday.objects.create(canteen=self.canteen, date=holiday_date, description="Test holiday")
        result = cake_service.check_availability(self.canteen, holiday_date)
        self.assertFalse(result["available"])
        self.assertIn("holiday", result["message"].lower())

    def test_check_availability_insufficient_lead_time(self):
        # Use today's date — not enough lead time
        result = cake_service.check_availability(self.canteen, timezone.now().date())
        self.assertFalse(result["available"])
        self.assertIn("advance", result["message"].lower())

    # --- submit_reservation ---

    def _submit(self, pin="4321", amount=Decimal("500")):
        return cake_service.submit_reservation(
            customer_profile=self.customer,
            canteen=self.canteen,
            flavor="Vanilla",
            size="2kg",
            design="Floral",
            message="Happy Birthday",
            pickup_date=_future_date(),
            pickup_time=datetime.time(15, 0),
            advance_amount=amount,
            wallet_pin=pin,
        )

    def test_submit_reservation_success(self):
        reservation = self._submit()
        self.assertEqual(reservation.status, CakeReservation.Status.PENDING_APPROVAL)
        self.assertEqual(reservation.flavor, "Vanilla")
        self.assertEqual(reservation.size, "2kg")
        self.assertEqual(reservation.design, "Floral")
        self.assertEqual(reservation.message, "Happy Birthday")
        self.assertEqual(reservation.advance_amount, Decimal("500"))

    def test_submit_reservation_deducts_wallet(self):
        initial_balance = self.customer.wallet_balance
        self._submit(amount=Decimal("500"))
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.wallet_balance, initial_balance - Decimal("500"))

    def test_submit_reservation_wrong_pin(self):
        with self.assertRaises(ValueError) as ctx:
            self._submit(pin="0000")
        self.assertIn("PIN", str(ctx.exception))

    def test_submit_reservation_insufficient_funds(self):
        with self.assertRaises(ValueError):
            self._submit(amount=Decimal("999999"))

    # --- accept_reservation ---

    def test_accept_reservation(self):
        reservation = self._submit()
        result = cake_service.accept_reservation(reservation)
        self.assertEqual(result.status, CakeReservation.Status.CONFIRMED)

    # --- reject_reservation ---

    def test_reject_reservation_refunds_and_stores_reason(self):
        initial_balance = self.customer.wallet_balance
        reservation = self._submit(amount=Decimal("500"))
        self.customer.refresh_from_db()
        after_submit = self.customer.wallet_balance

        result = cake_service.reject_reservation(reservation, reason="Capacity full")
        self.assertEqual(result.status, CakeReservation.Status.REFUNDED)
        self.assertEqual(result.rejection_reason, "Capacity full")

        self.customer.refresh_from_db()
        self.assertEqual(self.customer.wallet_balance, after_submit + Decimal("500"))

    # --- complete_reservation ---

    def test_complete_reservation(self):
        reservation = self._submit()
        cake_service.accept_reservation(reservation)
        result = cake_service.complete_reservation(reservation)
        self.assertEqual(result.status, CakeReservation.Status.COMPLETED)

    def test_complete_reservation_without_confirm_raises(self):
        reservation = self._submit()
        # Still PENDING_APPROVAL, cannot complete
        with self.assertRaises(ValueError):
            cake_service.complete_reservation(reservation)


# ============================================================
# 3. API-level component tests
# ============================================================

class CakeAPITest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.cust_user, cls.cust = make_customer("api_cust@test.com", balance=Decimal("5000"), pin="1234")
        cls.mgr_user, cls.mgr = make_manager("api_mgr@test.com")
        cls.canteen = make_canteen(cls.mgr, name="API Cake Canteen")
        CakeFlavor.objects.create(canteen=cls.canteen, name="Red Velvet")
        CakeSizePrice.objects.create(canteen=cls.canteen, size="1kg", price=Decimal("500"))

        # Second manager for cross-canteen checks
        cls.mgr2_user, cls.mgr2 = make_manager("api_mgr2@test.com")
        cls.canteen2 = make_canteen(cls.mgr2, name="Other Canteen")

    def setUp(self):
        self.client = APIClient()

    # ------ helpers ------

    def _reserve(self, user=None):
        """Submit a cake reservation via API and return the response."""
        self.client.force_authenticate(user=user or self.cust_user)
        return self.client.post("/api/cakes/reserve/", {
            "canteen_id": self.canteen.pk,
            "flavor": "Red Velvet",
            "size": "1kg",
            "design": "Hearts",
            "message": "With Love",
            "pickup_date": str(_future_date()),
            "pickup_time": "14:00",
            "advance_amount": "500.00",
            "wallet_pin": "1234",
        }, format="json")

    # ------ check-availability ------

    def test_check_availability_200(self):
        self.client.force_authenticate(user=self.cust_user)
        resp = self.client.post("/api/cakes/check-availability/", {
            "canteen_id": self.canteen.pk,
            "date": str(_future_date(days=5)),
        }, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.data["available"])

    def test_check_availability_404_canteen(self):
        self.client.force_authenticate(user=self.cust_user)
        resp = self.client.post("/api/cakes/check-availability/", {
            "canteen_id": 99999,
            "date": str(_future_date()),
        }, format="json")
        self.assertEqual(resp.status_code, 404)

    def test_check_availability_unauthenticated(self):
        resp = self.client.post("/api/cakes/check-availability/", {
            "canteen_id": self.canteen.pk,
            "date": str(_future_date()),
        }, format="json")
        self.assertIn(resp.status_code, [401, 403])

    # ------ reserve ------

    def test_reserve_201_customer(self):
        resp = self._reserve()
        self.assertEqual(resp.status_code, 201)
        self.assertIn("reservation", resp.data)
        self.assertEqual(resp.data["reservation"]["status"], "PENDING_APPROVAL")

    def test_reserve_403_manager(self):
        resp = self._reserve(user=self.mgr_user)
        self.assertEqual(resp.status_code, 403)

    def test_reserve_404_canteen(self):
        self.client.force_authenticate(user=self.cust_user)
        resp = self.client.post("/api/cakes/reserve/", {
            "canteen_id": 99999,
            "flavor": "Vanilla",
            "size": "1kg",
            "pickup_date": str(_future_date()),
            "pickup_time": "14:00",
            "advance_amount": "100.00",
            "wallet_pin": "1234",
        }, format="json")
        self.assertEqual(resp.status_code, 404)

    # ------ my-reservations ------

    def test_my_reservations_200_customer(self):
        self._reserve()  # create one reservation first
        self.client.force_authenticate(user=self.cust_user)
        resp = self.client.get("/api/cakes/my-reservations/")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(len(resp.data) >= 1)

    def test_my_reservations_403_manager(self):
        self.client.force_authenticate(user=self.mgr_user)
        resp = self.client.get("/api/cakes/my-reservations/")
        self.assertEqual(resp.status_code, 403)

    # ------ pending (manager) ------

    def test_pending_200_manager(self):
        self._reserve()
        self.client.force_authenticate(user=self.mgr_user)
        resp = self.client.get("/api/cakes/pending/")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(len(resp.data) >= 1)

    def test_pending_403_customer(self):
        self.client.force_authenticate(user=self.cust_user)
        resp = self.client.get("/api/cakes/pending/")
        self.assertEqual(resp.status_code, 403)

    # ------ accept ------

    def test_accept_200_manager(self):
        resp = self._reserve()
        rid = resp.data["reservation"]["id"]
        self.client.force_authenticate(user=self.mgr_user)
        resp2 = self.client.post(f"/api/cakes/{rid}/accept/")
        self.assertEqual(resp2.status_code, 200)
        self.assertEqual(resp2.data["status"], "CONFIRMED")

    def test_accept_403_customer(self):
        resp = self._reserve()
        rid = resp.data["reservation"]["id"]
        self.client.force_authenticate(user=self.cust_user)
        resp2 = self.client.post(f"/api/cakes/{rid}/accept/")
        self.assertEqual(resp2.status_code, 403)

    def test_accept_404_wrong_manager(self):
        resp = self._reserve()
        rid = resp.data["reservation"]["id"]
        self.client.force_authenticate(user=self.mgr2_user)
        resp2 = self.client.post(f"/api/cakes/{rid}/accept/")
        self.assertEqual(resp2.status_code, 404)

    # ------ reject ------

    def test_reject_200_with_reason(self):
        resp = self._reserve()
        rid = resp.data["reservation"]["id"]
        self.client.force_authenticate(user=self.mgr_user)
        resp2 = self.client.post(f"/api/cakes/{rid}/reject/", {"reason": "Fully booked"}, format="json")
        self.assertEqual(resp2.status_code, 200)
        self.assertEqual(resp2.data["status"], "REFUNDED")
        self.assertEqual(resp2.data["rejection_reason"], "Fully booked")

    def test_reject_403_customer(self):
        resp = self._reserve()
        rid = resp.data["reservation"]["id"]
        self.client.force_authenticate(user=self.cust_user)
        resp2 = self.client.post(f"/api/cakes/{rid}/reject/", {"reason": "x"}, format="json")
        self.assertEqual(resp2.status_code, 403)

    # ------ complete ------

    def test_complete_full_lifecycle_api(self):
        resp = self._reserve()
        rid = resp.data["reservation"]["id"]
        self.client.force_authenticate(user=self.mgr_user)
        self.client.post(f"/api/cakes/{rid}/accept/")
        resp3 = self.client.post(f"/api/cakes/{rid}/complete/")
        self.assertEqual(resp3.status_code, 200)
        self.assertEqual(resp3.data["status"], "COMPLETED")

    def test_complete_without_accept_fails(self):
        resp = self._reserve()
        rid = resp.data["reservation"]["id"]
        self.client.force_authenticate(user=self.mgr_user)
        resp2 = self.client.post(f"/api/cakes/{rid}/complete/")
        self.assertEqual(resp2.status_code, 400)

    def test_complete_404_nonexistent(self):
        self.client.force_authenticate(user=self.mgr_user)
        resp = self.client.post("/api/cakes/99999/complete/")
        self.assertEqual(resp.status_code, 404)
