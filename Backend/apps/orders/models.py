"""
Order and Payment models for the SkipQ system.

Maps to class diagram entities:
  - Order   → id, customerId, dishId, status, bookTime, receiveTime
  - Payment → id, orderId, amount, status

State diagram reference (Order Lifecycle):
  Cart → Authenticating (PIN) → Processing (FundCheck → Deduction/PaymentGateway
  → OrderCreated) → UnderReview (Accepted/Rejected) → Preparing → PickUpReady
  → Completed  |  Rejected → Refunded

Sequence diagram references:
  Order/phase1 — estimation / wait time
  Order/phase2 — secure payment (PIN verify, deductFunds, createOrder)
  Order/phase3 — canteen operations (accept, ready, completed)
"""

import logging
from django.db import models

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Order (class diagram entity)
# ---------------------------------------------------------------------------
class Order(models.Model):
    """
    Order entity from the class diagram.

    Attributes mapped:
      - id: Int              → auto PK
      - customerId: Int      → FK to CustomerProfile
      - status: String       → choices (lifecycle states)
      - bookTime: DateTime   → auto_now_add
      - receiveTime: DateTime → set when completed

    The dishId from the class diagram is implemented as a M2M through OrderItem
    to support multiple dishes per order.
    """

    class Status(models.TextChoices):
        # From Order Lifecycle state diagram
        PENDING = "PENDING", "Pending"                      # OrderCreated
        ACCEPTED = "ACCEPTED", "Accepted"                   # Manager accepted
        READY = "READY", "Ready for Pickup"                 # PickUpReady
        COMPLETED = "COMPLETED", "Completed"                # Picked up
        REJECTED = "REJECTED", "Rejected"                   # Manager rejected
        REFUNDED = "REFUNDED", "Refunded"                   # After rejection → refund
        CANCEL_REQUESTED = "CANCEL_REQUESTED", "Cancel Requested"  # Customer requests cancellation
        CANCELLED = "CANCELLED", "Cancelled"                 # Manager approved cancellation
        # Cake-specific states (from Cake Reservation state diagram)
        PENDING_APPROVAL = "PENDING_APPROVAL", "Pending Approval"
        CONFIRMED = "CONFIRMED", "Confirmed"

    customer = models.ForeignKey(
        "users.CustomerProfile",
        on_delete=models.CASCADE,
        related_name="orders",
        help_text="Maps to customerId in class diagram.",
    )
    canteen = models.ForeignKey(
        "canteens.Canteen",
        on_delete=models.CASCADE,
        related_name="orders",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        help_text="Current state — from Order Lifecycle state diagram.",
    )
    book_time = models.DateTimeField(auto_now_add=True)
    receive_time = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Set when order is marked COMPLETED.",
    )
    # Special instructions from the customer
    notes = models.TextField(blank=True)
    reject_reason = models.TextField(
        blank=True,
        help_text="Reason provided by manager when order is rejected.",
    )
    cancel_rejection_reason = models.TextField(
        blank=True,
        help_text="Reason provided by manager when cancel request is denied.",
    )

    class Meta:
        app_label = "orders"
        ordering = ["-book_time"]

    def __str__(self):
        return f"Order #{self.pk} — {self.get_status_display()}"

    # --- Methods from class diagram ---

    def update_order_status(self, new_status):
        """
        updateOrderStatus(status: String): void

        Enforces valid state transitions from the Order Lifecycle state diagram.
        """
        valid_transitions = {
            self.Status.PENDING: [
                self.Status.ACCEPTED,
                self.Status.REJECTED,
                self.Status.CANCEL_REQUESTED,
            ],
            self.Status.CANCEL_REQUESTED: [
                self.Status.CANCELLED,   # Manager approves cancellation
                self.Status.PENDING,     # Manager rejects cancellation → back to PENDING
            ],
            self.Status.PENDING_APPROVAL: [self.Status.CONFIRMED, self.Status.REJECTED],
            self.Status.ACCEPTED: [self.Status.READY, self.Status.CANCEL_REQUESTED],
            self.Status.CONFIRMED: [self.Status.READY],
            self.Status.READY: [self.Status.COMPLETED],
            self.Status.REJECTED: [self.Status.REFUNDED],
            self.Status.CANCELLED: [self.Status.REFUNDED],
        }
        allowed = valid_transitions.get(self.status, [])
        if new_status not in allowed:
            raise ValueError(
                f"Invalid transition: {self.status} → {new_status}. "
                f"Allowed: {allowed}"
            )
        old_status = self.status
        self.status = new_status
        if new_status == self.Status.COMPLETED:
            from django.utils import timezone
            self.receive_time = timezone.now()
        self.save()
        logger.info(
            "Order #%s transitioned: %s → %s",
            self.pk, old_status, new_status,
        )

    def calculate_total(self):
        """
        calculateTotal(items: List): Float

        Sums OrderItem prices × quantities, applying discounts.
        """
        total = sum(
            item.price_at_order * item.quantity
            for item in self.items.all()
        )
        return total

    # --- Class diagram methods ---

    @classmethod
    def create_order(cls, customer, canteen, status=None, notes=""):
        """
        createOrder(status: String): Order — from class diagram.
        Wraps Order.objects.create() for reuse across code paths.
        """
        if status is None:
            status = cls.Status.PENDING
        return cls.objects.create(
            customer=customer,
            canteen=canteen,
            status=status,
            notes=notes,
        )

    # TODO: implement this wherever required like active orders for canteen dashboard
    @classmethod
    def query_active_orders(cls, canteen):
        """
        queryActiveOrders(canteenId: Int): List — from class diagram.
        Returns orders currently being processed for a canteen.
        """
        return cls.objects.filter(
            canteen=canteen,
            status__in=[cls.Status.PENDING, cls.Status.ACCEPTED, cls.Status.READY],
        )

    @classmethod
    def place_order(cls, customer, canteen, items, wallet_pin, notes=""):
        """
        placeOrder(customerId: Int, dishId: Int): Bool — from class diagram.
        Delegates to order_service.place_order() for the full workflow.
        """
        from apps.orders.services.order_service import place_order
        return place_order(customer, canteen, items, wallet_pin, notes)

    def add_to_order_history(self):
        """
        addToOrderHistory(): void — from class diagram.
        Hook called when an order is completed. Currently logs the event;
        can be extended for audit trails or archive tables.
        """
        logger.info(
            "Order #%s added to history for customer %s",
            self.pk, self.customer.user.email,
        )


# ---------------------------------------------------------------------------
# OrderItem — junction table for Order ↔ Dish (M2M with quantity)
# ---------------------------------------------------------------------------
class OrderItem(models.Model):
    """
    Represents a single line item in an order.
    The class diagram shows dishId on Order; we normalize this into a
    through-table to support multiple dishes per order.
    """

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
    )
    dish = models.ForeignKey(
        "canteens.Dish",
        on_delete=models.CASCADE,
        related_name="order_items",
    )
    quantity = models.PositiveIntegerField(default=1)
    price_at_order = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        help_text="Effective price at time of order (after discount).",
    )

    class Meta:
        app_label = "orders"

    def __str__(self):
        return f"{self.quantity}× {self.dish.name} in Order #{self.order.pk}"


# ---------------------------------------------------------------------------
# Payment (class diagram entity)
# ---------------------------------------------------------------------------
class Payment(models.Model):
    """
    Payment entity from the class diagram.

    Attributes mapped:
      - id: Int          → auto PK
      - orderId: Int     → FK to Order
      - amount: Float    → DecimalField
      - status: String   → choices

    Methods mapped:
      - authorizePayment()        → via payment_service
      - processPayment()          → via payment_service
      - processRefund()           → via payment_service
      - validateAndDeductFunds()  → via payment_service

    State transitions:
      PENDING → COMPLETED  (successful payment)
      COMPLETED → REFUNDED (order rejected → automatic refund)
    """

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        COMPLETED = "COMPLETED", "Completed"
        REFUNDED = "REFUNDED", "Refunded"

    order = models.OneToOneField(
        Order,
        on_delete=models.CASCADE,
        related_name="payment",
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "orders"

    def __str__(self):
        return f"Payment #{self.pk} — ₹{self.amount} ({self.get_status_display()})"
