"""
API views for the cakes app.

Thin views delegating to cake_service.
Maps to Cake/phase1–3 sequence diagrams and Cake Reservation state diagram.
"""

import logging

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.users.models import User
from apps.canteens.models import Canteen
from apps.cakes.models import CakeReservation, CakeSizePrice, CakeFlavor
from apps.cakes.serializers import (
    CakeReservationSerializer,
    CheckAvailabilitySerializer,
    SubmitReservationSerializer,
    ReservationActionSerializer,
    CakeSizePriceSerializer,
    CakeFlavorSerializer,
)
from apps.cakes.services import cake_service

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Availability check — Cake/phase1 sequence diagram
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def check_availability(request):
    """
    POST /api/cakes/check-availability/

    Sequence diagram (Cake/phase1):
      FE → checkAvailability(canteenID, date)
      → Check holidays + lead time → available/unavailable

    State diagram: ConstraintCheck → DateError / TimeError / Validated
    """
    serializer = CheckAvailabilitySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        canteen = Canteen.objects.get(pk=serializer.validated_data["canteen_id"])
    except Canteen.DoesNotExist:
        return Response({"error": "Canteen not found"}, status=status.HTTP_404_NOT_FOUND)

    result = cake_service.check_availability(canteen, serializer.validated_data["date"])
    return Response(result)


# ---------------------------------------------------------------------------
# Submit reservation — Cake/phase2 sequence diagram
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_reservation(request):
    """
    POST /api/cakes/reserve/

    Sequence diagram (Cake/phase2):
      FE → submitReservation(details, paymentToken, pinHash)
      → Verify PIN → deductFunds → createOrder(PENDING_APPROVAL) → notify manager
    """
    if request.user.role != User.Role.CUSTOMER:
        return Response({"error": "Only customers can make reservations"}, status=status.HTTP_403_FORBIDDEN)

    serializer = SubmitReservationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    try:
        canteen = Canteen.objects.get(pk=data.pop("canteen_id"))
    except Canteen.DoesNotExist:
        return Response({"error": "Canteen not found"}, status=status.HTTP_404_NOT_FOUND)

    try:
        reservation = cake_service.submit_reservation(
            customer_profile=request.user.customer_profile,
            canteen=canteen,
            **data,
        )
        return Response(
            {
                "message": "Reservation submitted — awaiting manager approval",
                "reservation": CakeReservationSerializer(reservation).data,
            },
            status=status.HTTP_201_CREATED,
        )
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# Customer's reservations
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_reservations(request):
    """
    GET /api/cakes/my-reservations/

    Lists all cake reservations for the logged-in customer.
    """
    if request.user.role != User.Role.CUSTOMER:
        return Response({"error": "Only customers have reservations"}, status=status.HTTP_403_FORBIDDEN)

    reservations = CakeReservation.objects.filter(customer=request.user.customer_profile)
    return Response(CakeReservationSerializer(reservations, many=True).data)


# ---------------------------------------------------------------------------
# Manager actions — Cake/phase3 sequence diagram
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def manager_all_reservations(request):
    """
    GET /api/cakes/manager-all/

    Returns all cake reservations for the manager's canteen (all statuses).
    """
    if request.user.role != User.Role.MANAGER:
        return Response({"error": "Only managers"}, status=status.HTTP_403_FORBIDDEN)

    try:
        canteen = request.user.manager_profile.canteen
    except Exception:
        return Response({"error": "No canteen assigned"}, status=status.HTTP_404_NOT_FOUND)

    reservations = CakeReservation.objects.filter(canteen=canteen).order_by("-created_at")
    return Response(CakeReservationSerializer(reservations, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def pending_reservations(request):
    """
    GET /api/cakes/pending/

    viewPendingOrders() — lists pending cake reservations for a manager's canteen.
    Sequence diagram (Cake/phase3, steps 12–15).
    """
    if request.user.role != User.Role.MANAGER:
        return Response({"error": "Only managers"}, status=status.HTTP_403_FORBIDDEN)

    try:
        canteen = request.user.manager_profile.canteen
    except Exception:
        return Response({"error": "No canteen assigned"}, status=status.HTTP_404_NOT_FOUND)

    reservations = CakeReservation.objects.filter(
        canteen=canteen,
        status=CakeReservation.Status.PENDING_APPROVAL,
    )
    return Response(CakeReservationSerializer(reservations, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def accept_reservation(request, reservation_id):
    """
    POST /api/cakes/<reservation_id>/accept/

    Sequence diagram (Cake/phase3, steps 17–21):
      M → acceptOrder(orderID)
    """
    if request.user.role != User.Role.MANAGER:
        return Response({"error": "Only managers"}, status=status.HTTP_403_FORBIDDEN)

    try:
        reservation = CakeReservation.objects.get(
            pk=reservation_id,
            canteen__manager=request.user.manager_profile,
        )
    except CakeReservation.DoesNotExist:
        return Response({"error": "Reservation not found"}, status=status.HTTP_404_NOT_FOUND)

    try:
        reservation = cake_service.accept_reservation(reservation)
        return Response(CakeReservationSerializer(reservation).data)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reject_reservation(request, reservation_id):
    """
    POST /api/cakes/<reservation_id>/reject/

    Sequence diagram (Cake/phase3, steps 23–32):
      M → rejectOrder(orderID, reason)
      → processRefund → notify customer
    """
    if request.user.role != User.Role.MANAGER:
        return Response({"error": "Only managers"}, status=status.HTTP_403_FORBIDDEN)

    try:
        reservation = CakeReservation.objects.get(
            pk=reservation_id,
            canteen__manager=request.user.manager_profile,
        )
    except CakeReservation.DoesNotExist:
        return Response({"error": "Reservation not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = ReservationActionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    try:
        reservation = cake_service.reject_reservation(
            reservation, serializer.validated_data.get("reason", ""),
        )
        return Response(CakeReservationSerializer(reservation).data)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def complete_reservation(request, reservation_id):
    """
    POST /api/cakes/<reservation_id>/complete/

    State diagram: Confirmed → Picked up → Completed
    """
    if request.user.role != User.Role.MANAGER:
        return Response({"error": "Only managers"}, status=status.HTTP_403_FORBIDDEN)

    try:
        reservation = CakeReservation.objects.get(
            pk=reservation_id,
            canteen__manager=request.user.manager_profile,
        )
    except CakeReservation.DoesNotExist:
        return Response({"error": "Reservation not found"}, status=status.HTTP_404_NOT_FOUND)

    try:
        reservation = cake_service.complete_reservation(reservation)
        return Response(CakeReservationSerializer(reservation).data)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# Public cake options — available sizes/prices and flavors for a canteen
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def canteen_cake_options(request, canteen_id):
    """
    GET /api/cakes/options/<canteen_id>/

    Returns available cake sizes/prices and flavors for a canteen.
    Used by the customer reservation form.
    """
    try:
        canteen = Canteen.objects.get(pk=canteen_id)
    except Canteen.DoesNotExist:
        return Response({"error": "Canteen not found"}, status=status.HTTP_404_NOT_FOUND)

    sizes = CakeSizePrice.objects.filter(canteen=canteen, is_available=True)
    flavors = CakeFlavor.objects.filter(canteen=canteen, is_available=True)

    return Response({
        "sizes": CakeSizePriceSerializer(sizes, many=True).data,
        "flavors": CakeFlavorSerializer(flavors, many=True).data,
    })


# ---------------------------------------------------------------------------
# Manager CRUD — CakeSizePrice
# ---------------------------------------------------------------------------

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def manager_size_prices(request):
    """
    GET  /api/cakes/manage/sizes/   — list all size-prices for manager's canteen
    POST /api/cakes/manage/sizes/   — create a new size-price entry
    """
    if request.user.role != User.Role.MANAGER:
        return Response({"error": "Only managers"}, status=status.HTTP_403_FORBIDDEN)

    try:
        canteen = request.user.manager_profile.canteen
    except Exception:
        return Response({"error": "No canteen assigned"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        entries = CakeSizePrice.objects.filter(canteen=canteen)
        return Response(CakeSizePriceSerializer(entries, many=True).data)

    # POST
    serializer = CakeSizePriceSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save(canteen=canteen)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["PUT", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def manager_size_price_detail(request, pk):
    """
    PUT/PATCH /api/cakes/manage/sizes/<pk>/  — update a size-price entry
    DELETE    /api/cakes/manage/sizes/<pk>/  — delete a size-price entry
    """
    if request.user.role != User.Role.MANAGER:
        return Response({"error": "Only managers"}, status=status.HTTP_403_FORBIDDEN)

    try:
        entry = CakeSizePrice.objects.get(
            pk=pk, canteen__manager=request.user.manager_profile,
        )
    except CakeSizePrice.DoesNotExist:
        return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "DELETE":
        entry.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # PUT / PATCH
    partial = request.method == "PATCH"
    serializer = CakeSizePriceSerializer(entry, data=request.data, partial=partial)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


# ---------------------------------------------------------------------------
# Manager CRUD — CakeFlavor
# ---------------------------------------------------------------------------

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def manager_flavors(request):
    """
    GET  /api/cakes/manage/flavors/   — list all flavors for manager's canteen
    POST /api/cakes/manage/flavors/   — create a new flavor
    """
    if request.user.role != User.Role.MANAGER:
        return Response({"error": "Only managers"}, status=status.HTTP_403_FORBIDDEN)

    try:
        canteen = request.user.manager_profile.canteen
    except Exception:
        return Response({"error": "No canteen assigned"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        entries = CakeFlavor.objects.filter(canteen=canteen)
        return Response(CakeFlavorSerializer(entries, many=True).data)

    # POST
    serializer = CakeFlavorSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save(canteen=canteen)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["PUT", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def manager_flavor_detail(request, pk):
    """
    PUT/PATCH /api/cakes/manage/flavors/<pk>/  — update a flavor
    DELETE    /api/cakes/manage/flavors/<pk>/  — delete a flavor
    """
    if request.user.role != User.Role.MANAGER:
        return Response({"error": "Only managers"}, status=status.HTTP_403_FORBIDDEN)

    try:
        entry = CakeFlavor.objects.get(
            pk=pk, canteen__manager=request.user.manager_profile,
        )
    except CakeFlavor.DoesNotExist:
        return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "DELETE":
        entry.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # PUT / PATCH
    partial = request.method == "PATCH"
    serializer = CakeFlavorSerializer(entry, data=request.data, partial=partial)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)
