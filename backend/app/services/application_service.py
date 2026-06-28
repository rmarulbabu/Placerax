"""Application / ATS pipeline service — the product core."""
from __future__ import annotations

from app.core.exceptions import (
    ConflictError,
    ForbiddenError,
    NotFoundError,
    ValidationError,
)
from app.models.application import Application, ApplicationNote, StageEvent
from app.models.enums import ApplicationStage, ApplicationStatus, JobStatus, Role
from app.models.user import User
from app.repositories.application_repo import ApplicationRepository
from app.repositories.job_repo import JobRepository
from app.repositories.misc_repo import ResumeRepository
from app.repositories.user_repo import StudentProfileRepository
from app.schemas.application import ApplicationCreate
from app.services import ai_engine
from app.services.notification_service import NotificationService


class ApplicationService:
    def __init__(
        self,
        applications: ApplicationRepository,
        jobs: JobRepository,
        resumes: ResumeRepository,
        students: StudentProfileRepository,
        notifications: NotificationService,
    ) -> None:
        self.applications = applications
        self.jobs = jobs
        self.resumes = resumes
        self.students = students
        self.notifications = notifications

    async def apply(self, data: ApplicationCreate, student: User) -> Application:
        job = await self.jobs.get(data.job_id)
        if not job:
            raise NotFoundError("Job not found.")
        if job.status != JobStatus.PUBLISHED:
            raise ValidationError("This job is not accepting applications.")

        existing = await self.applications.get_for_pair(data.job_id, str(student.id))
        if existing:
            raise ConflictError("You have already applied to this job.")

        profile = await self.students.get_by_user(str(student.id))
        skills = profile.skills if profile else []
        resume_id = data.resume_id or (profile.active_resume_id if profile else None)

        match = ai_engine.match_score(skills, job.skills, job.description)
        ats = match
        if resume_id:
            resume = await self.resumes.get(resume_id)
            if resume:
                analysis = ai_engine.analyze_resume(
                    resume.parsed.get("text", ""), skills, job.skills
                )
                ats = analysis["ats_score"]

        application = await self.applications.insert(
            Application(
                job_id=str(job.id),
                company_id=job.company_id,
                student_id=str(student.id),
                resume_id=resume_id,
                stage=ApplicationStage.APPLIED,
                match_score=match,
                ats_score=ats,
                cover_letter=data.cover_letter,
                answers=data.answers,
                stage_history=[StageEvent(stage=ApplicationStage.APPLIED.value,
                                          by=str(student.id))],
            )
        )
        await self.jobs.inc(str(job.id), "stats.applicants")

        # notify the recruiter who posted the job
        await self.notifications.notify(
            job.posted_by,
            type_="application.created",
            title="New applicant",
            body=f"{student.full_name} applied to {job.title}.",
            link=f"/recruiter/jobs/{job.id}/pipeline",
        )
        return application

    async def list_for_student(self, student_id: str) -> list[Application]:
        return await self.applications.list_for_student(student_id)

    async def get(self, application_id: str, actor: User) -> Application:
        app = await self.applications.get(application_id)
        if not app:
            raise NotFoundError("Application not found.")
        if actor.role == Role.STUDENT and app.student_id != str(actor.id):
            raise ForbiddenError("Not your application.")
        if actor.role == Role.RECRUITER and app.company_id != actor.company_id:
            raise ForbiddenError("Not your company's application.")
        return app

    async def withdraw(self, application_id: str, student: User) -> None:
        app = await self.get(application_id, student)
        await self.applications.update(
            application_id, {"status": ApplicationStatus.WITHDRAWN.value}
        )

    async def list_for_job(self, job_id: str, recruiter: User) -> list[Application]:
        job = await self.jobs.get(job_id)
        if not job:
            raise NotFoundError("Job not found.")
        if job.company_id != recruiter.company_id:
            raise ForbiddenError("Not your company's job.")
        return await self.applications.list_for_job(job_id)

    async def pipeline(self, job_id: str, recruiter: User) -> dict:
        job = await self.jobs.get(job_id)
        if not job:
            raise NotFoundError("Job not found.")
        if job.company_id != recruiter.company_id:
            raise ForbiddenError("Not your company's job.")
        apps = await self.applications.list_for_job(job_id)
        board: dict[str, list[dict]] = {stage: [] for stage in job.pipeline_stages}
        for app in apps:
            board.setdefault(app.stage.value, []).append(app.model_dump(mode="json"))
        return {"job_id": job_id, "stages": job.pipeline_stages, "board": board}

    async def move_stage(
        self, application_id: str, stage: ApplicationStage, recruiter: User
    ) -> Application:
        app = await self.get(application_id, recruiter)
        await self.applications.update(application_id, {"stage": stage.value})
        await self.applications.push(
            application_id, "stage_history",
            StageEvent(stage=stage.value, by=str(recruiter.id)).model_dump(mode="json"),
        )
        # notify student of progress
        await self.notifications.notify(
            app.student_id,
            type_="application.stage_changed",
            title="Application update",
            body=f"Your application advanced to {stage.value.title()}.",
            link=f"/student/applications/{application_id}",
        )
        updated = await self.applications.get(application_id)
        assert updated
        return updated

    async def set_rank(self, application_id: str, ranking: int, recruiter: User) -> Application:
        await self.get(application_id, recruiter)
        updated = await self.applications.update(application_id, {"ranking": ranking})
        assert updated
        return updated

    async def add_note(self, application_id: str, body: str, recruiter: User) -> Application:
        await self.get(application_id, recruiter)
        note = ApplicationNote(author_id=str(recruiter.id), body=body)
        await self.applications.push(application_id, "notes", note.model_dump(mode="json"))
        updated = await self.applications.get(application_id)
        assert updated
        return updated
