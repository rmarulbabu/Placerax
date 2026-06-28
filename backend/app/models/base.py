"""Shared Mongo model primitives: ObjectId handling + base document."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated, Any

from bson import ObjectId
from pydantic import BaseModel, BeforeValidator, ConfigDict, Field


def _validate_object_id(value: Any) -> str:
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, str) and ObjectId.is_valid(value):
        return value
    if isinstance(value, str):
        # allow non-objectid string ids in tests/mocks
        return value
    raise ValueError(f"Invalid ObjectId: {value!r}")


# A string field that accepts ObjectId or str and always serializes to str.
PyObjectId = Annotated[str, BeforeValidator(_validate_object_id)]


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class MongoModel(BaseModel):
    """Base for documents stored in MongoDB.

    ``id`` is aliased to Mongo's ``_id`` and serialized as a string.
    """

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str},
    )

    id: PyObjectId | None = Field(default=None, alias="_id")
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)

    def to_mongo(self, *, exclude_none: bool = True) -> dict[str, Any]:
        """Serialize for insertion, dropping the alias id when unset."""
        data = self.model_dump(by_alias=True, exclude_none=exclude_none)
        if data.get("_id") is None:
            data.pop("_id", None)
        return data
