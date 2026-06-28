"""Application / ATS routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, status

from app.core.dependencies import (
    get_application_service,
    get_current_user,
    require_role,
)
from app.models.enums import Role
from app.models.user import User
from app.schemas.application import (
    ApplicationCreate,
    NoteCreate,
    RankUpdate,
    StageUpdate,
)
from app.schemas.common import Message
from app.services.application_service import ApplicationService

router = APIRouter(tags=["applications"])


@router.post("/applications", status_code=status.HTTP_201_CREATED)
async def apply(
    data: ApplicationCreate,
    user: User = Depends(require_role(Role.STUDENT)),
    service: ApplicationService = Depends(get_application_service),
):
    app = await service.apply(data, user)
    return app.model_dump(mode="json")


@router.get("/applications/me")
async def my_applications(
    user: User = Depends(require_role(Role.STUDENT)),
    service: ApplicationService = Depends(get_application_service),
):
    apps = await service.list_for_student(str(user.id))
    return [a.model_dump(mode="json") for a in apps]


@router.get("/applications/{application_id}")
async def get_application(
    application_id: str,
    user: User = Depends(get_current_user),
    service: ApplicationService = Depends(get_application_service),
):
    app = await service.get(application_id, user)
    return app.model_dump(mode="json")


@router.delete("/applications/{application_id}", response_model=Message)
async def withdraw(
    application_id: str,
    user: User = Depends(require_role(Role.STUDENT)),
    service: ApplicationService = Depends(get_application_service),
):
    await service.withdraw(application_id, user)
    return Message(message="Application withdrawn.")


@router.patch("/applications/{application_id}/stage")
async def move_stage(
    application_id: str,
    data: StageUpdate,
    user: User = Depends(require_role(Role.RECRUITER)),
    service: ApplicationService = Depends(get_application_service),
):
    app = await service.move_stage(application_id, data.stage, user)
    return app.model_dump(mode="json")


@router.patch("/applications/{application_id}/rank")
async def set_rank(
    application_id: str,
    data: RankUpdate,
    user: User = Depends(require_role(Role.RECRUITER)),
    service: ApplicationService = Depends(get_application_service),
):
    app = await service.set_rank(application_id, data.ranking, user)
    return app.model_dump(mode="json")


@router.post("/applications/{application_id}/notes")
async def add_note(
    application_id: str,
    data: NoteCreate,
    user: User = Depends(require_role(Role.RECRUITER)),
    service: ApplicationService = Depends(get_application_service),
):
    app = await service.add_note(application_id, data.body, user)
    return app.model_dump(mode="json")


@router.get("/pipeline/{job_id}")
async def pipeline(
    job_id: str,
    user: User = Depends(require_role(Role.RECRUITER)),
    service: ApplicationService = Depends(get_application_service),
):
    return await service.pipeline(job_id, user)
