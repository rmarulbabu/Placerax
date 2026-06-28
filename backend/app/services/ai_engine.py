"""Deterministic, dependency-free AI/scoring engine.

This is the heuristic engine that powers resume scoring, ATS compatibility,
match scoring, profile strength, placement readiness, and skill-gap analysis.
It is intentionally provider-agnostic: swap any method body for an LLM/ML call
behind the same signature and nothing else in the app changes.
"""
from __future__ import annotations

import re

_STOP = {"and", "or", "the", "a", "an", "to", "of", "in", "for", "with", "on", "at"}


def _tokens(text: str) -> set[str]:
    return {w for w in re.findall(r"[a-zA-Z+#.]{2,}", text.lower()) if w not in _STOP}


def _norm(skills: list[str]) -> set[str]:
    return {s.strip().lower() for s in skills if s.strip()}


def keyword_overlap(have: list[str], want: list[str]) -> tuple[int, list[str]]:
    """Return (percent_overlap 0-100, missing_keywords)."""
    have_set, want_set = _norm(have), _norm(want)
    if not want_set:
        return 100, []
    matched = have_set & want_set
    missing = sorted(want_set - have_set)
    pct = round(len(matched) / len(want_set) * 100)
    return pct, missing


def match_score(candidate_skills: list[str], job_skills: list[str], job_text: str = "") -> int:
    """How well a candidate matches a job (0-100)."""
    skill_pct, _ = keyword_overlap(candidate_skills, job_skills)
    text_bonus = 0
    if job_text:
        jt = _tokens(job_text)
        cs = _norm(candidate_skills)
        if jt:
            text_bonus = round(len(cs & jt) / max(len(cs), 1) * 20)
    return max(0, min(100, round(skill_pct * 0.8 + text_bonus)))


def analyze_resume(parsed_text: str, skills: list[str], job_skills: list[str] | None = None) -> dict:
    """Produce resume score + ATS score + strengths/improvements."""
    text = parsed_text or ""
    words = len(text.split())
    skill_set = _norm(skills)

    strengths: list[str] = []
    improvements: list[str] = []

    # ATS parse-ability heuristics
    ats = 50
    if skill_set:
        ats += min(20, len(skill_set) * 2)
        strengths.append(f"{len(skill_set)} relevant skills detected")
    else:
        improvements.append("Add a clearly labelled Skills section")

    if any(k in text.lower() for k in ("experience", "internship", "project")):
        ats += 12
        strengths.append("Includes experience/projects section")
    else:
        improvements.append("Add an Experience or Projects section")

    if any(k in text.lower() for k in ("education", "b.tech", "bachelor", "degree")):
        ats += 8
    else:
        improvements.append("Add an Education section")

    if re.search(r"\b\d+%|\b\d+\+?\b", text):
        ats += 6
        strengths.append("Quantified achievements found")
    else:
        improvements.append("Quantify impact with numbers/metrics")

    if 200 <= words <= 900:
        ats += 4
    elif words < 200:
        improvements.append("Resume looks short; add more detail")
    else:
        improvements.append("Resume may be too long; tighten content")

    ats = max(0, min(100, ats))

    # overall quality score
    score = round(ats * 0.7 + min(30, len(skill_set) * 3))
    score = max(0, min(100, score))

    missing: list[str] = []
    if job_skills:
        ats_match, missing = keyword_overlap(skills, job_skills)
        ats = round((ats + ats_match) / 2)
        if missing:
            improvements.append(f"Add JD keywords: {', '.join(missing[:6])}")

    return {
        "score": score,
        "ats_score": ats,
        "strengths": strengths[:5],
        "improvements": improvements[:6],
        "missing_keywords": missing[:10],
    }


def profile_strength(profile: dict) -> int:
    """Weighted completeness score for a student profile (0-100)."""
    weights = {
        "headline": 10,
        "location": 5,
        "skills": 20,
        "education": 15,
        "experience": 15,
        "projects": 10,
        "links": 10,
        "active_resume_id": 15,
    }
    total = 0
    for field, w in weights.items():
        value = profile.get(field)
        if isinstance(value, list):
            if value:
                total += w
        elif isinstance(value, dict):
            if value:
                total += w
        elif value:
            total += w
    return min(100, total)


def placement_readiness(profile: dict, *, applications: int, resume_ats: int) -> int:
    """Composite placement-readiness score (0-100)."""
    strength = profile_strength(profile)
    activity = min(100, applications * 10)
    return max(0, min(100, round(strength * 0.45 + resume_ats * 0.35 + activity * 0.20)))


def skill_gap(candidate_skills: list[str], target_skills: list[str]) -> dict:
    have = _norm(candidate_skills)
    want = _norm(target_skills)
    matched = sorted(have & want)
    missing = sorted(want - have)
    coverage = round(len(matched) / len(want) * 100) if want else 100
    return {
        "coverage": coverage,
        "matched": matched,
        "missing": missing,
        "recommendation": [f"Learn {s}" for s in missing[:5]],
    }


def career_roadmap(target_role: str, current_skills: list[str], missing: list[str]) -> dict:
    """Generate a phased roadmap toward a target role."""
    phases = [
        {
            "phase": "Foundations (Weeks 1-4)",
            "focus": missing[:2] or ["Strengthen core fundamentals"],
            "milestone": "Complete 2 guided projects",
        },
        {
            "phase": "Specialization (Weeks 5-10)",
            "focus": missing[2:5] or ["Deepen domain expertise"],
            "milestone": "Build 1 portfolio-grade project",
        },
        {
            "phase": "Interview Readiness (Weeks 11-14)",
            "focus": ["DSA practice", "Mock interviews", "Resume polish"],
            "milestone": "Pass 5 mock interviews",
        },
    ]
    return {"target_role": target_role, "phases": phases}
