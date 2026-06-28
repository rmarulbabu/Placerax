"""Role-aware dashboard + analytics routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.dependencies import (
    get_application_service,
    get_dashboard_service,
    require_role,
)
from app.models.enums import Role
from app.models.user import User
from app.services.application_service import ApplicationService
from app.services.dashboard_service import DashboardService

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard/student")
async def student_dashboard(
    user: User = Depends(require_role(Role.STUDENT)),
    service: DashboardService = Depends(get_dashboard_service),
):
    return await service.student(str(user.id))


@router.get("/dashboard/recruiter")
async def recruiter_dashboard(
    user: User = Depends(require_role(Role.RECRUITER)),
    service: DashboardService = Depends(get_dashboard_service),
):
    return await service.recruiter(user.company_id)


@router.get("/dashboard/admin")
async def admin_dashboard(
    user: User = Depends(require_role(Role.ADMIN)),
    service: DashboardService = Depends(get_dashboard_service),
):
    return await service.admin()


@router.get("/analytics/funnel/{job_id}")
async def hiring_funnel(
    job_id: str,
    user: User = Depends(require_role(Role.RECRUITER)),
    apps: ApplicationService = Depends(get_application_service),
):
    pipeline = await apps.pipeline(job_id, user)
    funnel = {stage: len(items) for stage, items in pipeline["board"].items()}
    return {"job_id": job_id, "funnel": funnel}
