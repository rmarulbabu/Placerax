"""Resume document with parsed content + AI analysis."""
from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.base import MongoModel, PyObjectId


class ResumeAnalysis(BaseModel):
    score: int = 0
    ats_score: int = 0
    strengths: list[str] = Field(default_factory=list)
    improvements: list[str] = Field(default_factory=list)
    missing_keywords: list[str] = Field(default_factory=list)


class Resume(MongoModel):
    student_id: PyObjectId
    file_url: str
    file_name: str
    parsed: dict = Field(default_factory=dict)
    analysis: ResumeAnalysis = Field(default_factory=ResumeAnalysis)
    is_active: bool = False
