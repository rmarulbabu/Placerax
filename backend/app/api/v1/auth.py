"""Authentication routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Request, status

from app.core.dependencies import get_auth_service, get_current_user
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenPair,
    UserPublic,
)
from app.schemas.common import Message
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


def _client(request: Request) -> tuple[str | None, str | None]:
    ip = request.client.host if request.client else None
    return ip, request.headers.get("user-agent")


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    data: RegisterRequest,
    request: Request,
    service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    ip, ua = _client(request)
    return await service.register(data, ip=ip, ua=ua)


@router.post("/login", response_model=AuthResponse)
async def login(
    data: LoginRequest,
    request: Request,
    service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    ip, ua = _client(request)
    return await service.login(data, ip=ip, ua=ua)


@router.post("/refresh", response_model=TokenPair)
async def refresh(
    data: RefreshRequest,
    service: AuthService = Depends(get_auth_service),
) -> TokenPair:
    return await service.refresh(data.refresh_token)


@router.post("/logout", response_model=Message)
async def logout(
    data: RefreshRequest,
    service: AuthService = Depends(get_auth_service),
) -> Message:
    await service.logout(data.refresh_token)
    return Message(message="Logged out.")


@router.get("/me", response_model=UserPublic)
async def me(user: User = Depends(get_current_user)) -> UserPublic:
    return AuthService._public(user)
