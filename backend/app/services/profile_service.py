"""Student & recruiter profile management + strength computation."""
from __future__ import annotations

from app.core.exceptions import NotFoundError
from app.models.user import StudentProfile
from app.repositories.application_repo import ApplicationRepository
from app.repositories.misc_repo import ResumeRepository
from app.repositories.user_repo import (
    RecruiterProfileRepository,
    StudentProfileRepository,
    UserRepository,
)
from app.schemas.company import OnboardingRequest, StudentProfileUpdate
from app.services import ai_engine


class ProfileService:
    def __init__(
        self,
        students: StudentProfileRepository,
        recruiters: RecruiterProfileRepository,
        users: UserRepository,
        resumes: ResumeRepository,
        applications: ApplicationRepository,
    ) -> None:
        self.students = students
        self.recruiters = recruiters
        self.users = users
        self.resumes = resumes
        self.applications = applications

    async def get_student(self, user_id: str) -> StudentProfile:
        profile = await self.students.get_by_user(user_id)
        if not profile:
            raise NotFoundError("Student profile not found.")
        return profile

    async def _recompute(self, profile: StudentProfile) -> StudentProfile:
        data = profile.model_dump()
        strength = ai_engine.profile_strength(data)
        apps = await self.applications.count({"student_id": profile.user_id})
        resume_ats = 0
        if profile.active_resume_id:
            resume = await self.resumes.get(profile.active_resume_id)
            if resume:
                resume_ats = resume.analysis.ats_score
        readiness = ai_engine.placement_readiness(
            data, applications=apps, resume_ats=resume_ats
        )
        updated = await self.students.update(
            str(profile.id),
            {"profile_strength": strength, "placement_readiness": readiness},
        )
        return updated or profile

    async def update_student(self, user_id: str, data: StudentProfileUpdate) -> StudentProfile:
        profile = await self.get_student(user_id)
        changes = data.model_dump(exclude_none=True)
        if "skills" in changes:
            changes["skills"] = [s.lower().strip() for s in changes["skills"]]
        updated = await self.students.update(str(profile.id), changes)
        return await self._recompute(updated or profile)

    async def complete_onboarding(self, user_id: str, data: OnboardingRequest) -> StudentProfile:
        profile = await self.get_student(user_id)
        await self.students.update(
            str(profile.id),
            {
                "headline": data.headline,
                "location": data.location,
                "skills": [s.lower().strip() for s in data.skills],
                "education": [e.model_dump() for e in data.education],
                "preferences": data.preferences.model_dump(),
            },
        )
        await self.users.update(user_id, {"onboarding_completed": True})
        refreshed = await self.get_student(user_id)
        return await self._recompute(refreshed)
