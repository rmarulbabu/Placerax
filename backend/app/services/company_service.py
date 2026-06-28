"""Company workspace management."""
from __future__ import annotations

from app.core.exceptions import ForbiddenError, NotFoundError
from app.core.utils import unique_slug
from app.models.company import Company
from app.models.user import User
from app.repositories.company_repo import CompanyRepository
from app.repositories.user_repo import RecruiterProfileRepository, UserRepository
from app.schemas.company import CompanyCreate, CompanyUpdate


class CompanyService:
    def __init__(
        self,
        companies: CompanyRepository,
        recruiters: RecruiterProfileRepository,
        users: UserRepository,
    ) -> None:
        self.companies = companies
        self.recruiters = recruiters
        self.users = users

    async def create(self, data: CompanyCreate, recruiter: User) -> Company:
        company = await self.companies.insert(
            Company(
                name=data.name,
                slug=unique_slug(data.name),
                website=data.website,
                industry=data.industry,
                size=data.size,
                about=data.about,
                locations=data.locations,
                owner_id=str(recruiter.id),
                team=[str(recruiter.id)],
            )
        )
        # bind recruiter to company
        await self.users.update(str(recruiter.id), {"company_id": str(company.id)})
        profile = await self.recruiters.get_by_user(str(recruiter.id))
        if profile:
            await self.recruiters.update(str(profile.id), {"company_id": str(company.id)})
        return company

    async def get_by_slug(self, slug: str) -> Company:
        company = await self.companies.get_by_slug(slug)
        if not company:
            raise NotFoundError("Company not found.")
        return company

    async def update(self, company_id: str, data: CompanyUpdate, recruiter: User) -> Company:
        company = await self.companies.get(company_id)
        if not company:
            raise NotFoundError("Company not found.")
        if company.owner_id != str(recruiter.id):
            raise ForbiddenError("Only the company owner can edit this workspace.")
        updated = await self.companies.update(company_id, data.model_dump(exclude_none=True))
        return updated or company
