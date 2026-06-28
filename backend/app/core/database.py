"""MongoDB connection management (Motor async driver) + index bootstrap."""
from __future__ import annotations

import logging

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING, TEXT

from app.core.config import settings

logger = logging.getLogger("placera.db")


class MongoManager:
    """Holds the singleton Motor client + database handle for the process."""

    client: AsyncIOMotorClient | None = None
    db: AsyncIOMotorDatabase | None = None


mongo = MongoManager()


def get_database() -> AsyncIOMotorDatabase:
    if mongo.db is None:  # pragma: no cover - defensive
        raise RuntimeError("Database not initialized. Call connect_to_mongo() first.")
    return mongo.db


async def connect_to_mongo() -> None:
    logger.info("Connecting to MongoDB at %s", settings.MONGODB_URI.split("@")[-1])
    mongo.client = AsyncIOMotorClient(settings.MONGODB_URI, uuidRepresentation="standard")
    mongo.db = mongo.client[settings.MONGODB_DB]
    await mongo.client.admin.command("ping")
    await _ensure_indexes(mongo.db)
    logger.info("MongoDB connected and indexes ensured.")


async def close_mongo_connection() -> None:
    if mongo.client is not None:
        mongo.client.close()
        logger.info("MongoDB connection closed.")


async def _ensure_indexes(db: AsyncIOMotorDatabase) -> None:
    """Create every index on hot query paths. Idempotent."""
    await db.users.create_index([("email", ASCENDING)], unique=True)
    await db.users.create_index([("role", ASCENDING), ("status", ASCENDING)])
    await db.users.create_index([("company_id", ASCENDING)])

    await db.student_profiles.create_index([("user_id", ASCENDING)], unique=True)
    await db.student_profiles.create_index([("skills", ASCENDING)])

    await db.recruiter_profiles.create_index([("user_id", ASCENDING)], unique=True)
    await db.recruiter_profiles.create_index([("company_id", ASCENDING)])
    await db.recruiter_profiles.create_index([("verified", ASCENDING)])

    await db.companies.create_index([("slug", ASCENDING)], unique=True)
    await db.companies.create_index([("approval_status", ASCENDING)])
    await db.companies.create_index([("name", TEXT), ("industry", TEXT)])

    await db.jobs.create_index([("slug", ASCENDING)], unique=True)
    await db.jobs.create_index(
        [("status", ASCENDING), ("type", ASCENDING), ("workplace", ASCENDING)]
    )
    await db.jobs.create_index([("company_id", ASCENDING), ("status", ASCENDING)])
    await db.jobs.create_index([("skills", ASCENDING)])
    await db.jobs.create_index([("created_at", DESCENDING)])
    await db.jobs.create_index([("title", TEXT), ("description", TEXT), ("skills", TEXT)])

    await db.applications.create_index([("job_id", ASCENDING), ("stage", ASCENDING)])
    await db.applications.create_index([("student_id", ASCENDING), ("created_at", DESCENDING)])
    await db.applications.create_index([("company_id", ASCENDING), ("status", ASCENDING)])
    await db.applications.create_index(
        [("job_id", ASCENDING), ("student_id", ASCENDING)], unique=True
    )

    await db.resumes.create_index([("student_id", ASCENDING), ("is_active", ASCENDING)])

    await db.interviews.create_index([("student_id", ASCENDING), ("start_at", ASCENDING)])
    await db.interviews.create_index([("company_id", ASCENDING), ("start_at", ASCENDING)])

    await db.saved_jobs.create_index(
        [("student_id", ASCENDING), ("job_id", ASCENDING)], unique=True
    )

    await db.notifications.create_index(
        [("user_id", ASCENDING), ("read", ASCENDING), ("created_at", DESCENDING)]
    )

    await db.sessions.create_index([("jti", ASCENDING)], unique=True)
    await db.sessions.create_index([("user_id", ASCENDING)])
    await db.sessions.create_index([("expires_at", ASCENDING)], expireAfterSeconds=0)

    await db.activity_logs.create_index([("actor_id", ASCENDING), ("created_at", DESCENDING)])
