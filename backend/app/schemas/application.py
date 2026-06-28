"""Application request/response schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.models.application import QAItem
from app.models.enums import ApplicationStage


class ApplicationCreate(BaseModel):
    job_id: str
    resume_id: str | None = None
    cover_letter: str | None = None
    answers: list[QAItem] = Field(default_factory=list)


class StageUpdate(BaseModel):
    stage: ApplicationStage


class RankUpdate(BaseModel):
    ranking: int = Field(ge=0)


class NoteCreate(BaseModel):
    body: str = Field(min_length=1, max_length=2000)


class ApplicationOut(BaseModel):
    id: str
    job_id: str
    company_id: str
    student_id: str
    stage: str
    status: str
    match_score: int
    ats_score: int
    ranking: int | None = None
    created_at: datetime
