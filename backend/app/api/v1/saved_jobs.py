"""Saved jobs routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.dependencies import job_repo, require_role, saved_job_repo
from app.core.exceptions import ConflictError, NotFoundError
from app.models.enums import Role
from app.models.notification import SavedJob
from app.models.user import User
from app.repositories.job_repo import JobRepository
from app.repositories.misc_repo import SavedJobRepository
from app.schemas.common import Message

router = APIRouter(prefix="/saved-jobs", tags=["saved jobs"])


@router.get("")
async def list_saved(
    user: User = Depends(require_role(Role.STUDENT)),
    saved: SavedJobRepository = Depends(saved_job_repo),
    jobs: JobRepository = Depends(job_repo),
):
    items = await saved.list_for_student(str(user.id))
    result = []
    for item in items:
        job = await jobs.get(item.job_id)
        if job:
            result.append(job.model_dump(mode="json"))
    return result


@router.post("/{job_id}", response_model=Message)
async def save_job(
    job_id: str,
    user: User = Depends(require_role(Role.STUDENT)),
    saved: SavedJobRepository = Depends(saved_job_repo),
    jobs: JobRepository = Depends(job_repo),
):
    if not await jobs.get(job_id):
        raise NotFoundError("Job not found.")
    if await saved.find_one({"student_id": str(user.id), "job_id": job_id}):
        raise ConflictError("Job already saved.")
    await saved.insert(SavedJob(student_id=str(user.id), job_id=job_id))
    return Message(message="Job saved.")


@router.delete("/{job_id}", response_model=Message)
async def unsave_job(
    job_id: str,
    user: User = Depends(require_role(Role.STUDENT)),
    saved: SavedJobRepository = Depends(saved_job_repo),
):
    await saved.remove(str(user.id), job_id)
    return Message(message="Job removed from saved.")
