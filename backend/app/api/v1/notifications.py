"""Notification routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.dependencies import get_current_user, get_notification_service
from app.models.user import User
from app.schemas.common import Message
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])


class MarkReadRequest(BaseModel):
    ids: list[str] | None = None


@router.get("")
async def list_notifications(
    user: User = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service),
):
    return await service.list(str(user.id))


@router.post("/read", response_model=Message)
async def mark_read(
    data: MarkReadRequest,
    user: User = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service),
):
    await service.mark_read(str(user.id), data.ids)
    return Message(message="Notifications marked read.")
