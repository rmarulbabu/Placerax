"""Student & recruiter profile routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.dependencies import (
    get_current_user,
    get_profile_service,
    recruiter_repo,
    require_role,
)
from app.models.enums import Role
from app.models.user import User
from app.repositories.user_repo import RecruiterProfileRepository
from app.schemas.company import OnboardingRequest, StudentProfileUpdate
from app.services.profile_service import ProfileService

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("/student/me")
async def my_student_profile(
    user: User = Depends(require_role(Role.STUDENT)),
    service: ProfileService = Depends(get_profile_service),
):
    profile = await service.get_student(str(user.id))
    return profile.model_dump(mode="json")


@router.patch("/student/me")
async def update_student_profile(
    data: StudentProfileUpdate,
    user: User = Depends(require_role(Role.STUDENT)),
    service: ProfileService = Depends(get_profile_service),
):
    profile = await service.update_student(str(user.id), data)
    return profile.model_dump(mode="json")


@router.post("/student/onboarding")
async def complete_onboarding(
    data: OnboardingRequest,
    user: User = Depends(require_role(Role.STUDENT)),
    service: ProfileService = Depends(get_profile_service),
):
    profile = await service.complete_onboarding(str(user.id), data)
    return profile.model_dump(mode="json")


@router.get("/recruiter/me")
async def my_recruiter_profile(
    user: User = Depends(require_role(Role.RECRUITER)),
    recruiters: RecruiterProfileRepository = Depends(recruiter_repo),
):
    profile = await recruiters.get_by_user(str(user.id))
    return profile.model_dump(mode="json") if profile else None
