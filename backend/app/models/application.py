"""Application (core ATS object) document."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.models.base import MongoModel, PyObjectId, utcnow
from app.models.enums import ApplicationStage, ApplicationStatus


class ApplicationNote(BaseModel):
    author_id: PyObjectId
    body: str
    created_at: datetime = Field(default_factory=utcnow)


class StageEvent(BaseModel):
    stage: str
    by: PyObjectId | None = None
    at: datetime = Field(default_factory=utcnow)


class QAItem(BaseModel):
    question: str
    answer: str


class Application(MongoModel):
    job_id: PyObjectId
    company_id: PyObjectId
    student_id: PyObjectId
    resume_id: PyObjectId | None = None
    stage: ApplicationStage = ApplicationStage.APPLIED
    status: ApplicationStatus = ApplicationStatus.ACTIVE
    match_score: int = 0
    ats_score: int = 0
    cover_letter: str | None = None
    answers: list[QAItem] = Field(default_factory=list)
    ranking: int | None = None
    notes: list[ApplicationNote] = Field(default_factory=list)
    stage_history: list[StageEvent] = Field(default_factory=list)
