"""Small cross-cutting helpers."""
from __future__ import annotations

import re
import secrets


def slugify(text: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return base or "item"


def unique_slug(text: str) -> str:
    return f"{slugify(text)}-{secrets.token_hex(3)}"
