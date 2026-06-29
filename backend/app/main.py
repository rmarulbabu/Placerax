"""Placera FastAPI application factory + lifespan + middleware."""
from __future__ import annotations

import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import (
    close_mongo_connection,
    connect_to_mongo,
    get_database,
)
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging
from app.websockets.routes import router as ws_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    configure_logging("DEBUG" if settings.DEBUG else "INFO")
    await connect_to_mongo()
    yield
    await close_mongo_connection()


def create_app() -> FastAPI:
    app = FastAPI(
        title=f"{settings.APP_NAME} API",
        version="1.0.0",
        description="Venture-scale Internship & Placement Platform API",
        docs_url="/docs",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)

    @app.middleware("http")
    async def add_timing_header(request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        response.headers["X-Process-Time-ms"] = f"{(time.perf_counter() - start) * 1000:.1f}"
        return response

    app.include_router(api_router, prefix=settings.API_V1_PREFIX)
    app.include_router(ws_router)

    @app.get("/health", tags=["system"])
    async def health() -> dict:
        return {"status": "ok", "app": settings.APP_NAME}

    @app.get("/ready", tags=["system"])
    async def ready() -> dict:
        ok = False
        try:
            await get_database().command("ping")
            ok = True
        except Exception:
            pass
        return {"status": "ready" if ok else "degraded", "checks": {"mongo": ok}}

    return app


app = create_app()
