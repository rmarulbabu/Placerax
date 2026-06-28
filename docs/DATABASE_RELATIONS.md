# Placera — Database Relations (ERD)

> MongoDB is non-relational, but Placera models clear logical relationships via referenced ObjectIds (and selective denormalization for read performance). This document is the canonical relationship map.

## Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o| STUDENT_PROFILES : "has (role=student)"
    USERS ||--o| RECRUITER_PROFILES : "has (role=recruiter)"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ SESSIONS : "owns refresh tokens"
    USERS ||--o{ ACTIVITY_LOGS : "generates"

    COMPANIES ||--o{ JOBS : "posts"
    COMPANIES ||--o{ RECRUITER_PROFILES : "employs"
    COMPANIES ||--o{ APPLICATIONS : "receives (denormalized)"

    USERS ||--o{ RESUMES : "student uploads"
    STUDENT_PROFILES ||--o| RESUMES : "active_resume_id"

    JOBS ||--o{ APPLICATIONS : "attracts"
    USERS ||--o{ APPLICATIONS : "student submits"
    RESUMES ||--o{ APPLICATIONS : "attached to"

    APPLICATIONS ||--o{ INTERVIEWS : "schedules"
    JOBS ||--o{ INTERVIEWS : "for"

    USERS ||--o{ SAVED_JOBS : "bookmarks"
    JOBS ||--o{ SAVED_JOBS : "saved in"

    USERS {
        ObjectId _id PK
        string email UK
        string role
        ObjectId company_id FK
    }
    STUDENT_PROFILES {
        ObjectId _id PK
        ObjectId user_id FK,UK
        ObjectId active_resume_id FK
    }
    RECRUITER_PROFILES {
        ObjectId _id PK
        ObjectId user_id FK,UK
        ObjectId company_id FK
        bool verified
    }
    COMPANIES {
        ObjectId _id PK
        string slug UK
        ObjectId owner_id FK
        string approval_status
    }
    JOBS {
        ObjectId _id PK
        ObjectId company_id FK
        ObjectId posted_by FK
        string status
    }
    APPLICATIONS {
        ObjectId _id PK
        ObjectId job_id FK
        ObjectId student_id FK
        ObjectId resume_id FK
        ObjectId company_id FK
        string stage
    }
    RESUMES {
        ObjectId _id PK
        ObjectId student_id FK
    }
    INTERVIEWS {
        ObjectId _id PK
        ObjectId application_id FK
        ObjectId student_id FK
        ObjectId company_id FK
    }
    SAVED_JOBS {
        ObjectId _id PK
        ObjectId student_id FK
        ObjectId job_id FK
    }
    NOTIFICATIONS {
        ObjectId _id PK
        ObjectId user_id FK
    }
    SESSIONS {
        ObjectId _id PK
        ObjectId user_id FK
        string jti UK
    }
```

## Relationship Cardinality Summary

| From | To | Type | Reference |
|------|----|------|-----------|
| users → student_profiles | 1 : 0..1 | embedded id | `student_profiles.user_id` |
| users → recruiter_profiles | 1 : 0..1 | reference | `recruiter_profiles.user_id` |
| companies → jobs | 1 : N | reference | `jobs.company_id` |
| companies → recruiter_profiles | 1 : N | reference | `recruiter_profiles.company_id` |
| jobs → applications | 1 : N | reference | `applications.job_id` |
| users(student) → applications | 1 : N | reference | `applications.student_id` |
| applications → interviews | 1 : N | reference | `interviews.application_id` |
| users(student) → resumes | 1 : N | reference | `resumes.student_id` |
| users × jobs → saved_jobs | M : N | junction | unique `{student_id, job_id}` |
| users → notifications | 1 : N | reference | `notifications.user_id` |

## Denormalization Decisions (read-optimization)

| Field | Stored on | Why |
|-------|-----------|-----|
| `company_id` | applications, interviews | Recruiter "all applicants for my company" in one index, no join |
| `company logo/name` snapshot | (optional cache on application list responses) | Avoid N+1 lookups in pipeline UI |
| `stats.applicants` | jobs | O(1) counters on dashboards instead of `count()` |
| `match_score`, `ats_score` | applications | Precomputed at apply time for instant ranking/sort |

## Integrity Guarantees

1. **One application per job per student** — enforced by unique compound index.
2. **One active resume per student** — `student_profiles.active_resume_id` is authoritative; `resumes.is_active` mirrors it.
3. **Recruiters bound to a company** — `users.company_id` + `recruiter_profiles.company_id` must match; enforced in the service layer.
4. **Cascade behavior** — handled in services (no DB FKs): closing a job → applications become read-only; deleting a company (admin) → soft-cascades jobs to `closed`.
