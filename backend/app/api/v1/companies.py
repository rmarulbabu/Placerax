"""Company workspace routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, status

from app.core.dependencies import get_company_service, require_role
from app.models.enums import Role
from app.models.user import User
from app.schemas.company import CompanyCreate, CompanyUpdate
from app.services.company_service import CompanyService

router = APIRouter(prefix="/companies", tags=["companies"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_company(
    data: CompanyCreate,
    user: User = Depends(require_role(Role.RECRUITER)),
    service: CompanyService = Depends(get_company_service),
):
    company = await service.create(data, user)
    return company.model_dump(mode="json")


@router.get("/{slug}")
async def get_company(slug: str, service: CompanyService = Depends(get_company_service)):
    company = await service.get_by_slug(slug)
    return company.model_dump(mode="json")


@router.patch("/{company_id}")
async def update_company(
    company_id: str,
    data: CompanyUpdate,
    user: User = Depends(require_role(Role.RECRUITER)),
    service: CompanyService = Depends(get_company_service),
):
    company = await service.update(company_id, data, user)
    return company.model_dump(mode="json")
