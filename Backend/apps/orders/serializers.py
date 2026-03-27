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
    total_price = serializers.SerializerMethodField()
    estimated_wait_minutes = serializers.SerializerMethodField()
    customer_email = serializers.CharField(source="customer.user.email", read_only=True)
    canteen_name = serializers.CharField(source="canteen.name", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "customer_email", "canteen_name", "status",
            "book_time", "receive_time", "notes",
            "customer_name", "roll_no",
            "reject_reason", "cancel_rejection_reason",
            "items", "payment", "total_price", "is_rated",
            "estimated_wait_minutes",
        ]
        read_only_fields = fields

    def get_total_price(self, obj):
        return str(obj.calculate_total())

    def get_estimated_wait_minutes(self, obj):  
        return obj.get_dynamic_wait_time()


class OrderHistoryItemSerializer(serializers.ModelSerializer):
    """Line item with dish details for order history."""
    dish_name = serializers.CharField(source="dish.name", read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "dish", "dish_name", "quantity", "price_at_order"]
        read_only_fields = fields


class OrderHistorySerializer(serializers.ModelSerializer):
    """Comprehensive order representation for order history pages."""
    items = OrderHistoryItemSerializer(many=True, read_only=True)
    payment = PaymentSerializer(read_only=True)
    total_price = serializers.SerializerMethodField()
    canteen_name = serializers.CharField(source="canteen.name", read_only=True)
    canteen_id = serializers.IntegerField(source="canteen.pk", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "canteen_id", "canteen_name", "status",
            "book_time", "receive_time", "is_rated",
            "customer_name", "roll_no",
            "items", "payment", "total_price",
        ]
        read_only_fields = fields

    def get_total_price(self, obj):
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
    customer_name = serializers.CharField(required=False, default="")
    roll_no = serializers.CharField(required=False, default="")

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


class DishRatingInputSerializer(serializers.Serializer):
    """Single dish rating entry."""
    dish_id = serializers.IntegerField()
    rating = serializers.IntegerField(min_value=1, max_value=5)


class RateOrderSerializer(serializers.Serializer):
    """
    Serializer for rating dishes in a completed order.

    Expects per-dish ratings:
      {"ratings": [{"dish_id": 1, "rating": 5}, {"dish_id": 2, "rating": 3}]}
    """
    ratings = serializers.ListField(
        child=DishRatingInputSerializer(),
        help_text='List of {"dish_id": int, "rating": int (1-5)}',
    )

    def validate_ratings(self, value):
        if not value:
            raise serializers.ValidationError("Ratings list cannot be empty")

        # Ensure no duplicate dish_ids
        dish_ids = [r["dish_id"] for r in value]
        if len(dish_ids) != len(set(dish_ids)):
            raise serializers.ValidationError("Duplicate dish_id entries are not allowed")

        return value
