"""Application repository — the ATS core data access."""
from __future__ import annotations

from typing import Any

from app.models.application import Application
from app.repositories.base import BaseRepository


class ApplicationRepository(BaseRepository[Application]):
    collection_name = "applications"
    model = Application

    async def get_for_pair(self, job_id: str, student_id: str) -> Application | None:
        return await self.find_one({"job_id": job_id, "student_id": student_id})

    async def list_for_student(
        self, student_id: str, *, limit: int = 50, skip: int = 0
    ) -> list[Application]:
        return await self.find(
            {"student_id": student_id}, sort=[("created_at", -1)], limit=limit, skip=skip
        )

    async def list_for_job(self, job_id: str, *, limit: int = 200) -> list[Application]:
        return await self.find({"job_id": job_id}, sort=[("ranking", 1)], limit=limit)

    async def funnel_for_job(self, job_id: str) -> dict[str, int]:
        """Count applications grouped by stage for a hiring funnel."""
        pipeline = [
            {"$match": {"job_id": job_id}},
            {"$group": {"_id": "$stage", "count": {"$sum": 1}}},
        ]
        rows = await self.aggregate(pipeline)
        return {row["_id"]: row["count"] for row in rows}

    async def company_stage_counts(self, company_id: str) -> dict[str, int]:
        pipeline = [
            {"$match": {"company_id": company_id}},
            {"$group": {"_id": "$stage", "count": {"$sum": 1}}},
        ]
        rows = await self.aggregate(pipeline)
        return {row["_id"]: row["count"] for row in rows}

    async def count_by_query(self, query: dict[str, Any]) -> int:
        return await self.count(query)
