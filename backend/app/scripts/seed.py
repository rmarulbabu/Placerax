"""Seed demo data: admin, recruiters, students, an approved company, and jobs.

Run with:  python -m app.scripts.seed
"""
from __future__ import annotations

import asyncio

from app.core.config import settings
from app.core.database import close_mongo_connection, connect_to_mongo, get_database
from app.core.security import hash_password
from app.core.utils import unique_slug
from app.models.application import Application, StageEvent
from app.models.company import Company
from app.models.enums import (
    ApplicationStage,
    ApprovalStatus,
    JobStatus,
    JobType,
    Role,
    UserStatus,
    Workplace,
)
from app.models.job import Job, Salary
from app.models.user import RecruiterProfile, StudentProfile, User
from app.repositories.application_repo import ApplicationRepository
from app.repositories.company_repo import CompanyRepository
from app.repositories.job_repo import JobRepository
from app.repositories.user_repo import (
    RecruiterProfileRepository,
    StudentProfileRepository,
    UserRepository,
)
from app.services import ai_engine


async def seed() -> None:
    await connect_to_mongo()
    db = get_database()
    users = UserRepository(db)
    students = StudentProfileRepository(db)
    recruiters = RecruiterProfileRepository(db)
    companies = CompanyRepository(db)
    jobs = JobRepository(db)
    applications = ApplicationRepository(db)

    print("Seeding Placera demo data...")

    # ---- Admin ----
    if not await users.get_by_email(settings.SEED_ADMIN_EMAIL):
        await users.insert(
            User(
                email=settings.SEED_ADMIN_EMAIL.lower(),
                password_hash=hash_password(settings.SEED_ADMIN_PASSWORD),
                full_name="Platform Admin",
                role=Role.ADMIN,
                status=UserStatus.ACTIVE,
                email_verified=True,
            )
        )
        print(f"  ✓ admin: {settings.SEED_ADMIN_EMAIL} / {settings.SEED_ADMIN_PASSWORD}")

    # ---- Recruiter + approved company ----
    recruiter = await users.get_by_email("recruiter@acme.ai")
    if not recruiter:
        recruiter = await users.insert(
            User(
                email="recruiter@acme.ai",
                password_hash=hash_password("Recruiter@123"),
                full_name="Riya Recruiter",
                role=Role.RECRUITER,
                status=UserStatus.ACTIVE,
                email_verified=True,
            )
        )
        company = await companies.insert(
            Company(
                name="Acme AI",
                slug=unique_slug("Acme AI"),
                industry="Artificial Intelligence",
                size="51-200",
                about="Building applied AI products for the enterprise.",
                locations=["Bengaluru", "Remote"],
                approval_status=ApprovalStatus.APPROVED,
                owner_id=str(recruiter.id),
                team=[str(recruiter.id)],
            )
        )
        await users.update(str(recruiter.id), {"company_id": str(company.id)})
        await recruiters.insert(
            RecruiterProfile(
                user_id=str(recruiter.id),
                company_id=str(company.id),
                title="Talent Lead",
                verified=True,
            )
        )
        print("  ✓ recruiter@acme.ai / Recruiter@123 (verified, company approved)")

        # ---- Jobs ----
        seed_jobs = [
            ("Software Engineer Intern", JobType.INTERNSHIP, ["python", "react", "fastapi"]),
            ("ML Engineer Intern", JobType.INTERNSHIP, ["python", "pytorch", "ml"]),
            ("Frontend Developer", JobType.FULL_TIME, ["react", "typescript", "tailwind"]),
        ]
        for title, jtype, skills in seed_jobs:
            await jobs.insert(
                Job(
                    company_id=str(company.id),
                    posted_by=str(recruiter.id),
                    title=title,
                    slug=unique_slug(title),
                    type=jtype,
                    workplace=Workplace.REMOTE,
                    location="Bengaluru, IN",
                    description=f"We are hiring a {title} to join Acme AI. "
                    "Work on real products with a senior team.",
                    responsibilities=["Ship features", "Collaborate with the team"],
                    requirements=["Strong fundamentals", "Good communication"],
                    skills=skills,
                    salary=Salary(min=25000, max=45000, currency="INR", period="month"),
                    openings=2,
                    status=JobStatus.PUBLISHED,
                )
            )
        print("  ✓ 3 published jobs")

    # ---- Students ----
    student = await users.get_by_email("ada@uni.edu")
    if not student:
        student = await users.insert(
            User(
                email="ada@uni.edu",
                password_hash=hash_password("Student@123"),
                full_name="Ada Lovelace",
                role=Role.STUDENT,
                status=UserStatus.ACTIVE,
                email_verified=True,
                onboarding_completed=True,
            )
        )
        profile = StudentProfile(
            user_id=str(student.id),
            headline="CS senior · full-stack & ML",
            location="Bengaluru, IN",
            skills=["python", "react", "fastapi", "mongodb", "typescript"],
        )
        data = profile.model_dump()
        profile.profile_strength = ai_engine.profile_strength(data)
        await students.insert(profile)
        print("  ✓ ada@uni.edu / Student@123")

        # auto-apply to first job
        first_job = await jobs.find({"status": JobStatus.PUBLISHED.value}, limit=1)
        if first_job:
            job = first_job[0]
            match = ai_engine.match_score(profile.skills, job.skills, job.description)
            await applications.insert(
                Application(
                    job_id=str(job.id),
                    company_id=job.company_id,
                    student_id=str(student.id),
                    stage=ApplicationStage.SCREENING,
                    match_score=match,
                    ats_score=match,
                    stage_history=[
                        StageEvent(stage=ApplicationStage.APPLIED.value, by=str(student.id)),
                        StageEvent(stage=ApplicationStage.SCREENING.value, by=job.posted_by),
                    ],
                )
            )
            await jobs.inc(str(job.id), "stats.applicants")
            print("  ✓ sample application")

    print("Done. Visit /docs to explore the API.")
    await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(seed())
