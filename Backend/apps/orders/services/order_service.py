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
from apps.orders.services import payment_service

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
    # Validate canteen is accepting orders
    from apps.canteens.models import Canteen
    if canteen.status not in (Canteen.Status.OPEN, Canteen.Status.BUSY):
        raise ValueError(
            f"Canteen '{canteen.name}' is not currently accepting orders "
            f"(status: {canteen.get_status_display()})"
        )

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

    # Verify PIN + deduct funds via payment service
    payment_service.validate_and_deduct_funds(customer_profile, total, wallet_pin)

    # Create order using the class diagram method
    order = Order.create_order(
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
    # TODO: notify("Order Accepted") — push notification
    return order


def reject_order(order, reason=""):
    """
    Manager rejects an order — triggers refund.

    Sequence diagram (Cake/phase3, steps 24–32 — same pattern for regular orders):
      M → rejectOrder(orderID, reason)
      BE → processRefund(userID, amount)
      BE → updateOrderStatus(orderID, "REJECTED")
    """
    order.reject_reason = reason
    order.save(update_fields=["reject_reason"])

    order.update_order_status(Order.Status.REJECTED)

    # Process automatic refund via payment service
    payment_service.process_refund(order.payment)
    order.update_order_status(Order.Status.REFUNDED)

    logger.info("Order #%s rejected and refunded. Reason: %s", order.pk, reason)
    return order


def request_cancel(order, customer_profile):
    """
    Customer requests cancellation of their order.

    State diagram: PENDING/ACCEPTED → CANCEL_REQUESTED
    Manager must then approve or reject the cancel request.
    """
    if order.customer != customer_profile:
        raise ValueError("You can only cancel your own orders")

    if order.status not in (Order.Status.PENDING, Order.Status.ACCEPTED):
        raise ValueError(
            f"Only PENDING or ACCEPTED orders can be cancelled "
            f"(current: {order.get_status_display()})"
        )

    order.update_order_status(Order.Status.CANCEL_REQUESTED)
    logger.info("Order #%s cancel requested by customer", order.pk)
    # TODO: notify manager about cancel request
    return order


@transaction.atomic
def approve_cancel(order):
    """
    Manager approves the customer's cancel request.

    State diagram: CANCEL_REQUESTED → CANCELLED → REFUNDED
    """
    if order.status != Order.Status.CANCEL_REQUESTED:
        raise ValueError(
            f"Only CANCEL_REQUESTED orders can be approved for cancellation "
            f"(current: {order.get_status_display()})"
        )

    order.update_order_status(Order.Status.CANCELLED)

    # Process refund via payment service
    payment_service.process_refund(order.payment)
    order.update_order_status(Order.Status.REFUNDED)

    logger.info("Order #%s cancel approved by manager and refunded", order.pk)
    # TODO: notify customer — "Your cancellation has been approved and refunded"
    return order


def reject_cancel(order, reason=""):
    """
    Manager rejects the customer's cancel request — order reverts to PENDING.

    State diagram: CANCEL_REQUESTED → PENDING
    Customer should be notified that their cancel request was denied.
    """
    if order.status != Order.Status.CANCEL_REQUESTED:
        raise ValueError(
            f"Only CANCEL_REQUESTED orders can have cancellation rejected "
            f"(current: {order.get_status_display()})"
        )

    order.cancel_rejection_reason = reason
    order.save(update_fields=["cancel_rejection_reason"])

    order.update_order_status(Order.Status.PENDING)

    logger.info(
        "Order #%s cancel request denied by manager. Reason: %s",
        order.pk, reason,
    )
    # TODO: notify customer — "Your cancellation request was denied: {reason}"
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
    # TODO: notify("Your Order is Ready!") — push notification
    return order


@transaction.atomic
def mark_order_completed(order):
    """
    Sequence diagram (Order/phase3, steps 26–32):
      M → markOrderCompleted(orderID)
      BE → updateOrderStatus(orderID, "COMPLETED")
      BE → addToOrderHistory(orderID)
      BE → creditManagerEarnings(amount)

    State diagram: PickUpReady → Completed
    """
    order.update_order_status(Order.Status.COMPLETED)

    # Credit earnings to canteen manager wallet
    from apps.users.services.profile_service import credit_to_manager
    payment = order.payment
    credit_to_manager(order.canteen.manager, payment.amount)

    # Add to order history (class diagram method)
    order.add_to_order_history()

    logger.info("Order #%s completed — ₹%s credited to manager", order.pk, payment.amount)
    return order


def get_order_history(customer_profile):
    """
    viewOrderHistory(): void — from Customer class diagram.
    Returns all terminal-state orders for a customer.
    """
    return Order.objects.filter(
        customer=customer_profile,
        status__in=[
            Order.Status.COMPLETED,
            Order.Status.REFUNDED,
            Order.Status.CANCELLED,
            Order.Status.REJECTED,
        ],
    )


def get_manager_order_history(canteen):
    """
    Returns full order history for a canteen (all statuses),
    ordered by most recent first.
    """
    return Order.objects.filter(canteen=canteen)


def rate_order(order, customer_profile, rating, review_text=""):
    """
    Rate a completed order.

    Creates a DishReview for each dish in the order and marks
    the order as rated so it cannot be rated again.
    """
    if order.customer != customer_profile:
        raise ValueError("You can only rate your own orders")

    if order.status != Order.Status.COMPLETED:
        raise ValueError("Only completed orders can be rated")

    if order.is_rated:
        raise ValueError("This order has already been rated")

    from apps.canteens.services import menu_service

    for item in order.items.select_related("dish"):
        menu_service.add_review(
            dish=item.dish,
            customer_profile=customer_profile,
            rating=rating,
            review_text=review_text,
        )

    order.is_rated = True
    order.save(update_fields=["is_rated"])

    logger.info("Order #%s rated %d★ by %s", order.pk, rating, customer_profile.user.email)
    return order


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

