"""Company + profile request/response schemas."""
from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.user import Education, Experience, Project, StudentPreferences


class CompanyCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    website: str | None = None
    industry: str | None = None
    size: str | None = None
    about: str | None = None
    locations: list[str] = Field(default_factory=list)


class CompanyUpdate(BaseModel):
    name: str | None = None
    logo_url: str | None = None
    website: str | None = None
    industry: str | None = None
    size: str | None = None
    about: str | None = None
    locations: list[str] | None = None


class StudentProfileUpdate(BaseModel):
    headline: str | None = None
    location: str | None = None
    phone: str | None = None
    education: list[Education] | None = None
    experience: list[Experience] | None = None
    skills: list[str] | None = None
    projects: list[Project] | None = None
    links: dict[str, str] | None = None
    preferences: StudentPreferences | None = None


class OnboardingRequest(BaseModel):
    headline: str
    location: str
    skills: list[str]
    education: list[Education] = Field(default_factory=list)
    preferences: StudentPreferences = Field(default_factory=StudentPreferences)
