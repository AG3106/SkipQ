"""
API views for the canteens app.

Thin views that delegate to canteen_service and menu_service.
"""

import logging

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.users.models import User
from apps.canteens.models import Canteen, Dish
from apps.canteens.serializers import (
    CanteenSerializer,
    CanteenRegistrationSerializer,
    CanteenStatusUpdateSerializer,
    DishSerializer,
    DishCreateUpdateSerializer,
    AddReviewSerializer,
    CanteenHolidaySerializer,
)
from apps.canteens.services import canteen_service, menu_service

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Canteen listing & detail (public)
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([AllowAny])
def canteen_list(request):
    """
    GET /api/canteens/

    searchCanteen(): void — from Customer class diagram.
    Lists all active canteens.
    """
    canteens = Canteen.objects.filter(
        status__in=[Canteen.Status.ACTIVE, Canteen.Status.OPEN, Canteen.Status.BUSY]
    )
    return Response(CanteenSerializer(canteens, many=True).data)


@api_view(["GET"])
@permission_classes([AllowAny])
def canteen_detail(request, canteen_id):
    """
    GET /api/canteens/<canteen_id>/

    Returns canteen details including menu, schedule, estimated wait time.
    """
    try:
        canteen = Canteen.objects.get(pk=canteen_id)
    except Canteen.DoesNotExist:
        return Response({"error": "Canteen not found"}, status=status.HTTP_404_NOT_FOUND)
    return Response(CanteenSerializer(canteen).data)


# ---------------------------------------------------------------------------
# Canteen registration — NewCanteen/phase1 sequence diagram
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def register_canteen(request):
    """
    POST /api/canteens/register/

    Sequence diagram (NewCanteen/phase1, steps 12–16):
      M → Submit Registration (Docs, Location, Menu)
      FE → submitRequest()
      BE → createEntry(status="UNDER_REVIEW")

    submitRequest(): void — from CanteenManager class diagram.
    """
    if request.user.role != User.Role.MANAGER:
        return Response({"error": "Only managers can register canteens"}, status=status.HTTP_403_FORBIDDEN)

    serializer = CanteenRegistrationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    try:
        canteen = canteen_service.submit_canteen_registration(
            manager_profile=request.user.manager_profile,
            **serializer.validated_data,
        )
        return Response(
            {"message": "Registration submitted", "canteen": CanteenSerializer(canteen).data},
            status=status.HTTP_201_CREATED,
        )
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# Canteen operational status — Canteen Operational state diagram
# ---------------------------------------------------------------------------

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_canteen_status(request, canteen_id):
    """
    PATCH /api/canteens/<canteen_id>/status/

    updateCanteenStatus(): void — from CanteenManager class diagram.
    Implements Canteen Operational state diagram transitions.
    """
    if request.user.role != User.Role.MANAGER:
        return Response({"error": "Only managers can update status"}, status=status.HTTP_403_FORBIDDEN)
    try:
        canteen = Canteen.objects.get(pk=canteen_id, manager=request.user.manager_profile)
    except Canteen.DoesNotExist:
        return Response({"error": "Canteen not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = CanteenStatusUpdateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    try:
        canteen = canteen_service.update_canteen_operational_status(
            canteen, serializer.validated_data["status"],
        )
        return Response(CanteenSerializer(canteen).data)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# Menu management — Canteen & Dish class diagram methods
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([AllowAny])
def canteen_menu(request, canteen_id):
    """
    GET /api/canteens/<canteen_id>/menu/

    getMenu(): List — from Canteen class diagram.
    """
    try:
        canteen = Canteen.objects.get(pk=canteen_id)
    except Canteen.DoesNotExist:
        return Response({"error": "Canteen not found"}, status=status.HTTP_404_NOT_FOUND)

    dishes = menu_service.get_menu(canteen)
    return Response(DishSerializer(dishes, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_dish(request, canteen_id):
    """
    POST /api/canteens/<canteen_id>/menu/

    updateMenu(dish: Dish): void — from Canteen class diagram.
    """
    if request.user.role != User.Role.MANAGER:
        return Response({"error": "Only managers can add dishes"}, status=status.HTTP_403_FORBIDDEN)
    try:
        canteen = Canteen.objects.get(pk=canteen_id, manager=request.user.manager_profile)
    except Canteen.DoesNotExist:
        return Response({"error": "Canteen not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = DishCreateUpdateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    dish = menu_service.add_dish(canteen, **serializer.validated_data)
    return Response(DishSerializer(dish).data, status=status.HTTP_201_CREATED)


@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def manage_dish(request, dish_id):
    """
    PATCH/DELETE /api/canteens/dishes/<dish_id>/

    updateDishDetails() / toggleAvailability() — from Dish class diagram.
    """
    if request.user.role != User.Role.MANAGER:
        return Response({"error": "Only managers can manage dishes"}, status=status.HTTP_403_FORBIDDEN)
    try:
        dish = Dish.objects.get(pk=dish_id, canteen__manager=request.user.manager_profile)
    except Dish.DoesNotExist:
        return Response({"error": "Dish not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "DELETE":
        dish.delete()
        return Response({"message": "Dish deleted"}, status=status.HTTP_204_NO_CONTENT)

    serializer = DishCreateUpdateSerializer(dish, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(DishSerializer(dish).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_dish_availability(request, dish_id):
    """
    POST /api/canteens/dishes/<dish_id>/toggle/

    toggleAvailability(): void — from Dish class diagram.
    """
    if request.user.role != User.Role.MANAGER:
        return Response({"error": "Only managers can toggle availability"}, status=status.HTTP_403_FORBIDDEN)
    try:
        dish = Dish.objects.get(pk=dish_id, canteen__manager=request.user.manager_profile)
    except Dish.DoesNotExist:
        return Response({"error": "Dish not found"}, status=status.HTTP_404_NOT_FOUND)

    dish.toggle_availability()
    return Response(DishSerializer(dish).data)


# ---------------------------------------------------------------------------
# Reviews — Customer class diagram: rateAndReview()
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_review(request, dish_id):
    """
    POST /api/canteens/dishes/<dish_id>/review/

    rateAndReview(rate: Int, review: String): void — from Customer class diagram.
    """
    if request.user.role != User.Role.CUSTOMER:
        return Response({"error": "Only customers can review"}, status=status.HTTP_403_FORBIDDEN)
    try:
        dish = Dish.objects.get(pk=dish_id)
    except Dish.DoesNotExist:
        return Response({"error": "Dish not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = AddReviewSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    try:
        review = menu_service.add_review(
            dish, request.user.customer_profile, **serializer.validated_data,
        )
        from apps.canteens.serializers import DishReviewSerializer
        return Response(DishReviewSerializer(review).data, status=status.HTTP_201_CREATED)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# Holidays — Canteen schedule management
# ---------------------------------------------------------------------------

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def manage_holidays(request, canteen_id):
    """
    GET/POST /api/canteens/<canteen_id>/holidays/

    getHolidays(): List — from Canteen class diagram.
    """
    try:
        canteen = Canteen.objects.get(pk=canteen_id)
    except Canteen.DoesNotExist:
        return Response({"error": "Canteen not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        holidays = canteen_service.get_holidays(canteen)
        return Response(CanteenHolidaySerializer(holidays, many=True).data)

    # POST — add holiday
    if request.user.role != User.Role.MANAGER:
        return Response({"error": "Only managers can add holidays"}, status=status.HTTP_403_FORBIDDEN)
    serializer = CanteenHolidaySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    try:
        holiday = canteen_service.add_holiday(canteen, **serializer.validated_data)
        return Response(CanteenHolidaySerializer(holiday).data, status=status.HTTP_201_CREATED)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([AllowAny])
def estimated_wait_time(request, canteen_id):
    """
    GET /api/canteens/<canteen_id>/wait-time/

    getEstimatedWaitTime(): Time — from Canteen class diagram.
    Sequence diagram (Order/phase1): getEstimatedWaitTime(canteenID)
    """
    try:
        canteen = Canteen.objects.get(pk=canteen_id)
    except Canteen.DoesNotExist:
        return Response({"error": "Canteen not found"}, status=status.HTTP_404_NOT_FOUND)

    wait_time = canteen.get_estimated_wait_time()
    return Response({"wait_time_minutes": wait_time})


# ---------------------------------------------------------------------------
# Documents retrieval — Canteen class diagram: getDocuments()
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def canteen_documents(request, canteen_id):
    """
    GET /api/canteens/<canteen_id>/documents/

    getDocuments(): List — from Canteen class diagram.
    Used by Admin during canteen verification (NewCanteen sequence diagram).
    """
    try:
        canteen = Canteen.objects.get(pk=canteen_id)
    except Canteen.DoesNotExist:
        return Response({"error": "Canteen not found"}, status=status.HTTP_404_NOT_FOUND)

    # Only manager of this canteen or admin can view documents
    user = request.user
    if user.role == User.Role.MANAGER:
        if canteen.manager.user != user:
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
    elif user.role != User.Role.ADMIN:
        return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

    document_url = canteen.documents.url if canteen.documents else None
    return Response({
        "canteen_id": canteen.pk,
        "canteen_name": canteen.name,
        "document_url": document_url,
        "status": canteen.status,
    })


# ---------------------------------------------------------------------------
# Lead time config — Canteen class diagram: getLeadTimeConfig()
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([AllowAny])
def lead_time_config(request, canteen_id):
    """
    GET /api/canteens/<canteen_id>/lead-time/

    getLeadTimeConfig(): Int — from Canteen class diagram.
    Returns the minimum advance hours required for cake reservations.
    """
    try:
        canteen = Canteen.objects.get(pk=canteen_id)
    except Canteen.DoesNotExist:
        return Response({"error": "Canteen not found"}, status=status.HTTP_404_NOT_FOUND)

    return Response({
        "canteen_id": canteen.pk,
        "lead_time_hours": canteen.lead_time_config,
    })


# ---------------------------------------------------------------------------
# Manager dashboard — CanteenManager class diagram methods
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def manager_dashboard(request):
    """
    GET /api/canteens/manager/dashboard/

    Implements multiple CanteenManager class diagram methods:
      - manageCanteen(canteen: Canteen): void
      - viewEarningStats(): void
      - manageOrderQueue(): void
    """
    if request.user.role != User.Role.MANAGER:
        return Response({"error": "Only managers"}, status=status.HTTP_403_FORBIDDEN)

    try:
        canteen = request.user.manager_profile.canteen
    except Exception:
        return Response({"error": "No canteen assigned"}, status=status.HTTP_404_NOT_FOUND)

    from apps.orders.models import Order, Payment
    from django.db.models import Sum, Count

    # viewEarningStats(): void — earnings breakdown
    completed_payments = Payment.objects.filter(
        order__canteen=canteen,
        status=Payment.Status.COMPLETED,
    )
    total_earnings = completed_payments.aggregate(total=Sum("amount"))["total"] or 0
    total_completed = completed_payments.count()

    # manageOrderQueue(): void — current queue status
    from apps.orders.services.order_service import get_pending_orders, get_active_orders
    pending_count = get_pending_orders(canteen).count()
    active_count = get_active_orders(canteen).count()

    # manageCanteen status overview
    return Response({
        "canteen": CanteenSerializer(canteen).data,
        "earnings": {
            "total_revenue": str(total_earnings),
            "completed_orders": total_completed,
        },
        "queue": {
            "pending_orders": pending_count,
            "active_orders": active_count,
            "estimated_wait_minutes": canteen.get_estimated_wait_time(),
        },
    })
