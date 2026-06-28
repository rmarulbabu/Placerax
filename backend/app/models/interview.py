"""Interview scheduling document."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.models.base import MongoModel, PyObjectId
from app.models.enums import InterviewStatus, InterviewType


class InterviewFeedback(BaseModel):
    interviewer_id: PyObjectId
    rating: int = 0
    recommendation: str = "maybe"  # yes | no | maybe
    notes: str | None = None


class Interview(MongoModel):
    application_id: PyObjectId
    job_id: PyObjectId
    company_id: PyObjectId
    student_id: PyObjectId
    scheduled_by: PyObjectId
    type: InterviewType = InterviewType.TECHNICAL
    mode: str = "video"
    start_at: datetime
    duration_min: int = 45
    meeting_url: str | None = None
    panel: list[PyObjectId] = Field(default_factory=list)
    status: InterviewStatus = InterviewStatus.SCHEDULED
    feedback: list[InterviewFeedback] = Field(default_factory=list)
