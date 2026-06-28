"""Admin moderation, verification, and user management."""
from __future__ import annotations

from app.core.exceptions import NotFoundError
from app.models.enums import ApprovalStatus, JobStatus, UserStatus
from app.repositories.company_repo import CompanyRepository
from app.repositories.job_repo import JobRepository
from app.repositories.user_repo import (
    RecruiterProfileRepository,
    UserRepository,
)
from app.services.notification_service import NotificationService


class AdminService:
    def __init__(
        self,
        users: UserRepository,
        recruiters: RecruiterProfileRepository,
        companies: CompanyRepository,
        jobs: JobRepository,
        notifications: NotificationService,
    ) -> None:
        self.users = users
        self.recruiters = recruiters
        self.companies = companies
        self.jobs = jobs
        self.notifications = notifications

    async def list_users(self, *, role: str | None = None, limit: int = 50, skip: int = 0):
        query = {"role": role} if role else {}
        items = await self.users.find(query, sort=[("created_at", -1)], limit=limit, skip=skip)
        total = await self.users.count(query)
        return {"items": [u.model_dump(mode="json", exclude={"password_hash"}) for u in items],
                "total": total, "limit": limit, "skip": skip,
                "has_more": skip + len(items) < total}

    async def set_user_status(self, user_id: str, status: UserStatus):
        user = await self.users.set_status(user_id, status)
        if not user:
            raise NotFoundError("User not found.")
        return user

    async def pending_recruiters(self):
        return await self.recruiters.list_pending()

    async def verify_recruiter(self, profile_id: str, verified: bool = True):
        profile = await self.recruiters.update(profile_id, {"verified": verified})
        if not profile:
            raise NotFoundError("Recruiter profile not found.")
        await self.notifications.notify(
            profile.user_id,
            type_="recruiter.verified",
            title="Recruiter verified" if verified else "Verification declined",
            body="You can now post jobs." if verified else "Please resubmit your documents.",
        )
        return profile

    async def pending_companies(self):
        return await self.companies.list_pending()

    async def moderate_company(self, company_id: str, approve: bool):
        status = ApprovalStatus.APPROVED if approve else ApprovalStatus.REJECTED
        company = await self.companies.update(company_id, {"approval_status": status.value})
        if not company:
            raise NotFoundError("Company not found.")
        await self.notifications.notify(
            company.owner_id,
            type_="company.moderated",
            title=f"Company {status.value}",
            body=f"{company.name} was {status.value}.",
        )
        return company

    async def moderation_queue(self):
        return await self.jobs.find(
            {"status": JobStatus.PENDING_MODERATION.value}, sort=[("created_at", 1)], limit=100
        )

    async def moderate_job(self, job_id: str, approve: bool):
        status = JobStatus.PUBLISHED if approve else JobStatus.REJECTED
        job = await self.jobs.update(job_id, {"status": status.value})
        if not job:
            raise NotFoundError("Job not found.")
        await self.notifications.notify(
            job.posted_by,
            type_="job.moderated",
            title=f"Job {status.value}",
            body=f"'{job.title}' was {status.value}.",
            link=f"/recruiter/jobs/{job.id}",
        )
        return job
