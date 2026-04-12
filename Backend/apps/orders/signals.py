"""
Broadcasting helper for real-time order events.

Sends serialized order data to the manager's canteen channel group
via the Channels layer. Called from order_service after state transitions.
"""

import logging

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from apps.orders.serializers import OrderSerializer

logger = logging.getLogger(__name__)


def broadcast_order_event(order, event_type="order_update"):
    """
    Broadcast an order event to all managers of the order's canteen.

    Args:
        order: Order model instance (must have canteen_id).
        event_type: "new_order" or "order_update".
    """
    channel_layer = get_channel_layer()
    if channel_layer is None:
        logger.warning("Channel layer not configured — skipping broadcast")
        return

    group_name = f"orders_canteen_{order.canteen_id}"

    # Serialize the order (same format the REST API returns)
    order_data = OrderSerializer(order).data

    try:
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": event_type,
                "order": order_data,
            },
        )
        logger.info(
            "Broadcast %s for Order #%s to group %s",
            event_type,
            order.pk,
            group_name,
        )
    except Exception:
        # Never let broadcast failures break the order workflow
        logger.exception(
            "Failed to broadcast %s for Order #%s",
            event_type,
            order.pk,
        )
