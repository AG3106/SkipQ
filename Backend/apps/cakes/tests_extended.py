"""
Extended unit tests for the cakes app — additional coverage.

Covers:
  - CakeReservation model __str__
  - cake_service — check_availability, complete_reservation
  - cake_service — wrong PIN submission
  - CakeReservation state transitions — invalid transitions
  - API edge cases — insufficient balance
"""

import datetime
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.users.models import User, CustomerProfile, CanteenManagerProfile
from apps.users.services.auth_service import hash_wallet_pin
from apps.canteens.models import Canteen, CanteenHoliday
from apps.cakes.models import CakeReservation
from apps.cakes.services.cake_service import (
    check_availability, submit_reservation,
    accept_reservation, complete_reservation, reject_reservation,
)


def make_customer(email, balance=Decimal("2000"), pin="1234"):
    user = User.objects.create_user(email, "pw", role="CUSTOMER")
    user.is_verified = True
    user.save()
    profile = CustomerProfile.objects.create(
        user=user, name=email.split("@")[0],
        wallet_balance=balance,
        wallet_pin_hash=hash_wallet_pin(pin),
    )
    return user, profile


def make_manager(email):
    user = User.objects.create_user(email, "pw", role="MANAGER")
    user.is_verified = True
    user.save()
    profile = CanteenManagerProfile.objects.create(user=user)
    return user, profile


def make_canteen(mgr, name="Test Cake Canteen"):
    return Canteen.objects.create(
        name=name, location="Block A",
        opening_time=datetime.time(8, 0), closing_time=datetime.time(22, 0),
        manager=mgr, status=Canteen.Status.ACTIVE,
        lead_time_config=6,
    )


# ============================================================
# CakeReservation model
# ============================================================

class CakeReservationModelTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        _, cls.mgr = make_manager("crmod@test.com")
        cls.canteen = make_canteen(cls.mgr)
        _, cls.cust = make_customer("crcust@test.com")

    def test_cake_reservation_str(self):
        r = CakeReservation.objects.create(
            customer=self.cust, canteen=self.canteen,
            flavor="Chocolate", size="1kg", design="Round",
            pickup_date="2026-05-01", pickup_time="14:00",
            advance_amount=Decimal("500"),
            status=CakeReservation.Status.PENDING_APPROVAL,
        )
        self.assertIn("Chocolate", str(r))
        self.assertIn("Pending Approval", str(r))

    def test_invalid_state_transition(self):
        r = CakeReservation.objects.create(
            customer=self.cust, canteen=self.canteen,
            flavor="Vanilla", size="2kg", design="Square",
            pickup_date="2026-05-01", pickup_time="14:00",
            advance_amount=Decimal("500"),
            status=CakeReservation.Status.PENDING_APPROVAL,
        )
        with self.assertRaises(ValueError):
            r.update_status(CakeReservation.Status.COMPLETED)

    def test_completed_transition_from_confirmed(self):
        r = CakeReservation.objects.create(
            customer=self.cust, canteen=self.canteen,
            flavor="Strawberry", size="1.5kg", design="Custom",
            pickup_date="2026-05-01", pickup_time="14:00",
            advance_amount=Decimal("500"),
            status=CakeReservation.Status.PENDING_APPROVAL,
        )
        r.update_status(CakeReservation.Status.CONFIRMED)
        r.update_status(CakeReservation.Status.COMPLETED)
        self.assertEqual(r.status, CakeReservation.Status.COMPLETED)


# ============================================================
# Cake service — availability
# ============================================================

class CakeServiceAvailabilityTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        _, cls.mgr = make_manager("csa@test.com")
        cls.canteen = make_canteen(cls.mgr)

    def test_available_future_date(self):
        future = (timezone.now() + datetime.timedelta(days=5)).date()
        result = check_availability(self.canteen, future)
        self.assertTrue(result["available"])

    def test_holiday_date(self):
        future = (timezone.now() + datetime.timedelta(days=5)).date()
        CanteenHoliday.objects.create(canteen=self.canteen, date=future)
        result = check_availability(self.canteen, future)
        self.assertFalse(result["available"])
        self.assertIn("holiday", result["message"].lower())


# ============================================================
# Cake service — full reservation lifecycle
# ============================================================

class CakeServiceLifecycleTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        _, cls.mgr = make_manager("cslc@test.com")
        cls.canteen = make_canteen(cls.mgr)
        _, cls.cust = make_customer("cslcc@test.com", balance=Decimal("2000"))

    def test_submit_and_accept_and_complete(self):
        future = (timezone.now() + datetime.timedelta(days=5)).date()
        r = submit_reservation(
            self.cust, self.canteen, "Chocolate", "1kg", "Round", "Happy Birthday",
            future, "14:00", Decimal("500"), "1234",
        )
        self.assertEqual(r.status, CakeReservation.Status.PENDING_APPROVAL)
        accept_reservation(r)
        self.assertEqual(r.status, CakeReservation.Status.CONFIRMED)
        complete_reservation(r)
        self.assertEqual(r.status, CakeReservation.Status.COMPLETED)

    def test_submit_and_reject_with_refund(self):
        future = (timezone.now() + datetime.timedelta(days=5)).date()
        initial = self.cust.wallet_balance
        r = submit_reservation(
            self.cust, self.canteen, "Vanilla", "2kg", "Square", "Congrats",
            future, "15:00", Decimal("400"), "1234",
        )
        self.cust.refresh_from_db()
        after_deduct = self.cust.wallet_balance
        self.assertEqual(after_deduct, initial - Decimal("400"))

        reject_reservation(r, "Capacity full")
        self.cust.refresh_from_db()
        self.assertEqual(self.cust.wallet_balance, initial)
        self.assertEqual(r.status, CakeReservation.Status.REFUNDED)

    def test_wrong_pin_raises(self):
        future = (timezone.now() + datetime.timedelta(days=5)).date()
        with self.assertRaises(ValueError) as ctx:
            submit_reservation(
                self.cust, self.canteen, "Vanilla", "1kg", "Round", "Hi",
                future, "14:00", Decimal("300"), "0000",
            )
        self.assertIn("wallet pin", str(ctx.exception).lower())

    def test_insufficient_balance_raises(self):
        _, poor_cust = make_customer("poor@test.com", balance=Decimal("10"))
        future = (timezone.now() + datetime.timedelta(days=5)).date()
        with self.assertRaises(ValueError):
            submit_reservation(
                poor_cust, self.canteen, "Vanilla", "1kg", "Round", "Hi",
                future, "14:00", Decimal("500"), "1234",
            )
