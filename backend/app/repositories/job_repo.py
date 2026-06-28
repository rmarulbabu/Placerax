"""Job repository with search/filter helpers."""
from __future__ import annotations

from typing import Any

from app.models.enums import JobStatus
from app.models.job import Job
from app.repositories.base import BaseRepository


class JobRepository(BaseRepository[Job]):
    collection_name = "jobs"
    model = Job

    async def get_by_slug(self, slug: str) -> Job | None:
        return await self.find_one({"slug": slug})

    def build_query(
        self,
        *,
        q: str | None = None,
        type_: str | None = None,
        workplace: str | None = None,
        skills: list[str] | None = None,
        location: str | None = None,
        company_id: str | None = None,
        status: str | None = JobStatus.PUBLISHED.value,
    ) -> dict[str, Any]:
        query: dict[str, Any] = {}
        if status:
            query["status"] = status
        if q:
            query["$text"] = {"$search": q}
        if type_:
            query["type"] = type_
        if workplace:
            query["workplace"] = workplace
        if skills:
            query["skills"] = {"$in": [s.lower() for s in skills]}
        if location:
            query["location"] = {"$regex": location, "$options": "i"}
        if company_id:
            query["company_id"] = company_id
        return query

    async def search(
        self, query: dict[str, Any], *, limit: int = 20, skip: int = 0
    ) -> list[Job]:
        return await self.find(query, sort=[("created_at", -1)], limit=limit, skip=skip)
