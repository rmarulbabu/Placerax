"""Dashboard aggregation for each role. Cached per user/role."""
from __future__ import annotations

from app.core.redis import Cache
from app.models.enums import ApprovalStatus, JobStatus, UserStatus
from app.repositories.application_repo import ApplicationRepository
from app.repositories.company_repo import CompanyRepository
from app.repositories.job_repo import JobRepository
from app.repositories.misc_repo import InterviewRepository, NotificationRepository
from app.repositories.user_repo import (
    RecruiterProfileRepository,
    StudentProfileRepository,
    UserRepository,
)


class DashboardService:
    def __init__(
        self,
        users: UserRepository,
        students: StudentProfileRepository,
        recruiters: RecruiterProfileRepository,
        companies: CompanyRepository,
        jobs: JobRepository,
        applications: ApplicationRepository,
        interviews: InterviewRepository,
        notifications: NotificationRepository,
    ) -> None:
        self.users = users
        self.students = students
        self.recruiters = recruiters
        self.companies = companies
        self.jobs = jobs
        self.applications = applications
        self.interviews = interviews
        self.notifications = notifications

    async def student(self, user_id: str) -> dict:
        key = f"dash:student:{user_id}"
        if (cached := await Cache.get(key)) is not None:
            return cached

        profile = await self.students.get_by_user(user_id)
        apps = await self.applications.list_for_student(user_id)
        interviews = await self.interviews.list_for_student(user_id)
        active_resume_score = 0
        if profile and profile.active_resume_id:
            from app.core.database import get_database
            from app.repositories.misc_repo import ResumeRepository

            resume = await ResumeRepository(get_database()).get(profile.active_resume_id)
            if resume:
                active_resume_score = resume.analysis.score

        stage_counts: dict[str, int] = {}
        for a in apps:
            stage_counts[a.stage.value] = stage_counts.get(a.stage.value, 0) + 1

        widgets = {
            "profile_completion": profile.profile_strength if profile else 0,
            "placement_readiness": profile.placement_readiness if profile else 0,
            "resume_score": active_resume_score,
            "applications_sent": len(apps),
            "interview_invites": len(interviews),
            "stage_breakdown": stage_counts,
            "skills": profile.skills[:12] if profile else [],
        }
        await Cache.set(key, widgets, ttl=60)
        return widgets

    async def recruiter(self, company_id: str | None) -> dict:
        if not company_id:
            return {"active_jobs": 0, "applicants": 0, "funnel": {}, "interviews": 0}
        key = f"dash:recruiter:{company_id}"
        if (cached := await Cache.get(key)) is not None:
            return cached

        active_jobs = await self.jobs.count(
            {"company_id": company_id, "status": JobStatus.PUBLISHED.value}
        )
        applicants = await self.applications.count({"company_id": company_id})
        funnel = await self.applications.company_stage_counts(company_id)
        interviews = await self.interviews.list_for_company(company_id)

        widgets = {
            "active_jobs": active_jobs,
            "applicants": applicants,
            "funnel": funnel,
            "interview_pipeline": len(interviews),
        }
        await Cache.set(key, widgets, ttl=60)
        return widgets

    async def admin(self) -> dict:
        key = "dash:admin"
        if (cached := await Cache.get(key)) is not None:
            return cached

        total_users = await self.users.count({})
        active_users = await self.users.count({"status": UserStatus.ACTIVE.value})
        students = await self.users.count({"role": "student"})
        recruiters = await self.users.count({"role": "recruiter"})
        jobs_posted = await self.jobs.count({})
        published_jobs = await self.jobs.count({"status": JobStatus.PUBLISHED.value})
        applications = await self.applications.count({})
        pending_companies = await self.companies.count(
            {"approval_status": ApprovalStatus.PENDING.value}
        )

        widgets = {
            "total_users": total_users,
            "active_users": active_users,
            "students": students,
            "recruiters": recruiters,
            "jobs_posted": jobs_posted,
            "published_jobs": published_jobs,
            "applications_submitted": applications,
            "pending_company_approvals": pending_companies,
            # placeholder revenue metric (wire to billing provider in production)
            "mrr_estimate": recruiters * 49,
        }
        await Cache.set(key, widgets, ttl=120)
        return widgets
