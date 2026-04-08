"""
DRF serializers for the cakes app.

Maps CakeReservation entity to API representations.
"""

from decimal import Decimal

from rest_framework import serializers
from apps.cakes.models import CakeReservation, CakeSizePrice, CakeFlavor


class CakeReservationSerializer(serializers.ModelSerializer):
    """Cake reservation representation."""
    customer_email = serializers.CharField(source="customer.user.email", read_only=True)
    canteen_name = serializers.CharField(source="canteen.name", read_only=True)

    class Meta:
        model = CakeReservation
        fields = [
            "id", "customer_email", "canteen_name",
            "flavor", "size", "design", "message",
            "pickup_date", "pickup_time",
            "advance_amount", "status", "rejection_reason",
            "created_at",
        ]
        read_only_fields = ["id", "status", "rejection_reason", "created_at"]


class CheckAvailabilitySerializer(serializers.Serializer):
    """
    Request: checkAvailability(canteenID, date)
    From Cake/phase1 sequence diagram.
    """
    canteen_id = serializers.IntegerField()
    date = serializers.DateField()


class SubmitReservationSerializer(serializers.Serializer):
    """
    Request: submitReservation(details, paymentToken, pinHash)
    From Cake/phase2 sequence diagram.
    """
    canteen_id = serializers.IntegerField()
    flavor = serializers.CharField(max_length=100)
    size = serializers.CharField(max_length=50)
    design = serializers.CharField(max_length=255, required=False, default="")
    message = serializers.CharField(max_length=500, required=False, default="")
    pickup_date = serializers.DateField()
    pickup_time = serializers.TimeField()
    advance_amount = serializers.DecimalField(
        max_digits=10, decimal_places=2, min_value=Decimal("1.00"),
    )
    wallet_pin = serializers.CharField(write_only=True)


class ReservationActionSerializer(serializers.Serializer):
    """Serializer for manager reservation actions."""
    reason = serializers.CharField(required=False, default="")


# ---------------------------------------------------------------------------
# CakeSizePrice — manager-managed size/price configuration
# ---------------------------------------------------------------------------

class CakeSizePriceSerializer(serializers.ModelSerializer):
    """Read/write serializer for cake size-price entries."""

    class Meta:
        model = CakeSizePrice
        fields = ["id", "size", "price", "is_available", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


# ---------------------------------------------------------------------------
# CakeFlavor — manager-managed flavor catalog
# ---------------------------------------------------------------------------

class CakeFlavorSerializer(serializers.ModelSerializer):
    """Read/write serializer for cake flavors."""

    class Meta:
        model = CakeFlavor
        fields = ["id", "name", "photo", "is_available", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

