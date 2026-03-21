"""
DRF serializers for the orders app.

Maps Order, OrderItem, Payment entities to API representations.
"""

from rest_framework import serializers
from apps.orders.models import Order, OrderItem, Payment


class OrderItemSerializer(serializers.ModelSerializer):
    """Line item in an order."""
    dish_name = serializers.CharField(source="dish.name", read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "dish", "dish_name", "quantity", "price_at_order"]
        read_only_fields = ["id", "dish_name", "price_at_order"]


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["id", "amount", "status", "created_at"]
        read_only_fields = fields


class OrderSerializer(serializers.ModelSerializer):
    """Order representation with items and payment."""
    items = OrderItemSerializer(many=True, read_only=True)
    payment = PaymentSerializer(read_only=True)
    total = serializers.SerializerMethodField()
    customer_email = serializers.CharField(source="customer.user.email", read_only=True)
    canteen_name = serializers.CharField(source="canteen.name", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "customer_email", "canteen_name", "status",
            "book_time", "receive_time", "notes",
            "reject_reason", "cancel_rejection_reason",
            "items", "payment", "total", "is_rated",
        ]
        read_only_fields = fields

    def get_total(self, obj):
        return str(obj.calculate_total())


class PlaceOrderSerializer(serializers.Serializer):
    """
    Request: placeOrder(userID, items, pinHash)
    From Order/phase2 sequence diagram.
    """
    canteen_id = serializers.IntegerField()
    items = serializers.ListField(
        child=serializers.DictField(),
        help_text='List of {"dish_id": int, "quantity": int}',
    )
    wallet_pin = serializers.CharField(write_only=True)
    notes = serializers.CharField(required=False, default="")

    def validate_items(self, value):
        """Validate that items list is well-formed."""
        if not value:
            raise serializers.ValidationError("Items list cannot be empty")

        for i, item in enumerate(value):
            if "dish_id" not in item:
                raise serializers.ValidationError(
                    f"Item {i}: 'dish_id' is required"
                )
            try:
                item["dish_id"] = int(item["dish_id"])
            except (ValueError, TypeError):
                raise serializers.ValidationError(
                    f"Item {i}: 'dish_id' must be an integer"
                )

            if "quantity" in item:
                try:
                    item["quantity"] = int(item["quantity"])
                except (ValueError, TypeError):
                    raise serializers.ValidationError(
                        f"Item {i}: 'quantity' must be an integer"
                    )
                if item["quantity"] <= 0:
                    raise serializers.ValidationError(
                        f"Item {i}: 'quantity' must be positive"
                    )

        return value


class OrderActionSerializer(serializers.Serializer):
    """Serializer for manager order actions (accept, reject)."""
    reason = serializers.CharField(required=False, default="")


class RateOrderSerializer(serializers.Serializer):
    """Serializer for rating a completed order."""
    rating = serializers.IntegerField(min_value=1, max_value=5)
    review_text = serializers.CharField(required=False, default="")
