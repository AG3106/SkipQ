"""
Analytics service for canteen managers.

Provides monthly revenue and order count breakdowns
using Django's TruncMonth aggregation, plus dish-level
frequency and revenue analytics.
"""

import logging
from datetime import timedelta

from django.db.models import Sum, Count, F
from django.db.models.functions import TruncMonth
from django.utils import timezone

from apps.orders.models import Order, OrderItem, Payment

logger = logging.getLogger(__name__)


def get_monthly_analytics(canteen, year=None):
    """
    Returns per-month revenue and order count for a canteen.

    Args:
        canteen: Canteen instance.
        year: Optional int to filter to a specific year.

    Returns:
        List of dicts: [{"month": "2026-01", "revenue": "12500.00", "order_count": 45}, ...]
    """
    queryset = Payment.objects.filter(
        order__canteen=canteen,
        status=Payment.Status.COMPLETED,
    )

    if year:
        queryset = queryset.filter(order__book_time__year=year)

    monthly_data = (
        queryset
        .annotate(month=TruncMonth("order__book_time"))
        .values("month")
        .annotate(
            revenue=Sum("amount"),
            order_count=Count("id"),
        )
        .order_by("month")
    )

    results = []
    for entry in monthly_data:
        results.append({
            "month": entry["month"].strftime("%Y-%m"),
            "revenue": str(entry["revenue"]),
            "order_count": entry["order_count"],
        })

    logger.info(
        "Analytics fetched for canteen '%s': %d months of data",
        canteen.name, len(results),
    )
    return results


# ---------------------------------------------------------------------------
# Dish-level analytics — frequency & revenue for the last 30 days
# ---------------------------------------------------------------------------

def _last_month_order_items(canteen):
    """Base queryset: OrderItems from completed orders in the last 30 days."""
    thirty_days_ago = timezone.now() - timedelta(days=30)
    return OrderItem.objects.filter(
        order__canteen=canteen,
        order__status=Order.Status.COMPLETED,
        order__book_time__gte=thirty_days_ago,
    )


def get_dish_frequency(canteen):
    """
    Returns all dishes ordered in the last 30 days with their total order count,
    sorted by frequency (highest first).
    """
    qs = (
        _last_month_order_items(canteen)
        .values("dish__id", "dish__name")
        .annotate(total_ordered=Sum("quantity"))
        .order_by("-total_ordered")
    )
    return [
        {"dish_id": e["dish__id"], "dish_name": e["dish__name"], "total_ordered": e["total_ordered"]}
        for e in qs
    ]


def get_top_dishes_by_frequency(canteen, limit=5):
    """Returns the top N most frequently ordered dishes in the last 30 days."""
    return get_dish_frequency(canteen)[:limit]


def get_top_dishes_by_revenue(canteen, limit=5):
    """
    Returns the top N dishes by revenue (price_at_order * quantity)
    in the last 30 days.
    """
    qs = (
        _last_month_order_items(canteen)
        .values("dish__id", "dish__name")
        .annotate(
            total_ordered=Sum("quantity"),
            revenue=Sum(F("price_at_order") * F("quantity")),
        )
        .order_by("-revenue")[:limit]
    )
    return [
        {
            "dish_id": e["dish__id"],
            "dish_name": e["dish__name"],
            "total_ordered": e["total_ordered"],
            "revenue": e["revenue"],
        }
        for e in qs
    ]
