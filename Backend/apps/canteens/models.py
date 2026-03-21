"""
Canteen and Dish models for the SkipQ system.

Maps to class diagram entities:
  - Canteen → id, name, location, openingTime, closingTime, foodQueue,
              holidays, leadTimeConfig, operational status
  - Dish    → id, name, price, description, isAvailable, discount,
              photo, rating, reviews

State diagram reference (Canteen Operational):
  Default → Closed (OutOfHours ↔ OnHoliday)
  isOpen() == True → Open
  Open + Concurrency > 500 → Busy
  Load drops → Open
  Manual Toggle → EmergencyClosure
  closingTime reached → Closed
"""

import uuid
import logging

from django.db import models
from django.utils import timezone

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Canteen (class diagram entity)
# ---------------------------------------------------------------------------
class Canteen(models.Model):
    """
    Canteen entity from the class diagram.

    Attributes mapped:
      - id: Int                → auto PK
      - name: String           → CharField
      - location: String       → CharField
      - openingTime: Time      → TimeField
      - closingTime: Time      → TimeField
      - foodQueue: List        → tracked via active orders (computed)
      - holidays: List         → CanteenHoliday model
      - leadTimeConfig: Int    → IntegerField (hours)

    Operational status from state diagram:
      UNDER_REVIEW | ACTIVE | CLOSED | OPEN | BUSY | EMERGENCY_CLOSURE
    """

    class Status(models.TextChoices):
        # Registration states (sequence diagram: NewCanteen)
        UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
        REJECTED = "REJECTED", "Rejected"
        # Operational states (state diagram: Canteen Operational)
        ACTIVE = "ACTIVE", "Active (auto-managed)"
        OPEN = "OPEN", "Open"
        CLOSED = "CLOSED", "Closed"
        BUSY = "BUSY", "Busy"
        EMERGENCY_CLOSURE = "EMERGENCY_CLOSURE", "Emergency Closure"

    name = models.CharField(max_length=255)
    location = models.CharField(max_length=500)
    opening_time = models.TimeField()
    closing_time = models.TimeField()
    lead_time_config = models.IntegerField(
        default=6,
        help_text="Minimum hours before a cake reservation can be placed.",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.UNDER_REVIEW,
        help_text="Current operational status — from Canteen Operational state diagram.",
    )

    # Manager relationship (class diagram: CanteenManager manages 1 Canteen)
    manager = models.OneToOneField(
        "users.CanteenManagerProfile",
        on_delete=models.CASCADE,
        related_name="canteen",
    )

    # Registration documents (for admin review — NewCanteen sequence diagram)
    aadhar_card = models.FileField(upload_to="documents/", blank=True, null=True,
        help_text="Aadhar card of the canteen manager.",
    )
    hall_approval_form = models.FileField(upload_to="documents/", blank=True, null=True,
        help_text="Hall Approval Form for the canteen.",
    )
    # Canteen cover image (public)
    image = models.ImageField(upload_to="canteen_images/", blank=True, null=True,
        help_text="Cover photo of the canteen.",
    )
    rejection_reason = models.TextField(
        blank=True,
        help_text="Reason provided by Admin if registration is rejected.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "canteens"

    def __str__(self):
        return f"{self.name} ({self.get_status_display()})"

    # --- Methods from class diagram ---

    def is_open(self):
        """
        isOpen(currentTime: DateTime): Bool

        Implements the state transition check from the Canteen Operational
        state diagram: isOpen() == True → Open state.
        """
        if self.status in (self.Status.UNDER_REVIEW, self.Status.REJECTED, self.Status.EMERGENCY_CLOSURE):
            return False
        now = timezone.localtime().time()
        if self.opening_time <= self.closing_time:
            return self.opening_time <= now < self.closing_time
        else:
            # Handles overnight hours (e.g., 14:00 – 02:00)
            return now >= self.opening_time or now < self.closing_time

    # TODO: Improve estimated order time logic
    def get_estimated_wait_time(self):
        """
        getEstimatedWaitTime(): Time

        Calculated from active orders in the queue.
        Each active order is assumed to take ~5 minutes.
        """
        from apps.orders.models import Order
        active_count = Order.objects.filter(
            canteen=self,
            status__in=[Order.Status.PENDING, Order.Status.ACCEPTED],
        ).count()
        return active_count * 30  # minutes

    def check_availability(self, date):
        """
        checkAvailability(date: DateTime): Bool

        Used by cake reservation — checks holidays and lead time.
        Implements the Scheduling sub-state from the Cake Reservation state diagram.
        """
        # Check if date falls on a holiday
        if self.holidays.filter(date=date).exists():
            return False, "Date falls on a canteen holiday"

        # Check lead time constraint
        now = timezone.now()
        from datetime import datetime, timedelta
        if isinstance(date, datetime):
            diff = date - now
        else:
            diff = timezone.make_aware(
                datetime.combine(date, self.opening_time)
            ) - now
        if diff < timedelta(hours=self.lead_time_config):
            return False, f"Must order at least {self.lead_time_config} hours in advance"

        return True, "Slot available"


# ---------------------------------------------------------------------------
# CanteenHoliday — implements holidays: List from class diagram
# ---------------------------------------------------------------------------
class CanteenHoliday(models.Model):
    """
    Holiday entries for a canteen.
    Referenced in Cake Reservation state diagram: ConstraintCheck → Is Holiday → DateError.
    """

    canteen = models.ForeignKey(
        Canteen,
        on_delete=models.CASCADE,
        related_name="holidays",
    )
    date = models.DateField()
    description = models.CharField(max_length=255, blank=True)

    class Meta:
        app_label = "canteens"
        unique_together = ("canteen", "date")
        ordering = ["date"]

    def __str__(self):
        return f"{self.canteen.name} — {self.date}"


# ---------------------------------------------------------------------------
# Dish (class diagram entity)
# ---------------------------------------------------------------------------
class Dish(models.Model):
    """
    Dish entity from the class diagram.

    Attributes mapped:
      - id: Int                → auto PK
      - name: String           → CharField
      - price: Float           → DecimalField
      - description: String    → TextField
      - isAvailable: Bool      → BooleanField
      - discount: Float        → DecimalField (percentage)
      - photo: String          → ImageField
      - rating: Float          → DecimalField
      - reviews: List          → DishReview model (1..* relationship from class diagram)

    Methods mapped:
      - updateDishDetails() → via serializer / service
      - toggleAvailability()   → toggle_availability()
      - updatePrice()          → via service
      - updateDiscount()       → via service
      - updateRatingAndReviews() → via service
    """

    canteen = models.ForeignKey(
        Canteen,
        on_delete=models.CASCADE,
        related_name="dishes",
    )
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    description = models.TextField(blank=True)
    is_available = models.BooleanField(default=True)
    discount = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        help_text="Discount percentage (0–100).",
    )
    photo = models.ImageField(upload_to="dish_photos/", blank=True, null=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    category = models.CharField(max_length=50, blank=True)
    is_veg = models.BooleanField(
        default=True,
        help_text="True for vegetarian, False for non-vegetarian.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "canteens"

    def __str__(self):
        return f"{self.name} (₹{self.price})"

    def toggle_availability(self):
        """toggleAvailability(): void — from class diagram."""
        self.is_available = not self.is_available
        self.save(update_fields=["is_available"])
        logger.info("Dish %s availability toggled to %s", self.name, self.is_available)

    def get_effective_price(self):
        """Calculate price after discount."""
        if self.discount > 0:
            return self.price * (1 - self.discount / 100)
        return self.price


# ---------------------------------------------------------------------------
# DishReview — implements reviews: List from class diagram
# ---------------------------------------------------------------------------
class DishReview(models.Model):
    """
    Review entries for a dish.
    Maps to the reviews attribute and updateRatingAndReviews() method
    in the Dish class from the class diagram.
    """

    dish = models.ForeignKey(
        Dish,
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    customer = models.ForeignKey(
        "users.CustomerProfile",
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    rating = models.IntegerField(
        help_text="Rating from 1 to 5.",
    )
    review_text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "canteens"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Review of {self.dish.name} by {self.customer.user.email} — {self.rating}★"
