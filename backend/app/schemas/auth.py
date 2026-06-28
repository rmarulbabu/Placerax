"""Auth request/response schemas."""
from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.enums import Role


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=120)
    role: Role = Role.STUDENT

    @field_validator("role")
    @classmethod
    def _no_admin_signup(cls, v: Role) -> Role:
        if v == Role.ADMIN:
            raise ValueError("Admin accounts cannot be self-registered.")
        return v

    @field_validator("password")
    @classmethod
    def _strength(cls, v: str) -> str:
        if not any(c.isdigit() for c in v) or not any(c.isalpha() for c in v):
            raise ValueError("Password must contain letters and numbers.")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserPublic(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: Role
    avatar_url: str | None = None
    status: str
    email_verified: bool
    onboarding_completed: bool
    company_id: str | None = None


class AuthResponse(BaseModel):
    user: UserPublic
    tokens: TokenPair
