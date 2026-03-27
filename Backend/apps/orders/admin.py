"""Django admin configuration for the orders app."""

from django.contrib import admin
from apps.orders.models import Order, OrderItem, Payment


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ["dish", "quantity", "price_at_order"]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["id", "customer", "canteen", "status", "book_time", "receive_time"]
    list_filter = ["status", "canteen"]
    search_fields = ["customer__user__email"]
    inlines = [OrderItemInline]


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ["id", "order", "amount", "status", "created_at"]
    list_filter = ["status"]
