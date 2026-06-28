"""WebSocket endpoint for realtime notifications/updates."""
from __future__ import annotations

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.core.security import ACCESS, decode_token
from app.core.exceptions import UnauthorizedError
from app.websockets.manager import connection_manager

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)) -> None:
    try:
        payload = decode_token(token, expected_type=ACCESS)
        user_id = payload["sub"]
    except (UnauthorizedError, KeyError):
        await websocket.close(code=4401)
        return

    await connection_manager.connect(user_id, websocket)
    try:
        await websocket.send_json({"event": "connection.ready", "data": {"user_id": user_id}})
        while True:
            # client heartbeats / ping; server primarily pushes events
            await websocket.receive_text()
    except WebSocketDisconnect:
        connection_manager.disconnect(user_id, websocket)
