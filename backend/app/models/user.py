"""User identity + role-specific profile documents."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.base import MongoModel, PyObjectId
from app.models.enums import Role, UserStatus


class User(MongoModel):
    email: EmailStr
    password_hash: str
    role: Role = Role.STUDENT
    full_name: str
    avatar_url: str | None = None
    status: UserStatus = UserStatus.ACTIVE
    email_verified: bool = False
    onboarding_completed: bool = False
    company_id: PyObjectId | None = None
    last_login_at: datetime | None = None


class Education(BaseModel):
    institution: str
    degree: str
    field: str | None = None
    start: int | None = None
    end: int | None = None
    cgpa: float | None = None


class Experience(BaseModel):
    company: str
    title: str
    start: datetime | None = None
    end: datetime | None = None
    summary: str | None = None


class Project(BaseModel):
    title: str
    url: str | None = None
    description: str | None = None


class StudentPreferences(BaseModel):
    roles: list[str] = Field(default_factory=list)
    locations: list[str] = Field(default_factory=list)
    job_types: list[str] = Field(default_factory=list)


class StudentProfile(MongoModel):
    user_id: PyObjectId
    headline: str | None = None
    location: str | None = None
    phone: str | None = None
    education: list[Education] = Field(default_factory=list)
    experience: list[Experience] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    projects: list[Project] = Field(default_factory=list)
    links: dict[str, str] = Field(default_factory=dict)
    preferences: StudentPreferences = Field(default_factory=StudentPreferences)
    profile_strength: int = 0
    placement_readiness: int = 0
    active_resume_id: PyObjectId | None = None


class RecruiterProfile(MongoModel):
    user_id: PyObjectId
    company_id: PyObjectId | None = None
    title: str | None = None
    verified: bool = False
    verification_doc_url: str | None = None
    permissions: list[str] = Field(default_factory=lambda: ["post_jobs", "manage_pipeline"])
