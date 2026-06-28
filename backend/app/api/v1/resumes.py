"""Resume + AI career tool routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, File, UploadFile
from pydantic import BaseModel

from app.core.dependencies import get_job_service, get_resume_service, require_role
from app.models.enums import Role
from app.models.user import User
from app.services.job_service import JobService
from app.services.resume_service import ResumeService

router = APIRouter(tags=["resumes & ai"])


class SkillGapRequest(BaseModel):
    target_skills: list[str]


class RoadmapRequest(BaseModel):
    target_role: str
    target_skills: list[str]


@router.post("/resumes", status_code=201)
async def upload_resume(
    file: UploadFile = File(...),
    user: User = Depends(require_role(Role.STUDENT)),
    service: ResumeService = Depends(get_resume_service),
):
    content = await file.read()
    resume = await service.upload(str(user.id), content, file.filename or "resume.pdf")
    return resume.model_dump(mode="json")


@router.get("/resumes")
async def list_resumes(
    user: User = Depends(require_role(Role.STUDENT)),
    service: ResumeService = Depends(get_resume_service),
):
    return [r.model_dump(mode="json") for r in await service.list(str(user.id))]


@router.get("/resumes/{resume_id}")
async def get_resume(
    resume_id: str,
    user: User = Depends(require_role(Role.STUDENT)),
    service: ResumeService = Depends(get_resume_service),
):
    resume = await service.get(resume_id, str(user.id))
    return resume.model_dump(mode="json")


@router.post("/resumes/{resume_id}/activate")
async def activate_resume(
    resume_id: str,
    user: User = Depends(require_role(Role.STUDENT)),
    service: ResumeService = Depends(get_resume_service),
):
    resume = await service.activate(resume_id, str(user.id))
    return resume.model_dump(mode="json")


@router.post("/resumes/{resume_id}/analyze")
async def analyze_resume(
    resume_id: str,
    job_id: str | None = None,
    user: User = Depends(require_role(Role.STUDENT)),
    service: ResumeService = Depends(get_resume_service),
):
    resume = await service.reanalyze(resume_id, str(user.id), job_id)
    return resume.model_dump(mode="json")


@router.post("/ai/skill-gap")
async def skill_gap(
    data: SkillGapRequest,
    user: User = Depends(require_role(Role.STUDENT)),
    service: ResumeService = Depends(get_resume_service),
):
    return await service.skill_gap(str(user.id), data.target_skills)


@router.post("/ai/roadmap")
async def roadmap(
    data: RoadmapRequest,
    user: User = Depends(require_role(Role.STUDENT)),
    service: ResumeService = Depends(get_resume_service),
):
    return await service.roadmap(str(user.id), data.target_role, data.target_skills)


@router.get("/ai/recommendations/jobs")
async def job_recommendations(
    limit: int = 12,
    user: User = Depends(require_role(Role.STUDENT)),
    service: JobService = Depends(get_job_service),
):
    return await service.recommend_for_student(str(user.id), limit=limit)
