"""
API views for the canteens app.

Thin views that delegate to canteen_service and menu_service.
"""

import os
import logging

from django.http import FileResponse, Http404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
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
    CanteenHolidaySerializer,
    PopularDishSerializer,
)
from apps.canteens.services import canteen_service, menu_service
from apps.canteens.utils.file_handlers import (
    save_canteen_image,
    save_dish_image,
    save_canteen_document,
    get_canteen_documents,
    get_document_path,
)

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
@parser_classes([MultiPartParser, FormParser, JSONParser])
def register_canteen(request):
    """
    POST /api/canteens/register/  (multipart/form-data)

    Register a new canteen for review by an admin.

    Upload instructions (multipart/form-data):
    ─────────────────────────────────────────────
    Text fields:
      • name            (required)  — Canteen name
      • location        (required)  — Physical location
      • opening_time    (required)  — HH:MM format
      • closing_time    (required)  — HH:MM format

    File fields:
      • image               (optional) — Canteen cover photo.
                               Accepts JPEG, PNG, WEBP, BMP, etc.
                               Automatically converted to JPEG and saved
                               as files/canteen_images/<canteen_id>.jpg
      • aadhar_card          (required) — Aadhar card of the canteen manager.
                               Saved as files/documents/<canteen_id>/aadhar_card.<ext>
      • hall_approval_form   (required) — Hall Approval Form.
                               Saved as files/documents/<canteen_id>/hall_approval_form.<ext>

    Example curl:
      curl -X POST http://localhost:8000/api/canteens/register/ \
        -b cookies.txt \
        -F "name=My Canteen" \
        -F "location=Hall 5" \
        -F "opening_time=08:00" \
        -F "closing_time=22:00" \
        -F "image=@/path/to/photo.png" \
        -F "aadhar_card=@/path/to/aadhar.pdf" \
        -F "hall_approval_form=@/path/to/approval.pdf"
    """
    if request.user.role != User.Role.MANAGER:
        return Response({"error": "Only managers can register canteens"}, status=status.HTTP_403_FORBIDDEN)

    serializer = CanteenRegistrationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    # Pop file fields — they are saved to disk after canteen creation
    validated = serializer.validated_data
    image_file = validated.pop("image", None)
    aadhar_file = validated.pop("aadhar_card", None)
    hall_form_file = validated.pop("hall_approval_form", None)

    try:
        canteen = canteen_service.submit_canteen_registration(
            manager_profile=request.user.manager_profile,
            **validated,
        )

        # Save files to structured files/ directory using canteen PK
        if image_file:
            save_canteen_image(canteen.pk, image_file)
        if aadhar_file:
            save_canteen_document(canteen.pk, "aadhar_card", aadhar_file)
        if hall_form_file:
            save_canteen_document(canteen.pk, "hall_approval_form", hall_form_file)

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
@parser_classes([MultiPartParser, FormParser, JSONParser])
def add_dish(request, canteen_id):
    """
    POST /api/canteens/<canteen_id>/menu/add/  (multipart/form-data or JSON)

    Add a new dish to a canteen's menu.

    File fields (multipart/form-data):
      • image  (optional) — Dish photo. Accepts JPEG, PNG, WEBP, BMP, etc.
                            Converted to JPEG → saved as files/dish_images/<dish_id>.jpg

    Example curl:
      curl -X POST http://localhost:8000/api/canteens/1/menu/add/ \
        -b cookies.txt \
        -F "name=Paneer Tikka" -F "price=120.00" -F "category=North Indian" \
        -F "image=@/path/to/dish_photo.png"
    """
    if request.user.role != User.Role.MANAGER:
        return Response({"error": "Only managers can add dishes"}, status=status.HTTP_403_FORBIDDEN)
    try:
        canteen = Canteen.objects.get(pk=canteen_id, manager=request.user.manager_profile)
    except Canteen.DoesNotExist:
        return Response({"error": "Canteen not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = DishCreateUpdateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    # Pop fields not accepted by menu_service.add_dish()
    image_file = serializer.validated_data.pop("photo", None)
    # Also accept 'image' as field name from multipart form
    if image_file is None:
        image_file = request.FILES.get("image")
    serializer.validated_data.pop("is_available", None)
    dish = menu_service.add_dish(canteen, **serializer.validated_data)

    if image_file:
        save_dish_image(dish.pk, image_file)

    return Response(DishSerializer(dish).data, status=status.HTTP_201_CREATED)


@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def manage_dish(request, dish_id):
    """
    PATCH/DELETE /api/canteens/dishes/<dish_id>/  (multipart/form-data for PATCH)

    Update or delete a dish.

    PATCH file fields (multipart/form-data):
      • image  (optional) — New dish photo. Accepts JPEG, PNG, WEBP, BMP, etc.
                            Converted to JPEG → saved as files/dish_images/<dish_id>.jpg

    Example curl:
      curl -X PATCH http://localhost:8000/api/canteens/dishes/5/ \
        -b cookies.txt \
        -F "price=150.00" -F "image=@/path/to/new_photo.png"
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

    # Save image to disk if provided (accept both 'photo' and 'image' field names)
    image_file = serializer.validated_data.pop("photo", None)
    if image_file is None:
        image_file = request.FILES.get("image")
    serializer.save()
    if image_file:
        save_dish_image(dish.pk, image_file)

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
# Popular dishes — global ranking
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([AllowAny])
def popular_dishes(request):
    """
    GET /api/canteens/dishes/popular/

    Returns a globally ranked list of popular dishes across all canteens,
    sorted by rating (highest first).

    Query params:
      - limit (int, default 20, max 50)
      - category (string, optional)
      - available_only (bool, default true)
    """
    try:
        limit = int(request.query_params.get("limit", 20))
    except (ValueError, TypeError):
        limit = 20

    category = request.query_params.get("category", None)
    available_only = request.query_params.get("available_only", "true").lower() != "false"

    dishes = menu_service.get_popular_dishes(
        limit=limit,
        category=category,
        available_only=available_only,
    )
    return Response(PopularDishSerializer(dishes, many=True).data)


@api_view(["GET"])
@permission_classes([AllowAny])
def canteen_popular_dishes(request, canteen_id):
    """
    GET /api/canteens/<canteen_id>/menu/popular/

    Returns popular dishes for a specific canteen, sorted by rating (highest first).

    Query params:
      - limit (int, default 20, max 50)
      - category (string, optional)
      - available_only (bool, default true)
    """
    try:
        canteen = Canteen.objects.get(pk=canteen_id)
    except Canteen.DoesNotExist:
        return Response({"error": "Canteen not found"}, status=status.HTTP_404_NOT_FOUND)

    try:
        limit = int(request.query_params.get("limit", 20))
    except (ValueError, TypeError):
        limit = 20

    category = request.query_params.get("category", None)
    available_only = request.query_params.get("available_only", "true").lower() != "false"

    dishes = menu_service.get_canteen_popular_dishes(
        canteen=canteen,
        limit=limit,
        category=category,
        available_only=available_only,
    )
    return Response(DishSerializer(dishes, many=True).data)


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

    Returns download URLs for aadhar_card and hall_approval_form from
    files/documents/<canteen_id>/.
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

    documents = get_canteen_documents(canteen.pk)
    return Response({
        "canteen_id": canteen.pk,
        "canteen_name": canteen.name,
        "documents": documents,
        "status": canteen.status,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def serve_document(request, canteen_id, filename):
    """
    GET /api/canteens/<canteen_id>/documents/<filename>/

    Serves a specific document file. Admin and the canteen's manager only.
    """
    try:
        canteen = Canteen.objects.get(pk=canteen_id)
    except Canteen.DoesNotExist:
        return Response({"error": "Canteen not found"}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    if user.role == User.Role.MANAGER:
        if canteen.manager.user != user:
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
    elif user.role != User.Role.ADMIN:
        return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

    file_path = get_document_path(canteen.pk, filename)
    if not os.path.isfile(file_path):
        raise Http404("Document not found")

    return FileResponse(open(file_path, "rb"), as_attachment=True, filename=filename)


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


# ---------------------------------------------------------------------------
# Manager analytics — monthly revenue & order breakdown
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def manager_analytics(request):
    """
    GET /api/canteens/manager/analytics/

    Returns per-month revenue and order count for the manager's canteen.
    Optional query param: ?year=2026
    """
    if request.user.role != User.Role.MANAGER:
        return Response({"error": "Only managers can view analytics"}, status=status.HTTP_403_FORBIDDEN)

    try:
        canteen = request.user.manager_profile.canteen
    except Exception:
        return Response({"error": "No canteen assigned"}, status=status.HTTP_404_NOT_FOUND)

    from apps.canteens.services import analytics_service

    year = request.query_params.get("year", None)
    if year:
        try:
            year = int(year)
        except (ValueError, TypeError):
            return Response({"error": "Invalid year parameter"}, status=status.HTTP_400_BAD_REQUEST)

    monthly_data = analytics_service.get_monthly_analytics(canteen, year=year)
    return Response({
        "canteen_id": canteen.pk,
        "canteen_name": canteen.name,
        "year_filter": year,
        "monthly_breakdown": monthly_data,
    })


# ---------------------------------------------------------------------------
# Manager dish analytics — frequency & revenue for the last 30 days
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def manager_dish_analytics(request):
    """
    GET /api/canteens/manager/dish-analytics/

    Returns dish-level analytics for the manager's canteen over the last 30 days:
      - Full frequency table (all dishes, sorted by order count)
      - Top 5 dishes by order frequency
      - Top 5 dishes by revenue
    """
    if request.user.role != User.Role.MANAGER:
        return Response({"error": "Only managers can view dish analytics"}, status=status.HTTP_403_FORBIDDEN)

    try:
        canteen = request.user.manager_profile.canteen
    except Exception:
        return Response({"error": "No canteen assigned"}, status=status.HTTP_404_NOT_FOUND)

    from apps.canteens.services import analytics_service

    dish_frequency = analytics_service.get_dish_frequency(canteen)
    top_by_frequency = analytics_service.get_top_dishes_by_frequency(canteen, limit=5)
    top_by_revenue = analytics_service.get_top_dishes_by_revenue(canteen, limit=5)

    # Stringify revenue decimals for JSON safety
    for entry in top_by_revenue:
        entry["revenue"] = str(entry["revenue"])

    return Response({
        "canteen_id": canteen.pk,
        "canteen_name": canteen.name,
        "period": "last_30_days",
        "dish_frequency": dish_frequency,
        "top_5_by_frequency": top_by_frequency,
        "top_5_by_revenue": top_by_revenue,
    })
