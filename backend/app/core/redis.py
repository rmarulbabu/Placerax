"""Redis client for caching, rate limiting, and pub/sub fan-out.

Designed to degrade gracefully: if Redis is unavailable, cache helpers return
``None`` (miss) instead of raising, so the API keeps serving from Mongo.
"""
from __future__ import annotations

import json
import logging
from typing import Any

import redis.asyncio as aioredis

from app.core.config import settings

logger = logging.getLogger("placera.redis")


class RedisManager:
    client: aioredis.Redis | None = None


redis_manager = RedisManager()


async def connect_to_redis() -> None:
    try:
        redis_manager.client = aioredis.from_url(
            settings.REDIS_URL, encoding="utf-8", decode_responses=True
        )
        await redis_manager.client.ping()
        logger.info("Redis connected.")
    except Exception as exc:  # pragma: no cover - infra dependent
        logger.warning("Redis unavailable (%s); running without cache.", exc)
        redis_manager.client = None


async def close_redis_connection() -> None:
    if redis_manager.client is not None:
        await redis_manager.client.aclose()


def get_redis() -> aioredis.Redis | None:
    return redis_manager.client


class Cache:
    """Thin cache-aside helper used by services."""

    @staticmethod
    async def get(key: str) -> Any | None:
        client = get_redis()
        if client is None:
            return None
        try:
            raw = await client.get(key)
            return json.loads(raw) if raw else None
        except Exception:  # pragma: no cover
            return None

    @staticmethod
    async def set(key: str, value: Any, ttl: int = 60) -> None:
        client = get_redis()
        if client is None:
            return
        try:
            await client.set(key, json.dumps(value, default=str), ex=ttl)
        except Exception:  # pragma: no cover
            pass

    @staticmethod
    async def delete(*keys: str) -> None:
        client = get_redis()
        if client is None or not keys:
            return
        try:
            await client.delete(*keys)
        except Exception:  # pragma: no cover
            pass

    @staticmethod
    async def incr_with_ttl(key: str, ttl: int) -> int:
        """Atomic fixed-window counter for rate limiting. Returns current count."""
        client = get_redis()
        if client is None:
            return 0
        try:
            pipe = client.pipeline()
            pipe.incr(key)
            pipe.expire(key, ttl)
            count, _ = await pipe.execute()
            return int(count)
        except Exception:  # pragma: no cover
            return 0
