"""Django admin configuration for the cakes app."""

from django.contrib import admin
from apps.cakes.models import CakeReservation, CakeSizePrice, CakeFlavor


@admin.register(CakeReservation)
class CakeReservationAdmin(admin.ModelAdmin):
    list_display = ["id", "customer", "canteen", "flavor", "size", "pickup_date", "status"]
    list_filter = ["status", "canteen"]
    search_fields = ["customer__user__email", "flavor"]


@admin.register(CakeSizePrice)
class CakeSizePriceAdmin(admin.ModelAdmin):
    list_display = ["id", "canteen", "size", "price", "is_available"]
    list_filter = ["canteen", "is_available"]


@admin.register(CakeFlavor)
class CakeFlavorAdmin(admin.ModelAdmin):
    list_display = ["id", "canteen", "name", "is_available"]
    list_filter = ["canteen", "is_available"]
    search_fields = ["name"]
