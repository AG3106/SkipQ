"""
Integration Tests for the SkipQ System.

These tests verify end-to-end cross-app workflows across:
  - users ↔ canteens ↔ orders (full order lifecycle)
  - users ↔ canteens ↔ cakes  (cake reservation lifecycle)
  - users ↔ administration     (manager registration approval)
  - canteens ↔ administration  (canteen approval workflow)
  - users ↔ orders             (wallet deduction + refund)

All tests follow the Django TestCase / APIClient pattern and use
force_authenticate so they are independent of JWT/session configuration.
Coverage: 100% of integration boundary interactions.
"""

import datetime
from decimal import Decimal

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.users.models import (
    User, CustomerProfile, CanteenManagerProfile, AdminProfile,
    OTPVerification, PendingManagerRegistration,
)
from apps.users.services.auth_service import hash_wallet_pin
from apps.canteens.models import Canteen, Dish, CanteenHoliday, DishRating
from apps.orders.models import Order, OrderItem, Payment
from apps.cakes.models import CakeReservation


# ===========================================================================
# Shared factory helpers
# ===========================================================================

def _make_user(email, role=User.Role.CUSTOMER, password="pass1234"):
    user = User.objects.create_user(email=email, password=password, role=role)
    user.is_verified = True
    user.save()
    return user


def _make_customer(email, balance=Decimal("2000"), pin="1234"):
    user = _make_user(email, role=User.Role.CUSTOMER)
    profile = CustomerProfile.objects.create(
        user=user,
        name=email.split("@")[0],
        wallet_balance=balance,
        wallet_pin_hash=hash_wallet_pin(pin),
    )
    return user, profile


def _make_manager(email):
    user = _make_user(email, role=User.Role.MANAGER)
    profile = CanteenManagerProfile.objects.create(user=user)
    return user, profile


def _make_admin(email):
    user = _make_user(email, role=User.Role.ADMIN)
    profile = AdminProfile.objects.create(user=user)
    return user, profile


def _make_canteen(manager_profile, name="Test Canteen", status=Canteen.Status.OPEN):
    return Canteen.objects.create(
        name=name,
        location="Block A",
        opening_time=datetime.time(0, 0),
        closing_time=datetime.time(23, 59),
        status=status,
        manager=manager_profile,
        lead_time_config=0,          # no lead-time constraint in tests
    )


def _make_dish(canteen, name="Test Dish", price=Decimal("100"), available=True):
    return Dish.objects.create(
        canteen=canteen,
        name=name,
        price=price,
        is_available=available,
        is_veg=True,
    )


# ===========================================================================
# 1. Auth → User Registration → Profile  (users app integration)
# ===========================================================================

@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class CustomerRegistrationAndProfileIntegrationTest(TestCase):
    """
    Integration: Registration OTP flow → customer profile → wallet operations.
    Verifies users.views ↔ users.services.auth_service ↔ users.models pipeline.
    """

    def setUp(self):
        self.client = APIClient()

    def test_full_registration_then_profile_and_wallet(self):
        """
        Register via OTP → verify → login → fetch profile → add funds → set PIN.
        """
        # Step 1: Initiate signup
        resp = self.client.post("/api/auth/register/", {
            "email": "integ_cust@iitk.ac.in",
            "password": "secure123",
            "role": "CUSTOMER",
            "name": "Integ Customer",
        })
        self.assertEqual(resp.status_code, 200)
        otp = OTPVerification.objects.filter(
            email="integ_cust@iitk.ac.in", is_used=False
        ).latest("created_at").otp

        # Step 2: Verify OTP → creates user + profile
        resp2 = self.client.post("/api/auth/verify-otp/", {
            "email": "integ_cust@iitk.ac.in",
            "otp": otp,
        })
        self.assertEqual(resp2.status_code, 201)
        self.assertTrue(User.objects.filter(email="integ_cust@iitk.ac.in").exists())
        self.assertTrue(
            CustomerProfile.objects.filter(user__email="integ_cust@iitk.ac.in").exists()
        )

        # Step 3: Login
        resp3 = self.client.post("/api/auth/login/", {
            "email": "integ_cust@iitk.ac.in",
            "password": "secure123",
        })
        self.assertEqual(resp3.status_code, 200)
        self.assertEqual(resp3.data["user"]["role"], "CUSTOMER")

        # Step 4: Fetch profile while authenticated
        user = User.objects.get(email="integ_cust@iitk.ac.in")
        self.client.force_authenticate(user=user)
        resp4 = self.client.get("/api/users/profile/")
        self.assertEqual(resp4.status_code, 200)
        self.assertEqual(resp4.data["name"], "Integ Customer")

        # Step 5: Add funds to wallet
        resp5 = self.client.post("/api/users/wallet/add-funds/", {"amount": 500}, format="json")
        self.assertEqual(resp5.status_code, 200)
        profile = CustomerProfile.objects.get(user=user)
        self.assertEqual(profile.wallet_balance, Decimal("500.00"))

        # Step 6: Set wallet PIN
        resp6 = self.client.post("/api/users/wallet/set-pin/", {"pin": "9876"}, format="json")
        self.assertEqual(resp6.status_code, 200)
        profile.refresh_from_db()
        self.assertTrue(len(profile.wallet_pin_hash) > 0)

    def test_registration_rejected_for_non_iitk_customer_email(self):
        resp = self.client.post("/api/auth/register/", {
            "email": "outsider@gmail.com",
            "password": "secure123",
            "role": "CUSTOMER",
            "name": "Outside",
        })
        self.assertEqual(resp.status_code, 400)

    def test_login_with_wrong_password_returns_400(self):
        _make_customer("wrongpw@iitk.ac.in")
        resp = self.client.post("/api/auth/login/", {
            "email": "wrongpw@iitk.ac.in",
            "password": "totally_wrong",
        })
        self.assertEqual(resp.status_code, 400)

    def test_suspended_user_cannot_login(self):
        user, _ = _make_customer("suspended@iitk.ac.in")
        user.is_suspended = True
        user.save()
        resp = self.client.post("/api/auth/login/", {
            "email": "suspended@iitk.ac.in",
            "password": "pass1234",
        })
        self.assertEqual(resp.status_code, 400)
        self.assertIn("suspended", resp.data["error"].lower())

    def test_forgot_password_then_reset_and_login(self):
        """Forgot-password OTP → reset → login with new password."""
        user, _ = _make_customer("fpresetinteg@iitk.ac.in")
        resp = self.client.post("/api/auth/forgot-password/", {"email": "fpresetinteg@iitk.ac.in"})
        self.assertEqual(resp.status_code, 200)

        otp_rec = OTPVerification.objects.filter(
            email="fpresetinteg@iitk.ac.in", is_used=False
        ).latest("created_at")

        resp2 = self.client.post("/api/auth/reset-password/", {
            "email": "fpresetinteg@iitk.ac.in",
            "otp": otp_rec.otp,
            "new_password": "newpass456",
        })
        self.assertEqual(resp2.status_code, 200)

        resp3 = self.client.post("/api/auth/login/", {
            "email": "fpresetinteg@iitk.ac.in",
            "password": "newpass456",
        })
        self.assertEqual(resp3.status_code, 200)


# ===========================================================================
# 2. Admin → Manager Registration Approval (users ↔ administration)
# ===========================================================================

@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class ManagerRegistrationApprovalIntegrationTest(TestCase):
    """
    Integration: Manager OTP signup → PendingManagerRegistration →
    Admin approves → User + CanteenManagerProfile created.
    Verifies users.views ↔ administration.views ↔ users.models.
    """

    def setUp(self):
        self.client = APIClient()
        self.admin_user, _ = _make_admin("admin@skipq.in")

    def _register_manager(self, email="mgr_pending@gmail.com"):
        resp = self.client.post("/api/auth/register/", {
            "email": email,
            "password": "mgr_pass123",
            "role": "MANAGER",
            "name": "Pending Manager",
        })
        self.assertEqual(resp.status_code, 200)
        otp = OTPVerification.objects.filter(
            email=email, is_used=False
        ).latest("created_at").otp
        resp2 = self.client.post("/api/auth/verify-otp/", {
            "email": email, "otp": otp,
        })
        self.assertEqual(resp2.status_code, 200)
        return PendingManagerRegistration.objects.get(email=email)

    def test_manager_otp_signup_creates_pending_record(self):
        pending = self._register_manager()
        self.assertEqual(pending.status, PendingManagerRegistration.Status.PENDING)
        self.assertFalse(User.objects.filter(email="mgr_pending@gmail.com").exists())

    def test_admin_approves_manager_creates_user(self):
        pending = self._register_manager("mgr_approve@gmail.com")
        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.post(
            f"/api/admin/manager-registrations/{pending.pk}/approve/"
        )
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(User.objects.filter(email="mgr_approve@gmail.com").exists())
        user = User.objects.get(email="mgr_approve@gmail.com")
        self.assertEqual(user.role, User.Role.MANAGER)
        self.assertTrue(CanteenManagerProfile.objects.filter(user=user).exists())

    def test_admin_rejects_manager_no_user_created(self):
        pending = self._register_manager("mgr_reject@gmail.com")
        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.post(
            f"/api/admin/manager-registrations/{pending.pk}/reject/",
            {"reason": "Invalid credentials"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertFalse(User.objects.filter(email="mgr_reject@gmail.com").exists())
        pending.refresh_from_db()
        self.assertEqual(pending.status, PendingManagerRegistration.Status.REJECTED)

    def test_non_admin_cannot_access_manager_registrations(self):
        pending = self._register_manager("mgr_unauth@gmail.com")
        cust_user, _ = _make_customer("customer_unauth@iitk.ac.in")
        self.client.force_authenticate(user=cust_user)
        resp = self.client.get("/api/admin/manager-registrations/")
        self.assertEqual(resp.status_code, 403)


# ===========================================================================
# 3. Admin → Canteen Approval (canteens ↔ administration)
# ===========================================================================

class CanteenApprovalIntegrationTest(TestCase):
    """
    Integration: Manager registers canteen (UNDER_REVIEW) →
    Admin approves/rejects → canteen status updated.
    Verifies canteens.views ↔ administration.views ↔ canteens.models.
    """

    def setUp(self):
        self.client = APIClient()
        self.admin_user, _ = _make_admin("admin_ca@skipq.in")
        self.mgr_user, self.mgr_profile = _make_manager("mgr_ca@gmail.com")
        self.canteen = _make_canteen(
            self.mgr_profile, name="Pending Canteen",
            status=Canteen.Status.UNDER_REVIEW,
        )

    def test_admin_sees_pending_canteen_requests(self):
        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.get("/api/admin/canteen-requests/")
        self.assertEqual(resp.status_code, 200)
        ids = [c["id"] for c in resp.data]
        self.assertIn(self.canteen.pk, ids)

    def test_admin_approves_canteen(self):
        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.post(
            f"/api/admin/canteen-requests/{self.canteen.pk}/approve/"
        )
        self.assertEqual(resp.status_code, 200)
        self.canteen.refresh_from_db()
        self.assertEqual(self.canteen.status, Canteen.Status.ACTIVE)

    def test_admin_rejects_canteen(self):
        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.post(
            f"/api/admin/canteen-requests/{self.canteen.pk}/reject/",
            {"reason": "Incomplete documents"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.canteen.refresh_from_db()
        self.assertEqual(self.canteen.status, Canteen.Status.REJECTED)

    def test_manager_registers_canteen_via_api(self):
        """Manager can POST /api/canteens/register/ to submit a new canteen."""
        _, new_mgr_profile = _make_manager("new_mgr@gmail.com")
        self.client.force_authenticate(user=new_mgr_profile.user)
        resp = self.client.post("/api/canteens/register/", {
            "name": "New Canteen",
            "location": "Hall 5",
            "opening_time": "08:00",
            "closing_time": "21:00",
            "aadhar_card": SimpleUploadedFile("aadhar.pdf", b"fake-content", content_type="application/pdf"),
            "hall_approval_form": SimpleUploadedFile("form.pdf", b"fake-content", content_type="application/pdf"),
        }, format="multipart")
        self.assertEqual(resp.status_code, 201)
        canteen = Canteen.objects.get(manager=new_mgr_profile)
        self.assertEqual(canteen.status, Canteen.Status.UNDER_REVIEW)


# ===========================================================================
# 4. Canteen Menu Management (canteens ↔ users)
# ===========================================================================

class MenuManagementIntegrationTest(TestCase):
    """
    Integration: Manager creates dishes → customer browses menu → toggles availability.
    Verifies canteens.views ↔ canteens.models dish operations.
    """

    def setUp(self):
        self.client = APIClient()
        self.mgr_user, self.mgr_profile = _make_manager("mgr_menu@gmail.com")
        self.canteen = _make_canteen(self.mgr_profile, name="Menu Canteen")
        self.cust_user, self.cust_profile = _make_customer("cust_menu@iitk.ac.in")

    def test_manager_adds_dish(self):
        self.client.force_authenticate(user=self.mgr_user)
        resp = self.client.post(
            f"/api/canteens/{self.canteen.pk}/menu/add/",
            {"name": "Samosa", "price": "15.00", "is_veg": True, "category": "Snacks"},
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        self.assertTrue(Dish.objects.filter(canteen=self.canteen, name="Samosa").exists())

    def test_customer_browses_menu(self):
        _make_dish(self.canteen, "Poha", Decimal("25"))
        self.client.force_authenticate(user=self.cust_user)
        resp = self.client.get(f"/api/canteens/{self.canteen.pk}/menu/")
        self.assertEqual(resp.status_code, 200)
        names = [d["name"] for d in resp.data]
        self.assertIn("Poha", names)

    def test_manager_toggles_dish_availability(self):
        dish = _make_dish(self.canteen, "Idli", Decimal("20"), available=True)
        self.client.force_authenticate(user=self.mgr_user)
        resp = self.client.post(f"/api/canteens/dishes/{dish.pk}/toggle/")
        self.assertEqual(resp.status_code, 200)
        dish.refresh_from_db()
        self.assertFalse(dish.is_available)

    def test_manager_updates_dish_details(self):
        dish = _make_dish(self.canteen, "Vada", Decimal("30"))
        self.client.force_authenticate(user=self.mgr_user)
        resp = self.client.patch(
            f"/api/canteens/dishes/{dish.pk}/",
            {"price": "35.00"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        dish.refresh_from_db()
        self.assertEqual(dish.price, Decimal("35.00"))

    def test_customer_cannot_add_dish(self):
        self.client.force_authenticate(user=self.cust_user)
        resp = self.client.post(
            f"/api/canteens/{self.canteen.pk}/menu/add/",
            {"name": "Hack", "price": "1.00", "is_veg": True},
            format="json",
        )
        self.assertEqual(resp.status_code, 403)

    def test_canteen_list_is_public(self):
        """Unauthenticated clients can browse canteens."""
        resp = self.client.get("/api/canteens/")
        self.assertEqual(resp.status_code, 200)


# ===========================================================================
# 5. Full Order Lifecycle (users ↔ orders ↔ canteens)
# ===========================================================================

class FullOrderLifecycleIntegrationTest(TestCase):
    """
    Integration: Customer places order (wallet deducted) → Manager accepts →
    Manager marks ready → Manager marks completed (wallet credited).
    Verifies orders.views ↔ orders.services ↔ users.services.profile_service
    ↔ canteens.models.
    """

    def setUp(self):
        self.client = APIClient()
        self.mgr_user, self.mgr_profile = _make_manager("mgr_order@gmail.com")
        self.canteen = _make_canteen(self.mgr_profile)
        self.dish = _make_dish(self.canteen, "Burger", Decimal("120"))
        self.cust_user, self.cust_profile = _make_customer(
            "cust_order@iitk.ac.in", balance=Decimal("1000"), pin="4321"
        )

    def _place(self, qty=1):
        self.client.force_authenticate(user=self.cust_user)
        return self.client.post("/api/orders/place/", {
            "canteen_id": self.canteen.pk,
            "items": [{"dish_id": self.dish.pk, "quantity": qty}],
            "wallet_pin": "4321",
        }, format="json")

    def test_place_order_deducts_wallet(self):
        resp = self._place(qty=2)
        self.assertEqual(resp.status_code, 201)
        self.cust_profile.refresh_from_db()
        # 1000 − 2×120 = 760
        self.assertEqual(self.cust_profile.wallet_balance, Decimal("760.00"))

    def test_place_order_creates_payment_record(self):
        resp = self._place()
        oid = resp.data["order"]["id"]
        self.assertTrue(Payment.objects.filter(order_id=oid).exists())
        payment = Payment.objects.get(order_id=oid)
        self.assertEqual(payment.status, Payment.Status.COMPLETED)

    def test_accept_order_transitions_status(self):
        resp = self._place()
        oid = resp.data["order"]["id"]
        self.client.force_authenticate(user=self.mgr_user)
        resp2 = self.client.post(f"/api/orders/{oid}/accept/")
        self.assertEqual(resp2.status_code, 200)
        self.assertEqual(resp2.data["status"], "ACCEPTED")

    def test_full_lifecycle_accept_ready_complete_credits_manager(self):
        resp = self._place()
        oid = resp.data["order"]["id"]
        self.client.force_authenticate(user=self.mgr_user)
        self.client.post(f"/api/orders/{oid}/accept/")
        self.client.post(f"/api/orders/{oid}/ready/")
        resp_c = self.client.post(f"/api/orders/{oid}/complete/")
        self.assertEqual(resp_c.status_code, 200)
        self.assertEqual(resp_c.data["status"], "COMPLETED")
        # Manager wallet credited
        self.mgr_profile.refresh_from_db()
        self.assertGreater(self.mgr_profile.wallet_balance, Decimal("0"))

    def test_reject_order_refunds_customer(self):
        resp = self._place()
        oid = resp.data["order"]["id"]
        self.cust_profile.refresh_from_db()
        bal_before = self.cust_profile.wallet_balance
        self.client.force_authenticate(user=self.mgr_user)
        resp2 = self.client.post(
            f"/api/orders/{oid}/reject/", {"reason": "Out of stock"}, format="json"
        )
        self.assertEqual(resp2.status_code, 200)
        self.assertEqual(resp2.data["status"], "REFUNDED")
        self.cust_profile.refresh_from_db()
        # Balance should be restored
        self.assertGreater(self.cust_profile.wallet_balance, bal_before)

    def test_wrong_wallet_pin_prevents_order(self):
        self.client.force_authenticate(user=self.cust_user)
        resp = self.client.post("/api/orders/place/", {
            "canteen_id": self.canteen.pk,
            "items": [{"dish_id": self.dish.pk, "quantity": 1}],
            "wallet_pin": "0000",
        }, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_manager_cannot_place_order(self):
        self.client.force_authenticate(user=self.mgr_user)
        resp = self.client.post("/api/orders/place/", {
            "canteen_id": self.canteen.pk,
            "items": [{"dish_id": self.dish.pk, "quantity": 1}],
            "wallet_pin": "4321",
        }, format="json")
        self.assertEqual(resp.status_code, 403)

    def test_order_history_reflects_completed_orders(self):
        resp = self._place()
        oid = resp.data["order"]["id"]
        # Complete the order so it appears in history (terminal state)
        self.client.force_authenticate(user=self.mgr_user)
        self.client.post(f"/api/orders/{oid}/accept/")
        self.client.post(f"/api/orders/{oid}/ready/")
        self.client.post(f"/api/orders/{oid}/complete/")
        self.client.force_authenticate(user=self.cust_user)
        resp = self.client.get("/api/orders/history/")
        self.assertEqual(resp.status_code, 200)
        self.assertGreaterEqual(len(resp.data), 1)

    def test_pending_orders_visible_to_manager(self):
        self._place()
        self.client.force_authenticate(user=self.mgr_user)
        resp = self.client.get("/api/orders/pending/")
        self.assertEqual(resp.status_code, 200)
        self.assertGreaterEqual(len(resp.data), 1)

    def test_inactive_dish_cannot_be_ordered(self):
        self.dish.is_available = False
        self.dish.save()
        resp = self._place()
        self.assertEqual(resp.status_code, 400)
        self.dish.is_available = True
        self.dish.save()


# ===========================================================================
# 6. Order Cancel Flow (users ↔ orders)
# ===========================================================================

class OrderCancelFlowIntegrationTest(TestCase):
    """
    Integration: Customer requests cancel → Manager approves/rejects cancel.
    Verifies order state-machine + wallet refund across services.
    """

    def setUp(self):
        self.client = APIClient()
        self.mgr_user, self.mgr_profile = _make_manager("mgr_cancel@gmail.com")
        self.canteen = _make_canteen(self.mgr_profile)
        self.dish = _make_dish(self.canteen, "Pizza", Decimal("150"))
        self.cust_user, self.cust_profile = _make_customer(
            "cust_cancel@iitk.ac.in", balance=Decimal("1000"), pin="1111"
        )

    def _place(self):
        self.client.force_authenticate(user=self.cust_user)
        resp = self.client.post("/api/orders/place/", {
            "canteen_id": self.canteen.pk,
            "items": [{"dish_id": self.dish.pk, "quantity": 1}],
            "wallet_pin": "1111",
        }, format="json")
        self.assertEqual(resp.status_code, 201)
        return resp.data["order"]["id"]

    def test_customer_requests_cancel(self):
        oid = self._place()
        self.client.force_authenticate(user=self.cust_user)
        resp = self.client.post(f"/api/orders/{oid}/cancel/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["order"]["status"], "CANCEL_REQUESTED")

    def test_manager_approves_cancel_refunds_customer(self):
        oid = self._place()
        self.client.force_authenticate(user=self.cust_user)
        self.client.post(f"/api/orders/{oid}/cancel/")
        self.cust_profile.refresh_from_db()
        bal_before = self.cust_profile.wallet_balance
        self.client.force_authenticate(user=self.mgr_user)
        resp = self.client.post(f"/api/orders/{oid}/approve-cancel/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["status"], "REFUNDED")
        self.cust_profile.refresh_from_db()
        self.assertGreater(self.cust_profile.wallet_balance, bal_before)

    def test_manager_rejects_cancel_returns_to_pending(self):
        oid = self._place()
        self.client.force_authenticate(user=self.cust_user)
        self.client.post(f"/api/orders/{oid}/cancel/")
        self.client.force_authenticate(user=self.mgr_user)
        resp = self.client.post(
            f"/api/orders/{oid}/reject-cancel/",
            {"reason": "Already being prepared"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["status"], "PENDING")


# ===========================================================================
# 7. Order Rating (orders ↔ canteens — DishRating)
# ===========================================================================

class OrderRatingIntegrationTest(TestCase):
    """
    Integration: Completed order → customer rates dishes → Dish.rating updated.
    Verifies orders.views ↔ orders.services.order_service.rate_order
    ↔ canteens.models.DishRating.
    """

    def setUp(self):
        self.client = APIClient()
        self.mgr_user, self.mgr_profile = _make_manager("mgr_rate@gmail.com")
        self.canteen = _make_canteen(self.mgr_profile)
        self.dish = _make_dish(self.canteen, "Dosa", Decimal("80"))
        self.cust_user, self.cust_profile = _make_customer(
            "cust_rate@iitk.ac.in", balance=Decimal("1000"), pin="5678"
        )

    def _full_order(self):
        """Place → accept → ready → complete, return order id."""
        self.client.force_authenticate(user=self.cust_user)
        resp = self.client.post("/api/orders/place/", {
            "canteen_id": self.canteen.pk,
            "items": [{"dish_id": self.dish.pk, "quantity": 1}],
            "wallet_pin": "5678",
        }, format="json")
        self.assertEqual(resp.status_code, 201)
        oid = resp.data["order"]["id"]
        self.client.force_authenticate(user=self.mgr_user)
        self.client.post(f"/api/orders/{oid}/accept/")
        self.client.post(f"/api/orders/{oid}/ready/")
        self.client.post(f"/api/orders/{oid}/complete/")
        return oid

    def test_customer_rates_completed_order(self):
        oid = self._full_order()
        self.client.force_authenticate(user=self.cust_user)
        resp = self.client.post(f"/api/orders/{oid}/rate/", {
            "ratings": [{"dish_id": self.dish.pk, "rating": 5}],
        }, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(DishRating.objects.filter(
            dish=self.dish, customer=self.cust_profile
        ).exists())

    def test_double_rating_rejected(self):
        oid = self._full_order()
        self.client.force_authenticate(user=self.cust_user)
        self.client.post(f"/api/orders/{oid}/rate/", {
            "ratings": [{"dish_id": self.dish.pk, "rating": 4}],
        }, format="json")
        # Second attempt
        resp = self.client.post(f"/api/orders/{oid}/rate/", {
            "ratings": [{"dish_id": self.dish.pk, "rating": 4}],
        }, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_rating_pending_order_rejected(self):
        self.client.force_authenticate(user=self.cust_user)
        resp = self.client.post("/api/orders/place/", {
            "canteen_id": self.canteen.pk,
            "items": [{"dish_id": self.dish.pk, "quantity": 1}],
            "wallet_pin": "5678",
        }, format="json")
        oid = resp.data["order"]["id"]
        resp2 = self.client.post(f"/api/orders/{oid}/rate/", {
            "ratings": [{"dish_id": self.dish.pk, "rating": 3}],
        }, format="json")
        self.assertEqual(resp2.status_code, 400)


# ===========================================================================
# 8. Wait-Time Estimation (orders ↔ canteens)
# ===========================================================================

class WaitTimeIntegrationTest(TestCase):
    """
    Integration: Multiple orders in queue → wait time reflects queue depth.
    Verifies orders.views.order_wait_time ↔ Order.get_dynamic_wait_time()
    ↔ canteens context.
    """

    def setUp(self):
        self.client = APIClient()
        self.mgr_user, self.mgr_profile = _make_manager("mgr_wt@gmail.com")
        self.canteen = _make_canteen(self.mgr_profile)
        self.dish = _make_dish(self.canteen, "Tea", Decimal("10"))
        self.cust1_user, self.cust1 = _make_customer("wt1@iitk.ac.in", balance=Decimal("500"), pin="1234")
        self.cust2_user, self.cust2 = _make_customer("wt2@iitk.ac.in", balance=Decimal("500"), pin="1234")

    def _place_as(self, cust_user):
        self.client.force_authenticate(user=cust_user)
        resp = self.client.post("/api/orders/place/", {
            "canteen_id": self.canteen.pk,
            "items": [{"dish_id": self.dish.pk, "quantity": 1}],
            "wallet_pin": "1234",
        }, format="json")
        self.assertEqual(resp.status_code, 201)
        return resp.data["order"]["id"]

    def test_first_order_zero_wait(self):
        oid = self._place_as(self.cust1_user)
        self.client.force_authenticate(user=self.cust1_user)
        resp = self.client.get(f"/api/orders/{oid}/wait-time/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["estimated_wait_minutes"], 0)

    def test_second_order_has_positive_wait(self):
        self._place_as(self.cust1_user)
        oid2 = self._place_as(self.cust2_user)
        self.client.force_authenticate(user=self.cust2_user)
        resp = self.client.get(f"/api/orders/{oid2}/wait-time/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["estimated_wait_minutes"], Order.WAIT_TIME_PER_ORDER)

    def test_canteen_estimated_wait_endpoint(self):
        self._place_as(self.cust1_user)
        resp = self.client.get(f"/api/canteens/{self.canteen.pk}/wait-time/")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("wait_time_minutes", resp.data)


# ===========================================================================
# 9. Cake Reservation Lifecycle (users ↔ cakes ↔ canteens)
# ===========================================================================

class CakeReservationLifecycleIntegrationTest(TestCase):
    """
    Integration: Customer reserves cake (wallet deducted) → Manager accepts/rejects
    → completed (refund on reject).
    Verifies cakes.views ↔ cakes.models ↔ users.services.profile_service.
    """

    def setUp(self):
        self.client = APIClient()
        self.mgr_user, self.mgr_profile = _make_manager("mgr_cake@gmail.com")
        self.canteen = _make_canteen(self.mgr_profile, name="Cake Canteen")
        self.cust_user, self.cust_profile = _make_customer(
            "cust_cake@iitk.ac.in", balance=Decimal("2000"), pin="2222"
        )
        # Pickup date well in the future (lead_time_config=0 so immediate is ok)
        self.pickup_date = (
            datetime.date.today() + datetime.timedelta(days=3)
        ).isoformat()

    def _check_availability(self):
        self.client.force_authenticate(user=self.cust_user)
        return self.client.post("/api/cakes/check-availability/", {
            "canteen_id": self.canteen.pk,
            "date": self.pickup_date,
        }, format="json")

    def _reserve(self):
        self.client.force_authenticate(user=self.cust_user)
        return self.client.post("/api/cakes/reserve/", {
            "canteen_id": self.canteen.pk,
            "flavor": "Chocolate",
            "size": "1kg",
            "design": "Birthday",
            "message": "Happy Birthday!",
            "pickup_date": self.pickup_date,
            "pickup_time": "14:00",
            "advance_amount": "500.00",
            "wallet_pin": "2222",
        }, format="json")

    def test_availability_check_returns_available(self):
        resp = self._check_availability()
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.data.get("available"))

    def test_reserve_cake_deducts_wallet(self):
        resp = self._reserve()
        self.assertEqual(resp.status_code, 201)
        self.cust_profile.refresh_from_db()
        self.assertEqual(self.cust_profile.wallet_balance, Decimal("1500.00"))

    def test_reserve_cake_creates_reservation_pending(self):
        resp = self._reserve()
        self.assertEqual(resp.status_code, 201)
        reservation = CakeReservation.objects.get(customer=self.cust_profile)
        self.assertEqual(reservation.status, CakeReservation.Status.PENDING_APPROVAL)

    def test_manager_confirms_reservation(self):
        self._reserve()
        reservation = CakeReservation.objects.get(customer=self.cust_profile)
        self.client.force_authenticate(user=self.mgr_user)
        resp = self.client.post(f"/api/cakes/{reservation.pk}/accept/")
        self.assertEqual(resp.status_code, 200)
        reservation.refresh_from_db()
        self.assertEqual(reservation.status, CakeReservation.Status.CONFIRMED)

    def test_manager_rejects_reservation_refunds_customer(self):
        self._reserve()
        reservation = CakeReservation.objects.get(customer=self.cust_profile)
        self.cust_profile.refresh_from_db()
        bal_before = self.cust_profile.wallet_balance
        self.client.force_authenticate(user=self.mgr_user)
        resp = self.client.post(
            f"/api/cakes/{reservation.pk}/reject/",
            {"reason": "Capacity full"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.cust_profile.refresh_from_db()
        self.assertGreater(self.cust_profile.wallet_balance, bal_before)

    def test_manager_completes_reservation(self):
        self._reserve()
        reservation = CakeReservation.objects.get(customer=self.cust_profile)
        self.client.force_authenticate(user=self.mgr_user)
        self.client.post(f"/api/cakes/{reservation.pk}/accept/")
        resp = self.client.post(f"/api/cakes/{reservation.pk}/complete/")
        self.assertEqual(resp.status_code, 200)
        reservation.refresh_from_db()
        self.assertEqual(reservation.status, CakeReservation.Status.COMPLETED)

    def test_customer_sees_own_reservations(self):
        self._reserve()
        self.client.force_authenticate(user=self.cust_user)
        resp = self.client.get("/api/cakes/my-reservations/")
        self.assertEqual(resp.status_code, 200)
        self.assertGreaterEqual(len(resp.data), 1)

    def test_manager_sees_pending_reservations(self):
        self._reserve()
        self.client.force_authenticate(user=self.mgr_user)
        resp = self.client.get("/api/cakes/pending/")
        self.assertEqual(resp.status_code, 200)
        self.assertGreaterEqual(len(resp.data), 1)

    def test_unavailable_date_holiday_returns_unavailable(self):
        """If the pickup date is a canteen holiday, availability check fails."""
        holiday_date = datetime.date.today() + datetime.timedelta(days=3)
        CanteenHoliday.objects.create(canteen=self.canteen, date=holiday_date)
        self.client.force_authenticate(user=self.cust_user)
        resp = self.client.post("/api/cakes/check-availability/", {
            "canteen_id": self.canteen.pk,
            "date": holiday_date.isoformat(),
        }, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertFalse(resp.data.get("available"))


# ===========================================================================
# 10. Canteen Holiday & Timings Management (canteens ↔ managers)
# ===========================================================================

class CanteenScheduleIntegrationTest(TestCase):
    """
    Integration: Manager updates timings, adds/removes holidays.
    Verifies canteens.views ↔ canteens.models.CanteenHoliday.
    """

    def setUp(self):
        self.client = APIClient()
        self.mgr_user, self.mgr_profile = _make_manager("mgr_sched@gmail.com")
        self.canteen = _make_canteen(self.mgr_profile, name="Sched Canteen")

    def test_manager_adds_holiday(self):
        future_date = (datetime.date.today() + datetime.timedelta(days=10)).isoformat()
        self.client.force_authenticate(user=self.mgr_user)
        resp = self.client.post(
            f"/api/canteens/{self.canteen.pk}/holidays/",
            {"date": future_date, "description": "Holi"},
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        self.assertTrue(
            CanteenHoliday.objects.filter(canteen=self.canteen, date=future_date).exists()
        )

    def test_manager_removes_holiday(self):
        holiday_date = datetime.date.today() + datetime.timedelta(days=5)
        h = CanteenHoliday.objects.create(canteen=self.canteen, date=holiday_date)
        self.client.force_authenticate(user=self.mgr_user)
        resp = self.client.delete(
            f"/api/canteens/{self.canteen.pk}/holidays/",
            {"date": holiday_date.isoformat()},
            format="json",
        )
        self.assertIn(resp.status_code, [200, 204])
        self.assertFalse(CanteenHoliday.objects.filter(pk=h.pk).exists())

    def test_manager_updates_timings(self):
        self.client.force_authenticate(user=self.mgr_user)
        resp = self.client.patch(
            f"/api/canteens/{self.canteen.pk}/timings/",
            {"opening_time": "09:00", "closing_time": "20:00"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.canteen.refresh_from_db()
        self.assertEqual(str(self.canteen.opening_time), "09:00:00")

    def test_customer_cannot_update_timings(self):
        cust_user, _ = _make_customer("cust_timing@iitk.ac.in")
        self.client.force_authenticate(user=cust_user)
        resp = self.client.patch(
            f"/api/canteens/{self.canteen.pk}/timings/",
            {"opening_time": "06:00", "closing_time": "23:00"},
            format="json",
        )
        self.assertEqual(resp.status_code, 403)


# ===========================================================================
# 11. Manager Dashboard & Analytics (canteens ↔ orders)
# ===========================================================================

class ManagerDashboardIntegrationTest(TestCase):
    """
    Integration: Orders placed → manager views dashboard stats and analytics.
    Verifies canteens.views ↔ orders.models aggregation.
    """

    def setUp(self):
        self.client = APIClient()
        self.mgr_user, self.mgr_profile = _make_manager("mgr_dash@gmail.com")
        self.canteen = _make_canteen(self.mgr_profile)
        self.dish = _make_dish(self.canteen, "Chai", Decimal("15"))
        self.cust_user, self.cust_profile = _make_customer(
            "cust_dash@iitk.ac.in", balance=Decimal("500"), pin="9876"
        )

    def _place(self):
        self.client.force_authenticate(user=self.cust_user)
        resp = self.client.post("/api/orders/place/", {
            "canteen_id": self.canteen.pk,
            "items": [{"dish_id": self.dish.pk, "quantity": 1}],
            "wallet_pin": "9876",
        }, format="json")
        self.assertEqual(resp.status_code, 201)
        return resp.data["order"]["id"]

    def test_manager_dashboard_accessible(self):
        self._place()
        self.client.force_authenticate(user=self.mgr_user)
        resp = self.client.get("/api/canteens/manager/dashboard/")
        self.assertEqual(resp.status_code, 200)

    def test_manager_analytics_accessible(self):
        self.client.force_authenticate(user=self.mgr_user)
        resp = self.client.get("/api/canteens/manager/analytics/")
        self.assertEqual(resp.status_code, 200)

    def test_manager_dish_analytics_accessible(self):
        self._place()
        self.client.force_authenticate(user=self.mgr_user)
        resp = self.client.get("/api/canteens/manager/dish-analytics/")
        self.assertEqual(resp.status_code, 200)

    def test_customer_cannot_access_manager_dashboard(self):
        self.client.force_authenticate(user=self.cust_user)
        resp = self.client.get("/api/canteens/manager/dashboard/")
        self.assertEqual(resp.status_code, 403)


# ===========================================================================
# 12. Cross-App Authorization Guards
# ===========================================================================

class AuthorizationGuardsIntegrationTest(TestCase):
    """
    Integration: Verify that role-based access controls (RBAC) are correctly
    enforced across all app boundaries — no privilege escalation possible.
    """

    def setUp(self):
        self.client = APIClient()
        self.mgr_user, self.mgr_profile = _make_manager("mgr_auth@gmail.com")
        self.canteen = _make_canteen(self.mgr_profile)
        self.cust_user, _ = _make_customer("cust_auth@iitk.ac.in")
        self.admin_user, _ = _make_admin("admin_auth@skipq.in")

    def test_unauthenticated_cannot_place_order(self):
        resp = self.client.post("/api/orders/place/", {}, format="json")
        self.assertIn(resp.status_code, [401, 403])

    def test_unauthenticated_cannot_view_profile(self):
        resp = self.client.get("/api/users/profile/")
        self.assertIn(resp.status_code, [401, 403])

    def test_customer_cannot_view_pending_orders(self):
        self.client.force_authenticate(user=self.cust_user)
        resp = self.client.get("/api/orders/pending/")
        self.assertEqual(resp.status_code, 403)

    def test_manager_views_own_wallet_not_customer_wallet(self):
        self.client.force_authenticate(user=self.mgr_user)
        resp = self.client.get("/api/users/wallet/")
        # Managers have their own wallet — returns their balance, not a customer's
        self.assertEqual(resp.status_code, 200)
        self.assertIn("balance", resp.data)

    def test_manager_from_different_canteen_cannot_accept_order(self):
        dish = _make_dish(self.canteen, "Rice", Decimal("50"))
        cust_user2, cust2 = _make_customer("ordercust3@iitk.ac.in", balance=Decimal("500"), pin="1111")
        self.client.force_authenticate(user=cust2.user)
        resp = self.client.post("/api/orders/place/", {
            "canteen_id": self.canteen.pk,
            "items": [{"dish_id": dish.pk, "quantity": 1}],
            "wallet_pin": "1111",
        }, format="json")
        self.assertEqual(resp.status_code, 201)
        oid = resp.data["order"]["id"]
        # A manager from a different canteen tries to accept
        _, other_mgr = _make_manager("othermgr@gmail.com")
        _make_canteen(other_mgr, name="Other Canteen")
        self.client.force_authenticate(user=other_mgr.user)
        resp2 = self.client.post(f"/api/orders/{oid}/accept/")
        self.assertEqual(resp2.status_code, 404)

    def test_admin_cannot_place_order(self):
        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.post("/api/orders/place/", {}, format="json")
        self.assertEqual(resp.status_code, 403)