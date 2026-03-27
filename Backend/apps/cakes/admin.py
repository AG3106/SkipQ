"""Django admin configuration for the cakes app."""

from django.contrib import admin
from apps.cakes.models import CakeReservation


@admin.register(CakeReservation)
class CakeReservationAdmin(admin.ModelAdmin):
    list_display = ["id", "customer", "canteen", "flavor", "size", "pickup_date", "status"]
    list_filter = ["status", "canteen"]
    search_fields = ["customer__user__email", "flavor"]
