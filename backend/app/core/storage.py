"""Cloudinary storage adapter.

Falls back to a no-op local stub when Cloudinary credentials are not configured,
so the app remains runnable in development without external storage.
"""
from __future__ import annotations

import logging

from app.core.config import settings

logger = logging.getLogger("placera.storage")

_configured = False


def _ensure_configured() -> bool:
    global _configured
    if _configured:
        return True
    if not settings.CLOUDINARY_CLOUD_NAME:
        return False
    try:
        import cloudinary

        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True,
        )
        _configured = True
        return True
    except Exception as exc:  # pragma: no cover
        logger.warning("Cloudinary not configured: %s", exc)
        return False


async def upload_file(content: bytes, *, folder: str, filename: str) -> str:
    """Upload bytes and return a public URL. Stubbed when unconfigured."""
    if not _ensure_configured():
        logger.info("Storage stub: pretending to upload %s/%s", folder, filename)
        return f"https://storage.local/{folder}/{filename}"
    import cloudinary.uploader

    result = cloudinary.uploader.upload(
        content, folder=f"placera/{folder}", resource_type="auto", public_id=filename
    )
    return result["secure_url"]
