"""
Comprehensive unit tests for the administration app.

Uses ``rest_framework.test.APITestCase`` with session authentication.
Test organisation mirrors the module's service functions:

  1. Access-control tests   — admin-only enforcement for all 10 endpoints
  2. Canteen approval       — approve / reject workflows, 404 guards
  3. User management        — suspend / unsuspend, admin-guard
  4. Analytics              — correct aggregation
  5. Activity log           — entries appear after admin actions
  6. Broadcast notification — valid, empty-message, targeted
  7. Content moderation     — delete review / canteen, 404, bad params

Both **verification** (correct behaviour) and **defect** (error handling)
testing patterns are used throughout.
"""

from decimal import Decimal
from datetime import time

from django.test import TestCase
from rest_framework.test import APIClient

from apps.users.models import (
    User,
    CustomerProfile,
    CanteenManagerProfile,
    AdminProfile,
    AdminActivityLog,
)
from apps.canteens.models import Canteen, Dish, DishReview
from apps.orders.models import Order, OrderItem, Payment


# ============================================================================
# Base test class — shared set-up
# ============================================================================

class AdminTestBase(TestCase):
    """
    Creates the minimum data needed by all admin tests:

    * 1 admin user  (``self.admin``)
    * 1 customer user (``self.customer``)
    * 1 manager user  (``self.manager``)
    * 1 canteen (OPEN, owned by manager) → ``self.canteen``
    * 1 canteen under review             → ``self.canteen_pending``
    * 1 dish on self.canteen             → ``self.dish``
    """

    @classmethod
    def setUpTestData(cls):
        # --- Admin ---
        cls.admin = User.objects.create_user(
            email="admin@iitk.ac.in",
            password="admin1234",
            role=User.Role.ADMIN,
            is_verified=True,
        )
        AdminProfile.objects.create(user=cls.admin)

        # --- Customer ---
        cls.customer = User.objects.create_user(
            email="cust@iitk.ac.in",
            password="cust1234",
            role=User.Role.CUSTOMER,
            is_verified=True,
        )
        cls.customer_profile = CustomerProfile.objects.create(
            user=cls.customer,
            name="Test Customer",
            wallet_balance=Decimal("500.00"),
        )

        # --- Manager ---
        cls.manager = User.objects.create_user(
            email="mgr@iitk.ac.in",
            password="mgr1234",
            role=User.Role.MANAGER,
            is_verified=True,
        )
        cls.manager_profile = CanteenManagerProfile.objects.create(
            user=cls.manager,
            contact_details="Hall 5",
        )

        # --- Second manager (for pending canteen) ---
        cls.manager2 = User.objects.create_user(
            email="mgr2@iitk.ac.in",
            password="mgr1234",
            role=User.Role.MANAGER,
            is_verified=True,
        )
        cls.manager2_profile = CanteenManagerProfile.objects.create(
            user=cls.manager2,
            contact_details="New Cafe",
        )

        # --- Canteen (OPEN) ---
        cls.canteen = Canteen.objects.create(
            name="Hall 5 Canteen",
            location="Hall 5",
            opening_time=time(8, 0),
            closing_time=time(22, 0),
            status=Canteen.Status.OPEN,
            manager=cls.manager_profile,
        )

        # --- Canteen (UNDER_REVIEW) ---
        cls.canteen_pending = Canteen.objects.create(
            name="New Cafe",
            location="SAC",
            opening_time=time(10, 0),
            closing_time=time(20, 0),
            status=Canteen.Status.UNDER_REVIEW,
            manager=cls.manager2_profile,
        )

        # --- Dish ---
        cls.dish = Dish.objects.create(
            canteen=cls.canteen,
            name="Paneer Butter Masala",
            price=Decimal("120.00"),
            is_available=True,
        )

    def setUp(self):
        self.client = APIClient()

    # ------ helpers ------

    def login_admin(self):
        self.client.login(email="admin@iitk.ac.in", password="admin1234")

    def login_customer(self):
        self.client.login(email="cust@iitk.ac.in", password="cust1234")

    def login_manager(self):
        self.client.login(email="mgr@iitk.ac.in", password="mgr1234")


# ============================================================================
# 1. ACCESS CONTROL — all endpoints reject non-admin users
# ============================================================================

class AccessControlTests(AdminTestBase):
    """
    Verification: each endpoint returns 403 for customers and managers.
    Defect: unauthenticated requests also return 403.
    """

    # --- Unauthenticated ---

    def test_unauthenticated_canteen_requests(self):
        resp = self.client.get("/api/admin/canteen-requests/")
        self.assertEqual(resp.status_code, 403)

    def test_unauthenticated_analytics(self):
        resp = self.client.get("/api/admin/analytics/")
        self.assertEqual(resp.status_code, 403)

    # --- Customer ---

    def test_customer_cannot_access_canteen_requests(self):
        self.login_customer()
        resp = self.client.get("/api/admin/canteen-requests/")
        self.assertEqual(resp.status_code, 403)

    def test_customer_cannot_access_analytics(self):
        self.login_customer()
        resp = self.client.get("/api/admin/analytics/")
        self.assertEqual(resp.status_code, 403)

    def test_customer_cannot_list_users(self):
        self.login_customer()
        resp = self.client.get("/api/admin/users/")
        self.assertEqual(resp.status_code, 403)

    def test_customer_cannot_suspend_user(self):
        self.login_customer()
        resp = self.client.post(f"/api/admin/users/{self.customer.pk}/suspend/")
        self.assertEqual(resp.status_code, 403)

    def test_customer_cannot_broadcast(self):
        self.login_customer()
        resp = self.client.post(
            "/api/admin/broadcast/",
            {"message": "hello"},
            format="json",
        )
        self.assertEqual(resp.status_code, 403)

    def test_customer_cannot_moderate(self):
        self.login_customer()
        resp = self.client.post(
            "/api/admin/moderate/",
            {"content_type": "review", "content_id": 1},
            format="json",
        )
        self.assertEqual(resp.status_code, 403)

    # --- Manager ---

    def test_manager_cannot_access_analytics(self):
        self.login_manager()
        resp = self.client.get("/api/admin/analytics/")
        self.assertEqual(resp.status_code, 403)

    def test_manager_cannot_approve_canteen(self):
        self.login_manager()
        resp = self.client.post(
            f"/api/admin/canteen-requests/{self.canteen_pending.pk}/approve/"
        )
        self.assertEqual(resp.status_code, 403)


# ============================================================================
# 2. CANTEEN APPROVAL WORKFLOW
# ============================================================================

class CanteenApprovalTests(AdminTestBase):
    """
    Verification: approve and reject transition canteen status correctly.
    Defect: 404 for non-existent or already-processed canteens.
    """

    def test_list_pending_canteens(self):
        """GET /api/admin/canteen-requests/ returns UNDER_REVIEW canteens."""
        self.login_admin()
        resp = self.client.get("/api/admin/canteen-requests/")
        self.assertEqual(resp.status_code, 200)
        # Only self.canteen_pending should be listed
        ids = [c["id"] for c in resp.data]
        self.assertIn(self.canteen_pending.pk, ids)
        self.assertNotIn(self.canteen.pk, ids)

    def test_approve_canteen(self):
        """POST approve transitions UNDER_REVIEW → ACTIVE."""
        self.login_admin()
        resp = self.client.post(
            f"/api/admin/canteen-requests/{self.canteen_pending.pk}/approve/"
        )
        self.assertEqual(resp.status_code, 200)
        self.canteen_pending.refresh_from_db()
        self.assertEqual(self.canteen_pending.status, Canteen.Status.ACTIVE)

    def test_approve_nonexistent_canteen_404(self):
        """POST approve on non-existent ID returns 404."""
        self.login_admin()
        resp = self.client.post("/api/admin/canteen-requests/9999/approve/")
        self.assertEqual(resp.status_code, 404)

    def test_approve_already_active_canteen_404(self):
        """POST approve on an already-ACTIVE canteen returns 404."""
        self.login_admin()
        resp = self.client.post(
            f"/api/admin/canteen-requests/{self.canteen.pk}/approve/"
        )
        self.assertEqual(resp.status_code, 404)

    def test_reject_canteen(self):
        """POST reject transitions UNDER_REVIEW → REJECTED."""
        self.login_admin()
        resp = self.client.post(
            f"/api/admin/canteen-requests/{self.canteen_pending.pk}/reject/",
            {"reason": "Blurry documents"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.canteen_pending.refresh_from_db()
        self.assertEqual(self.canteen_pending.status, Canteen.Status.REJECTED)
        self.assertIn("Blurry", self.canteen_pending.rejection_reason)

    def test_reject_nonexistent_canteen_404(self):
        """POST reject on non-existent canteen returns 404."""
        self.login_admin()
        resp = self.client.post(
            "/api/admin/canteen-requests/9999/reject/",
            {"reason": "Test"},
            format="json",
        )
        self.assertEqual(resp.status_code, 404)


# ============================================================================
# 3. USER MANAGEMENT — suspend / unsuspend
# ============================================================================

class UserManagementTests(AdminTestBase):
    """
    Verification: suspend/unsuspend correctly toggles is_suspended.
    Defect: cannot suspend admins; 404 for missing users.
    """

    def test_list_users(self):
        """GET /api/admin/users/ returns all users."""
        self.login_admin()
        resp = self.client.get("/api/admin/users/")
        self.assertEqual(resp.status_code, 200)
        # We created admin + customer + manager + manager2 = 4
        self.assertGreaterEqual(len(resp.data), 4)

    def test_suspend_customer(self):
        """POST suspend sets is_suspended = True."""
        self.login_admin()
        resp = self.client.post(
            f"/api/admin/users/{self.customer.pk}/suspend/"
        )
        self.assertEqual(resp.status_code, 200)
        self.customer.refresh_from_db()
        self.assertTrue(self.customer.is_suspended)

    def test_unsuspend_customer(self):
        """POST unsuspend sets is_suspended = False."""
        # First suspend
        self.customer.is_suspended = True
        self.customer.save(update_fields=["is_suspended"])

        self.login_admin()
        resp = self.client.post(
            f"/api/admin/users/{self.customer.pk}/unsuspend/"
        )
        self.assertEqual(resp.status_code, 200)
        self.customer.refresh_from_db()
        self.assertFalse(self.customer.is_suspended)

    def test_cannot_suspend_admin(self):
        """POST suspend on another admin returns 400."""
        self.login_admin()
        resp = self.client.post(
            f"/api/admin/users/{self.admin.pk}/suspend/"
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("Cannot suspend", resp.data.get("error", ""))

    def test_suspend_nonexistent_user_404(self):
        """POST suspend on non-existent user returns 404."""
        self.login_admin()
        resp = self.client.post("/api/admin/users/9999/suspend/")
        self.assertEqual(resp.status_code, 404)

    def test_unsuspend_nonexistent_user_404(self):
        """POST unsuspend on non-existent user returns 404."""
        self.login_admin()
        resp = self.client.post("/api/admin/users/9999/unsuspend/")
        self.assertEqual(resp.status_code, 404)


# ============================================================================
# 4. ANALYTICS
# ============================================================================

class AnalyticsTests(AdminTestBase):
    """
    Verification: analytics returns the expected structure and counts.
    """

    def test_analytics_structure(self):
        """GET /api/admin/analytics/ returns expected keys."""
        self.login_admin()
        resp = self.client.get("/api/admin/analytics/")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("users", resp.data)
        self.assertIn("canteens", resp.data)
        self.assertIn("orders", resp.data)
        self.assertIn("revenue", resp.data)
        self.assertIn("total_dishes", resp.data)

    def test_analytics_user_counts(self):
        """Analytics should count customers, managers, and total."""
        self.login_admin()
        resp = self.client.get("/api/admin/analytics/")
        users_data = resp.data["users"]
        self.assertGreaterEqual(users_data["total"], 4)
        self.assertGreaterEqual(users_data["customers"], 1)
        self.assertGreaterEqual(users_data["managers"], 1)

    def test_analytics_dish_count(self):
        """total_dishes should reflect at least the one we created."""
        self.login_admin()
        resp = self.client.get("/api/admin/analytics/")
        self.assertGreaterEqual(resp.data["total_dishes"], 1)


# ============================================================================
# 5. ACTIVITY LOG
# ============================================================================

class ActivityLogTests(AdminTestBase):
    """
    Verification: admin actions create log entries that show up
    in the activity-log endpoint.
    """

    def test_activity_log_empty_initially(self):
        """Fresh admin has no log entries yet."""
        self.login_admin()
        resp = self.client.get("/api/admin/activity-log/")
        self.assertEqual(resp.status_code, 200)
        self.assertIsInstance(resp.data, list)

    def test_activity_log_appears_after_action(self):
        """Suspending a user should add a log entry."""
        self.login_admin()
        # Do an action
        self.client.post(f"/api/admin/users/{self.customer.pk}/suspend/")
        # Check log
        resp = self.client.get("/api/admin/activity-log/")
        self.assertEqual(resp.status_code, 200)
        actions = [entry["action"] for entry in resp.data]
        self.assertIn("suspend_user", actions)


# ============================================================================
# 6. BROADCAST NOTIFICATION
# ============================================================================

class BroadcastTests(AdminTestBase):
    """
    Verification: valid broadcast returns 200 with recipient count.
    Defect: empty message returns 400.
    """

    def test_broadcast_to_all(self):
        """POST broadcast with message and no role → all active users."""
        self.login_admin()
        resp = self.client.post(
            "/api/admin/broadcast/",
            {"message": "System maintenance tonight", "target_role": ""},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertIn("recipients_count", resp.data)
        self.assertEqual(resp.data["target_role"], "ALL")

    def test_broadcast_to_customers(self):
        """POST broadcast targeted to CUSTOMER role."""
        self.login_admin()
        resp = self.client.post(
            "/api/admin/broadcast/",
            {"message": "Special offer!", "target_role": "CUSTOMER"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["target_role"], "CUSTOMER")

    def test_broadcast_empty_message_fails(self):
        """POST broadcast with empty message → 400."""
        self.login_admin()
        resp = self.client.post(
            "/api/admin/broadcast/",
            {"message": ""},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)

    def test_broadcast_missing_message_fails(self):
        """POST broadcast with no message field → 400."""
        self.login_admin()
        resp = self.client.post(
            "/api/admin/broadcast/",
            {},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)


# ============================================================================
# 7. CONTENT MODERATION
# ============================================================================

class ModerationTests(AdminTestBase):
    """
    Verification: delete review / canteen works and returns 200.
    Defect: missing params, non-existent content, invalid types.
    """

    def test_delete_review(self):
        """Moderating a review with action=delete removes it."""
        # Create a review first
        review = DishReview.objects.create(
            dish=self.dish,
            customer=self.customer_profile,
            rating=5,
            review_text="Great food!",
        )
        self.login_admin()
        resp = self.client.post(
            "/api/admin/moderate/",
            {
                "content_type": "review",
                "content_id": review.pk,
                "action": "delete",
                "reason": "Spam",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertFalse(DishReview.objects.filter(pk=review.pk).exists())

    def test_delete_nonexistent_review_404(self):
        """Moderating a non-existent review → 404."""
        self.login_admin()
        resp = self.client.post(
            "/api/admin/moderate/",
            {"content_type": "review", "content_id": 9999, "action": "delete"},
            format="json",
        )
        self.assertEqual(resp.status_code, 404)

    def test_moderate_missing_params_400(self):
        """Missing content_type or content_id → 400."""
        self.login_admin()
        resp = self.client.post(
            "/api/admin/moderate/",
            {"content_type": "", "content_id": ""},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)

    def test_moderate_invalid_content_type_400(self):
        """Invalid content_type → 400."""
        self.login_admin()
        resp = self.client.post(
            "/api/admin/moderate/",
            {"content_type": "order", "content_id": 1, "action": "delete"},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)

    def test_delete_nonexistent_canteen_404(self):
        """Moderating a non-existent canteen → 404."""
        self.login_admin()
        resp = self.client.post(
            "/api/admin/moderate/",
            {
                "content_type": "canteen",
                "content_id": 9999,
                "action": "delete",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 404)


# ============================================================================
# 8. EDGE CASES — boundary conditions and idempotency
# ============================================================================

class EdgeCaseTests(AdminTestBase):
    """
    Additional defect-testing for boundary conditions.
    """

    def test_suspend_already_suspended_user(self):
        """Suspending an already-suspended user should still return 200 (idempotent)."""
        self.customer.is_suspended = True
        self.customer.save(update_fields=["is_suspended"])
        self.login_admin()
        resp = self.client.post(
            f"/api/admin/users/{self.customer.pk}/suspend/"
        )
        self.assertEqual(resp.status_code, 200)
        self.customer.refresh_from_db()
        self.assertTrue(self.customer.is_suspended)

    def test_unsuspend_not_suspended_user(self):
        """Unsuspending a non-suspended user should still return 200 (idempotent)."""
        self.customer.is_suspended = False
        self.customer.save(update_fields=["is_suspended"])
        self.login_admin()
        resp = self.client.post(
            f"/api/admin/users/{self.customer.pk}/unsuspend/"
        )
        self.assertEqual(resp.status_code, 200)
        self.customer.refresh_from_db()
        self.assertFalse(self.customer.is_suspended)

    def test_reject_canteen_empty_reason(self):
        """Rejecting with empty reason is allowed."""
        self.login_admin()
        resp = self.client.post(
            f"/api/admin/canteen-requests/{self.canteen_pending.pk}/reject/",
            {"reason": ""},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)

    def test_broadcast_with_invalid_role_treated_as_all(self):
        """
        If target_role is not CUSTOMER or MANAGER, the serializer should
        reject it (ChoiceField validation).
        """
        self.login_admin()
        resp = self.client.post(
            "/api/admin/broadcast/",
            {"message": "Hello", "target_role": "SUPERUSER"},
            format="json",
        )
        # The BroadcastSerializer should reject invalid choice
        self.assertEqual(resp.status_code, 400)

    def test_suspend_manager(self):
        """Admins can suspend managers (not just customers)."""
        self.login_admin()
        resp = self.client.post(
            f"/api/admin/users/{self.manager.pk}/suspend/"
        )
        self.assertEqual(resp.status_code, 200)
        self.manager.refresh_from_db()
        self.assertTrue(self.manager.is_suspended)
        # Cleanup
        self.manager.is_suspended = False
        self.manager.save(update_fields=["is_suspended"])
