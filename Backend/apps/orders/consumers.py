"""
WebSocket consumer for real-time order updates.

Only authenticated managers are allowed to connect.
Each manager joins a channel group scoped to their canteen:
  orders_canteen_{canteen_id}

This keeps the connection count at ~15 (number of canteen managers)
instead of ~1000 (all concurrent users).
"""

import json
import logging

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

logger = logging.getLogger(__name__)


class OrderConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for the manager dashboard.

    Events handled:
      - new_order:    A customer placed a new order at the manager's canteen.
      - order_update: An existing order changed status (accept, reject, ready,
                      complete, cancel request, cancel approve/reject).
    """

    async def connect(self):
        """
        Authenticate the WebSocket connection via session cookie.
        Only managers with an assigned canteen are allowed.
        """
        user = self.scope.get("user")

        if user is None or user.is_anonymous:
            logger.warning("WebSocket rejected: unauthenticated connection")
            await self.close()
            return

        # Check role and get canteen_id in a sync DB call
        canteen_id = await self._get_manager_canteen_id(user)

        if canteen_id is None:
            logger.warning(
                "WebSocket rejected: user %s is not a manager or has no canteen",
                user.email,
            )
            await self.close()
            return

        self.canteen_group = f"orders_canteen_{canteen_id}"

        await self.channel_layer.group_add(self.canteen_group, self.channel_name)
        await self.accept()

        logger.info(
            "WebSocket connected: manager %s joined group %s",
            user.email,
            self.canteen_group,
        )

    async def disconnect(self, close_code):
        """Remove manager from the canteen group on disconnect."""
        if hasattr(self, "canteen_group"):
            await self.channel_layer.group_discard(
                self.canteen_group, self.channel_name
            )
            logger.info("WebSocket disconnected from group %s", self.canteen_group)

    # ------------------------------------------------------------------
    # Event handlers — called via channel_layer.group_send()
    # ------------------------------------------------------------------

    async def new_order(self, event):
        """Push a new order to the manager's dashboard."""
        await self.send(text_data=json.dumps({
            "type": "new_order",
            "order": event["order"],
        }))

    async def order_update(self, event):
        """Push an order status change to the manager's dashboard."""
        await self.send(text_data=json.dumps({
            "type": "order_update",
            "order": event["order"],
        }))

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @database_sync_to_async
    def _get_manager_canteen_id(self, user):
        """
        Returns the canteen ID for a manager user, or None if the user
        is not a manager or has no canteen assigned.
        """
        from apps.users.models import User

        if user.role != User.Role.MANAGER:
            return None

        try:
            return user.manager_profile.canteen_id
        except Exception:
            return None
