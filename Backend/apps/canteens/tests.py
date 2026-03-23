"""
Unit and component tests for the canteens app.

Covers:
  - Canteen model (status, is_open, wait time)
  - Dish model (effective price, toggle availability)
  - Canteen registration flow
  - Menu management (add, edit, delete, toggle)
  - Status updates
  - Holidays
  - Popular dishes
  - Document access
  - Service layer (canteen_service, menu_service)
"""

from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from apps.users.models import User, CustomerProfile, CanteenManagerProfile, AdminProfile
from apps.canteens.models import Canteen, Dish, DishReview, CanteenHoliday


# ============================================================
# Model-level unit tests
# ============================================================

class CanteenModelTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.mgr_user = User.objects.create_user("cm@iitk.ac.in", "pw", role="MANAGER")
        cls.mgr = CanteenManagerProfile.objects.create(user=cls.mgr_user)
        cls.canteen = Canteen.objects.create(
            name="Model Canteen", location="Hall 1",
            opening_time="08:00", closing_time="22:00",
            manager=cls.mgr, status=Canteen.Status.ACTIVE,
        )

    def test_str(self):
        self.assertIn("Model Canteen", str(self.canteen))

    def test_get_estimated_wait_time_empty(self):
        self.assertEqual(self.canteen.get_estimated_wait_time(), 0)

    def test_status_choices(self):
        self.assertIn(Canteen.Status.OPEN, [c[0] for c in Canteen.Status.choices])


class DishModelTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        mgr_user = User.objects.create_user("dm@iitk.ac.in", "pw", role="MANAGER")
        mgr = CanteenManagerProfile.objects.create(user=mgr_user)
        cls.canteen = Canteen.objects.create(
            name="Dish Canteen", location="Hall 2",
            opening_time="08:00", closing_time="22:00",
            manager=mgr, status=Canteen.Status.ACTIVE,
        )
        cls.dish = Dish.objects.create(
            canteen=cls.canteen, name="Dosa", price=Decimal("60.00"),
            discount=Decimal("10.00"), is_available=True, is_veg=True,
        )

    def test_effective_price_with_discount(self):
        price = self.dish.get_effective_price()
        self.assertEqual(price, Decimal("54.00"))

    def test_effective_price_no_discount(self):
        self.dish.discount = Decimal("0")
        self.dish.save()
        self.assertEqual(self.dish.get_effective_price(), Decimal("60.00"))

    def test_toggle_availability(self):
        self.assertTrue(self.dish.is_available)
        self.dish.toggle_availability()
        self.assertFalse(self.dish.is_available)
        self.dish.toggle_availability()
        self.assertTrue(self.dish.is_available)


# ============================================================
# Canteen service unit tests
# ============================================================

class CanteenServiceTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.mgr_user = User.objects.create_user("cs@iitk.ac.in", "pw", role="MANAGER")
        cls.mgr = CanteenManagerProfile.objects.create(user=cls.mgr_user)

    def test_submit_registration(self):
        from apps.canteens.services.canteen_service import submit_canteen_registration
        c = submit_canteen_registration(self.mgr, "Reg Canteen", "Hall 3", "08:00", "22:00")
        self.assertEqual(c.status, Canteen.Status.UNDER_REVIEW)
        self.assertEqual(c.manager, self.mgr)

    def test_approve_canteen(self):
        from apps.canteens.services.canteen_service import submit_canteen_registration, approve_canteen
        c = submit_canteen_registration(self.mgr, "Appr Canteen", "Hall 4", "08:00", "22:00")
        approve_canteen(c)
        c.refresh_from_db()
        self.assertEqual(c.status, Canteen.Status.ACTIVE)
        self.mgr_user.refresh_from_db()
        self.assertTrue(self.mgr_user.is_staff)

    def test_reject_canteen(self):
        from apps.canteens.services.canteen_service import submit_canteen_registration, reject_canteen
        c = submit_canteen_registration(self.mgr, "Rej Canteen", "Hall 5", "08:00", "22:00")
        reject_canteen(c, "Bad docs")
        c.refresh_from_db()
        self.assertEqual(c.status, Canteen.Status.REJECTED)
        self.assertEqual(c.rejection_reason, "Bad docs")

    def test_operational_transitions(self):
        from apps.canteens.services.canteen_service import update_canteen_operational_status
        c = Canteen.objects.create(
            name="Trans", location="H", opening_time="08:00", closing_time="22:00",
            manager=self.mgr, status=Canteen.Status.ACTIVE,
        )
        update_canteen_operational_status(c, Canteen.Status.OPEN)
        self.assertEqual(c.status, Canteen.Status.OPEN)
        update_canteen_operational_status(c, Canteen.Status.BUSY)
        self.assertEqual(c.status, Canteen.Status.BUSY)
        update_canteen_operational_status(c, Canteen.Status.OPEN)

    def test_invalid_transition(self):
        from apps.canteens.services.canteen_service import update_canteen_operational_status
        c = Canteen.objects.create(
            name="BadT", location="H", opening_time="08:00", closing_time="22:00",
            manager=self.mgr, status=Canteen.Status.ACTIVE,
        )
        with self.assertRaises(ValueError):
            update_canteen_operational_status(c, Canteen.Status.BUSY)

    def test_holidays(self):
        from apps.canteens.services.canteen_service import add_holiday, get_holidays
        c = Canteen.objects.create(
            name="Hol", location="H", opening_time="08:00", closing_time="22:00",
            manager=self.mgr, status=Canteen.Status.ACTIVE,
        )
        add_holiday(c, "2026-04-01", "April Holiday")
        holidays = get_holidays(c)
        self.assertEqual(holidays.count(), 1)

    def test_duplicate_holiday(self):
        from apps.canteens.services.canteen_service import add_holiday
        c = Canteen.objects.create(
            name="DupH", location="H", opening_time="08:00", closing_time="22:00",
            manager=self.mgr, status=Canteen.Status.ACTIVE,
        )
        add_holiday(c, "2026-05-01")
        with self.assertRaises(ValueError):
            add_holiday(c, "2026-05-01")


# ============================================================
# API-level component tests
# ============================================================

class CanteenAPITest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.mgr_user = User.objects.create_user("capi@iitk.ac.in", "pw", role="MANAGER")
        cls.mgr = CanteenManagerProfile.objects.create(user=cls.mgr_user)
        cls.cust_user = User.objects.create_user("ccapi@iitk.ac.in", "pw", role="CUSTOMER")
        cls.cust = CustomerProfile.objects.create(user=cls.cust_user, name="CustAPI")
        cls.canteen = Canteen.objects.create(
            name="API Canteen", location="Hall 1",
            opening_time="08:00", closing_time="22:00",
            manager=cls.mgr, status=Canteen.Status.OPEN,
        )
        cls.dish = Dish.objects.create(
            canteen=cls.canteen, name="Idli", price=Decimal("40.00"),
            is_available=True, is_veg=True,
        )

    def setUp(self):
        self.client = APIClient()

    def test_list_canteens(self):
        resp = self.client.get("/api/canteens/")
        self.assertEqual(resp.status_code, 200)
        names = [c["name"] for c in resp.data]
        self.assertIn("API Canteen", names)

    def test_canteen_detail(self):
        resp = self.client.get(f"/api/canteens/{self.canteen.pk}/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["name"], "API Canteen")

    def test_view_menu(self):
        resp = self.client.get(f"/api/canteens/{self.canteen.pk}/menu/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["name"], "Idli")

    def test_add_dish_manager(self):
        self.client.force_authenticate(user=self.mgr_user)
        resp = self.client.post(f"/api/canteens/{self.canteen.pk}/menu/add/", {
            "name": "NewDish", "price": "55.00", "is_veg": True,
        })
        self.assertEqual(resp.status_code, 201)
        self.assertTrue(Dish.objects.filter(name="NewDish").exists())

    def test_add_dish_customer_forbidden(self):
        self.client.force_authenticate(user=self.cust_user)
        resp = self.client.post(f"/api/canteens/{self.canteen.pk}/menu/add/", {
            "name": "Bad", "price": "10", "is_veg": True,
        })
        self.assertEqual(resp.status_code, 403)

    def test_toggle_dish(self):
        self.client.force_authenticate(user=self.mgr_user)
        resp = self.client.post(f"/api/canteens/dishes/{self.dish.pk}/toggle/")
        self.assertEqual(resp.status_code, 200)
        self.dish.refresh_from_db()
        self.assertFalse(self.dish.is_available)

    def test_update_dish(self):
        self.client.force_authenticate(user=self.mgr_user)
        resp = self.client.patch(f"/api/canteens/dishes/{self.dish.pk}/", {"price": "50.00"}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.dish.refresh_from_db()
        self.assertEqual(self.dish.price, Decimal("50.00"))

    def test_delete_dish(self):
        self.client.force_authenticate(user=self.mgr_user)
        d = Dish.objects.create(canteen=self.canteen, name="ToDelete", price=Decimal("10"), is_veg=True)
        resp = self.client.delete(f"/api/canteens/dishes/{d.pk}/")
        self.assertEqual(resp.status_code, 204)
        self.assertFalse(Dish.objects.filter(pk=d.pk).exists())

    def test_update_canteen_status(self):
        self.client.force_authenticate(user=self.mgr_user)
        resp = self.client.patch(f"/api/canteens/{self.canteen.pk}/status/", {"status": "CLOSED"}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.canteen.refresh_from_db()
        self.assertEqual(self.canteen.status, Canteen.Status.CLOSED)

    def test_holidays_api(self):
        self.client.force_authenticate(user=self.mgr_user)
        resp = self.client.post(f"/api/canteens/{self.canteen.pk}/holidays/", {"date": "2026-12-25", "description": "Christmas"}, format="json")
        self.assertEqual(resp.status_code, 201)
        resp2 = self.client.get(f"/api/canteens/{self.canteen.pk}/holidays/")
        self.assertEqual(resp2.status_code, 200)
        self.assertEqual(len(resp2.data), 1)

    def test_popular_dishes_global(self):
        resp = self.client.get("/api/canteens/dishes/popular/")
        self.assertEqual(resp.status_code, 200)

    def test_wait_time(self):
        resp = self.client.get(f"/api/canteens/{self.canteen.pk}/wait-time/")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("wait_time_minutes", resp.data)

    def test_register_canteen(self):
        mgr2_user = User.objects.create_user("mgr2@iitk.ac.in", "pw", role="MANAGER")
        mgr2 = CanteenManagerProfile.objects.create(user=mgr2_user)
        self.client.force_authenticate(user=mgr2_user)
        import io
        from PIL import Image
        img = Image.new("RGB", (100, 100), color="red")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        buf.name = "test.png"

        doc = io.BytesIO(b"fake pdf content")
        doc.name = "aadhar.pdf"
        doc2 = io.BytesIO(b"fake form content")
        doc2.name = "form.pdf"

        resp = self.client.post("/api/canteens/register/", {
            "name": "New Reg Canteen",
            "location": "Hall 9",
            "opening_time": "10:00",
            "closing_time": "20:00",
            "image": buf,
            "aadhar_card": doc,
            "hall_approval_form": doc2,
        }, format="multipart")
        self.assertEqual(resp.status_code, 201)
        self.assertTrue(Canteen.objects.filter(name="New Reg Canteen").exists())
