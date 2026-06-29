"""FastAPI dependency wiring: DB handle, repositories, services, and RBAC guards.

This module is the composition root. Routers depend only on these providers,
never constructing repositories/services themselves.
"""
from __future__ import annotations

from collections.abc import Callable

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.cache import Cache
from app.core.security import ACCESS, decode_token
from app.models.enums import Role, UserStatus
from app.models.user import User
from app.repositories.application_repo import ApplicationRepository
from app.repositories.company_repo import CompanyRepository
from app.repositories.job_repo import JobRepository
from app.repositories.misc_repo import (
    InterviewRepository,
    NotificationRepository,
    ResumeRepository,
    SavedJobRepository,
)
from app.repositories.user_repo import (
    RecruiterProfileRepository,
    SessionRepository,
    StudentProfileRepository,
    UserRepository,
)
from app.services.admin_service import AdminService
from app.services.application_service import ApplicationService
from app.services.auth_service import AuthService
from app.services.company_service import CompanyService
from app.services.dashboard_service import DashboardService
from app.services.job_service import JobService
from app.services.notification_service import NotificationService
from app.services.profile_service import ProfileService
from app.services.resume_service import ResumeService

_bearer = HTTPBearer(auto_error=False)


def db() -> AsyncIOMotorDatabase:
    return get_database()


# ---------- Repository providers ----------
def user_repo(database: AsyncIOMotorDatabase = Depends(db)) -> UserRepository:
    return UserRepository(database)


def student_repo(database: AsyncIOMotorDatabase = Depends(db)) -> StudentProfileRepository:
    return StudentProfileRepository(database)


def recruiter_repo(database: AsyncIOMotorDatabase = Depends(db)) -> RecruiterProfileRepository:
    return RecruiterProfileRepository(database)


def session_repo(database: AsyncIOMotorDatabase = Depends(db)) -> SessionRepository:
    return SessionRepository(database)


def company_repo(database: AsyncIOMotorDatabase = Depends(db)) -> CompanyRepository:
    return CompanyRepository(database)


def job_repo(database: AsyncIOMotorDatabase = Depends(db)) -> JobRepository:
    return JobRepository(database)


def application_repo(database: AsyncIOMotorDatabase = Depends(db)) -> ApplicationRepository:
    return ApplicationRepository(database)


def resume_repo(database: AsyncIOMotorDatabase = Depends(db)) -> ResumeRepository:
    return ResumeRepository(database)


def interview_repo(database: AsyncIOMotorDatabase = Depends(db)) -> InterviewRepository:
    return InterviewRepository(database)


def notification_repo(database: AsyncIOMotorDatabase = Depends(db)) -> NotificationRepository:
    return NotificationRepository(database)


def saved_job_repo(database: AsyncIOMotorDatabase = Depends(db)) -> SavedJobRepository:
    return SavedJobRepository(database)


# ---------- Service providers ----------
def get_auth_service(
    users: UserRepository = Depends(user_repo),
    students: StudentProfileRepository = Depends(student_repo),
    recruiters: RecruiterProfileRepository = Depends(recruiter_repo),
    sessions: SessionRepository = Depends(session_repo),
) -> AuthService:
    return AuthService(users, students, recruiters, sessions)


def get_notification_service(
    notifications: NotificationRepository = Depends(notification_repo),
) -> NotificationService:
    return NotificationService(notifications)


def get_profile_service(
    students: StudentProfileRepository = Depends(student_repo),
    recruiters: RecruiterProfileRepository = Depends(recruiter_repo),
    users: UserRepository = Depends(user_repo),
    resumes: ResumeRepository = Depends(resume_repo),
    applications: ApplicationRepository = Depends(application_repo),
) -> ProfileService:
    return ProfileService(students, recruiters, users, resumes, applications)


def get_company_service(
    companies: CompanyRepository = Depends(company_repo),
    recruiters: RecruiterProfileRepository = Depends(recruiter_repo),
    users: UserRepository = Depends(user_repo),
) -> CompanyService:
    return CompanyService(companies, recruiters, users)


def get_job_service(
    jobs: JobRepository = Depends(job_repo),
    companies: CompanyRepository = Depends(company_repo),
    recruiters: RecruiterProfileRepository = Depends(recruiter_repo),
    students: StudentProfileRepository = Depends(student_repo),
) -> JobService:
    return JobService(jobs, companies, recruiters, students)


def get_application_service(
    applications: ApplicationRepository = Depends(application_repo),
    jobs: JobRepository = Depends(job_repo),
    resumes: ResumeRepository = Depends(resume_repo),
    students: StudentProfileRepository = Depends(student_repo),
    notifications: NotificationService = Depends(get_notification_service),
) -> ApplicationService:
    return ApplicationService(applications, jobs, resumes, students, notifications)


def get_resume_service(
    resumes: ResumeRepository = Depends(resume_repo),
    students: StudentProfileRepository = Depends(student_repo),
    jobs: JobRepository = Depends(job_repo),
) -> ResumeService:
    return ResumeService(resumes, students, jobs)


def get_dashboard_service(
    users: UserRepository = Depends(user_repo),
    students: StudentProfileRepository = Depends(student_repo),
    recruiters: RecruiterProfileRepository = Depends(recruiter_repo),
    companies: CompanyRepository = Depends(company_repo),
    jobs: JobRepository = Depends(job_repo),
    applications: ApplicationRepository = Depends(application_repo),
    interviews: InterviewRepository = Depends(interview_repo),
    notifications: NotificationRepository = Depends(notification_repo),
) -> DashboardService:
    return DashboardService(
        users, students, recruiters, companies, jobs, applications, interviews, notifications
    )


def get_admin_service(
    users: UserRepository = Depends(user_repo),
    recruiters: RecruiterProfileRepository = Depends(recruiter_repo),
    companies: CompanyRepository = Depends(company_repo),
    jobs: JobRepository = Depends(job_repo),
    notifications: NotificationService = Depends(get_notification_service),
) -> AdminService:
    return AdminService(users, recruiters, companies, jobs, notifications)


# ---------- Auth + RBAC ----------
async def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
    users: UserRepository = Depends(user_repo),
) -> User:
    if creds is None:
        raise UnauthorizedError("Authentication required.")
    payload = decode_token(creds.credentials, expected_type=ACCESS)
    user_id = payload.get("sub", "")

    # cache the lightweight identity to avoid a DB hit on every request
    cache_key = f"user:{user_id}"
    cached = await Cache.get(cache_key)
    if cached:
        user = User.model_validate(cached)
    else:
        user = await users.get(user_id)
        if not user:
            raise UnauthorizedError("User not found.")
        await Cache.set(cache_key, user.model_dump(mode="json"), ttl=30)

    if user.status in (UserStatus.SUSPENDED, UserStatus.BANNED):
        raise ForbiddenError("Account access has been restricted.")
    return user


def require_role(*roles: Role) -> Callable:
    allowed = set(roles)

    async def _guard(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed:
            raise ForbiddenError("You do not have permission to perform this action.")
        return user

    return _guard
