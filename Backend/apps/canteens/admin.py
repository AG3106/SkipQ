"""Django admin configuration for the canteens app."""

from django.contrib import admin
from apps.canteens.models import Canteen, Dish, DishRating, CanteenHoliday


@admin.register(Canteen)
class CanteenAdmin(admin.ModelAdmin):
    list_display = ["name", "location", "status", "opening_time", "closing_time", "manager"]
    list_filter = ["status"]
    search_fields = ["name", "location"]


@admin.register(Dish)
class DishAdmin(admin.ModelAdmin):
    list_display = ["name", "canteen", "price", "is_available", "discount", "rating", "category", "is_veg"]
    list_filter = ["is_available", "category", "canteen"]
    search_fields = ["name"]


@admin.register(DishRating)
class DishRatingAdmin(admin.ModelAdmin):
    list_display = ["dish", "customer", "rating", "order", "created_at"]
    list_filter = ["rating"]


@admin.register(CanteenHoliday)
class CanteenHolidayAdmin(admin.ModelAdmin):
    list_display = ["canteen", "date", "description"]
    list_filter = ["canteen"]
