"""
Unit and component tests for the users app.

Covers:
  - User model creation (all roles)
  - Registration flow (initiate_signup, verify_otp, complete_registration)
  - Login/logout
  - Forgot password + reset password
  - Profile API (GET/PATCH)
  - Wallet operations (balance, add funds, set PIN)
  - Service layer (auth_service, profile_service)
"""

from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.users.models import (
    User, CustomerProfile, CanteenManagerProfile, AdminProfile, OTPVerification,
)
from apps.users.services import auth_service, profile_service


# ============================================================
# Model-level unit tests
# ============================================================

class UserModelTest(TestCase):

    def test_create_customer(self):
        u = User.objects.create_user("c@iitk.ac.in", "pass123", role="CUSTOMER")
        self.assertEqual(u.role, User.Role.CUSTOMER)
        self.assertFalse(u.is_staff)

    def test_create_manager(self):
        u = User.objects.create_user("m@iitk.ac.in", "pass123", role="MANAGER")
        self.assertEqual(u.role, User.Role.MANAGER)

    def test_create_superuser(self):
        u = User.objects.create_superuser("su@iitk.ac.in", "pass123")
        self.assertTrue(u.is_staff)
        self.assertTrue(u.is_superuser)
        self.assertEqual(u.role, User.Role.ADMIN)

    def test_email_required(self):
        with self.assertRaises(ValueError):
            User.objects.create_user("", "pass123")

    def test_customer_profile_creation(self):
        u = User.objects.create_user("c2@iitk.ac.in", "pass123", role="CUSTOMER")
        cp = CustomerProfile.objects.create(user=u, name="Test")
        self.assertEqual(cp.wallet_balance, Decimal("0.00"))
        self.assertEqual(str(cp), "Customer: c2@iitk.ac.in")

    def test_manager_profile_creation(self):
        u = User.objects.create_user("m2@iitk.ac.in", "pass123", role="MANAGER")
        mp = CanteenManagerProfile.objects.create(user=u, contact_details="Hall 5")
        self.assertIsNotNone(mp.manager_id)


# ============================================================
# Auth service unit tests
# ============================================================

class AuthServiceTest(TestCase):

    def test_validate_iitk_email_customer(self):
        with self.assertRaises(ValueError):
            auth_service.validate_registration_email("test@gmail.com", User.Role.CUSTOMER)

    def test_validate_iitk_email_ok(self):
        auth_service.validate_registration_email("test@iitk.ac.in", User.Role.CUSTOMER)

    def test_validate_duplicate_email(self):
        User.objects.create_user("dup@iitk.ac.in", "pass123")
        with self.assertRaises(ValueError):
            auth_service.validate_registration_email("dup@iitk.ac.in", User.Role.CUSTOMER)

    def test_manager_email_no_iitk_check(self):
        auth_service.validate_registration_email("mgr@gmail.com", User.Role.MANAGER)

    @patch("django.core.mail.send_mail")
    def test_generate_otp(self, mock_mail):
        otp = auth_service.generate_and_send_otp("test@iitk.ac.in", "pw", "CUSTOMER", "Test")
        self.assertEqual(len(otp), 6)
        rec = OTPVerification.objects.filter(email="test@iitk.ac.in").first()
        self.assertIsNotNone(rec)
        self.assertFalse(rec.is_used)

    @patch("django.core.mail.send_mail")
    def test_verify_otp_success(self, mock_mail):
        otp = auth_service.generate_and_send_otp("v@iitk.ac.in", "pw", "CUSTOMER", "V")
        rec = auth_service.verify_otp("v@iitk.ac.in", otp)
        self.assertTrue(rec.is_used)

    @patch("django.core.mail.send_mail")
    def test_verify_otp_wrong(self, mock_mail):
        auth_service.generate_and_send_otp("w@iitk.ac.in", "pw", "CUSTOMER", "W")
        with self.assertRaises(ValueError):
            auth_service.verify_otp("w@iitk.ac.in", "000000")

    def test_complete_registration_customer(self):
        u = auth_service.complete_registration("cr@iitk.ac.in", password="pw123", role="CUSTOMER", name="CR")
        self.assertEqual(u.role, User.Role.CUSTOMER)
        self.assertTrue(u.is_verified)
        self.assertTrue(hasattr(u, "customer_profile"))

    def test_complete_registration_manager(self):
        u = auth_service.complete_registration("mr@gmail.com", password="pw123", role="MANAGER", name="MR")
        self.assertEqual(u.role, User.Role.MANAGER)
        self.assertTrue(hasattr(u, "manager_profile"))

    def test_hash_wallet_pin(self):
        h = auth_service.hash_wallet_pin("1234")
        self.assertEqual(len(h), 64)  # SHA-256 hex digest

    def test_verify_wallet_pin(self):
        h = auth_service.hash_wallet_pin("1234")
        self.assertTrue(auth_service.verify_wallet_pin(h, "1234"))
        self.assertFalse(auth_service.verify_wallet_pin(h, "0000"))


# ============================================================
# Profile service unit tests
# ============================================================

class ProfileServiceTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user("ps@iitk.ac.in", "pw", role="CUSTOMER")
        cls.profile = CustomerProfile.objects.create(
            user=cls.user, name="PS User", wallet_balance=Decimal("500.00")
        )
        cls.mgr_user = User.objects.create_user("pm@iitk.ac.in", "pw", role="MANAGER")
        cls.mgr_profile = CanteenManagerProfile.objects.create(user=cls.mgr_user)

    def test_add_funds(self):
        new_bal = profile_service.add_funds(self.profile, 100)
        self.assertEqual(new_bal, Decimal("600.00"))

    def test_add_funds_negative(self):
        with self.assertRaises(ValueError):
            profile_service.add_funds(self.profile, -50)

    def test_deduct_funds(self):
        self.profile.refresh_from_db()
        old_bal = self.profile.wallet_balance
        profile_service.deduct_funds(self.profile, Decimal("50"))
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.wallet_balance, old_bal - Decimal("50"))

    def test_deduct_insufficient(self):
        with self.assertRaises(ValueError):
            profile_service.deduct_funds(self.profile, 99999)

    def test_refund_to_wallet(self):
        old = self.profile.wallet_balance
        profile_service.refund_to_wallet(self.profile, 200)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.wallet_balance, old + Decimal("200.00"))

    def test_set_wallet_pin(self):
        profile_service.set_wallet_pin(self.profile, "5678")
        self.profile.refresh_from_db()
        self.assertTrue(len(self.profile.wallet_pin_hash) > 0)

    def test_credit_to_manager(self):
        self.mgr_profile.refresh_from_db()
        old_bal = self.mgr_profile.wallet_balance
        new_bal = profile_service.credit_to_manager(self.mgr_profile, Decimal("300"))
        self.assertEqual(new_bal, old_bal + Decimal("300"))


# ============================================================
# API-level component tests
# ============================================================

@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class AuthAPITest(TestCase):

    def setUp(self):
        self.client = APIClient()

    def test_register_flow(self):
        resp = self.client.post("/api/auth/register/", {
            "email": "reg@iitk.ac.in",
            "password": "testpass123",
            "role": "CUSTOMER",
            "name": "Reg User",
        })
        self.assertEqual(resp.status_code, 200)
        otp_val = resp.data["otp_dev"]

        resp2 = self.client.post("/api/auth/verify-otp/", {
            "email": "reg@iitk.ac.in",
            "otp": otp_val,
        })
        self.assertEqual(resp2.status_code, 201)
        self.assertTrue(User.objects.filter(email="reg@iitk.ac.in").exists())

    def test_register_non_iitk_email(self):
        resp = self.client.post("/api/auth/register/", {
            "email": "reg@gmail.com",
            "password": "testpass123",
            "role": "CUSTOMER",
            "name": "Bad",
        })
        self.assertEqual(resp.status_code, 400)

    def test_login_logout(self):
        u = auth_service.complete_registration("login@iitk.ac.in", password="pw", role="CUSTOMER", name="LI")
        resp = self.client.post("/api/auth/login/", {
            "email": "login@iitk.ac.in",
            "password": "pw",
        })
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["user"]["email"], "login@iitk.ac.in")

        resp2 = self.client.post("/api/auth/logout/")
        self.assertEqual(resp2.status_code, 200)

    def test_login_wrong_password(self):
        auth_service.complete_registration("lw@iitk.ac.in", password="pw", role="CUSTOMER", name="LW")
        resp = self.client.post("/api/auth/login/", {
            "email": "lw@iitk.ac.in",
            "password": "wrong",
        })
        self.assertEqual(resp.status_code, 400)

    def test_login_suspended_user(self):
        u = auth_service.complete_registration("sus@iitk.ac.in", password="pw", role="CUSTOMER", name="SUS")
        u.is_suspended = True
        u.save()
        resp = self.client.post("/api/auth/login/", {
            "email": "sus@iitk.ac.in",
            "password": "pw",
        })
        self.assertEqual(resp.status_code, 400)
        self.assertIn("suspended", resp.data["error"].lower())

    def test_forgot_and_reset_password(self):
        auth_service.complete_registration("fp@iitk.ac.in", password="old", role="CUSTOMER", name="FP")
        resp = self.client.post("/api/auth/forgot-password/", {"email": "fp@iitk.ac.in"})
        self.assertEqual(resp.status_code, 200)

        otp_rec = OTPVerification.objects.filter(email="fp@iitk.ac.in", is_used=False).latest("created_at")
        resp2 = self.client.post("/api/auth/reset-password/", {
            "email": "fp@iitk.ac.in",
            "otp": otp_rec.otp,
            "new_password": "newpw123",
        })
        self.assertEqual(resp2.status_code, 200)

        resp3 = self.client.post("/api/auth/login/", {"email": "fp@iitk.ac.in", "password": "newpw123"})
        self.assertEqual(resp3.status_code, 200)


class ProfileAPITest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user("papi@iitk.ac.in", "pw", role="CUSTOMER")
        cls.user.is_verified = True
        cls.user.save()
        cls.profile = CustomerProfile.objects.create(user=cls.user, name="PAPI", wallet_balance=Decimal("500.00"))

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_get_profile(self):
        resp = self.client.get("/api/users/profile/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["name"], "PAPI")

    def test_patch_profile(self):
        resp = self.client.patch("/api/users/profile/", {"name": "NEW NAME"}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.name, "NEW NAME")

    def test_wallet_balance(self):
        resp = self.client.get("/api/users/wallet/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["balance"], "500.00")

    def test_add_funds(self):
        resp = self.client.post("/api/users/wallet/add-funds/", {"amount": 200}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.wallet_balance, Decimal("700.00"))

    def test_set_wallet_pin(self):
        resp = self.client.post("/api/users/wallet/set-pin/", {"pin": "1234"}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.profile.refresh_from_db()
        self.assertTrue(len(self.profile.wallet_pin_hash) > 0)
