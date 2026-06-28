"""Aggregates every v1 router under a single APIRouter."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import (
    admin,
    applications,
    auth,
    companies,
    dashboard,
    jobs,
    notifications,
    profiles,
    resumes,
    saved_jobs,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(profiles.router)
api_router.include_router(companies.router)
api_router.include_router(jobs.router)
api_router.include_router(applications.router)
api_router.include_router(resumes.router)
api_router.include_router(saved_jobs.router)
api_router.include_router(notifications.router)
api_router.include_router(dashboard.router)
api_router.include_router(admin.router)
