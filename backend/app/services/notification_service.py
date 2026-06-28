"""Notification creation + realtime fan-out."""
from __future__ import annotations

from app.models.notification import Notification
from app.repositories.misc_repo import NotificationRepository
from app.websockets.manager import connection_manager


class NotificationService:
    def __init__(self, notifications: NotificationRepository) -> None:
        self.notifications = notifications

    async def notify(
        self, user_id: str, *, type_: str, title: str, body: str | None = None,
        link: str | None = None,
    ) -> Notification:
        notif = await self.notifications.insert(
            Notification(user_id=user_id, type=type_, title=title, body=body, link=link)
        )
        await connection_manager.send_to_user(
            user_id,
            {"event": "notification.new", "data": notif.model_dump(mode="json")},
        )
        return notif

    async def list(self, user_id: str) -> dict:
        items = await self.notifications.list_for_user(user_id)
        unread = await self.notifications.unread_count(user_id)
        return {
            "items": [n.model_dump(mode="json") for n in items],
            "unread": unread,
        }

    async def mark_read(self, user_id: str, ids: list[str] | None = None) -> None:
        await self.notifications.mark_read(user_id, ids)
