"""Company workspace document."""
from __future__ import annotations

from pydantic import Field

from app.models.base import MongoModel, PyObjectId
from app.models.enums import ApprovalStatus


class Company(MongoModel):
    name: str
    slug: str
    logo_url: str | None = None
    website: str | None = None
    industry: str | None = None
    size: str | None = None
    about: str | None = None
    locations: list[str] = Field(default_factory=list)
    approval_status: ApprovalStatus = ApprovalStatus.PENDING
    owner_id: PyObjectId
    team: list[PyObjectId] = Field(default_factory=list)
