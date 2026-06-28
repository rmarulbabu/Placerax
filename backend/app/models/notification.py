"""Notification + session + saved-job documents."""
from __future__ import annotations

from datetime import datetime

from app.models.base import MongoModel, PyObjectId


class Notification(MongoModel):
    user_id: PyObjectId
    type: str
    title: str
    body: str | None = None
    link: str | None = None
    read: bool = False


class Session(MongoModel):
    user_id: PyObjectId
    jti: str
    user_agent: str | None = None
    ip: str | None = None
    revoked: bool = False
    expires_at: datetime


class SavedJob(MongoModel):
    student_id: PyObjectId
    job_id: PyObjectId
