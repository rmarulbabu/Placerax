"""Job request/response schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import JobType, Workplace
from app.models.job import Salary


class JobCreate(BaseModel):
    title: str = Field(min_length=3, max_length=160)
    type: JobType = JobType.INTERNSHIP
    workplace: Workplace = Workplace.REMOTE
    location: str | None = None
    description: str = Field(min_length=20)
    responsibilities: list[str] = Field(default_factory=list)
    requirements: list[str] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    experience_level: str = "entry"
    salary: Salary = Field(default_factory=Salary)
    openings: int = Field(default=1, ge=1)
    deadline: datetime | None = None


class JobUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    responsibilities: list[str] | None = None
    requirements: list[str] | None = None
    skills: list[str] | None = None
    salary: Salary | None = None
    openings: int | None = None
    deadline: datetime | None = None


class JobOut(BaseModel):
    id: str
    company_id: str
    title: str
    slug: str
    type: str
    workplace: str
    location: str | None = None
    description: str
    responsibilities: list[str]
    requirements: list[str]
    skills: list[str]
    experience_level: str
    salary: Salary
    openings: int
    deadline: datetime | None = None
    status: str
    stats: dict
    created_at: datetime
