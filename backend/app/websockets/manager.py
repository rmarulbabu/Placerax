"""WebSocket connection manager with Redis pub/sub fan-out.

Each API/WS pod keeps its own local socket registry and subscribes to a Redis
channel. When any pod publishes an event for a user, every pod receives it and
delivers to whichever local sockets belong to that user — enabling realtime
delivery under horizontal scaling.
"""
from __future__ import annotations

import asyncio
import json
import logging
from collections import defaultdict

from fastapi import WebSocket

from app.core.redis import get_redis

logger = logging.getLogger("placera.ws")

_CHANNEL = "placera:events"


class ConnectionManager:
    def __init__(self) -> None:
        self._sockets: dict[str, set[WebSocket]] = defaultdict(set)
        self._pubsub_task: asyncio.Task | None = None

    async def connect(self, user_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self._sockets[user_id].add(websocket)
        logger.info("WS connected user=%s total=%d", user_id, self.total)

    def disconnect(self, user_id: str, websocket: WebSocket) -> None:
        self._sockets[user_id].discard(websocket)
        if not self._sockets[user_id]:
            self._sockets.pop(user_id, None)

    @property
    def total(self) -> int:
        return sum(len(s) for s in self._sockets.values())

    async def _deliver_local(self, user_id: str, message: dict) -> None:
        dead: list[WebSocket] = []
        for ws in self._sockets.get(user_id, set()):
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(user_id, ws)

    async def send_to_user(self, user_id: str, message: dict) -> None:
        """Publish to Redis so all pods fan out; fall back to local delivery."""
        redis = get_redis()
        envelope = {"user_id": user_id, "message": message}
        if redis is not None:
            try:
                await redis.publish(_CHANNEL, json.dumps(envelope, default=str))
                return
            except Exception:  # pragma: no cover
                pass
        await self._deliver_local(user_id, message)

    async def start_pubsub(self) -> None:
        redis = get_redis()
        if redis is None:
            return
        self._pubsub_task = asyncio.create_task(self._pubsub_loop(redis))

    async def _pubsub_loop(self, redis) -> None:  # pragma: no cover - infra loop
        pubsub = redis.pubsub()
        await pubsub.subscribe(_CHANNEL)
        try:
            async for raw in pubsub.listen():
                if raw.get("type") != "message":
                    continue
                try:
                    payload = json.loads(raw["data"])
                    await self._deliver_local(payload["user_id"], payload["message"])
                except Exception:
                    continue
        finally:
            await pubsub.unsubscribe(_CHANNEL)

    async def stop_pubsub(self) -> None:
        if self._pubsub_task:
            self._pubsub_task.cancel()


connection_manager = ConnectionManager()
