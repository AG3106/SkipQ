"""
DRF serializers for the canteens app.

Maps Canteen and Dish entities to API representations.
"""

import statistics

from django.utils import timezone
from rest_framework import serializers
from apps.canteens.models import Canteen, Dish, DishRating, CanteenHoliday
from apps.canteens.utils.file_handlers import canteen_image_exists, dish_image_exists


class DishRatingSerializer(serializers.ModelSerializer):
    """Rating representation."""
    customer_email = serializers.CharField(source="customer.user.email", read_only=True)

    class Meta:
        model = DishRating
        fields = ["id", "customer_email", "rating", "created_at"]
        read_only_fields = ["id", "customer_email", "created_at"]


class DishSerializer(serializers.ModelSerializer):
    """Dish representation with photo URL."""
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Dish
        fields = [
            "id", "name", "price", "description",
            "is_available", "photo", "photo_url", "rating", "category",
            "is_veg", "created_at",
        ]
        read_only_fields = ["id", "rating", "created_at"]

    def get_photo_url(self, obj):
        """Return /files/dish_images/<dish_id>.jpg if the file exists."""
        if dish_image_exists(obj.pk):
            return f"/files/dish_images/{obj.pk}.jpg"
        return None


class DishCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating dishes."""
    class Meta:
        model = Dish
        fields = ["name", "price", "description", "is_available", "photo", "category", "is_veg"]


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
    median_rating = serializers.SerializerMethodField()
    holiday_today = serializers.SerializerMethodField()
    manager_email = serializers.CharField(source="manager.user.email", read_only=True)
    holidays = CanteenHolidaySerializer(many=True, read_only=True)

    class Meta:
        model = Canteen
        fields = [
            "id", "name", "location", "opening_time", "closing_time",
            "lead_time_config", "status", "manager_email", "image_url",
            "is_currently_open", "estimated_wait_time", "median_rating",
            "holiday_today", "holidays", "created_at",
        ]
        read_only_fields = ["id", "status", "created_at"]

    def get_is_currently_open(self, obj):
        return obj.is_open()

    def get_holiday_today(self, obj):
        """Return the holiday name if today is a holiday for this canteen, else None."""
        today = timezone.localdate()
        holiday = obj.holidays.filter(date=today).first()
        return holiday.description if holiday else None

    def get_estimated_wait_time(self, obj):
        return f"{obj.get_estimated_wait_time()} mins"

    def get_median_rating(self, obj):
        """Return the median rating across all dishes in this canteen."""
        ratings = list(obj.dishes.exclude(rating=0).values_list("rating", flat=True))
        if not ratings:
            return 0
        return round(float(statistics.median(ratings)), 2)

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


class PopularDishSerializer(serializers.ModelSerializer):
    """Dish representation for the popular dishes endpoint — includes canteen info and popularity metrics."""
    canteen_id = serializers.IntegerField(source="canteen.id", read_only=True)
    canteen_name = serializers.CharField(source="canteen.name", read_only=True)
    canteen_location = serializers.CharField(source="canteen.location", read_only=True)
    is_canteen_open = serializers.SerializerMethodField()
    canteen_holiday_today = serializers.SerializerMethodField()
    rating_count = serializers.IntegerField(read_only=True)
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Dish
        fields = [
            "id", "name", "price", "description",
            "is_available", "photo", "photo_url", "rating", "category",
            "is_veg", "canteen_id", "canteen_name", "canteen_location",
            "is_canteen_open", "canteen_holiday_today", "rating_count",
        ]
        read_only_fields = fields

    def get_is_canteen_open(self, obj):
        return obj.canteen.is_open()

    def get_canteen_holiday_today(self, obj):
        """Return the holiday name if today is a holiday for this canteen, else None."""
        today = timezone.localdate()
        holiday = obj.canteen.holidays.filter(date=today).first()
        return holiday.description if holiday else None

    def get_photo_url(self, obj):
        """Return /files/dish_images/<dish_id>.jpg if the file exists."""
        if dish_image_exists(obj.pk):
            return f"/files/dish_images/{obj.pk}.jpg"
        return None
