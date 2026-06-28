# Placera — MongoDB Schema Design

> Database: **MongoDB Atlas**. Driver: **Motor** (async). Validation: **Pydantic v2** document models.
> Convention: every collection has `_id` (ObjectId), `created_at`, `updated_at` (UTC). Soft-delete via `deleted_at` where relevant.

## Collection Map

```
users ───┬──< student_profiles      (1:1)
         ├──< recruiter_profiles     (1:1)
         └──< notifications          (1:N)

companies ──< jobs ──< applications >── users(student)
                 │           │
                 │           └──< interviews
                 └──< pipeline_stages

resumes >── users(student)
saved_jobs (users × jobs)
activity_logs, audit_logs, sessions(refresh tokens)
```

---

## 1. `users`

The identity record shared by all roles. Profile-specific data lives in dedicated collections.

```jsonc
{
  "_id": ObjectId,
  "email": "ada@uni.edu",            // unique, lowercased
  "password_hash": "bcrypt$...",
  "role": "student",                  // enum: student | recruiter | admin
  "full_name": "Ada Lovelace",
  "avatar_url": "https://res.cloudinary.com/...",
  "status": "active",                 // active | pending | suspended | banned
  "email_verified": true,
  "onboarding_completed": false,
  "company_id": ObjectId | null,      // recruiters only
  "last_login_at": ISODate,
  "created_at": ISODate,
  "updated_at": ISODate
}
```
**Indexes:** `{ email: 1 }` unique · `{ role: 1, status: 1 }` · `{ company_id: 1 }`

---

## 2. `student_profiles` (1:1 with users where role=student)

```jsonc
{
  "_id": ObjectId,
  "user_id": ObjectId,                // unique
  "headline": "CS senior · ML & full-stack",
  "location": "Bengaluru, IN",
  "phone": "+91...",
  "education": [
    { "institution": "...", "degree": "B.Tech CSE", "start": 2022, "end": 2026, "cgpa": 8.7 }
  ],
  "experience": [
    { "company": "...", "title": "SDE Intern", "start": ISODate, "end": ISODate, "summary": "..." }
  ],
  "skills": ["python", "react", "fastapi", "mongodb"],
  "projects": [{ "title": "...", "url": "...", "description": "..." }],
  "links": { "github": "...", "linkedin": "...", "portfolio": "..." },
  "preferences": {
    "roles": ["sde", "ml"],
    "locations": ["remote", "bengaluru"],
    "job_types": ["internship", "full_time"]
  },
  "profile_strength": 72,             // 0-100, computed
  "placement_readiness": 64,          // 0-100, computed
  "active_resume_id": ObjectId | null,
  "created_at": ISODate, "updated_at": ISODate
}
```
**Indexes:** `{ user_id: 1 }` unique · `{ skills: 1 }` · `{ "preferences.roles": 1 }` · text index on `headline`,`skills`

---

## 3. `recruiter_profiles` (1:1 with users where role=recruiter)

```jsonc
{
  "_id": ObjectId,
  "user_id": ObjectId,                // unique
  "company_id": ObjectId,
  "title": "Talent Lead",
  "verified": false,                  // admin-gated
  "verification_doc_url": "https://...",
  "permissions": ["post_jobs", "manage_pipeline"],
  "created_at": ISODate, "updated_at": ISODate
}
```
**Indexes:** `{ user_id: 1 }` unique · `{ company_id: 1 }` · `{ verified: 1 }`

---

## 4. `companies`

```jsonc
{
  "_id": ObjectId,
  "name": "Acme AI",
  "slug": "acme-ai",                  // unique
  "logo_url": "https://...",
  "website": "https://acme.ai",
  "industry": "Artificial Intelligence",
  "size": "51-200",
  "about": "...",
  "locations": ["Bengaluru", "Remote"],
  "approval_status": "approved",      // pending | approved | rejected
  "owner_id": ObjectId,               // recruiter who created it
  "team": [ObjectId],                 // recruiter user ids
  "created_at": ISODate, "updated_at": ISODate
}
```
**Indexes:** `{ slug: 1 }` unique · `{ approval_status: 1 }` · `{ owner_id: 1 }` · text index on `name`,`industry`

---

## 5. `jobs`

```jsonc
{
  "_id": ObjectId,
  "company_id": ObjectId,
  "posted_by": ObjectId,              // recruiter user id
  "title": "Software Engineer Intern",
  "slug": "software-engineer-intern-acme-ai",
  "type": "internship",              // internship | full_time | part_time | contract
  "workplace": "remote",             // remote | onsite | hybrid
  "location": "Bengaluru, IN",
  "description": "...",
  "responsibilities": ["..."],
  "requirements": ["..."],
  "skills": ["python", "react"],
  "experience_level": "entry",
  "salary": { "min": 20000, "max": 40000, "currency": "INR", "period": "month" },
  "openings": 3,
  "deadline": ISODate,
  "status": "published",             // draft | pending_moderation | published | closed | rejected
  "pipeline_stages": ["applied","screening","interview","offer","hired","rejected"],
  "stats": { "views": 0, "applicants": 0 },
  "created_at": ISODate, "updated_at": ISODate
}
```
**Indexes:** `{ slug: 1 }` unique · `{ status: 1, type: 1, workplace: 1 }` · `{ company_id: 1, status: 1 }` · `{ skills: 1 }` · `{ created_at: -1 }` · **text** index on `title`,`description`,`skills`

---

## 6. `applications`

The core ATS object. One per (student, job).

```jsonc
{
  "_id": ObjectId,
  "job_id": ObjectId,
  "company_id": ObjectId,            // denormalized for recruiter queries
  "student_id": ObjectId,
  "resume_id": ObjectId,
  "stage": "screening",              // matches job.pipeline_stages
  "status": "active",                // active | withdrawn | rejected | hired
  "match_score": 81,                 // 0-100 vs job requirements
  "ats_score": 74,                   // resume-vs-JD ATS compatibility
  "cover_letter": "...",
  "answers": [{ "question": "...", "answer": "..." }],
  "ranking": 3,                       // recruiter manual/auto rank within job
  "notes": [
    { "author_id": ObjectId, "body": "Strong ML background", "created_at": ISODate }
  ],
  "stage_history": [
    { "stage": "applied", "by": ObjectId, "at": ISODate }
  ],
  "created_at": ISODate, "updated_at": ISODate
}
```
**Indexes:** `{ job_id: 1, stage: 1 }` · `{ student_id: 1, created_at: -1 }` · `{ company_id: 1, status: 1 }` · **unique** `{ job_id: 1, student_id: 1 }` (prevents duplicate apply)

---

## 7. `resumes`

```jsonc
{
  "_id": ObjectId,
  "student_id": ObjectId,
  "file_url": "https://res.cloudinary.com/...pdf",
  "file_name": "ada_resume.pdf",
  "parsed": { "skills": ["..."], "education": [...], "experience": [...], "text": "..." },
  "analysis": {
    "score": 78,                     // overall resume quality
    "ats_score": 74,                 // ATS parse-ability
    "strengths": ["..."],
    "improvements": ["..."],
    "missing_keywords": ["docker"]
  },
  "is_active": true,
  "created_at": ISODate, "updated_at": ISODate
}
```
**Indexes:** `{ student_id: 1, is_active: 1 }`

---

## 8. `interviews`

```jsonc
{
  "_id": ObjectId,
  "application_id": ObjectId,
  "job_id": ObjectId,
  "company_id": ObjectId,
  "student_id": ObjectId,
  "scheduled_by": ObjectId,
  "type": "technical",               // screening | technical | hr | managerial
  "mode": "video",                   // video | phone | onsite
  "start_at": ISODate,
  "duration_min": 45,
  "meeting_url": "https://...",
  "panel": [ObjectId],
  "status": "scheduled",             // scheduled | completed | cancelled | no_show
  "feedback": [
    { "interviewer_id": ObjectId, "rating": 4, "recommendation": "yes", "notes": "..." }
  ],
  "created_at": ISODate, "updated_at": ISODate
}
```
**Indexes:** `{ student_id: 1, start_at: 1 }` · `{ company_id: 1, start_at: 1 }` · `{ application_id: 1 }`

---

## 9. `saved_jobs`

```jsonc
{ "_id": ObjectId, "student_id": ObjectId, "job_id": ObjectId, "created_at": ISODate }
```
**Indexes:** **unique** `{ student_id: 1, job_id: 1 }`

---

## 10. `notifications`

```jsonc
{
  "_id": ObjectId,
  "user_id": ObjectId,
  "type": "application.stage_changed",
  "title": "You advanced to Interview",
  "body": "Acme AI moved your application to Interview.",
  "link": "/student/applications/...",
  "read": false,
  "created_at": ISODate
}
```
**Indexes:** `{ user_id: 1, read: 1, created_at: -1 }`

---

## 11. `sessions` (refresh-token store)

```jsonc
{
  "_id": ObjectId,
  "user_id": ObjectId,
  "jti": "uuid",                     // refresh token id
  "user_agent": "...", "ip": "...",
  "revoked": false,
  "expires_at": ISODate,
  "created_at": ISODate
}
```
**Indexes:** `{ jti: 1 }` unique · `{ user_id: 1 }` · TTL on `expires_at`

---

## 12. `activity_logs` & `audit_logs`

```jsonc
// activity_logs — user-facing activity feed
{ "_id": ObjectId, "actor_id": ObjectId, "verb": "applied", "object_type": "job", "object_id": ObjectId, "meta": {}, "created_at": ISODate }

// audit_logs — admin/compliance trail (immutable)
{ "_id": ObjectId, "actor_id": ObjectId, "action": "company.approved", "target": {...}, "ip": "...", "created_at": ISODate }
```
**Indexes:** `{ actor_id: 1, created_at: -1 }` · TTL on `activity_logs.created_at` (e.g., 180 days)

---

## Data Integrity Rules

- Duplicate-apply prevented by unique compound index on `applications {job_id, student_id}`.
- `company_id` is **denormalized** into `jobs`, `applications`, and `interviews` for single-index recruiter queries (read-optimized).
- Computed fields (`profile_strength`, `placement_readiness`, `match_score`, `ats_score`) are written by services, never trusted from the client.
- Stage transitions append to `stage_history` for a full audit trail and funnel analytics.
