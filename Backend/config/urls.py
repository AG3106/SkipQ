"""
Root URL configuration for the SkipQ backend.

Routes all API endpoints to their respective app URL configs.
URL structure mirrors the system architecture:
  api/auth/       → Authentication (register, login, logout)
  api/users/      → User profiles and wallets
  api/canteens/   → Canteen management, menus, schedules
  api/orders/     → Order placement and lifecycle
  api/cakes/      → Cake reservations
  api/admin/      → Admin panel (canteen approval, user management, analytics)
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.users.urls import auth_urlpatterns, user_urlpatterns


@api_view(["GET"])
@permission_classes([AllowAny])
def api_root(request):
    """API root — lists all available endpoint groups."""
    return Response({
        "message": "Welcome to the SkipQ API",
        "endpoints": {
            "auth": "/api/auth/",
            "users": "/api/users/",
            "canteens": "/api/canteens/",
            "orders": "/api/orders/",
            "cakes": "/api/cakes/",
            "admin": "/api/admin/",
        },
    })


urlpatterns = [
    # Django admin
    path("django-admin/", admin.site.urls),

    # API root
    path("api/", api_root, name="api-root"),

    # App API routes
    path("api/auth/", include((auth_urlpatterns, "auth"))),
    path("api/users/", include((user_urlpatterns, "users"))),
    path("api/canteens/", include(("apps.canteens.urls", "canteens"))),
    path("api/orders/", include(("apps.orders.urls", "orders"))),
    path("api/cakes/", include(("apps.cakes.urls", "cakes"))),
    path("api/admin/", include(("apps.administration.urls", "administration"))),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
