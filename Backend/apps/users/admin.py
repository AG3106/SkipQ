"""Django admin configuration for the users app."""

from django.contrib import admin
from apps.users.models import User, CustomerProfile, CanteenManagerProfile, AdminProfile, AdminActivityLog, OTPVerification


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ["email", "role", "is_suspended", "is_verified", "is_active", "created_at"]
    list_filter = ["role", "is_suspended", "is_verified"]
    search_fields = ["email"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "name", "wallet_balance"]
    search_fields = ["user__email", "name"]


@admin.register(CanteenManagerProfile)
class CanteenManagerProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "manager_id", "wallet_balance"]
    search_fields = ["user__email"]


@admin.register(AdminProfile)
class AdminProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "admin_id", "role_level"]


@admin.register(AdminActivityLog)
class AdminActivityLogAdmin(admin.ModelAdmin):
    list_display = ["admin", "action", "timestamp"]
    list_filter = ["action"]
    readonly_fields = ["timestamp"]


@admin.register(OTPVerification)
class OTPVerificationAdmin(admin.ModelAdmin):
    list_display = ["email", "otp", "is_used", "created_at"]
    list_filter = ["is_used"]
