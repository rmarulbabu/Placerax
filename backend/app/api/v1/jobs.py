"""Job routes — public search + recruiter management."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.core.dependencies import (
    get_application_service,
    get_current_user,
    get_job_service,
    require_role,
)
from app.models.enums import Role
from app.models.user import User
from app.schemas.job import JobCreate, JobUpdate
from app.services.application_service import ApplicationService
from app.services.job_service import JobService

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("")
async def search_jobs(
    q: str | None = None,
    type: str | None = None,
    workplace: str | None = None,
    location: str | None = None,
    skills: str | None = Query(None, description="comma-separated"),
    limit: int = Query(20, le=100),
    skip: int = 0,
    service: JobService = Depends(get_job_service),
):
    skill_list = [s for s in skills.split(",")] if skills else None
    return await service.search(
        q=q, type_=type, workplace=workplace, location=location,
        skills=skill_list, limit=limit, skip=skip,
    )


@router.get("/manage/mine")
async def my_company_jobs(
    user: User = Depends(require_role(Role.RECRUITER)),
    service: JobService = Depends(get_job_service),
):
    jobs = await service.list_for_company(user.company_id)
    return [j.model_dump(mode="json") for j in jobs]


@router.get("/{slug}")
async def get_job(slug: str, service: JobService = Depends(get_job_service)):
    job = await service.get_by_slug(slug)
    return job.model_dump(mode="json")


@router.post("", status_code=201)
async def create_job(
    data: JobCreate,
    user: User = Depends(require_role(Role.RECRUITER)),
    service: JobService = Depends(get_job_service),
):
    job = await service.create(data, user)
    return job.model_dump(mode="json")


@router.patch("/{job_id}")
async def update_job(
    job_id: str,
    data: JobUpdate,
    user: User = Depends(require_role(Role.RECRUITER)),
    service: JobService = Depends(get_job_service),
):
    job = await service.update(job_id, data, user)
    return job.model_dump(mode="json")


@router.post("/{job_id}/publish")
async def publish_job(
    job_id: str,
    user: User = Depends(require_role(Role.RECRUITER)),
    service: JobService = Depends(get_job_service),
):
    job = await service.publish(job_id, user)
    return job.model_dump(mode="json")


@router.post("/{job_id}/close")
async def close_job(
    job_id: str,
    user: User = Depends(require_role(Role.RECRUITER)),
    service: JobService = Depends(get_job_service),
):
    job = await service.close(job_id, user)
    return job.model_dump(mode="json")


@router.get("/{job_id}/applicants")
async def job_applicants(
    job_id: str,
    user: User = Depends(require_role(Role.RECRUITER)),
    service: ApplicationService = Depends(get_application_service),
):
    apps = await service.list_for_job(job_id, user)
    return [a.model_dump(mode="json") for a in apps]
