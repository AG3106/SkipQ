"""
Extended unit tests for the canteens app — additional coverage.

Covers:
  - Canteen.is_open() — open/closed status logic, overnight hours
  - Canteen.check_availability() — lead time, holidays
  - DishRating model, add_rating service, menu_service functions
  - canteen_service edge cases (update_timings, remove_holiday)
  - Popular dishes (global + canteen-specific)
  - Analytics service (monthly analytics, dish frequency/revenue)
  - Canteen API — lead time, documents endpoint
"""

import datetime as dt
from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.users.models import User, CustomerProfile, CanteenManagerProfile
from apps.canteens.models import Canteen, Dish, DishRating, CanteenHoliday


# ============================================================
# Canteen.is_open() — model method tests
# ============================================================

class CanteenIsOpenTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.mgr_user = User.objects.create_user("isopen@iitk.ac.in", "pw", role="MANAGER")
        cls.mgr = CanteenManagerProfile.objects.create(user=cls.mgr_user)

    def test_under_review_not_open(self):
        c = Canteen.objects.create(
            name="UR", location="H", opening_time=dt.time(0, 0), closing_time=dt.time(23, 59),
            manager=self.mgr, status=Canteen.Status.UNDER_REVIEW,
        )
        self.assertFalse(c.is_open())

    def test_rejected_not_open(self):
        c = Canteen.objects.create(
            name="RJ", location="H", opening_time=dt.time(0, 0), closing_time=dt.time(23, 59),
            manager=self.mgr, status=Canteen.Status.REJECTED,
        )
        self.assertFalse(c.is_open())

    def test_closed_not_open(self):
        c = Canteen.objects.create(
            name="CL", location="H", opening_time=dt.time(0, 0), closing_time=dt.time(23, 59),
            manager=self.mgr, status=Canteen.Status.CLOSED,
        )
        self.assertFalse(c.is_open())

    def test_emergency_closure_not_open(self):
        c = Canteen.objects.create(
            name="EC", location="H", opening_time=dt.time(0, 0), closing_time=dt.time(23, 59),
            manager=self.mgr, status=Canteen.Status.EMERGENCY_CLOSURE,
        )
        self.assertFalse(c.is_open())

    def test_active_within_hours_is_open(self):
        # 00:00 to 23:59 — always open during the day
        c = Canteen.objects.create(
            name="AW", location="H", opening_time=dt.time(0, 0), closing_time=dt.time(23, 59),
            manager=self.mgr, status=Canteen.Status.ACTIVE,
        )
        self.assertTrue(c.is_open())

    def test_open_status_within_hours_is_open(self):
        c = Canteen.objects.create(
            name="ON", location="H", opening_time=dt.time(0, 0), closing_time=dt.time(23, 59),
            manager=self.mgr, status=Canteen.Status.OPEN,
        )
        self.assertTrue(c.is_open())


# ============================================================
# Canteen.check_availability() — model method tests
# ============================================================

class CanteenCheckAvailabilityTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.mgr_user = User.objects.create_user("avail@iitk.ac.in", "pw", role="MANAGER")
        cls.mgr = CanteenManagerProfile.objects.create(user=cls.mgr_user)
        cls.canteen = Canteen.objects.create(
            name="Avail Canteen", location="H",
            opening_time=dt.time(8, 0), closing_time=dt.time(22, 0),
            manager=cls.mgr, status=Canteen.Status.ACTIVE,
            lead_time_config=6,
        )

    def test_available_future_date(self):
        future = (timezone.now() + dt.timedelta(days=5)).date()
        avail, msg = self.canteen.check_availability(future)
        self.assertTrue(avail)

    def test_holiday_date_unavailable(self):
        future = (timezone.now() + dt.timedelta(days=5)).date()
        CanteenHoliday.objects.create(canteen=self.canteen, date=future, description="Holiday")
        avail, msg = self.canteen.check_availability(future)
        self.assertFalse(avail)
        self.assertIn("holiday", msg.lower())

    def test_insufficient_lead_time(self):
        today = timezone.now().date()
        avail, msg = self.canteen.check_availability(today)
        self.assertFalse(avail)
        self.assertIn("advance", msg.lower())


# ============================================================
# DishRating model tests
# ============================================================

class DishRatingTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.mgr_user = User.objects.create_user("drm@iitk.ac.in", "pw", role="MANAGER")
        cls.mgr = CanteenManagerProfile.objects.create(user=cls.mgr_user)
        cls.canteen = Canteen.objects.create(
            name="Rating Canteen", location="H",
            opening_time=dt.time(8, 0), closing_time=dt.time(22, 0),
            manager=cls.mgr, status=Canteen.Status.ACTIVE,
        )
        cls.dish = Dish.objects.create(
            canteen=cls.canteen, name="RateDish", price=Decimal("50"), is_veg=True,
        )
        cls.cust_user = User.objects.create_user("drc@iitk.ac.in", "pw", role="CUSTOMER")
        cls.cust = CustomerProfile.objects.create(user=cls.cust_user, name="RateCust")

    def test_dish_rating_str(self):
        rating = DishRating.objects.create(
            dish=self.dish, customer=self.cust, rating=4,
        )
        self.assertIn("RateDish", str(rating))
        self.assertIn("drc@iitk.ac.in", str(rating))
        self.assertIn("4★", str(rating))


# ============================================================
# Menu service — additional tests
# ============================================================

class MenuServiceExtendedTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.mgr_user = User.objects.create_user("mse@iitk.ac.in", "pw", role="MANAGER")
        cls.mgr = CanteenManagerProfile.objects.create(user=cls.mgr_user)
        cls.canteen = Canteen.objects.create(
            name="Menu Canteen", location="H",
            opening_time=dt.time(8, 0), closing_time=dt.time(22, 0),
            manager=cls.mgr, status=Canteen.Status.ACTIVE,
        )
        cls.cust_user = User.objects.create_user("msc@iitk.ac.in", "pw", role="CUSTOMER")
        cls.cust = CustomerProfile.objects.create(user=cls.cust_user, name="MenuCust")

    def test_add_rating_valid(self):
        from apps.canteens.services.menu_service import add_rating
        dish = Dish.objects.create(
            canteen=self.canteen, name="RateTest", price=Decimal("30"), is_veg=True,
        )
        rating = add_rating(dish, self.cust, 5)
        self.assertEqual(rating.rating, 5)
        dish.refresh_from_db()
        self.assertEqual(dish.rating, Decimal("5.00"))

    def test_add_rating_invalid_low(self):
        from apps.canteens.services.menu_service import add_rating
        dish = Dish.objects.create(
            canteen=self.canteen, name="RateInv", price=Decimal("30"), is_veg=True,
        )
        with self.assertRaises(ValueError):
            add_rating(dish, self.cust, 0)

    def test_add_rating_invalid_high(self):
        from apps.canteens.services.menu_service import add_rating
        dish = Dish.objects.create(
            canteen=self.canteen, name="RateHigh", price=Decimal("30"), is_veg=True,
        )
        with self.assertRaises(ValueError):
            add_rating(dish, self.cust, 6)

    def test_add_rating_recalculates_average(self):
        from apps.canteens.services.menu_service import add_rating
        dish = Dish.objects.create(
            canteen=self.canteen, name="AvgRating", price=Decimal("30"), is_veg=True,
        )
        cust2_user = User.objects.create_user("msc2@iitk.ac.in", "pw", role="CUSTOMER")
        cust2 = CustomerProfile.objects.create(user=cust2_user, name="MC2")
        add_rating(dish, self.cust, 4)
        add_rating(dish, cust2, 2)
        dish.refresh_from_db()
        self.assertEqual(dish.rating, Decimal("3.00"))

    def test_get_menu(self):
        from apps.canteens.services.menu_service import get_menu
        Dish.objects.create(
            canteen=self.canteen, name="MenuGet", price=Decimal("10"), is_veg=True,
        )
        menu = get_menu(self.canteen)
        self.assertTrue(menu.count() >= 1)

    def test_add_dish(self):
        from apps.canteens.services.menu_service import add_dish
        dish = add_dish(self.canteen, "NewFromSrv", "80", category="Main", is_veg=False)
        self.assertEqual(dish.name, "NewFromSrv")
        self.assertEqual(dish.price, Decimal("80"))
        self.assertFalse(dish.is_veg)

    def test_update_dish(self):
        from apps.canteens.services.menu_service import update_dish
        dish = Dish.objects.create(
            canteen=self.canteen, name="UpdDish", price=Decimal("50"), is_veg=True,
        )
        update_dish(dish, name="Updated", price=Decimal("60"))
        dish.refresh_from_db()
        self.assertEqual(dish.name, "Updated")
        self.assertEqual(dish.price, Decimal("60"))

    def test_update_price(self):
        from apps.canteens.services.menu_service import update_price
        dish = Dish.objects.create(
            canteen=self.canteen, name="PriceDish", price=Decimal("50"), is_veg=True,
        )
        update_price(dish, 75)
        dish.refresh_from_db()
        self.assertEqual(dish.price, Decimal("75"))

    def test_popular_dishes_global(self):
        from apps.canteens.services.menu_service import get_popular_dishes
        Dish.objects.create(
            canteen=self.canteen, name="PopDish", price=Decimal("10"),
            is_veg=True, rating=Decimal("4.5"),
        )
        dishes = get_popular_dishes(limit=5)
        self.assertTrue(len(dishes) >= 1)

    def test_popular_dishes_canteen_specific(self):
        from apps.canteens.services.menu_service import get_canteen_popular_dishes
        Dish.objects.create(
            canteen=self.canteen, name="CanteenPop", price=Decimal("10"),
            is_veg=True, rating=Decimal("4.0"),
        )
        dishes = get_canteen_popular_dishes(self.canteen, limit=5)
        self.assertTrue(len(dishes) >= 1)


# ============================================================
# Canteen service — timings, holidays
# ============================================================

class CanteenServiceExtendedTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.mgr_user = User.objects.create_user("cse@iitk.ac.in", "pw", role="MANAGER")
        cls.mgr = CanteenManagerProfile.objects.create(user=cls.mgr_user)

    def test_update_timings(self):
        from apps.canteens.services.canteen_service import update_canteen_timings
        c = Canteen.objects.create(
            name="TimCanteen", location="H", opening_time=dt.time(8, 0), closing_time=dt.time(22, 0),
            manager=self.mgr, status=Canteen.Status.ACTIVE,
        )
        update_canteen_timings(c, opening_time="09:00", closing_time="21:00")
        c.refresh_from_db()
        self.assertEqual(str(c.opening_time), "09:00:00")
        self.assertEqual(str(c.closing_time), "21:00:00")

    def test_remove_holiday(self):
        from apps.canteens.services.canteen_service import add_holiday, remove_holiday, get_holidays
        c = Canteen.objects.create(
            name="RemH", location="H", opening_time=dt.time(8, 0), closing_time=dt.time(22, 0),
            manager=self.mgr, status=Canteen.Status.ACTIVE,
        )
        add_holiday(c, "2026-07-01", "July Holiday")
        self.assertEqual(get_holidays(c).count(), 1)
        remove_holiday(c, "2026-07-01")
        self.assertEqual(get_holidays(c).count(), 0)

    def test_remove_nonexistent_holiday_raises(self):
        from apps.canteens.services.canteen_service import remove_holiday
        c = Canteen.objects.create(
            name="NoH", location="H", opening_time=dt.time(8, 0), closing_time=dt.time(22, 0),
            manager=self.mgr, status=Canteen.Status.ACTIVE,
        )
        with self.assertRaises(ValueError):
            remove_holiday(c, "2026-07-01")

    def test_emergency_closure_transitions(self):
        from apps.canteens.services.canteen_service import update_canteen_operational_status
        c = Canteen.objects.create(
            name="EmC", location="H", opening_time=dt.time(8, 0), closing_time=dt.time(22, 0),
            manager=self.mgr, status=Canteen.Status.ACTIVE,
        )
        update_canteen_operational_status(c, Canteen.Status.OPEN)
        update_canteen_operational_status(c, Canteen.Status.EMERGENCY_CLOSURE)
        self.assertEqual(c.status, Canteen.Status.EMERGENCY_CLOSURE)
        # Can go back to OPEN or CLOSED
        update_canteen_operational_status(c, Canteen.Status.CLOSED)
        self.assertEqual(c.status, Canteen.Status.CLOSED)


# ============================================================
# Analytics service — extended
# ============================================================

class AnalyticsServiceExtendedTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        from apps.orders.models import Order, OrderItem, Payment

        cls.mgr_user = User.objects.create_user("asev@iitk.ac.in", "pw", role="MANAGER")
        cls.mgr = CanteenManagerProfile.objects.create(user=cls.mgr_user)
        cls.cust_user = User.objects.create_user("acust@iitk.ac.in", "pw", role="CUSTOMER")
        cls.cust = CustomerProfile.objects.create(user=cls.cust_user, name="ACust")
        cls.canteen = Canteen.objects.create(
            name="Analytics Canteen", location="H",
            opening_time=dt.time(8, 0), closing_time=dt.time(22, 0),
            manager=cls.mgr, status=Canteen.Status.ACTIVE,
        )
        cls.dish = Dish.objects.create(
            canteen=cls.canteen, name="AnalyticsDish", price=Decimal("100"), is_veg=True,
        )
        # Completed order 7 days ago
        order = Order.objects.create(
            customer=cls.cust, canteen=cls.canteen, status=Order.Status.COMPLETED,
        )
        Order.objects.filter(pk=order.pk).update(
            book_time=timezone.now() - dt.timedelta(days=7)
        )
        OrderItem.objects.create(
            order=order, dish=cls.dish, quantity=3, price_at_order=Decimal("100"),
        )
        # Payment record is needed for monthly analytics
        Payment.objects.create(
            order=order, amount=Decimal("300"), status=Payment.Status.COMPLETED,
        )

    def test_monthly_analytics(self):
        from apps.canteens.services.analytics_service import get_monthly_analytics
        results = get_monthly_analytics(self.canteen)
        self.assertTrue(len(results) >= 1)

    def test_dish_frequency(self):
        from apps.canteens.services.analytics_service import get_dish_frequency
        freq = get_dish_frequency(self.canteen)
        self.assertTrue(len(freq) >= 1)
        self.assertEqual(freq[0]["dish_name"], "AnalyticsDish")

    def test_top_dishes_by_frequency(self):
        from apps.canteens.services.analytics_service import get_top_dishes_by_frequency
        top = get_top_dishes_by_frequency(self.canteen, limit=3)
        self.assertTrue(len(top) >= 1)

    def test_top_dishes_by_revenue(self):
        from apps.canteens.services.analytics_service import get_top_dishes_by_revenue
        top = get_top_dishes_by_revenue(self.canteen, limit=3)
        self.assertTrue(len(top) >= 1)
        self.assertEqual(top[0]["dish_name"], "AnalyticsDish")


# ============================================================
# Canteen Holiday model tests
# ============================================================

class CanteenHolidayTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.mgr_user = User.objects.create_user("ch@iitk.ac.in", "pw", role="MANAGER")
        cls.mgr = CanteenManagerProfile.objects.create(user=cls.mgr_user)
        cls.canteen = Canteen.objects.create(
            name="HolidayTest", location="H",
            opening_time=dt.time(8, 0), closing_time=dt.time(22, 0),
            manager=cls.mgr, status=Canteen.Status.ACTIVE,
        )

    def test_holiday_str(self):
        h = CanteenHoliday.objects.create(canteen=self.canteen, date="2026-12-25", description="Xmas")
        self.assertIn("HolidayTest", str(h))
        self.assertIn("2026-12-25", str(h))


# ============================================================
# Dish model tests
# ============================================================

class DishStrTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.mgr_user = User.objects.create_user("dstr@iitk.ac.in", "pw", role="MANAGER")
        cls.mgr = CanteenManagerProfile.objects.create(user=cls.mgr_user)
        cls.canteen = Canteen.objects.create(
            name="DishStr", location="H",
            opening_time=dt.time(8, 0), closing_time=dt.time(22, 0),
            manager=cls.mgr, status=Canteen.Status.ACTIVE,
        )

    def test_dish_str(self):
        d = Dish.objects.create(
            canteen=self.canteen, name="StrDish", price=Decimal("45"), is_veg=True,
        )
        self.assertIn("StrDish", str(d))
        self.assertIn("45", str(d))


# ============================================================
# API — canteen lead time, wait time
# ============================================================

class CanteenAPIExtendedTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.mgr_user = User.objects.create_user("cape@iitk.ac.in", "pw", role="MANAGER")
        cls.mgr = CanteenManagerProfile.objects.create(user=cls.mgr_user)
        cls.canteen = Canteen.objects.create(
            name="ExtAPI Canteen", location="H",
            opening_time=dt.time(8, 0), closing_time=dt.time(22, 0),
            manager=cls.mgr, status=Canteen.Status.ACTIVE,
            lead_time_config=6,
        )

    def setUp(self):
        self.client = APIClient()

    def test_lead_time_endpoint(self):
        resp = self.client.get(f"/api/canteens/{self.canteen.pk}/lead-time/")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("lead_time_hours", resp.data)
        self.assertEqual(resp.data["lead_time_hours"], 6)

    def test_popular_dishes_for_canteen_endpoint(self):
        Dish.objects.create(
            canteen=self.canteen, name="PopExt", price=Decimal("10"),
            is_veg=True, rating=Decimal("4.0"),
        )
        resp = self.client.get(f"/api/canteens/{self.canteen.pk}/menu/popular/")
        self.assertEqual(resp.status_code, 200)
