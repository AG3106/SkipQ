"""
Management command to seed the database with test data.

Creates test users, canteens, dishes, orders, and cake reservations
to verify all business logic and state transitions work correctly.
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, time, timedelta
from decimal import Decimal

from apps.users.models import User, CustomerProfile, CanteenManagerProfile, AdminProfile
from apps.users.services.auth_service import hash_wallet_pin
from apps.canteens.models import Canteen, Dish, CanteenHoliday
from apps.orders.models import Order, OrderItem, Payment
from apps.cakes.models import CakeReservation


class Command(BaseCommand):
    help = "Seed database with test data for verification"

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("Seeding database..."))

        # ---------------------------------------------------------------
        # 1. Create Users (class diagram: User, Customer, Manager, Admin)
        # ---------------------------------------------------------------
        self.stdout.write("  Creating users...")

        # Admin
        admin_user = User.objects.create_user(
            email="admin@iitk.ac.in", password="admin1234", role="ADMIN",
        )
        admin_user.is_verified = True
        admin_user.is_staff = True
        admin_user.save()
        admin_profile = AdminProfile.objects.create(user=admin_user)
        self.stdout.write(f"    ✓ Admin: {admin_user.email}")

        # Customer 1
        cust1_user = User.objects.create_user(
            email="rahul@iitk.ac.in", password="cust1234", role="CUSTOMER",
        )
        cust1_user.is_verified = True
        cust1_user.save()
        cust1 = CustomerProfile.objects.create(
            user=cust1_user,
            name="Rahul Sharma",
            phone="9876543210",
            wallet_balance=Decimal("500.00"),
            wallet_pin_hash=hash_wallet_pin("1234"),
        )
        self.stdout.write(f"    ✓ Customer: {cust1_user.email} (₹{cust1.wallet_balance})")

        # Customer 2
        cust2_user = User.objects.create_user(
            email="priya@iitk.ac.in", password="cust1234", role="CUSTOMER",
        )
        cust2_user.is_verified = True
        cust2_user.save()
        cust2 = CustomerProfile.objects.create(
            user=cust2_user,
            name="Priya Patel",
            phone="9876543211",
            wallet_balance=Decimal("300.00"),
            wallet_pin_hash=hash_wallet_pin("5678"),
        )
        self.stdout.write(f"    ✓ Customer: {cust2_user.email} (₹{cust2.wallet_balance})")

        # Suspended customer (for testing suspension logic)
        cust3_user = User.objects.create_user(
            email="suspended@iitk.ac.in", password="cust1234", role="CUSTOMER",
        )
        cust3_user.is_verified = True
        cust3_user.is_suspended = True
        cust3_user.save()
        CustomerProfile.objects.create(user=cust3_user, name="Suspended User")
        self.stdout.write(f"    ✓ Suspended user: {cust3_user.email}")

        # Manager 1
        mgr1_user = User.objects.create_user(
            email="manager1@iitk.ac.in", password="mgr1234", role="MANAGER",
        )
        mgr1_user.is_verified = True
        mgr1_user.save()
        mgr1 = CanteenManagerProfile.objects.create(
            user=mgr1_user,
            contact_details="Manager 1, Hall 5",
            wallet_balance=Decimal("1000.00"),
            wallet_pin_hash=hash_wallet_pin("0000"),
        )
        self.stdout.write(f"    ✓ Manager: {mgr1_user.email}")

        # Manager 2
        mgr2_user = User.objects.create_user(
            email="manager2@iitk.ac.in", password="mgr1234", role="MANAGER",
        )
        mgr2_user.is_verified = True
        mgr2_user.save()
        mgr2 = CanteenManagerProfile.objects.create(
            user=mgr2_user,
            contact_details="Manager 2, Hall 9",
        )
        self.stdout.write(f"    ✓ Manager: {mgr2_user.email}")

        # ---------------------------------------------------------------
        # 2. Create Canteens (class diagram: Canteen)
        # ---------------------------------------------------------------
        self.stdout.write("\n  Creating canteens...")

        # Active canteen with menu
        canteen1 = Canteen.objects.create(
            name="Hall 5 Canteen",
            location="Hall 5, IIT Kanpur",
            opening_time=time(8, 0),
            closing_time=time(22, 0),
            lead_time_config=6,
            status=Canteen.Status.OPEN,
            manager=mgr1,
        )
        self.stdout.write(f"    ✓ Canteen: {canteen1.name} (OPEN)")

        # Canteen under review (for admin approval testing)
        canteen2 = Canteen.objects.create(
            name="New Cafe",
            location="Academic Area, IIT Kanpur",
            opening_time=time(9, 0),
            closing_time=time(21, 0),
            lead_time_config=8,
            status=Canteen.Status.UNDER_REVIEW,
            manager=mgr2,
        )
        self.stdout.write(f"    ✓ Canteen: {canteen2.name} (UNDER_REVIEW)")

        # ---------------------------------------------------------------
        # 3. Add Holidays (class diagram: holidays: List)
        # ---------------------------------------------------------------
        self.stdout.write("\n  Adding holidays...")

        h1 = CanteenHoliday.objects.create(
            canteen=canteen1,
            date=date(2026, 3, 15),
            description="Holi holiday",
        )
        h2 = CanteenHoliday.objects.create(
            canteen=canteen1,
            date=date(2026, 8, 15),
            description="Independence Day",
        )
        self.stdout.write(f"    ✓ Holiday: {h1.date} — {h1.description}")
        self.stdout.write(f"    ✓ Holiday: {h2.date} — {h2.description}")

        # ---------------------------------------------------------------
        # 4. Create Dishes (class diagram: Dish)
        # ---------------------------------------------------------------
        self.stdout.write("\n  Creating dishes...")

        dish1 = Dish.objects.create(
            canteen=canteen1,
            name="Paneer Butter Masala",
            price=Decimal("120.00"),
            description="Rich and creamy paneer in butter tomato gravy",
            is_available=True,
            discount=Decimal("10.00"),
            category="Main Course",
            rating=Decimal("4.50"),
        )
        dish2 = Dish.objects.create(
            canteen=canteen1,
            name="Masala Dosa",
            price=Decimal("60.00"),
            description="Crispy dosa with potato filling",
            is_available=True,
            discount=Decimal("0.00"),
            category="South Indian",
            rating=Decimal("4.20"),
        )
        dish3 = Dish.objects.create(
            canteen=canteen1,
            name="Cold Coffee",
            price=Decimal("40.00"),
            description="Chilled coffee with ice cream",
            is_available=True,
            category="Beverages",
        )
        dish4 = Dish.objects.create(
            canteen=canteen1,
            name="Veg Biryani",
            price=Decimal("90.00"),
            description="Fragrant rice with mixed vegetables",
            is_available=False,  # Unavailable — for testing toggle
            category="Rice",
        )
        self.stdout.write(f"    ✓ Dish: {dish1.name} ₹{dish1.price} ({dish1.discount}% off)")
        self.stdout.write(f"    ✓ Dish: {dish2.name} ₹{dish2.price}")
        self.stdout.write(f"    ✓ Dish: {dish3.name} ₹{dish3.price}")
        self.stdout.write(f"    ✓ Dish: {dish4.name} ₹{dish4.price} (UNAVAILABLE)")

        # Add customer favorites
        cust1.favorite_dishes.add(dish1, dish2)
        self.stdout.write(f"    ✓ {cust1.name} favorites: {dish1.name}, {dish2.name}")

        # ---------------------------------------------------------------
        # 5. Create Orders (Order Lifecycle state diagram)
        # ---------------------------------------------------------------
        self.stdout.write("\n  Creating orders...")

        # Completed order
        order1 = Order.objects.create(
            customer=cust1, canteen=canteen1, status=Order.Status.COMPLETED,
            receive_time=timezone.now(),
        )
        OrderItem.objects.create(order=order1, dish=dish1, quantity=2, price_at_order=dish1.get_effective_price())
        OrderItem.objects.create(order=order1, dish=dish3, quantity=1, price_at_order=dish3.price)
        Payment.objects.create(order=order1, amount=order1.calculate_total(), status=Payment.Status.COMPLETED)
        self.stdout.write(f"    ✓ Order #{order1.pk}: COMPLETED — ₹{order1.calculate_total()}")

        # Pending order (for manager accept/reject testing)
        order2 = Order.objects.create(
            customer=cust1, canteen=canteen1, status=Order.Status.PENDING,
        )
        OrderItem.objects.create(order=order2, dish=dish2, quantity=1, price_at_order=dish2.price)
        Payment.objects.create(order=order2, amount=order2.calculate_total(), status=Payment.Status.COMPLETED)
        self.stdout.write(f"    ✓ Order #{order2.pk}: PENDING — ₹{order2.calculate_total()}")

        # Accepted order (for ready/complete testing)
        order3 = Order.objects.create(
            customer=cust2, canteen=canteen1, status=Order.Status.ACCEPTED,
        )
        OrderItem.objects.create(order=order3, dish=dish1, quantity=1, price_at_order=dish1.get_effective_price())
        OrderItem.objects.create(order=order3, dish=dish2, quantity=2, price_at_order=dish2.price)
        Payment.objects.create(order=order3, amount=order3.calculate_total(), status=Payment.Status.COMPLETED)
        self.stdout.write(f"    ✓ Order #{order3.pk}: ACCEPTED — ₹{order3.calculate_total()}")

        # Rejected + refunded order
        order4 = Order.objects.create(
            customer=cust2, canteen=canteen1, status=Order.Status.REFUNDED,
        )
        OrderItem.objects.create(order=order4, dish=dish3, quantity=3, price_at_order=dish3.price)
        Payment.objects.create(order=order4, amount=order4.calculate_total(), status=Payment.Status.REFUNDED)
        self.stdout.write(f"    ✓ Order #{order4.pk}: REFUNDED — ₹{order4.calculate_total()}")

        # ---------------------------------------------------------------
        # 6. Create Cake Reservations (Cake Reservation state diagram)
        # ---------------------------------------------------------------
        self.stdout.write("\n  Creating cake reservations...")

        cake1 = CakeReservation.objects.create(
            customer=cust1,
            canteen=canteen1,
            flavor="Chocolate",
            size="1kg",
            design="Round with sprinkles",
            message="Happy Birthday Rahul!",
            pickup_date=date(2026, 3, 20),
            pickup_time=time(14, 0),
            advance_amount=Decimal("200.00"),
            status=CakeReservation.Status.PENDING_APPROVAL,
        )
        self.stdout.write(f"    ✓ Cake #{cake1.pk}: PENDING_APPROVAL — {cake1.flavor} {cake1.size}")

        cake2 = CakeReservation.objects.create(
            customer=cust2,
            canteen=canteen1,
            flavor="Vanilla",
            size="0.5kg",
            message="Congratulations!",
            pickup_date=date(2026, 3, 25),
            pickup_time=time(16, 0),
            advance_amount=Decimal("150.00"),
            status=CakeReservation.Status.CONFIRMED,
        )
        self.stdout.write(f"    ✓ Cake #{cake2.pk}: CONFIRMED — {cake2.flavor} {cake2.size}")

        # ---------------------------------------------------------------
        # Summary
        # ---------------------------------------------------------------
        self.stdout.write(self.style.SUCCESS(
            f"\n✅ Seeding complete!\n"
            f"   Users: {User.objects.count()} "
            f"(Customers: {CustomerProfile.objects.count()}, "
            f"Managers: {CanteenManagerProfile.objects.count()}, "
            f"Admins: {AdminProfile.objects.count()})\n"
            f"   Canteens: {Canteen.objects.count()}\n"
            f"   Dishes: {Dish.objects.count()}\n"
            f"   Orders: {Order.objects.count()}\n"
            f"   Payments: {Payment.objects.count()}\n"
            f"   Cake Reservations: {CakeReservation.objects.count()}\n"
            f"   Holidays: {CanteenHoliday.objects.count()}"
        ))
