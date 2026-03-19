"""URL configuration for the canteens app."""

from django.urls import path
from apps.canteens import views

urlpatterns = [
    # Public canteen listing & detail
    path("", views.canteen_list, name="canteen-list"),
    path("<int:canteen_id>/", views.canteen_detail, name="canteen-detail"),

    # Wait time estimation — Order/phase1 sequence diagram
    path("<int:canteen_id>/wait-time/", views.estimated_wait_time, name="estimated-wait-time"),

    # Canteen registration — NewCanteen sequence diagram
    path("register/", views.register_canteen, name="register-canteen"),

    # Operational status — Canteen Operational state diagram
    path("<int:canteen_id>/status/", views.update_canteen_status, name="update-canteen-status"),

    # Menu management — Dish class diagram methods
    path("<int:canteen_id>/menu/", views.canteen_menu, name="canteen-menu"),
    path("<int:canteen_id>/menu/popular/", views.canteen_popular_dishes, name="canteen-popular-dishes"),
    path("<int:canteen_id>/menu/add/", views.add_dish, name="add-dish"),

    # Dish management
    path("dishes/popular/", views.popular_dishes, name="popular-dishes"),
    path("dishes/<int:dish_id>/", views.manage_dish, name="manage-dish"),
    path("dishes/<int:dish_id>/toggle/", views.toggle_dish_availability, name="toggle-dish"),
    path("dishes/<int:dish_id>/review/", views.add_review, name="add-review"),

    # Holidays — canteen schedule management
    path("<int:canteen_id>/holidays/", views.manage_holidays, name="manage-holidays"),

    # Documents — getDocuments() from Canteen class diagram
    path("<int:canteen_id>/documents/", views.canteen_documents, name="canteen-documents"),

    # Lead time config — getLeadTimeConfig() from Canteen class diagram
    path("<int:canteen_id>/lead-time/", views.lead_time_config, name="lead-time-config"),

    # Manager dashboard — viewEarningStats() + manageOrderQueue() from CanteenManager class diagram
    path("manager/dashboard/", views.manager_dashboard, name="manager-dashboard"),
]
