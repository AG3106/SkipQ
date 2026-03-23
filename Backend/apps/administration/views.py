"""
API views for the administration app (V1 — canteen registration only).

Core Admin functionality:
  - List pending canteen registrations (with document links)
  - approveRequest() / rejectRequest() for canteen registration
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.response import Response

from apps.users.models import User
from apps.canteens.models import Canteen
from apps.canteens.serializers import CanteenSerializer
from apps.canteens.services import canteen_service
from apps.canteens.utils.file_handlers import get_canteen_documents


class IsAdminUser(BasePermission):
    """Allows access only to users with role ADMIN."""

    message = "Admin access required"

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.ADMIN
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminUser])
def pending_canteen_requests(request):
    """
    GET /api/admin/canteen-requests/

    Lists all canteens with status UNDER_REVIEW.
    Each entry includes the canteen details plus document links
    so the admin can review documents before approving/rejecting.
    """
    canteens = Canteen.objects.filter(status=Canteen.Status.UNDER_REVIEW)
    results = []
    for canteen in canteens:
        data = CanteenSerializer(canteen).data
        data["documents"] = get_canteen_documents(canteen.pk)
        results.append(data)
    return Response(results)


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def approve_canteen(request, canteen_id):
    """
    POST /api/admin/canteen-requests/<id>/approve/

    Approves a pending canteen registration:
      1. Sets canteen status to ACTIVE
      2. Marks the manager's user as staff (is_staff=True)
      3. Returns the fully persisted canteen data
    """
    try:
        canteen = Canteen.objects.get(pk=canteen_id, status=Canteen.Status.UNDER_REVIEW)
    except Canteen.DoesNotExist:
        return Response({"error": "Canteen request not found"}, status=status.HTTP_404_NOT_FOUND)

    canteen = canteen_service.approve_canteen(canteen)
    return Response({
        "message": f"Canteen '{canteen.name}' approved and activated",
        "canteen": CanteenSerializer(canteen).data,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def reject_canteen(request, canteen_id):
    """
    POST /api/admin/canteen-requests/<id>/reject/

    Rejects a pending canteen registration:
      1. Sets canteen status to REJECTED
      2. Saves rejection reason
      3. TODO: Send rejection email to manager (email service to be set up later)
    """
    try:
        canteen = Canteen.objects.get(pk=canteen_id, status=Canteen.Status.UNDER_REVIEW)
    except Canteen.DoesNotExist:
        return Response({"error": "Canteen request not found"}, status=status.HTTP_404_NOT_FOUND)

    reason = request.data.get("reason", "")
    canteen = canteen_service.reject_canteen(canteen, reason)
    return Response({
        "message": f"Canteen '{canteen.name}' rejected",
        "canteen": CanteenSerializer(canteen).data,
    })
