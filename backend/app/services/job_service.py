"""Job posting, moderation, search, and recommendations."""
from __future__ import annotations

from app.core.exceptions import ForbiddenError, NotFoundError, ValidationError
from app.core.redis import Cache
from app.core.utils import unique_slug
from app.models.enums import ApprovalStatus, JobStatus
from app.models.job import Job
from app.models.user import User
from app.repositories.company_repo import CompanyRepository
from app.repositories.job_repo import JobRepository
from app.repositories.user_repo import RecruiterProfileRepository, StudentProfileRepository
from app.schemas.job import JobCreate, JobUpdate
from app.services import ai_engine


class JobService:
    def __init__(
        self,
        jobs: JobRepository,
        companies: CompanyRepository,
        recruiters: RecruiterProfileRepository,
        students: StudentProfileRepository,
    ) -> None:
        self.jobs = jobs
        self.companies = companies
        self.recruiters = recruiters
        self.students = students

    async def _assert_can_post(self, recruiter: User) -> str:
        profile = await self.recruiters.get_by_user(str(recruiter.id))
        if not profile or not profile.company_id:
            raise ValidationError("Create a company workspace before posting jobs.")
        if not profile.verified:
            raise ForbiddenError("Your recruiter account must be verified to post jobs.")
        company = await self.companies.get(profile.company_id)
        if not company or company.approval_status != ApprovalStatus.APPROVED:
            raise ForbiddenError("Your company must be approved before posting jobs.")
        return profile.company_id

    async def create(self, data: JobCreate, recruiter: User) -> Job:
        company_id = await self._assert_can_post(recruiter)
        job = await self.jobs.insert(
            Job(
                company_id=company_id,
                posted_by=str(recruiter.id),
                slug=unique_slug(data.title),
                title=data.title,
                type=data.type,
                workplace=data.workplace,
                location=data.location,
                description=data.description,
                responsibilities=data.responsibilities,
                requirements=data.requirements,
                skills=[s.lower() for s in data.skills],
                experience_level=data.experience_level,
                salary=data.salary,
                openings=data.openings,
                deadline=data.deadline,
                status=JobStatus.DRAFT,
            )
        )
        return job

    async def get_by_slug(self, slug: str) -> Job:
        job = await self.jobs.get_by_slug(slug)
        if not job:
            raise NotFoundError("Job not found.")
        await self.jobs.inc(str(job.id), "stats.views")
        return job

    async def _owned(self, job_id: str, recruiter: User) -> Job:
        job = await self.jobs.get(job_id)
        if not job:
            raise NotFoundError("Job not found.")
        if job.posted_by != str(recruiter.id) and job.company_id != recruiter.company_id:
            raise ForbiddenError("You cannot manage this job.")
        return job

    async def update(self, job_id: str, data: JobUpdate, recruiter: User) -> Job:
        await self._owned(job_id, recruiter)
        changes = data.model_dump(exclude_none=True)
        if "skills" in changes:
            changes["skills"] = [s.lower() for s in changes["skills"]]
        updated = await self.jobs.update(job_id, changes)
        assert updated
        return updated

    async def publish(self, job_id: str, recruiter: User) -> Job:
        await self._owned(job_id, recruiter)
        # goes to moderation queue before being publicly listed
        updated = await self.jobs.update(job_id, {"status": JobStatus.PENDING_MODERATION.value})
        assert updated
        return updated

    async def close(self, job_id: str, recruiter: User) -> Job:
        await self._owned(job_id, recruiter)
        updated = await self.jobs.update(job_id, {"status": JobStatus.CLOSED.value})
        assert updated
        return updated

    async def list_for_company(self, company_id: str | None) -> list[Job]:
        if not company_id:
            return []
        return await self.jobs.find(
            {"company_id": company_id}, sort=[("created_at", -1)], limit=200
        )

    async def search(self, *, limit: int = 20, skip: int = 0, **filters) -> dict:
        query = self.jobs.build_query(**filters)
        items = await self.jobs.search(query, limit=limit, skip=skip)
        total = await self.jobs.count(query)
        return {
            "items": [j.model_dump(mode="json") for j in items],
            "total": total,
            "limit": limit,
            "skip": skip,
            "has_more": skip + len(items) < total,
        }

    async def recommend_for_student(self, user_id: str, *, limit: int = 12) -> list[dict]:
        cache_key = f"reco:jobs:{user_id}"
        cached = await Cache.get(cache_key)
        if cached:
            return cached

        profile = await self.students.get_by_user(user_id)
        skills = profile.skills if profile else []
        prefs = profile.preferences if profile else None

        query = self.jobs.build_query(status=JobStatus.PUBLISHED.value)
        if skills:
            query["skills"] = {"$in": skills}
        if prefs and prefs.job_types:
            query["type"] = {"$in": prefs.job_types}

        candidates = await self.jobs.search(query, limit=60)
        if not candidates:
            candidates = await self.jobs.search(
                {"status": JobStatus.PUBLISHED.value}, limit=limit
            )

        ranked = []
        for job in candidates:
            score = ai_engine.match_score(skills, job.skills, job.description)
            data = job.model_dump(mode="json")
            data["match_score"] = score
            ranked.append(data)
        ranked.sort(key=lambda d: d["match_score"], reverse=True)
        result = ranked[:limit]
        await Cache.set(cache_key, result, ttl=600)
        return result
