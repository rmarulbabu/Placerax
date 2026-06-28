"""Job posting document."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.models.base import MongoModel, PyObjectId
from app.models.enums import DEFAULT_PIPELINE, JobStatus, JobType, Workplace


class Salary(BaseModel):
    min: int | None = None
    max: int | None = None
    currency: str = "INR"
    period: str = "month"  # month | year | hour | stipend


class JobStats(BaseModel):
    views: int = 0
    applicants: int = 0


class Job(MongoModel):
    company_id: PyObjectId
    posted_by: PyObjectId
    title: str
    slug: str
    type: JobType = JobType.INTERNSHIP
    workplace: Workplace = Workplace.REMOTE
    location: str | None = None
    description: str
    responsibilities: list[str] = Field(default_factory=list)
    requirements: list[str] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    experience_level: str = "entry"
    salary: Salary = Field(default_factory=Salary)
    openings: int = 1
    deadline: datetime | None = None
    status: JobStatus = JobStatus.DRAFT
    pipeline_stages: list[str] = Field(default_factory=lambda: list(DEFAULT_PIPELINE))
    stats: JobStats = Field(default_factory=JobStats)
