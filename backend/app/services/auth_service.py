"""Authentication & session orchestration."""
from __future__ import annotations

from app.core.exceptions import ConflictError, ForbiddenError, UnauthorizedError
from app.core.security import (
    REFRESH,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.base import utcnow
from app.models.enums import Role, UserStatus
from app.models.notification import Session
from app.models.user import RecruiterProfile, StudentProfile, User
from app.repositories.user_repo import (
    RecruiterProfileRepository,
    SessionRepository,
    StudentProfileRepository,
    UserRepository,
)
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    TokenPair,
    UserPublic,
)


class AuthService:
    def __init__(
        self,
        users: UserRepository,
        students: StudentProfileRepository,
        recruiters: RecruiterProfileRepository,
        sessions: SessionRepository,
    ) -> None:
        self.users = users
        self.students = students
        self.recruiters = recruiters
        self.sessions = sessions

    @staticmethod
    def _public(user: User) -> UserPublic:
        return UserPublic(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            avatar_url=user.avatar_url,
            status=user.status.value,
            email_verified=user.email_verified,
            onboarding_completed=user.onboarding_completed,
            company_id=user.company_id,
        )

    async def _issue_tokens(self, user: User, *, ip: str | None, ua: str | None) -> TokenPair:
        access = create_access_token(
            user_id=str(user.id), role=user.role.value, email=user.email
        )
        refresh, jti, expires_at = create_refresh_token(user_id=str(user.id))
        await self.sessions.insert(
            Session(user_id=str(user.id), jti=jti, expires_at=expires_at, ip=ip, user_agent=ua)
        )
        return TokenPair(access_token=access, refresh_token=refresh)

    async def register(
        self, data: RegisterRequest, *, ip: str | None = None, ua: str | None = None
    ) -> AuthResponse:
        if await self.users.get_by_email(data.email):
            raise ConflictError("An account with this email already exists.")

        user = User(
            email=data.email.lower(),
            password_hash=hash_password(data.password),
            full_name=data.full_name,
            role=data.role,
            status=UserStatus.ACTIVE,
        )
        user = await self.users.insert(user)

        # create the role-specific profile
        if user.role == Role.STUDENT:
            await self.students.insert(StudentProfile(user_id=str(user.id)))
        elif user.role == Role.RECRUITER:
            await self.recruiters.insert(RecruiterProfile(user_id=str(user.id)))

        tokens = await self._issue_tokens(user, ip=ip, ua=ua)
        return AuthResponse(user=self._public(user), tokens=tokens)

    async def login(
        self, data: LoginRequest, *, ip: str | None = None, ua: str | None = None
    ) -> AuthResponse:
        user = await self.users.get_by_email(data.email)
        if not user or not verify_password(data.password, user.password_hash):
            raise UnauthorizedError("Invalid email or password.")
        if user.status in (UserStatus.SUSPENDED, UserStatus.BANNED):
            raise ForbiddenError("This account is not permitted to sign in.")

        await self.users.update(str(user.id), {"last_login_at": utcnow()})
        tokens = await self._issue_tokens(user, ip=ip, ua=ua)
        return AuthResponse(user=self._public(user), tokens=tokens)

    async def refresh(self, refresh_token: str) -> TokenPair:
        payload = decode_token(refresh_token, expected_type=REFRESH)
        jti = payload.get("jti", "")
        session = await self.sessions.get_by_jti(jti)
        if not session or session.revoked:
            raise UnauthorizedError("Refresh token is no longer valid.")

        user = await self.users.get(payload["sub"])
        if not user:
            raise UnauthorizedError("User not found.")

        # rotate: revoke old jti and issue a fresh pair
        await self.sessions.revoke(jti)
        return await self._issue_tokens(user, ip=session.ip, ua=session.user_agent)

    async def logout(self, refresh_token: str) -> None:
        try:
            payload = decode_token(refresh_token, expected_type=REFRESH)
            await self.sessions.revoke(payload.get("jti", ""))
        except UnauthorizedError:
            return  # already invalid; treat as logged out
