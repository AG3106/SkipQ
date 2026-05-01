"""
Cake Reservation model for the SkipQ system.

Maps to the Cake Reservation workflow from sequence diagrams (Cake/phase1–3)
and the Cake Reservation state diagram:
  Configuration → Scheduling (ConstraintCheck → DateError / TimeError / Validated)
  → Payment → AwaitingManager (PENDING_APPROVAL)
  → Manager Accepts → Confirmed → Picked up → Completed
  → Manager Rejects → processRefund() → Refunded
"""

import logging
from django.db import models

logger = logging.getLogger(__name__)


class CakeReservation(models.Model):
    """
    Cake reservation entity — custom order type with advance scheduling.

    State diagram states:
      CONFIGURATION      → User is selecting flavor/size/design
      PENDING_APPROVAL   → Payment made, awaiting manager decision
      CONFIRMED          → Manager accepted
      REJECTED           → Manager rejected (triggers refund)
      COMPLETED          → Cake picked up
      REFUNDED           → Refund processed after rejection
    """

    class Status(models.TextChoices):
        CONFIGURATION = "CONFIGURATION", "Configuration"
        PENDING_APPROVAL = "PENDING_APPROVAL", "Pending Approval"
        CONFIRMED = "CONFIRMED", "Confirmed"
        REJECTED = "REJECTED", "Rejected"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"
        REFUNDED = "REFUNDED", "Refunded"

    customer = models.ForeignKey(
        "users.CustomerProfile",
        on_delete=models.CASCADE,
        related_name="cake_reservations",
    )
    canteen = models.ForeignKey(
        "canteens.Canteen",
        on_delete=models.CASCADE,
        related_name="cake_reservations",
    )

    # Configuration details (from state diagram: Configuration state)
    flavor = models.CharField(max_length=100)
    size = models.CharField(
        max_length=50,
        help_text="e.g., 0.5kg, 1kg, 2kg",
    )
    design = models.CharField(max_length=255, blank=True)
    message = models.CharField(
        max_length=500,
        blank=True,
        help_text="Message to write on the cake (e.g., 'Happy Birthday').",
    )

    # Scheduling (from state diagram: Scheduling sub-state)
    pickup_date = models.DateField()
    pickup_time = models.TimeField()

    # Payment
    advance_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    # Status tracking
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.CONFIGURATION,
    )
    rejection_reason = models.TextField(
        blank=True,
        help_text="Reason from manager if rejected (e.g., 'Capacity Full').",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "cakes"
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"Cake #{self.pk} — {self.flavor} ({self.size}) "
            f"for {self.pickup_date} ({self.get_status_display()})"
        )

    def update_status(self, new_status):
        """
        Enforces valid state transitions from the Cake Reservation state diagram.
        """
        valid_transitions = {
            self.Status.CONFIGURATION: [self.Status.PENDING_APPROVAL],
            self.Status.PENDING_APPROVAL: [self.Status.CONFIRMED, self.Status.REJECTED, self.Status.CANCELLED],
            self.Status.CONFIRMED: [self.Status.COMPLETED],
            self.Status.REJECTED: [self.Status.REFUNDED],
            self.Status.CANCELLED: [self.Status.REFUNDED],
        }
        allowed = valid_transitions.get(self.status, [])
        if new_status not in allowed:
            raise ValueError(
                f"Invalid cake reservation transition: {self.status} → {new_status}. "
                f"Allowed: {allowed}"
            )
        old_status = self.status
        self.status = new_status
        self.save()
        logger.info(
            "CakeReservation #%s transitioned: %s → %s",
            self.pk, old_status, new_status,
        )


# ---------------------------------------------------------------------------
# CakeSizePrice — per-canteen size/price configuration (managed by manager)
# ---------------------------------------------------------------------------
class CakeSizePrice(models.Model):
    """
    Defines available cake sizes and their advance prices for a canteen.
    Managers configure these; the reservation flow validates against them.
    """

    canteen = models.ForeignKey(
        "canteens.Canteen",
        on_delete=models.CASCADE,
        related_name="cake_size_prices",
    )
    size = models.CharField(max_length=50, help_text="e.g., 0.5 kg, 1 kg, 2 kg")
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Advance amount for this size.",
    )
    is_available = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "cakes"
        unique_together = ("canteen", "size")
        ordering = ["price"]

    def __str__(self):
        return f"{self.canteen.name} — {self.size} @ ₹{self.price}"


# ---------------------------------------------------------------------------
# CakeFlavor — per-canteen flavor catalog (managed by manager)
# ---------------------------------------------------------------------------
class CakeFlavor(models.Model):
    """
    Defines available cake flavors (with optional photo) for a canteen.
    Managers configure these; the reservation flow validates against them.
    Photo is stored on disk at files/cake_images/<canteen_id>/<id>.jpg (managed by file_handlers).
    """

    canteen = models.ForeignKey(
        "canteens.Canteen",
        on_delete=models.CASCADE,
        related_name="cake_flavors",
    )
    name = models.CharField(max_length=100)
    is_available = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "cakes"
        unique_together = ("canteen", "name")
        ordering = ["name"]

    def __str__(self):
        return f"{self.canteen.name} — {self.name}"
