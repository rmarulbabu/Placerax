"""Enumerations shared across the domain."""
from __future__ import annotations

from enum import Enum


class Role(str, Enum):
    STUDENT = "student"
    RECRUITER = "recruiter"
    ADMIN = "admin"


class UserStatus(str, Enum):
    ACTIVE = "active"
    PENDING = "pending"
    SUSPENDED = "suspended"
    BANNED = "banned"


class JobType(str, Enum):
    INTERNSHIP = "internship"
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"


class Workplace(str, Enum):
    REMOTE = "remote"
    ONSITE = "onsite"
    HYBRID = "hybrid"


class JobStatus(str, Enum):
    DRAFT = "draft"
    PENDING_MODERATION = "pending_moderation"
    PUBLISHED = "published"
    CLOSED = "closed"
    REJECTED = "rejected"


class ApplicationStage(str, Enum):
    APPLIED = "applied"
    SCREENING = "screening"
    INTERVIEW = "interview"
    OFFER = "offer"
    HIRED = "hired"
    REJECTED = "rejected"


DEFAULT_PIPELINE: list[str] = [
    ApplicationStage.APPLIED.value,
    ApplicationStage.SCREENING.value,
    ApplicationStage.INTERVIEW.value,
    ApplicationStage.OFFER.value,
    ApplicationStage.HIRED.value,
    ApplicationStage.REJECTED.value,
]


class ApplicationStatus(str, Enum):
    ACTIVE = "active"
    WITHDRAWN = "withdrawn"
    REJECTED = "rejected"
    HIRED = "hired"


class ApprovalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class InterviewType(str, Enum):
    SCREENING = "screening"
    TECHNICAL = "technical"
    HR = "hr"
    MANAGERIAL = "managerial"


class InterviewStatus(str, Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"
