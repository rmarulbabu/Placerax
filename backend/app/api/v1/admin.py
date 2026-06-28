"""Admin routes — moderation, verification, user management."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.core.dependencies import get_admin_service, require_role
from app.models.enums import Role, UserStatus
from app.models.user import User
from app.services.admin_service import AdminService

router = APIRouter(prefix="/admin", tags=["admin"])


class StatusUpdate(BaseModel):
    status: UserStatus


class Decision(BaseModel):
    approve: bool = True


@router.get("/users")
async def list_users(
    role: str | None = None,
    limit: int = Query(50, le=200),
    skip: int = 0,
    _: User = Depends(require_role(Role.ADMIN)),
    service: AdminService = Depends(get_admin_service),
):
    return await service.list_users(role=role, limit=limit, skip=skip)


@router.patch("/users/{user_id}/status")
async def set_user_status(
    user_id: str,
    data: StatusUpdate,
    _: User = Depends(require_role(Role.ADMIN)),
    service: AdminService = Depends(get_admin_service),
):
    user = await service.set_user_status(user_id, data.status)
    return user.model_dump(mode="json", exclude={"password_hash"})


@router.get("/recruiters/pending")
async def pending_recruiters(
    _: User = Depends(require_role(Role.ADMIN)),
    service: AdminService = Depends(get_admin_service),
):
    return [p.model_dump(mode="json") for p in await service.pending_recruiters()]


@router.post("/recruiters/{profile_id}/verify")
async def verify_recruiter(
    profile_id: str,
    data: Decision,
    _: User = Depends(require_role(Role.ADMIN)),
    service: AdminService = Depends(get_admin_service),
):
    profile = await service.verify_recruiter(profile_id, data.approve)
    return profile.model_dump(mode="json")


@router.get("/companies/pending")
async def pending_companies(
    _: User = Depends(require_role(Role.ADMIN)),
    service: AdminService = Depends(get_admin_service),
):
    return [c.model_dump(mode="json") for c in await service.pending_companies()]


@router.post("/companies/{company_id}/approve")
async def approve_company(
    company_id: str,
    data: Decision,
    _: User = Depends(require_role(Role.ADMIN)),
    service: AdminService = Depends(get_admin_service),
):
    company = await service.moderate_company(company_id, data.approve)
    return company.model_dump(mode="json")


@router.get("/jobs/moderation")
async def moderation_queue(
    _: User = Depends(require_role(Role.ADMIN)),
    service: AdminService = Depends(get_admin_service),
):
    return [j.model_dump(mode="json") for j in await service.moderation_queue()]


@router.post("/jobs/{job_id}/moderate")
async def moderate_job(
    job_id: str,
    data: Decision,
    _: User = Depends(require_role(Role.ADMIN)),
    service: AdminService = Depends(get_admin_service),
):
    job = await service.moderate_job(job_id, data.approve)
    return job.model_dump(mode="json")
