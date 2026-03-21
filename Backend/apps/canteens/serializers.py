"""
DRF serializers for the canteens app.

Maps Canteen and Dish entities to API representations.
"""

from rest_framework import serializers
from apps.canteens.models import Canteen, Dish, DishReview, CanteenHoliday
from apps.canteens.utils.file_handlers import canteen_image_exists, dish_image_exists


class DishReviewSerializer(serializers.ModelSerializer):
    """Review representation."""
    customer_email = serializers.CharField(source="customer.user.email", read_only=True)

    class Meta:
        model = DishReview
        fields = ["id", "customer_email", "rating", "review_text", "created_at"]
        read_only_fields = ["id", "customer_email", "created_at"]


class DishSerializer(serializers.ModelSerializer):
    """Dish representation with effective price, photo URL, and reviews."""
    effective_price = serializers.SerializerMethodField()
    photo_url = serializers.SerializerMethodField()
    reviews = DishReviewSerializer(many=True, read_only=True)

    class Meta:
        model = Dish
        fields = [
            "id", "name", "price", "effective_price", "description",
            "is_available", "discount", "photo", "photo_url", "rating", "category",
            "is_veg", "reviews", "created_at",
        ]
        read_only_fields = ["id", "rating", "created_at"]

    def get_effective_price(self, obj):
        return str(obj.get_effective_price())

    def get_photo_url(self, obj):
        """Return /files/dish_images/<dish_id>.jpg if the file exists."""
        if dish_image_exists(obj.pk):
            return f"/files/dish_images/{obj.pk}.jpg"
        return None


class DishCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating dishes."""
    class Meta:
        model = Dish
        fields = ["name", "price", "description", "is_available", "discount", "photo", "category", "is_veg"]


class CanteenHolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = CanteenHoliday
        fields = ["id", "date", "description"]
        read_only_fields = ["id"]


class CanteenSerializer(serializers.ModelSerializer):
    """Canteen representation."""
    is_currently_open = serializers.SerializerMethodField()
    estimated_wait_time = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    manager_email = serializers.CharField(source="manager.user.email", read_only=True)
    holidays = CanteenHolidaySerializer(many=True, read_only=True)

    class Meta:
        model = Canteen
        fields = [
            "id", "name", "location", "opening_time", "closing_time",
            "lead_time_config", "status", "manager_email", "image_url",
            "is_currently_open", "estimated_wait_time", "holidays",
            "created_at",
        ]
        read_only_fields = ["id", "status", "created_at"]

    def get_is_currently_open(self, obj):
        return obj.is_open()

    def get_estimated_wait_time(self, obj):
        return f"{obj.get_estimated_wait_time()} mins"

    def get_image_url(self, obj):
        """Return /files/canteen_images/<canteen_id>.jpg if the file exists."""
        if canteen_image_exists(obj.pk):
            return f"/files/canteen_images/{obj.pk}.jpg"
        return None


class CanteenRegistrationSerializer(serializers.Serializer):
    """Serializer for canteen registration request."""
    name = serializers.CharField(max_length=255)
    location = serializers.CharField(max_length=500)
    opening_time = serializers.TimeField()
    closing_time = serializers.TimeField()
    image = serializers.ImageField(required=False)
    aadhar_card = serializers.FileField(required=True)
    hall_approval_form = serializers.FileField(required=True)


class CanteenStatusUpdateSerializer(serializers.Serializer):
    """Serializer for updating canteen operational status."""
    status = serializers.ChoiceField(choices=Canteen.Status.choices)


class AddReviewSerializer(serializers.Serializer):
    """Serializer for adding a dish review."""
    rating = serializers.IntegerField(min_value=1, max_value=5)
    review_text = serializers.CharField(required=False, default="")


class PopularDishSerializer(serializers.ModelSerializer):
    """Dish representation for the popular dishes endpoint — includes canteen info and popularity metrics."""
    effective_price = serializers.SerializerMethodField()
    canteen_id = serializers.IntegerField(source="canteen.id", read_only=True)
    canteen_name = serializers.CharField(source="canteen.name", read_only=True)
    canteen_location = serializers.CharField(source="canteen.location", read_only=True)
    review_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Dish
        fields = [
            "id", "name", "price", "effective_price", "description",
            "is_available", "discount", "photo", "rating", "category",
            "is_veg", "canteen_id", "canteen_name", "canteen_location",
            "review_count",
        ]
        read_only_fields = fields

    def get_effective_price(self, obj):
        return str(obj.get_effective_price())

