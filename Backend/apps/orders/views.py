"""
API views for the orders app.

Thin views delegating to order_service and payment_service.
Maps to Order/phase1–3 sequence diagrams and Order Lifecycle state diagram.
"""

import logging

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.users.models import User
from apps.canteens.models import Canteen
from apps.orders.models import Order
from apps.orders.serializers import (
    OrderSerializer,
    PlaceOrderSerializer,
    OrderActionSerializer,
    RateOrderSerializer,
)
from apps.orders.services import order_service

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Place order — Order/phase2 sequence diagram
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def place_order(request):
    """
    POST /api/orders/place/

    Sequence diagram (Order/phase2):
      FE → placeOrder(userID, items, pinHash)
      → PIN verify → deductFunds → createOrder(PENDING) → notifyManager
    """
    if request.user.role != User.Role.CUSTOMER:
        return Response({"error": "Only customers can place orders"}, status=status.HTTP_403_FORBIDDEN)

    serializer = PlaceOrderSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    try:
        canteen = Canteen.objects.get(pk=data["canteen_id"])
    except Canteen.DoesNotExist:
        return Response({"error": "Canteen not found"}, status=status.HTTP_404_NOT_FOUND)

    try:
        order = order_service.place_order(
            customer_profile=request.user.customer_profile,
            canteen=canteen,
            items=data["items"],
            wallet_pin=data["wallet_pin"],
            notes=data.get("notes", ""),
        )
        return Response(
            {"message": "Order placed successfully", "order": OrderSerializer(order).data},
            status=status.HTTP_201_CREATED,
        )
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# Order detail & history
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def order_detail(request, order_id):
    """
    GET /api/orders/<order_id>/

    Returns order details including items, payment, and status.
    """
    try:
        order = Order.objects.get(pk=order_id)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

    # Authorization check
    user = request.user
    if user.role == User.Role.CUSTOMER and order.customer.user != user:
        return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
    if user.role == User.Role.MANAGER and order.canteen.manager.user != user:
        return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

    return Response(OrderSerializer(order).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def order_history(request):
    """
    GET /api/orders/history/

    viewOrderHistory(): void — from Customer class diagram.
    """
    if request.user.role != User.Role.CUSTOMER:
        return Response({"error": "Only customers have order history"}, status=status.HTTP_403_FORBIDDEN)

    orders = order_service.get_order_history(request.user.customer_profile)
    return Response(OrderSerializer(orders, many=True).data)


# ---------------------------------------------------------------------------
# Manager order actions — Order/phase3 sequence diagram
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def pending_orders(request):
    """
    GET /api/orders/pending/

    viewPendingOrders(): List — from CanteenManager class diagram.
    """
    if request.user.role != User.Role.MANAGER:
        return Response({"error": "Only managers can view pending orders"}, status=status.HTTP_403_FORBIDDEN)

    try:
        canteen = request.user.manager_profile.canteen
    except Exception:
        return Response({"error": "No canteen assigned"}, status=status.HTTP_404_NOT_FOUND)

    orders = order_service.get_pending_orders(canteen)
    return Response(OrderSerializer(orders, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def active_orders(request):
    """
    GET /api/orders/active/

    Returns all orders currently being processed.
    """
    if request.user.role != User.Role.MANAGER:
        return Response({"error": "Only managers can view active orders"}, status=status.HTTP_403_FORBIDDEN)

    try:
        canteen = request.user.manager_profile.canteen
    except Exception:
        return Response({"error": "No canteen assigned"}, status=status.HTTP_404_NOT_FOUND)

    orders = order_service.get_active_orders(canteen)
    return Response(OrderSerializer(orders, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def accept_order(request, order_id):
    """
    POST /api/orders/<order_id>/accept/

    Sequence diagram (Order/phase3, steps 12–15):
      M → acceptOrder(orderID)
      acceptOrder(orderID: Int): void — from CanteenManager class diagram.
    """
    if request.user.role != User.Role.MANAGER:
        return Response({"error": "Only managers can accept orders"}, status=status.HTTP_403_FORBIDDEN)

    try:
        order = Order.objects.get(pk=order_id, canteen__manager=request.user.manager_profile)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

    try:
        order = order_service.accept_order(order)
        return Response(OrderSerializer(order).data)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reject_order(request, order_id):
    """
    POST /api/orders/<order_id>/reject/

    rejectOrder(orderID: Int, reason: String): void — from CanteenManager class diagram.
    Automatically triggers refund processing.
    """
    if request.user.role != User.Role.MANAGER:
        return Response({"error": "Only managers can reject orders"}, status=status.HTTP_403_FORBIDDEN)

    try:
        order = Order.objects.get(pk=order_id, canteen__manager=request.user.manager_profile)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = OrderActionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    try:
        order = order_service.reject_order(order, serializer.validated_data.get("reason", ""))
        return Response(OrderSerializer(order).data)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_ready(request, order_id):
    """
    POST /api/orders/<order_id>/ready/

    Sequence diagram (Order/phase3, steps 20–23):
      M → markOrderReady(orderID)
    """
    if request.user.role != User.Role.MANAGER:
        return Response({"error": "Only managers can mark orders ready"}, status=status.HTTP_403_FORBIDDEN)

    try:
        order = Order.objects.get(pk=order_id, canteen__manager=request.user.manager_profile)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

    try:
        order = order_service.mark_order_ready(order)
        return Response(OrderSerializer(order).data)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_completed(request, order_id):
    """
    POST /api/orders/<order_id>/complete/

    Sequence diagram (Order/phase3, steps 26–32):
      M → markOrderCompleted(orderID)
    """
    if request.user.role != User.Role.MANAGER:
        return Response({"error": "Only managers can complete orders"}, status=status.HTTP_403_FORBIDDEN)

    try:
        order = Order.objects.get(pk=order_id, canteen__manager=request.user.manager_profile)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

    try:
        order = order_service.mark_order_completed(order)
        return Response(OrderSerializer(order).data)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# Dynamic wait time for a specific order
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def order_wait_time(request, order_id):
    """
    GET /api/orders/<order_id>/wait-time/

    Returns the dynamic, personalized wait time for a specific order
    based on its position in the canteen's preparation queue.
    """
    try:
        order = Order.objects.get(pk=order_id)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

    # Authorization: only the customer who owns the order or the canteen manager
    user = request.user
    if user.role == User.Role.CUSTOMER and order.customer.user != user:
        return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
    if user.role == User.Role.MANAGER and order.canteen.manager.user != user:
        return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

    wait_minutes = order.get_dynamic_wait_time()
    return Response({
        "order_id": order.pk,
        "status": order.status,
        "estimated_wait_minutes": wait_minutes,
    })


# ---------------------------------------------------------------------------
# Cancel request flow — customer requests, manager approves/rejects
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def request_cancel_order(request, order_id):
    """
    POST /api/orders/<order_id>/cancel/

    Customer requests cancellation of their PENDING or ACCEPTED order.
    Manager must then approve or reject the request.
    """
    if request.user.role != User.Role.CUSTOMER:
        return Response({"error": "Only customers can request cancellation"}, status=status.HTTP_403_FORBIDDEN)

    try:
        order = Order.objects.get(pk=order_id)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

    try:
        order = order_service.request_cancel(order, request.user.customer_profile)
        return Response(
            {"message": "Cancellation requested — awaiting manager approval", "order": OrderSerializer(order).data},
        )
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def approve_cancel_order(request, order_id):
    """
    POST /api/orders/<order_id>/approve-cancel/

    Manager approves the cancel request → CANCELLED → REFUNDED.
    """
    if request.user.role != User.Role.MANAGER:
        return Response({"error": "Only managers can approve cancellations"}, status=status.HTTP_403_FORBIDDEN)

    try:
        order = Order.objects.get(pk=order_id, canteen__manager=request.user.manager_profile)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

    try:
        order = order_service.approve_cancel(order)
        return Response(OrderSerializer(order).data)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reject_cancel_order(request, order_id):
    """
    POST /api/orders/<order_id>/reject-cancel/

    Manager rejects the cancel request → order reverts to PENDING.
    Customer is notified with the rejection reason.
    """
    if request.user.role != User.Role.MANAGER:
        return Response({"error": "Only managers can reject cancellations"}, status=status.HTTP_403_FORBIDDEN)

    try:
        order = Order.objects.get(pk=order_id, canteen__manager=request.user.manager_profile)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = OrderActionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        order = order_service.reject_cancel(order, serializer.validated_data.get("reason", ""))
        return Response(OrderSerializer(order).data)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# Rate order — post-completion feedback
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def rate_order(request, order_id):
    """
    POST /api/orders/<order_id>/rate/

    Allows a customer to rate dishes in a completed order.
    Accepts per-dish ratings: {"ratings": [{"dish_id": 1, "rating": 5}, ...]}
    Each dish in the order can be rated once.
    """
    if request.user.role != User.Role.CUSTOMER:
        return Response({"error": "Only customers can rate orders"}, status=status.HTTP_403_FORBIDDEN)

    try:
        order = Order.objects.get(pk=order_id)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = RateOrderSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    try:
        order = order_service.rate_order(
            order=order,
            customer_profile=request.user.customer_profile,
            ratings=serializer.validated_data["ratings"],
        )
        return Response(
            {"message": "Order rated successfully", "order": OrderSerializer(order).data},
        )
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# Manager order history
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def manager_order_history(request):
    """
    GET /api/orders/manager-history/

    Returns full order history for the manager's canteen.
    """
    if request.user.role != User.Role.MANAGER:
        return Response({"error": "Only managers can view canteen order history"}, status=status.HTTP_403_FORBIDDEN)

    try:
        canteen = request.user.manager_profile.canteen
    except Exception:
        return Response({"error": "No canteen assigned"}, status=status.HTTP_404_NOT_FOUND)

    orders = order_service.get_manager_order_history(canteen)
    return Response(OrderSerializer(orders, many=True).data)

