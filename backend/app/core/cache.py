"""In-process cache + simple rate-limit counter.

MongoDB-only deployment: no Redis required. This provides the same ``Cache``
interface the services already use, backed by an in-memory dict with TTLs.
Suitable for single-process dev/small deployments; swap for a shared cache
(e.g. Redis) later without changing any service code.
"""
from __future__ import annotations

import time
from typing import Any

_store: dict[str, tuple[float, Any]] = {}


def _expired(expires_at: float) -> bool:
    return expires_at != 0 and expires_at < time.time()


class Cache:
    """Cache-aside helper with TTL. All methods are async to match callers."""

    @staticmethod
    async def get(key: str) -> Any | None:
        item = _store.get(key)
        if item is None:
            return None
        expires_at, value = item
        if _expired(expires_at):
            _store.pop(key, None)
            return None
        return value

    @staticmethod
    async def set(key: str, value: Any, ttl: int = 60) -> None:
        expires_at = time.time() + ttl if ttl > 0 else 0
        _store[key] = (expires_at, value)

    @staticmethod
    async def delete(*keys: str) -> None:
        for key in keys:
            _store.pop(key, None)

    @staticmethod
    async def incr_with_ttl(key: str, ttl: int) -> int:
        """Fixed-window counter for rate limiting."""
        now = time.time()
        item = _store.get(key)
        if item is None or _expired(item[0]):
            _store[key] = (now + ttl, 1)
            return 1
        expires_at, count = item
        count = int(count) + 1
        _store[key] = (expires_at, count)
        return count
