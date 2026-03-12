"""
Order service for the SkipQ system.

Implements workflows from:
  - Order/phase1 sequence diagram → wait time estimation
  - Order/phase2 sequence diagram → place order (PIN verify, deduct, create)
  - Order/phase3 sequence diagram → accept, ready, complete
  - Order Lifecycle state diagram → all state transitions
"""

import logging
from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from apps.orders.models import Order, OrderItem, Payment
from apps.users.services.auth_service import verify_wallet_pin
from apps.users.services.profile_service import deduct_funds, refund_to_wallet

logger = logging.getLogger(__name__)


def get_estimated_wait_time(canteen):
    """
    Sequence diagram (Order/phase1, steps 14–17):
      FE → getEstimatedWaitTime(canteenID)
      BE → queryActiveOrders(canteenID)
      return waitTime (e.g., "15 mins")
    """
    return canteen.get_estimated_wait_time()


@transaction.atomic
def place_order(customer_profile, canteen, items, wallet_pin, notes=""):
    """
    Sequence diagram (Order/phase2):
      1. FE → placeOrder(userID, items, pinHash)
      2. BE → verifyWalletPIN(userID, pinHash)
      3. BE → deductFunds(userID, totalAmount)
      4. BE → createOrder(status="PENDING")
      5. BE → notifyNewOrder(orderDetails)

    State diagram (Order Lifecycle):
      Cart → Authenticating → Processing → OrderCreated (PENDING)

    Args:
        customer_profile: CustomerProfile instance
        canteen: Canteen instance
        items: list of dicts [{"dish_id": int, "quantity": int}, ...]
        wallet_pin: plaintext PIN for verification
        notes: optional order notes
    """
    # Step 2: Verify wallet PIN
    if not verify_wallet_pin(customer_profile.wallet_pin_hash, wallet_pin):
        raise ValueError("Incorrect wallet PIN")

    # Calculate total
    from apps.canteens.models import Dish
    total = Decimal("0.00")
    order_items_data = []

    for item_data in items:
        dish = Dish.objects.get(pk=item_data["dish_id"])
        if not dish.is_available:
            raise ValueError(f"Dish '{dish.name}' is currently unavailable")
        if dish.canteen_id != canteen.pk:
            raise ValueError(f"Dish '{dish.name}' does not belong to this canteen")

        effective_price = dish.get_effective_price()
        quantity = item_data.get("quantity", 1)
        total += effective_price * quantity
        order_items_data.append({
            "dish": dish,
            "quantity": quantity,
            "price_at_order": effective_price,
        })

    # Step 3: Deduct funds
    deduct_funds(customer_profile, total)

    # Step 4: Create order
    order = Order.objects.create(
        customer=customer_profile,
        canteen=canteen,
        status=Order.Status.PENDING,
        notes=notes,
    )

    for item_data in order_items_data:
        OrderItem.objects.create(
            order=order,
            dish=item_data["dish"],
            quantity=item_data["quantity"],
            price_at_order=item_data["price_at_order"],
        )

    # Create payment record
    Payment.objects.create(
        order=order,
        amount=total,
        status=Payment.Status.COMPLETED,
    )

    logger.info(
        "Order #%s placed by %s at '%s' — total ₹%s",
        order.pk, customer_profile.user.email, canteen.name, total,
    )

    # Step 5: Notification would be sent here (TODO: WebSocket / push notification)
    return order


def accept_order(order):
    """
    Sequence diagram (Order/phase3, steps 12–15):
      M → acceptOrder(orderID)
      BE → updateOrderStatus(orderID, "ACCEPTED")
      BE → notify("Order Accepted")

    State diagram: UnderReview → Accepted
    """
    order.update_order_status(Order.Status.ACCEPTED)
    logger.info("Order #%s accepted by manager", order.pk)
    return order


def reject_order(order, reason=""):
    """
    Manager rejects an order — triggers refund.

    Sequence diagram (Cake/phase3, steps 24–32 — same pattern for regular orders):
      M → rejectOrder(orderID, reason)
      BE → processRefund(userID, amount)
      BE → updateOrderStatus(orderID, "REJECTED")
    """
    order.update_order_status(Order.Status.REJECTED)

    # Process automatic refund
    payment = order.payment
    refund_to_wallet(order.customer, payment.amount)
    payment.status = Payment.Status.REFUNDED
    payment.save()
    order.update_order_status(Order.Status.REFUNDED)

    logger.info("Order #%s rejected and refunded. Reason: %s", order.pk, reason)
    return order


def mark_order_ready(order):
    """
    Sequence diagram (Order/phase3, steps 20–23):
      M → markOrderReady(orderID)
      BE → updateOrderStatus(orderID, "READY")
      BE → notify("Your Order is Ready!")

    State diagram: Preparing → PickUpReady
    """
    order.update_order_status(Order.Status.READY)
    logger.info("Order #%s marked as ready for pickup", order.pk)
    return order


def mark_order_completed(order):
    """
    Sequence diagram (Order/phase3, steps 26–32):
      M → markOrderCompleted(orderID)
      BE → updateOrderStatus(orderID, "COMPLETED")
      BE → addToOrderHistory(orderID)

    State diagram: PickUpReady → Completed
    """
    order.update_order_status(Order.Status.COMPLETED)
    logger.info("Order #%s completed", order.pk)
    return order


def get_order_history(customer_profile):
    """
    viewOrderHistory(): void — from Customer class diagram.
    Returns all completed orders for a customer.
    """
    return Order.objects.filter(
        customer=customer_profile,
        status__in=[Order.Status.COMPLETED, Order.Status.REFUNDED],
    )


def get_pending_orders(canteen):
    """
    viewPendingOrders(): List — from CanteenManager class diagram.
    Returns all pending orders for a canteen.
    """
    return Order.objects.filter(
        canteen=canteen,
        status__in=[Order.Status.PENDING, Order.Status.PENDING_APPROVAL],
    )


def get_active_orders(canteen):
    """
    queryActiveOrders(canteenId: Int): List — from Order class diagram.
    Returns orders currently being processed.
    """
    return Order.objects.filter(
        canteen=canteen,
        status__in=[Order.Status.PENDING, Order.Status.ACCEPTED, Order.Status.READY],
    )
