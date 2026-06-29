"""In-memory WebSocket connection manager (single-process, MongoDB-only setup).

Tracks active sockets per user and delivers realtime events directly. For a
multi-process/horizontally-scaled deployment, reintroduce a shared pub/sub
(e.g. Redis) behind ``send_to_user`` — no other code needs to change.
"""
from __future__ import annotations

import logging
from collections import defaultdict

from fastapi import WebSocket

logger = logging.getLogger("placera.ws")


class ConnectionManager:
    def __init__(self) -> None:
        self._sockets: dict[str, set[WebSocket]] = defaultdict(set)

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

    async def send_to_user(self, user_id: str, message: dict) -> None:
        dead: list[WebSocket] = []
        for ws in self._sockets.get(user_id, set()):
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(user_id, ws)


connection_manager = ConnectionManager()
