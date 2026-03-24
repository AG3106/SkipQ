"""
Unit tests for the administration app (V1 — canteen registration only).

Covers:
  1. Role-based access control (403 for non-admins)
  2. Canteen approval / rejection workflows
  3. Documents included in pending requests response
  4. Manager is_staff set on approval
"""

from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from apps.users.models import User, CustomerProfile, CanteenManagerProfile, AdminProfile
from apps.canteens.models import Canteen


class AdminTestBase(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.admin_user = User.objects.create_user(
            email="admin@iitk.ac.in", password="admin1234", role=User.Role.ADMIN,
        )
        cls.admin_profile = AdminProfile.objects.create(user=cls.admin_user)

        cls.customer_user = User.objects.create_user(
            email="customer@iitk.ac.in", password="cust1234", role=User.Role.CUSTOMER,
        )
        CustomerProfile.objects.create(
            user=cls.customer_user, name="Test Customer", wallet_balance=Decimal("500.00"),
        )

        cls.manager_user = User.objects.create_user(
            email="manager@iitk.ac.in", password="mgr1234", role=User.Role.MANAGER,
        )
        cls.manager_profile = CanteenManagerProfile.objects.create(
            user=cls.manager_user, contact_details="Hall 5",
        )

        cls.canteen = Canteen.objects.create(
            name="Test Canteen",
            location="Hall 5",
            opening_time="08:00:00",
            closing_time="22:00:00",
            manager=cls.manager_profile,
            status=Canteen.Status.UNDER_REVIEW,
        )

    def setUp(self):
        self.client = APIClient()

    def login_as_admin(self):
        self.client.force_authenticate(user=self.admin_user)

    def login_as_customer(self):
        self.client.force_authenticate(user=self.customer_user)

    def login_as_manager(self):
        self.client.force_authenticate(user=self.manager_user)


class AccessControlTest(AdminTestBase):

    def test_unauthenticated_access_denied(self):
        resp = self.client.get("/api/admin/canteen-requests/")
        self.assertEqual(resp.status_code, 403)

    def test_customer_access_denied(self):
        self.login_as_customer()
        resp = self.client.get("/api/admin/canteen-requests/")
        self.assertEqual(resp.status_code, 403)

    def test_manager_access_denied(self):
        self.login_as_manager()
        resp = self.client.get("/api/admin/canteen-requests/")
        self.assertEqual(resp.status_code, 403)


class CanteenApprovalTest(AdminTestBase):

    def test_pending_canteen_requests(self):
        self.login_as_admin()
        resp = self.client.get("/api/admin/canteen-requests/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["name"], "Test Canteen")

    def test_pending_requests_include_documents(self):
        """Verify each pending canteen entry includes a 'documents' dict."""
        self.login_as_admin()
        resp = self.client.get("/api/admin/canteen-requests/")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("documents", resp.data[0])
        docs = resp.data[0]["documents"]
        self.assertIn("aadhar_card", docs)
        self.assertIn("hall_approval_form", docs)

    def test_approve_canteen(self):
        self.login_as_admin()
        resp = self.client.post(f"/api/admin/canteen-requests/{self.canteen.pk}/approve/")
        self.assertEqual(resp.status_code, 200)
        self.canteen.refresh_from_db()
        self.assertEqual(self.canteen.status, Canteen.Status.ACTIVE)

    def test_approve_sets_manager_is_staff(self):
        """On approval the manager's user should get is_staff=True."""
        self.login_as_admin()
        self.assertFalse(self.manager_user.is_staff)
        self.client.post(f"/api/admin/canteen-requests/{self.canteen.pk}/approve/")
        self.manager_user.refresh_from_db()
        self.assertTrue(self.manager_user.is_staff)

    def test_approve_clears_rejection_reason(self):
        """If a previously-rejected canteen is re-submitted and approved, rejection_reason is cleared."""
        self.canteen.rejection_reason = "Blurry docs"
        self.canteen.status = Canteen.Status.UNDER_REVIEW
        self.canteen.save()
        self.login_as_admin()
        self.client.post(f"/api/admin/canteen-requests/{self.canteen.pk}/approve/")
        self.canteen.refresh_from_db()
        self.assertEqual(self.canteen.rejection_reason, "")

    def test_reject_canteen(self):
        self.login_as_admin()
        self.canteen.status = Canteen.Status.UNDER_REVIEW
        self.canteen.save()
        resp = self.client.post(
            f"/api/admin/canteen-requests/{self.canteen.pk}/reject/",
            {"reason": "Blurry documents"},
        )
        self.assertEqual(resp.status_code, 200)
        self.canteen.refresh_from_db()
        self.assertEqual(self.canteen.status, Canteen.Status.REJECTED)
        self.assertEqual(self.canteen.rejection_reason, "Blurry documents")

    def test_approve_nonexistent_canteen(self):
        self.login_as_admin()
        resp = self.client.post("/api/admin/canteen-requests/9999/approve/")
        self.assertEqual(resp.status_code, 404)

    def test_approve_already_active_canteen(self):
        self.login_as_admin()
        self.canteen.status = Canteen.Status.ACTIVE
        self.canteen.save()
        resp = self.client.post(f"/api/admin/canteen-requests/{self.canteen.pk}/approve/")
        self.assertEqual(resp.status_code, 404)


class ManagerRegistrationApprovalTest(AdminTestBase):
    """Tests for admin approval/rejection of manager registrations."""

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        from apps.users.models import PendingManagerRegistration
        from django.contrib.auth.hashers import make_password
        cls.pending = PendingManagerRegistration.objects.create(
            email="newmgr@gmail.com",
            password_hash=make_password("securepass"),
            name="New Manager",
        )

    def test_pending_manager_registrations_list(self):
        """Admin can see pending manager registrations."""
        self.login_as_admin()
        resp = self.client.get("/api/admin/manager-registrations/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["email"], "newmgr@gmail.com")

    def test_approve_manager_creates_user(self):
        """Approving creates a User + CanteenManagerProfile and sends email."""
        self.login_as_admin()
        resp = self.client.post(f"/api/admin/manager-registrations/{self.pending.pk}/approve/")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(User.objects.filter(email="newmgr@gmail.com").exists())
        user = User.objects.get(email="newmgr@gmail.com")
        self.assertEqual(user.role, User.Role.MANAGER)
        self.assertTrue(hasattr(user, "manager_profile"))
        self.pending.refresh_from_db()
        self.assertEqual(self.pending.status, "APPROVED")

    def test_reject_manager_no_user_created(self):
        """Rejecting does NOT create a user."""
        from apps.users.models import PendingManagerRegistration
        from django.contrib.auth.hashers import make_password
        pending2 = PendingManagerRegistration.objects.create(
            email="reject@gmail.com",
            password_hash=make_password("pass"),
            name="Reject Me",
        )
        self.login_as_admin()
        resp = self.client.post(
            f"/api/admin/manager-registrations/{pending2.pk}/reject/",
            {"reason": "Invalid credentials"},
        )
        self.assertEqual(resp.status_code, 200)
        self.assertFalse(User.objects.filter(email="reject@gmail.com").exists())
        pending2.refresh_from_db()
        self.assertEqual(pending2.status, "REJECTED")
        self.assertEqual(pending2.rejection_reason, "Invalid credentials")

    def test_non_admin_cannot_access_manager_registrations(self):
        """Non-admin users get 403."""
        self.login_as_customer()
        resp = self.client.get("/api/admin/manager-registrations/")
        self.assertEqual(resp.status_code, 403)

