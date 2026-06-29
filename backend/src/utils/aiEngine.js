"use strict";

/**
 * Deterministic, dependency-free AI/scoring engine.
 * Faithful port of app/services/ai_engine.py — powers resume scoring, ATS
 * compatibility, match scoring, profile strength, placement readiness, and
 * skill-gap analysis. Provider-agnostic: swap any function body for an LLM/ML
 * call behind the same signature and nothing else in the app changes.
 */

const STOP = new Set(["and", "or", "the", "a", "an", "to", "of", "in", "for", "with", "on", "at"]);

function tokens(text) {
  const matches = String(text || "").toLowerCase().match(/[a-z+#.]{2,}/g) || [];
  return new Set(matches.filter((w) => !STOP.has(w)));
}

function norm(skills) {
  const out = new Set();
  for (const s of skills || []) {
    const v = String(s).trim().toLowerCase();
    if (v) out.add(v);
  }
  return out;
}

function intersection(a, b) {
  const out = new Set();
  for (const x of a) if (b.has(x)) out.add(x);
  return out;
}

function difference(a, b) {
  const out = new Set();
  for (const x of a) if (!b.has(x)) out.add(x);
  return out;
}

/** Return [percentOverlap 0-100, missingKeywords]. */
function keywordOverlap(have, want) {
  const haveSet = norm(have);
  const wantSet = norm(want);
  if (wantSet.size === 0) return [100, []];
  const matched = intersection(haveSet, wantSet);
  const missing = [...difference(wantSet, haveSet)].sort();
  const pct = Math.round((matched.size / wantSet.size) * 100);
  return [pct, missing];
}

/** How well a candidate matches a job (0-100). */
function matchScore(candidateSkills, jobSkills, jobText = "") {
  const [skillPct] = keywordOverlap(candidateSkills, jobSkills);
  let textBonus = 0;
  if (jobText) {
    const jt = tokens(jobText);
    const cs = norm(candidateSkills);
    if (jt.size) {
      textBonus = Math.round((intersection(cs, jt).size / Math.max(cs.size, 1)) * 20);
    }
  }
  return Math.max(0, Math.min(100, Math.round(skillPct * 0.8 + textBonus)));
}

/** Produce resume score + ATS score + strengths/improvements. */
function analyzeResume(parsedText, skills, jobSkills = null) {
  const text = parsedText || "";
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean).length;
  const skillSet = norm(skills);

  const strengths = [];
  const improvements = [];

  let ats = 50;
  if (skillSet.size) {
    ats += Math.min(20, skillSet.size * 2);
    strengths.push(`${skillSet.size} relevant skills detected`);
  } else {
    improvements.push("Add a clearly labelled Skills section");
  }

  if (["experience", "internship", "project"].some((k) => lower.includes(k))) {
    ats += 12;
    strengths.push("Includes experience/projects section");
  } else {
    improvements.push("Add an Experience or Projects section");
  }

  if (["education", "b.tech", "bachelor", "degree"].some((k) => lower.includes(k))) {
    ats += 8;
  } else {
    improvements.push("Add an Education section");
  }

  if (/\b\d+%|\b\d+\+?\b/.test(text)) {
    ats += 6;
    strengths.push("Quantified achievements found");
  } else {
    improvements.push("Quantify impact with numbers/metrics");
  }

  if (words >= 200 && words <= 900) {
    ats += 4;
  } else if (words < 200) {
    improvements.push("Resume looks short; add more detail");
  } else {
    improvements.push("Resume may be too long; tighten content");
  }

  ats = Math.max(0, Math.min(100, ats));

  let score = Math.round(ats * 0.7 + Math.min(30, skillSet.size * 3));
  score = Math.max(0, Math.min(100, score));

  let missing = [];
  if (jobSkills) {
    const [atsMatch, miss] = keywordOverlap(skills, jobSkills);
    missing = miss;
    ats = Math.round((ats + atsMatch) / 2);
    if (missing.length) {
      improvements.push(`Add JD keywords: ${missing.slice(0, 6).join(", ")}`);
    }
  }

  return {
    score,
    ats_score: ats,
    strengths: strengths.slice(0, 5),
    improvements: improvements.slice(0, 6),
    missing_keywords: missing.slice(0, 10),
  };
}

/** Weighted completeness score for a student profile (0-100). */
function profileStrength(profile) {
  const weights = {
    headline: 10,
    location: 5,
    skills: 20,
    education: 15,
    experience: 15,
    projects: 10,
    links: 10,
    active_resume_id: 15,
  };
  let total = 0;
  for (const [field, w] of Object.entries(weights)) {
    const value = profile ? profile[field] : undefined;
    if (Array.isArray(value)) {
      if (value.length) total += w;
    } else if (value && typeof value === "object") {
      if (Object.keys(value).length) total += w;
    } else if (value) {
      total += w;
    }
  }
  return Math.min(100, total);
}

/** Composite placement-readiness score (0-100). */
function placementReadiness(profile, { applications, resumeAts }) {
  const strength = profileStrength(profile);
  const activity = Math.min(100, applications * 10);
  return Math.max(0, Math.min(100, Math.round(strength * 0.45 + resumeAts * 0.35 + activity * 0.2)));
}

function skillGap(candidateSkills, targetSkills) {
  const have = norm(candidateSkills);
  const want = norm(targetSkills);
  const matched = [...intersection(have, want)].sort();
  const missing = [...difference(want, have)].sort();
  const coverage = want.size ? Math.round((matched.length / want.size) * 100) : 100;
  return {
    coverage,
    matched,
    missing,
    recommendation: missing.slice(0, 5).map((s) => `Learn ${s}`),
  };
}

/** Generate a phased roadmap toward a target role. */
function careerRoadmap(targetRole, currentSkills, missing) {
  const phases = [
    {
      phase: "Foundations (Weeks 1-4)",
      focus: missing.slice(0, 2).length ? missing.slice(0, 2) : ["Strengthen core fundamentals"],
      milestone: "Complete 2 guided projects",
    },
    {
      phase: "Specialization (Weeks 5-10)",
      focus: missing.slice(2, 5).length ? missing.slice(2, 5) : ["Deepen domain expertise"],
      milestone: "Build 1 portfolio-grade project",
    },
    {
      phase: "Interview Readiness (Weeks 11-14)",
      focus: ["DSA practice", "Mock interviews", "Resume polish"],
      milestone: "Pass 5 mock interviews",
    },
  ];
  return { target_role: targetRole, phases };
}

module.exports = {
  keywordOverlap,
  matchScore,
  analyzeResume,
  profileStrength,
  placementReadiness,
  skillGap,
  careerRoadmap,
};
