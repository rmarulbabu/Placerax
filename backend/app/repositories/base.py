"""Generic repository implementing the repository pattern over a Mongo collection.

Services depend on repositories (never on Motor directly), which keeps data-access
code isolated and makes the service layer unit-testable with mock repositories.
"""
from __future__ import annotations

from typing import Any, Generic, TypeVar

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection, AsyncIOMotorDatabase
from pydantic import BaseModel

ModelT = TypeVar("ModelT", bound=BaseModel)


def _oid(value: str | ObjectId) -> ObjectId:
    return value if isinstance(value, ObjectId) else ObjectId(value)


def _doc_to_str_id(doc: dict[str, Any] | None) -> dict[str, Any] | None:
    if doc and isinstance(doc.get("_id"), ObjectId):
        doc["_id"] = str(doc["_id"])
    return doc


class BaseRepository(Generic[ModelT]):
    collection_name: str
    model: type[ModelT]

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.db = db
        self.col: AsyncIOMotorCollection = db[self.collection_name]

    # ---- create ----
    async def insert(self, model: ModelT) -> ModelT:
        data = model.to_mongo() if hasattr(model, "to_mongo") else model.model_dump(by_alias=True)
        result = await self.col.insert_one(data)
        data["_id"] = str(result.inserted_id)
        return self.model.model_validate(data)

    # ---- read ----
    async def get(self, id: str) -> ModelT | None:
        if not ObjectId.is_valid(id):
            return None
        doc = await self.col.find_one({"_id": _oid(id)})
        doc = _doc_to_str_id(doc)
        return self.model.model_validate(doc) if doc else None

    async def find_one(self, query: dict[str, Any]) -> ModelT | None:
        doc = _doc_to_str_id(await self.col.find_one(query))
        return self.model.model_validate(doc) if doc else None

    async def find(
        self,
        query: dict[str, Any] | None = None,
        *,
        sort: list[tuple[str, int]] | None = None,
        limit: int = 20,
        skip: int = 0,
    ) -> list[ModelT]:
        cursor = self.col.find(query or {})
        if sort:
            cursor = cursor.sort(sort)
        cursor = cursor.skip(skip).limit(limit)
        return [self.model.model_validate(_doc_to_str_id(d)) async for d in cursor]

    async def count(self, query: dict[str, Any] | None = None) -> int:
        return await self.col.count_documents(query or {})

    # ---- update ----
    async def update(self, id: str, changes: dict[str, Any]) -> ModelT | None:
        from app.models.base import utcnow

        changes = {**changes, "updated_at": utcnow()}
        doc = await self.col.find_one_and_update(
            {"_id": _oid(id)}, {"$set": changes}, return_document=True
        )
        doc = _doc_to_str_id(doc)
        return self.model.model_validate(doc) if doc else None

    async def push(self, id: str, field: str, value: Any) -> None:
        await self.col.update_one({"_id": _oid(id)}, {"$push": {field: value}})

    async def inc(self, id: str, field: str, amount: int = 1) -> None:
        await self.col.update_one({"_id": _oid(id)}, {"$inc": {field: amount}})

    # ---- delete ----
    async def delete(self, id: str) -> bool:
        result = await self.col.delete_one({"_id": _oid(id)})
        return result.deleted_count > 0

    # ---- aggregation passthrough ----
    async def aggregate(self, pipeline: list[dict[str, Any]]) -> list[dict[str, Any]]:
        return [doc async for doc in self.col.aggregate(pipeline)]
