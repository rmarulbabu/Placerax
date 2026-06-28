"""Application configuration loaded from environment variables.

Uses pydantic-settings so every value is validated and typed at startup.
"""
from __future__ import annotations

from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=False, extra="ignore"
    )

    # ---- App ----
    ENV: str = "development"
    APP_NAME: str = "Placera"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = True

    # ---- Security / JWT ----
    SECRET_KEY: str = "change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ---- Mongo ----
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB: str = "placera"

    # ---- Redis ----
    REDIS_URL: str = "redis://localhost:6379/0"

    # ---- Cloudinary ----
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # ---- CORS ----
    CORS_ORIGINS: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])

    # ---- Seed ----
    SEED_ADMIN_EMAIL: str = "admin@placera.io"
    SEED_ADMIN_PASSWORD: str = "Admin@12345"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _split_cors(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @property
    def is_production(self) -> bool:
        return self.ENV.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()


settings = get_settings()
