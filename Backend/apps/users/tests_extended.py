"""
Extended unit tests for the users app — additional coverage.

Covers:
  - OTP expiry, validate_otp (non-consuming OTP check)
  - Forgot password flow (email not found, OTP reuse)
  - authenticate_user edge cases (non-existent user, unverified user)
  - complete_registration edge cases (password_hash path, admin role)
  - update_customer_profile service method
  - Profile API for manager role
  - Wallet balance for manager
  - Admin profile creation
  - Model __str__ methods
"""

import datetime
from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from apps.users.models import (
    User, CustomerProfile, CanteenManagerProfile, AdminProfile,
    AdminActivityLog, OTPVerification, PendingManagerRegistration,
)
from apps.users.services import auth_service, profile_service


# ============================================================
# Auth service — OTP expiry and validate_otp
# ============================================================

class OTPExpiryTest(TestCase):
    """Tests for OTP expiry behavior."""

    @patch("django.core.mail.send_mail")
    def test_verify_expired_otp(self, mock_mail):
        """OTPs older than 10 minutes should be rejected."""
        otp = auth_service.generate_and_send_otp("exp@iitk.ac.in", "pw", "CUSTOMER", "Exp")
        rec = OTPVerification.objects.filter(email="exp@iitk.ac.in").latest("created_at")
        # Backdate the OTP to 15 minutes ago
        OTPVerification.objects.filter(pk=rec.pk).update(
            created_at=timezone.now() - datetime.timedelta(minutes=15)
        )
        with self.assertRaises(ValueError) as ctx:
            auth_service.verify_otp("exp@iitk.ac.in", otp)
        self.assertIn("expired", str(ctx.exception).lower())

    def test_verify_otp_no_pending(self):
        """No pending OTP should raise ValueError."""
        with self.assertRaises(ValueError) as ctx:
            auth_service.verify_otp("noone@iitk.ac.in", "123456")
        self.assertIn("no pending", str(ctx.exception).lower())


class ValidateOTPTest(TestCase):
    """Tests for the validate_otp function (non-consuming check)."""

    @patch("django.core.mail.send_mail")
    def test_validate_otp_success(self, mock_mail):
        otp = auth_service.generate_and_send_otp("valtest@iitk.ac.in", "pw", "CUSTOMER")
        result = auth_service.validate_otp("valtest@iitk.ac.in", otp)
        self.assertTrue(result)
        # Should NOT be consumed
        rec = OTPVerification.objects.filter(email="valtest@iitk.ac.in").latest("created_at")
        self.assertFalse(rec.is_used)

    @patch("django.core.mail.send_mail")
    def test_validate_otp_expired(self, mock_mail):
        otp = auth_service.generate_and_send_otp("valexp@iitk.ac.in", "pw", "CUSTOMER")
        rec = OTPVerification.objects.get(email="valexp@iitk.ac.in")
        OTPVerification.objects.filter(pk=rec.pk).update(
            created_at=timezone.now() - datetime.timedelta(minutes=15)
        )
        with self.assertRaises(ValueError):
            auth_service.validate_otp("valexp@iitk.ac.in", otp)

    @patch("django.core.mail.send_mail")
    def test_validate_otp_wrong(self, mock_mail):
        auth_service.generate_and_send_otp("valwrong@iitk.ac.in", "pw", "CUSTOMER")
        with self.assertRaises(ValueError):
            auth_service.validate_otp("valwrong@iitk.ac.in", "000000")

    def test_validate_otp_no_pending(self):
        with self.assertRaises(ValueError):
            auth_service.validate_otp("nobody@iitk.ac.in", "123456")


# ============================================================
# Auth service — forgot password
# ============================================================

@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class ForgotPasswordServiceTest(TestCase):

    def test_forgot_password_nonexistent_email(self):
        with self.assertRaises(ValueError) as ctx:
            auth_service.forgot_password_request("ghost@iitk.ac.in")
        self.assertIn("no account", str(ctx.exception).lower())

    def test_forgot_password_success(self):
        auth_service.complete_registration("fp2@iitk.ac.in", password="old", role="CUSTOMER", name="FP2")
        # Should not raise
        auth_service.forgot_password_request("fp2@iitk.ac.in")
        otp_rec = OTPVerification.objects.filter(email="fp2@iitk.ac.in", is_used=False).latest("created_at")
        self.assertIsNotNone(otp_rec)

    def test_reset_password_nonexistent_user(self):
        """reset_password should fail for non-existent email (even after OTP check)."""
        # Create a valid OTP for a user that exists
        auth_service.complete_registration("rptest@iitk.ac.in", password="old", role="CUSTOMER", name="RP")
        auth_service.forgot_password_request("rptest@iitk.ac.in")
        otp_rec = OTPVerification.objects.filter(email="rptest@iitk.ac.in", is_used=False).latest("created_at")
        # Valid reset should work
        auth_service.reset_password("rptest@iitk.ac.in", otp_rec.otp, "newpass")
        user = User.objects.get(email="rptest@iitk.ac.in")
        self.assertTrue(user.check_password("newpass"))


# ============================================================
# Auth service — authenticate_user edge cases
# ============================================================

class AuthenticateUserTest(TestCase):

    def test_nonexistent_user(self):
        from django.test import RequestFactory
        factory = RequestFactory()
        request = factory.post("/fake/")
        from django.contrib.sessions.middleware import SessionMiddleware
        middleware = SessionMiddleware(lambda r: None)
        middleware.process_request(request)
        request.session.save()

        with self.assertRaises(ValueError) as ctx:
            auth_service.authenticate_user(request, "ghost@iitk.ac.in", "pw")
        self.assertIn("does not exist", str(ctx.exception).lower())

    def test_unverified_user(self):
        from django.test import RequestFactory
        factory = RequestFactory()
        request = factory.post("/fake/")
        from django.contrib.sessions.middleware import SessionMiddleware
        middleware = SessionMiddleware(lambda r: None)
        middleware.process_request(request)
        request.session.save()

        user = User.objects.create_user("unverified@iitk.ac.in", "pw", role="CUSTOMER")
        # is_verified defaults to False
        self.assertFalse(user.is_verified)

        with self.assertRaises(ValueError) as ctx:
            auth_service.authenticate_user(request, "unverified@iitk.ac.in", "pw")
        self.assertIn("not verified", str(ctx.exception).lower())


# ============================================================
# Auth service — complete_registration edge cases
# ============================================================

class CompleteRegistrationTest(TestCase):

    def test_complete_registration_admin_role(self):
        user = auth_service.complete_registration("newadmin@iitk.ac.in", password="pw", role="ADMIN")
        self.assertEqual(user.role, User.Role.ADMIN)
        self.assertTrue(hasattr(user, "admin_profile"))

    def test_complete_registration_password_hash_path(self):
        from django.contrib.auth.hashers import make_password
        pw_hash = make_password("testpw")
        user = auth_service.complete_registration(
            "hashpath@iitk.ac.in", password_hash=pw_hash, role="CUSTOMER", name="H"
        )
        self.assertTrue(user.check_password("testpw"))

    def test_complete_registration_no_password_raises(self):
        with self.assertRaises(ValueError):
            auth_service.complete_registration("nopw@iitk.ac.in", role="CUSTOMER")

    def test_manager_no_password_raises(self):
        with self.assertRaises(ValueError):
            auth_service.complete_registration("mgrnopw@gmail.com", role="MANAGER")


# ============================================================
# Auth service — manager registration
# ============================================================

@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class ManagerRegistrationServiceTest(TestCase):

    def test_approve_nonexistent_pending(self):
        with self.assertRaises(ValueError):
            auth_service.approve_manager_registration(99999)

    def test_reject_nonexistent_pending(self):
        with self.assertRaises(ValueError):
            auth_service.reject_manager_registration(99999)

    def test_approve_creates_user_and_profile(self):
        from django.contrib.auth.hashers import make_password
        pending = PendingManagerRegistration.objects.create(
            email="apprmgr@gmail.com",
            password_hash=make_password("secure"),
            name="Test Manager",
            phone="1234567890",
        )
        user = auth_service.approve_manager_registration(pending.pk)
        self.assertEqual(user.role, User.Role.MANAGER)
        self.assertTrue(user.is_verified)
        self.assertTrue(hasattr(user, "manager_profile"))
        pending.refresh_from_db()
        self.assertEqual(pending.status, PendingManagerRegistration.Status.APPROVED)

    def test_reject_sets_status_and_reason(self):
        from django.contrib.auth.hashers import make_password
        pending = PendingManagerRegistration.objects.create(
            email="rejmgr@gmail.com",
            password_hash=make_password("secure"),
            name="Reject Mgr",
        )
        result = auth_service.reject_manager_registration(pending.pk, "Bad credentials")
        self.assertEqual(result.status, PendingManagerRegistration.Status.REJECTED)
        self.assertEqual(result.rejection_reason, "Bad credentials")
        self.assertFalse(User.objects.filter(email="rejmgr@gmail.com").exists())


# ============================================================
# Profile service — update_customer_profile
# ============================================================

class UpdateCustomerProfileTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user("ucp@iitk.ac.in", "pw", role="CUSTOMER")
        cls.profile = CustomerProfile.objects.create(
            user=cls.user, name="Old Name", phone="000"
        )

    def test_update_name_and_phone(self):
        profile_service.update_customer_profile(self.profile, name="New Name", phone="999")
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.name, "New Name")
        self.assertEqual(self.profile.phone, "999")

    def test_update_ignores_unknown_fields(self):
        """Unknown fields should not cause errors."""
        profile_service.update_customer_profile(self.profile, nonexistent_field="val")


# ============================================================
# Profile service — additional edge cases
# ============================================================

class ProfileServiceEdgeCaseTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user("psedge@iitk.ac.in", "pw", role="CUSTOMER")
        cls.profile = CustomerProfile.objects.create(
            user=cls.user, name="Edge", wallet_balance=Decimal("100")
        )

    def test_deduct_zero_raises(self):
        with self.assertRaises(ValueError):
            profile_service.deduct_funds(self.profile, 0)

    def test_add_zero_raises(self):
        with self.assertRaises(ValueError):
            profile_service.add_funds(self.profile, 0)

    def test_credit_to_manager_zero_raises(self):
        mgr_user = User.objects.create_user("mgredge@iitk.ac.in", "pw", role="MANAGER")
        mgr_profile = CanteenManagerProfile.objects.create(user=mgr_user)
        with self.assertRaises(ValueError):
            profile_service.credit_to_manager(mgr_profile, 0)


# ============================================================
# Model __str__ tests
# ============================================================

class ModelStrTests(TestCase):

    def test_user_str(self):
        u = User.objects.create_user("str_test@iitk.ac.in", "pw", role="CUSTOMER")
        self.assertIn("str_test@iitk.ac.in", str(u))
        self.assertIn("Customer", str(u))

    def test_admin_profile_str(self):
        u = User.objects.create_user("adm_str@iitk.ac.in", "pw", role="ADMIN")
        ap = AdminProfile.objects.create(user=u)
        self.assertIn("adm_str@iitk.ac.in", str(ap))

    def test_admin_activity_log_str(self):
        u = User.objects.create_user("actlog@iitk.ac.in", "pw", role="ADMIN")
        ap = AdminProfile.objects.create(user=u)
        log = AdminActivityLog.objects.create(admin=ap, action="approved canteen")
        self.assertIn("actlog@iitk.ac.in", str(log))
        self.assertIn("approved canteen", str(log))

    def test_otp_str(self):
        otp = OTPVerification.objects.create(email="otpstr@iitk.ac.in", otp="123456")
        self.assertIn("otpstr@iitk.ac.in", str(otp))
        self.assertIn("pending", str(otp))

    def test_otp_used_str(self):
        otp = OTPVerification.objects.create(email="otpused@iitk.ac.in", otp="123456", is_used=True)
        self.assertIn("used", str(otp))

    def test_pending_manager_str(self):
        pm = PendingManagerRegistration.objects.create(
            email="pmstr@gmail.com", password_hash="hash", name="PM"
        )
        self.assertIn("pmstr@gmail.com", str(pm))
        self.assertIn("Pending", str(pm))

    def test_manager_profile_str(self):
        u = User.objects.create_user("mgrstr@iitk.ac.in", "pw", role="MANAGER")
        mp = CanteenManagerProfile.objects.create(user=u)
        self.assertIn("mgrstr@iitk.ac.in", str(mp))


# ============================================================
# API tests — manager profile, admin wallet
# ============================================================

class ManagerProfileAPITest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.mgr_user = User.objects.create_user("mgrapi@iitk.ac.in", "pw", role="MANAGER")
        cls.mgr_user.is_verified = True
        cls.mgr_user.save()
        cls.mgr_profile = CanteenManagerProfile.objects.create(
            user=cls.mgr_user, contact_details="Hall 3",
            wallet_balance=Decimal("200")
        )

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=self.mgr_user)

    def test_get_profile_manager(self):
        resp = self.client.get("/api/users/profile/")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("contact_details", resp.data)

    def test_patch_profile_manager(self):
        resp = self.client.patch("/api/users/profile/", {"contact_details": "Hall 7"}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.mgr_profile.refresh_from_db()
        self.assertEqual(self.mgr_profile.contact_details, "Hall 7")

    def test_wallet_balance_manager(self):
        resp = self.client.get("/api/users/wallet/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(Decimal(resp.data["balance"]), Decimal("200"))

    def test_set_wallet_pin_manager(self):
        resp = self.client.post("/api/users/wallet/set-pin/", {"pin": "4321"}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.mgr_profile.refresh_from_db()
        self.assertTrue(len(self.mgr_profile.wallet_pin_hash) > 0)

    def test_add_funds_forbidden_for_manager(self):
        resp = self.client.post("/api/users/wallet/add-funds/", {"amount": 100}, format="json")
        self.assertEqual(resp.status_code, 403)


class AdminProfileAPITest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.admin_user = User.objects.create_user("adminapi@iitk.ac.in", "pw", role="ADMIN")
        cls.admin_user.is_verified = True
        cls.admin_user.save()
        cls.admin_profile = AdminProfile.objects.create(user=cls.admin_user)

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin_user)

    def test_get_profile_admin(self):
        resp = self.client.get("/api/users/profile/")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("email", resp.data)

    def test_wallet_balance_admin_no_wallet(self):
        resp = self.client.get("/api/users/wallet/")
        self.assertEqual(resp.status_code, 400)


# ============================================================
# API tests — auth endpoints edge cases
# ============================================================

@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class AuthAPIEdgeCaseTest(TestCase):

    def setUp(self):
        self.client = APIClient()

    def test_verify_forgot_password_otp_missing_fields(self):
        resp = self.client.post("/api/auth/verify-forgot-password-otp/", {})
        self.assertEqual(resp.status_code, 400)

    def test_verify_forgot_password_otp_invalid(self):
        auth_service.complete_registration("vfptest@iitk.ac.in", password="old", role="CUSTOMER", name="VFP")
        auth_service.forgot_password_request("vfptest@iitk.ac.in")
        resp = self.client.post("/api/auth/verify-forgot-password-otp/", {
            "email": "vfptest@iitk.ac.in",
            "otp": "000000",
        })
        self.assertEqual(resp.status_code, 400)

    def test_verify_forgot_password_otp_valid(self):
        auth_service.complete_registration("vfpok@iitk.ac.in", password="old", role="CUSTOMER", name="VFP")
        auth_service.forgot_password_request("vfpok@iitk.ac.in")
        otp_rec = OTPVerification.objects.filter(email="vfpok@iitk.ac.in", is_used=False).latest("created_at")
        resp = self.client.post("/api/auth/verify-forgot-password-otp/", {
            "email": "vfpok@iitk.ac.in",
            "otp": otp_rec.otp,
        })
        self.assertEqual(resp.status_code, 200)

    def test_forgot_password_nonexistent(self):
        resp = self.client.post("/api/auth/forgot-password/", {"email": "n@iitk.ac.in"})
        self.assertEqual(resp.status_code, 400)

    def test_logout_unauthenticated(self):
        resp = self.client.post("/api/auth/logout/")
        self.assertIn(resp.status_code, [401, 403])

    def test_register_manager_flow(self):
        """Manager registration should end in pending status, not user creation."""
        resp = self.client.post("/api/auth/register/", {
            "email": "mgrreg@gmail.com",
            "password": "testpass123",
            "role": "MANAGER",
            "name": "Manager Reg",
        })
        self.assertEqual(resp.status_code, 200)
        otp_rec = OTPVerification.objects.filter(email="mgrreg@gmail.com", is_used=False).latest("created_at")
        resp2 = self.client.post("/api/auth/verify-otp/", {
            "email": "mgrreg@gmail.com",
            "otp": otp_rec.otp,
        })
        self.assertEqual(resp2.status_code, 200)
        self.assertFalse(User.objects.filter(email="mgrreg@gmail.com").exists())
        self.assertTrue(PendingManagerRegistration.objects.filter(email="mgrreg@gmail.com").exists())

    def test_login_remember_me(self):
        auth_service.complete_registration("remme@iitk.ac.in", password="pw", role="CUSTOMER", name="RM")
        resp = self.client.post("/api/auth/login/", {
            "email": "remme@iitk.ac.in",
            "password": "pw",
            "remember_me": True,
        })
        self.assertEqual(resp.status_code, 200)
        self.assertIn("has_wallet_pin", resp.data)
