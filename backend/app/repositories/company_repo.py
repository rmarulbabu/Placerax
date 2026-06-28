"""Company repository."""
from __future__ import annotations

from app.models.company import Company
from app.models.enums import ApprovalStatus
from app.repositories.base import BaseRepository


class CompanyRepository(BaseRepository[Company]):
    collection_name = "companies"
    model = Company

    async def get_by_slug(self, slug: str) -> Company | None:
        return await self.find_one({"slug": slug})

    async def list_pending(self, *, limit: int = 50) -> list[Company]:
        return await self.find(
            {"approval_status": ApprovalStatus.PENDING.value},
            sort=[("created_at", 1)],
            limit=limit,
        )
