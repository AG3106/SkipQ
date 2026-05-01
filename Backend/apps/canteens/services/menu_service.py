"""
Menu service for the SkipQ system.

Implements Dish methods from the class diagram:
  - updateDishDetails(name, price, description)
  - toggleAvailability()
  - updatePrice(newPrice)
  - updateDiscount(newDiscount)
  - updateRating(rating)

Also implements Canteen methods:
  - updateMenu(dish): void
  - getMenu(): List
"""

import logging
from decimal import Decimal

from django.db.models import Avg

from apps.canteens.models import Dish, DishRating

logger = logging.getLogger(__name__)


def get_menu(canteen):
    """
    getMenu(): List — from class diagram (Canteen).
    Returns all dishes for a canteen.
    """
    return canteen.dishes.all()


def add_dish(canteen, name, price, description="", category="", photo=None, is_veg=True):
    """
    updateMenu(dish: Dish): void — from class diagram (Canteen).
    Adds a new dish to the canteen's menu.
    """
    if Dish.objects.filter(canteen=canteen, name=name).exists():
        raise ValueError(f"A dish named '{name}' already exists in this canteen.")

    dish = Dish.objects.create(
        canteen=canteen,
        name=name,
        price=Decimal(str(price)),
        description=description,
        category=category,
        photo=photo,
        is_veg=is_veg,
    )
    logger.info("Dish '%s' added to canteen '%s'", name, canteen.name)
    return dish


def update_dish(dish, **kwargs):
    """
    updateDishDetails(name, price, description): void — from class diagram.
    """
    for field, value in kwargs.items():
        if hasattr(dish, field):
            setattr(dish, field, value)
    dish.save()
    logger.info("Dish '%s' updated", dish.name)
    return dish


def update_price(dish, new_price):
    """updatePrice(newPrice: Float): void — from class diagram."""
    dish.price = Decimal(str(new_price))
    dish.save(update_fields=["price"])
    logger.info("Dish '%s' price updated to ₹%s", dish.name, new_price)


def add_rating(dish, customer_profile, rating, order=None):
    """
    updateRating(rating): void — from class diagram.

    Also maps to Customer method:
      rateDish(rate: Int): void

    Creates a DishRating entry and recalculates average dish rating.
    Uniqueness is enforced at the DB level via (dish, customer, order).
    """
    if not 1 <= rating <= 5:
        raise ValueError("Rating must be between 1 and 5")

    rating_obj = DishRating.objects.create(
        dish=dish,
        customer=customer_profile,
        rating=rating,
        order=order,
    )

    # Recalculate average rating
    avg_rating = dish.ratings.aggregate(avg=Avg("rating"))["avg"] or 0
    dish.rating = round(avg_rating, 2)
    dish.save(update_fields=["rating"])

    logger.info(
        "Rating added for '%s' by %s: %d★",
        dish.name, customer_profile.user.email, rating,
    )
    return rating_obj


def get_popular_dishes(limit=10, category=None, available_only=True):
    """
    Get globally ranked popular dishes across all canteens, sorted by rating.

    Only includes dishes from canteens in operational states (ACTIVE, OPEN, BUSY).

    Args:
        limit: Max number of dishes to return (capped at 50).
        category: Optional category filter.
        available_only: If True, exclude unavailable dishes (default True).
    """
    from apps.canteens.models import Canteen
    from django.db.models import Count

    limit = min(max(1, limit), 50)

    queryset = Dish.objects.filter(
        canteen__status__in=[
            Canteen.Status.ACTIVE,
            Canteen.Status.OPEN,
            Canteen.Status.BUSY,
        ],
    ).select_related("canteen")

    if available_only:
        queryset = queryset.filter(is_available=True)

    if category:
        queryset = queryset.filter(category__iexact=category)

    queryset = queryset.annotate(
        rating_count=Count("ratings"),
    ).order_by("-rating", "-rating_count")[:limit]

    return queryset


def get_canteen_popular_dishes(canteen, limit=10, category=None, available_only=True):
    """
    Get popular dishes for a specific canteen, sorted by rating.

    Args:
        canteen: Canteen instance.
        limit: Max number of dishes to return (capped at 50).
        category: Optional category filter.
        available_only: If True, exclude unavailable dishes (default True).
    """
    from django.db.models import Count

    limit = min(max(1, limit), 50)

    queryset = Dish.objects.filter(canteen=canteen)

    if available_only:
        queryset = queryset.filter(is_available=True)

    if category:
        queryset = queryset.filter(category__iexact=category)

    queryset = queryset.annotate(
        rating_count=Count("ratings"),
    ).order_by("-rating", "-rating_count")[:limit]

    return queryset
