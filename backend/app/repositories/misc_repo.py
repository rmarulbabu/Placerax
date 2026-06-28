"""Resume, interview, notification, saved-job repositories."""
from __future__ import annotations

from app.models.interview import Interview
from app.models.notification import Notification, SavedJob
from app.models.resume import Resume
from app.repositories.base import BaseRepository


class ResumeRepository(BaseRepository[Resume]):
    collection_name = "resumes"
    model = Resume

    async def list_for_student(self, student_id: str) -> list[Resume]:
        return await self.find({"student_id": student_id}, sort=[("created_at", -1)], limit=50)

    async def deactivate_all(self, student_id: str) -> None:
        await self.col.update_many(
            {"student_id": student_id}, {"$set": {"is_active": False}}
        )


class InterviewRepository(BaseRepository[Interview]):
    collection_name = "interviews"
    model = Interview

    async def list_for_student(self, student_id: str) -> list[Interview]:
        return await self.find({"student_id": student_id}, sort=[("start_at", 1)], limit=100)

    async def list_for_company(self, company_id: str) -> list[Interview]:
        return await self.find({"company_id": company_id}, sort=[("start_at", 1)], limit=200)


class NotificationRepository(BaseRepository[Notification]):
    collection_name = "notifications"
    model = Notification

    async def list_for_user(self, user_id: str, *, limit: int = 30) -> list[Notification]:
        return await self.find(
            {"user_id": user_id}, sort=[("created_at", -1)], limit=limit
        )

    async def unread_count(self, user_id: str) -> int:
        return await self.count({"user_id": user_id, "read": False})

    async def mark_read(self, user_id: str, ids: list[str] | None = None) -> None:
        query: dict = {"user_id": user_id, "read": False}
        if ids:
            from bson import ObjectId

            query["_id"] = {"$in": [ObjectId(i) for i in ids if ObjectId.is_valid(i)]}
        await self.col.update_many(query, {"$set": {"read": True}})


class SavedJobRepository(BaseRepository[SavedJob]):
    collection_name = "saved_jobs"
    model = SavedJob

    async def list_for_student(self, student_id: str) -> list[SavedJob]:
        return await self.find({"student_id": student_id}, sort=[("created_at", -1)], limit=100)

    async def remove(self, student_id: str, job_id: str) -> bool:
        result = await self.col.delete_one({"student_id": student_id, "job_id": job_id})
        return result.deleted_count > 0
