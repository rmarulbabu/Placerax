"""User, student-profile, recruiter-profile, and session repositories."""
from __future__ import annotations

from app.models.enums import Role, UserStatus
from app.models.notification import Session
from app.models.user import RecruiterProfile, StudentProfile, User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    collection_name = "users"
    model = User

    async def get_by_email(self, email: str) -> User | None:
        return await self.find_one({"email": email.lower()})

    async def list_by_role(self, role: Role, *, limit: int = 50, skip: int = 0) -> list[User]:
        return await self.find({"role": role.value}, sort=[("created_at", -1)],
                               limit=limit, skip=skip)

    async def set_status(self, user_id: str, status: UserStatus) -> User | None:
        return await self.update(user_id, {"status": status.value})


class StudentProfileRepository(BaseRepository[StudentProfile]):
    collection_name = "student_profiles"
    model = StudentProfile

    async def get_by_user(self, user_id: str) -> StudentProfile | None:
        return await self.find_one({"user_id": user_id})


class RecruiterProfileRepository(BaseRepository[RecruiterProfile]):
    collection_name = "recruiter_profiles"
    model = RecruiterProfile

    async def get_by_user(self, user_id: str) -> RecruiterProfile | None:
        return await self.find_one({"user_id": user_id})

    async def list_pending(self, *, limit: int = 50) -> list[RecruiterProfile]:
        return await self.find({"verified": False}, limit=limit)


class SessionRepository(BaseRepository[Session]):
    collection_name = "sessions"
    model = Session

    async def get_by_jti(self, jti: str) -> Session | None:
        return await self.find_one({"jti": jti})

    async def revoke(self, jti: str) -> None:
        await self.col.update_one({"jti": jti}, {"$set": {"revoked": True}})

    async def revoke_all_for_user(self, user_id: str) -> None:
        await self.col.update_many({"user_id": user_id}, {"$set": {"revoked": True}})
