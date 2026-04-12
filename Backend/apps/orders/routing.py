"""WebSocket URL routing for the orders app."""

from django.urls import re_path

from apps.orders.consumers import OrderConsumer

websocket_urlpatterns = [
    re_path(r"ws/orders/$", OrderConsumer.as_asgi()),
]
