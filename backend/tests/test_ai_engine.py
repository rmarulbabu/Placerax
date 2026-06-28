"""Unit tests for the dependency-free AI/scoring engine."""
from __future__ import annotations

from app.services import ai_engine


def test_keyword_overlap_full():
    pct, missing = ai_engine.keyword_overlap(["python", "react"], ["python", "react"])
    assert pct == 100
    assert missing == []


def test_keyword_overlap_partial():
    pct, missing = ai_engine.keyword_overlap(["python"], ["python", "docker"])
    assert pct == 50
    assert missing == ["docker"]


def test_match_score_bounds():
    score = ai_engine.match_score(["python", "react"], ["python", "react", "go"], "python react")
    assert 0 <= score <= 100


def test_profile_strength_weights():
    weak = ai_engine.profile_strength({"headline": "x"})
    strong = ai_engine.profile_strength(
        {
            "headline": "x",
            "location": "y",
            "skills": ["a", "b"],
            "education": [{"x": 1}],
            "experience": [{"x": 1}],
            "projects": [{"x": 1}],
            "links": {"github": "g"},
            "active_resume_id": "r",
        }
    )
    assert strong == 100
    assert weak < strong


def test_analyze_resume_returns_scores():
    result = ai_engine.analyze_resume(
        "Experience building projects in python. Education B.Tech. Improved metrics 30%.",
        ["python", "react"],
        ["python", "docker"],
    )
    assert 0 <= result["score"] <= 100
    assert 0 <= result["ats_score"] <= 100
    assert "docker" in result["missing_keywords"]


def test_skill_gap():
    gap = ai_engine.skill_gap(["python"], ["python", "docker", "k8s"])
    assert gap["coverage"] == 33
    assert set(gap["missing"]) == {"docker", "k8s"}
