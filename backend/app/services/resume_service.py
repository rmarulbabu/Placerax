"""Resume upload, parsing, analysis, and AI career tools."""
from __future__ import annotations

from app.core.exceptions import NotFoundError
from app.core.storage import upload_file
from app.models.resume import Resume, ResumeAnalysis
from app.repositories.job_repo import JobRepository
from app.repositories.misc_repo import ResumeRepository
from app.repositories.user_repo import StudentProfileRepository
from app.services import ai_engine


def _extract_text(content: bytes, filename: str) -> str:
    """Best-effort text extraction. PDF parsing is pluggable; here we decode text."""
    try:
        return content.decode("utf-8", errors="ignore")
    except Exception:  # pragma: no cover
        return ""


class ResumeService:
    def __init__(
        self,
        resumes: ResumeRepository,
        students: StudentProfileRepository,
        jobs: JobRepository,
    ) -> None:
        self.resumes = resumes
        self.students = students
        self.jobs = jobs

    async def upload(self, student_id: str, content: bytes, filename: str) -> Resume:
        url = await upload_file(content, folder=f"resumes/{student_id}", filename=filename)
        text = _extract_text(content, filename)
        profile = await self.students.get_by_user(student_id)
        skills = profile.skills if profile else []

        analysis = ai_engine.analyze_resume(text, skills)
        resume = await self.resumes.insert(
            Resume(
                student_id=student_id,
                file_url=url,
                file_name=filename,
                parsed={"text": text[:20000], "skills": skills},
                analysis=ResumeAnalysis(**analysis),
            )
        )
        return resume

    async def list(self, student_id: str) -> list[Resume]:
        return await self.resumes.list_for_student(student_id)

    async def get(self, resume_id: str, student_id: str) -> Resume:
        resume = await self.resumes.get(resume_id)
        if not resume or resume.student_id != student_id:
            raise NotFoundError("Resume not found.")
        return resume

    async def activate(self, resume_id: str, student_id: str) -> Resume:
        resume = await self.get(resume_id, student_id)
        await self.resumes.deactivate_all(student_id)
        await self.resumes.update(resume_id, {"is_active": True})
        profile = await self.students.get_by_user(student_id)
        if profile:
            await self.students.update(str(profile.id), {"active_resume_id": resume_id})
        refreshed = await self.resumes.get(resume_id)
        assert refreshed
        return refreshed

    async def reanalyze(self, resume_id: str, student_id: str,
                        job_id: str | None = None) -> Resume:
        resume = await self.get(resume_id, student_id)
        job_skills = None
        if job_id:
            job = await self.jobs.get(job_id)
            job_skills = job.skills if job else None
        profile = await self.students.get_by_user(student_id)
        skills = profile.skills if profile else resume.parsed.get("skills", [])
        analysis = ai_engine.analyze_resume(
            resume.parsed.get("text", ""), skills, job_skills
        )
        await self.resumes.update(resume_id, {"analysis": analysis})
        refreshed = await self.resumes.get(resume_id)
        assert refreshed
        return refreshed

    # ---- AI career tools ----
    async def skill_gap(self, student_id: str, target_skills: list[str]) -> dict:
        profile = await self.students.get_by_user(student_id)
        return ai_engine.skill_gap(profile.skills if profile else [], target_skills)

    async def roadmap(self, student_id: str, target_role: str,
                      target_skills: list[str]) -> dict:
        profile = await self.students.get_by_user(student_id)
        skills = profile.skills if profile else []
        gap = ai_engine.skill_gap(skills, target_skills)
        return ai_engine.career_roadmap(target_role, skills, gap["missing"])
