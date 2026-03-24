"""
Analytics service for canteen managers.

Provides monthly revenue and order count breakdowns
using Django's TruncMonth aggregation, plus dish-level
frequency and revenue analytics.
"""

import logging
from datetime import timedelta
from decimal import Decimal

from django.db.models import Sum, Count, F, DecimalField
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


# ---------------------------------------------------------------------------
# Monthly revenue — dish-level breakdown for a specific month
# ---------------------------------------------------------------------------

def get_monthly_revenue(canteen, year, month):
    """
    Returns the monthly revenue for a canteen, computed as:
      Σ (price_at_order × quantity) for all OrderItems
      in completed orders within the given year/month.

    Args:
        canteen: Canteen instance.
        year: int (e.g. 2026).
        month: int (1–12).

    Returns:
        dict: {
            "year": 2026,
            "month": 3,
            "dishes": [
                {"dish_id": 1, "dish_name": "Dosa", "quantity_sold": 15, "revenue": "900.00"},
                ...
            ],
            "total_revenue": "4500.00"
        }
    """
    qs = OrderItem.objects.filter(
        order__canteen=canteen,
        order__status=Order.Status.COMPLETED,
        order__book_time__year=year,
        order__book_time__month=month,
    )

    dish_breakdown = (
        qs
        .values("dish__id", "dish__name")
        .annotate(
            quantity_sold=Sum("quantity"),
            revenue=Sum(
                F("price_at_order") * F("quantity"),
                output_field=DecimalField(max_digits=10, decimal_places=2),
            ),
        )
        .order_by("-revenue")
    )

    TWO_PLACES = Decimal("0.01")

    dishes = [
        {
            "dish_id": e["dish__id"],
            "dish_name": e["dish__name"],
            "quantity_sold": e["quantity_sold"],
            "revenue": str(Decimal(str(e["revenue"])).quantize(TWO_PLACES)),
        }
        for e in dish_breakdown
    ]

    total = qs.aggregate(
        total=Sum(
            F("price_at_order") * F("quantity"),
            output_field=DecimalField(max_digits=10, decimal_places=2),
        ),
    )["total"] or 0
    total = Decimal(str(total)).quantize(TWO_PLACES)

    logger.info(
        "Monthly revenue for canteen '%s' (%d-%02d): %s",
        canteen.name, year, month, total,
    )

    return {
        "year": year,
        "month": month,
        "dishes": dishes,
        "total_revenue": str(total),
    }
