# Placera — API Design

> Base URL: `/api/v1` · Format: JSON · Auth: `Authorization: Bearer <access_token>` · Realtime: `wss://<host>/ws`

## 1. Conventions

- **Versioning:** URL-prefixed (`/api/v1`). New breaking changes ship under `/api/v2`; v1 stays supported.
- **Resource naming:** plural nouns (`/jobs`, `/applications`), kebab/segment ids.
- **Status codes:** `200` ok · `201` created · `204` no content · `400` validation · `401` unauthenticated · `403` forbidden (RBAC) · `404` not found · `409` conflict (e.g., duplicate apply) · `422` Pydantic validation · `429` rate-limited · `500` server.
- **Pagination:** keyset/cursor — `?limit=20&cursor=<opaque>`; responses return `{ items, next_cursor, total? }`.
- **Filtering/sort:** explicit query params (`?type=internship&workplace=remote&sort=-created_at`).
- **Errors:** uniform envelope.

```jsonc
// Error envelope
{ "error": { "code": "DUPLICATE_APPLICATION", "message": "You already applied to this job.", "details": {} } }
```

## 2. Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | public | Register (role: student/recruiter) |
| POST | `/auth/login` | public | Email + password → access + refresh |
| POST | `/auth/refresh` | refresh | Rotate tokens |
| POST | `/auth/logout` | bearer | Revoke refresh token |
| GET  | `/auth/me` | bearer | Current user + profile |
| POST | `/auth/verify-email` | public | Confirm email token |
| POST | `/auth/forgot-password` | public | Begin reset |
| POST | `/auth/reset-password` | public | Complete reset |

## 3. Users & Profiles

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/users/me` | any | Identity record |
| PATCH | `/users/me` | any | Update name/avatar |
| GET | `/profiles/student/me` | student | Get student profile + strength |
| PATCH | `/profiles/student/me` | student | Update student profile |
| POST | `/profiles/student/onboarding` | student | Complete multi-step onboarding |
| GET | `/profiles/recruiter/me` | recruiter | Recruiter profile |
| PATCH | `/profiles/recruiter/me` | recruiter | Update recruiter profile |

## 4. Resumes & AI

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/resumes` | student | Upload resume (Cloudinary) → triggers parse + analysis |
| GET | `/resumes` | student | List my resumes |
| GET | `/resumes/{id}` | student | Resume detail + analysis |
| POST | `/resumes/{id}/analyze` | student | Re-run analysis / ATS score |
| POST | `/resumes/{id}/activate` | student | Set active resume |
| POST | `/ai/ats-match` | student | ATS compatibility of resume vs job |
| POST | `/ai/skill-gap` | student | Skill-gap analysis vs target role |
| POST | `/ai/roadmap` | student | Generate career roadmap |
| GET | `/ai/recommendations/jobs` | student | Personalized job recommendations |

## 5. Companies

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/companies` | recruiter | Create company workspace (pending approval) |
| GET | `/companies/{slug}` | any | Public company profile |
| PATCH | `/companies/{id}` | recruiter(owner) | Update company |
| POST | `/companies/{id}/team` | recruiter(owner) | Invite teammate |

## 6. Jobs

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/jobs` | public | Search/filter jobs (paginated) |
| GET | `/jobs/{slug}` | public | Job detail |
| POST | `/jobs` | recruiter(verified) | Create job (wizard) → pending_moderation |
| PATCH | `/jobs/{id}` | recruiter(owner) | Edit job |
| POST | `/jobs/{id}/publish` | recruiter(owner) | Submit for moderation/publish |
| POST | `/jobs/{id}/close` | recruiter(owner) | Close job |
| GET | `/jobs/{id}/applicants` | recruiter(owner) | Applicants for job |

## 7. Applications (ATS)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/applications` | student | One-click apply `{job_id, resume_id}` |
| GET | `/applications/me` | student | My applications (tracker) |
| GET | `/applications/{id}` | student/recruiter | Detail (ownership-checked) |
| DELETE | `/applications/{id}` | student | Withdraw |
| PATCH | `/applications/{id}/stage` | recruiter | Move pipeline stage |
| PATCH | `/applications/{id}/rank` | recruiter | Set ranking |
| POST | `/applications/{id}/notes` | recruiter | Add note/feedback |
| GET | `/pipeline/{job_id}` | recruiter | Kanban: applications grouped by stage |

## 8. Interviews

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/interviews` | recruiter | Schedule interview |
| GET | `/interviews/me` | student/recruiter | My interviews |
| PATCH | `/interviews/{id}` | recruiter | Reschedule/cancel |
| POST | `/interviews/{id}/feedback` | recruiter | Submit feedback |

## 9. Saved Jobs, Search, Notifications

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/saved-jobs/{job_id}` | student | Save job |
| DELETE | `/saved-jobs/{job_id}` | student | Unsave |
| GET | `/saved-jobs` | student | List saved |
| GET | `/search?q=` | any | Global search (jobs, companies, candidates*) |
| GET | `/notifications` | any | List notifications |
| POST | `/notifications/read` | any | Mark read (all or ids) |

## 10. Dashboards & Analytics

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/dashboard/student` | student | All student widgets in one payload |
| GET | `/dashboard/recruiter` | recruiter | Recruiter widgets + hiring funnel |
| GET | `/dashboard/admin` | admin | Platform growth, users, revenue metrics |
| GET | `/analytics/funnel/{job_id}` | recruiter | Hiring funnel for a job |

## 11. Admin

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/admin/users` | admin | List/manage users |
| PATCH | `/admin/users/{id}/status` | admin | Suspend/ban/activate |
| GET | `/admin/recruiters/pending` | admin | Recruiters awaiting verification |
| POST | `/admin/recruiters/{id}/verify` | admin | Verify recruiter |
| GET | `/admin/companies/pending` | admin | Companies awaiting approval |
| POST | `/admin/companies/{id}/approve` | admin | Approve/reject company |
| GET | `/admin/jobs/moderation` | admin | Jobs awaiting moderation |
| POST | `/admin/jobs/{id}/moderate` | admin | Approve/reject job |

## 12. WebSockets

```
wss://<host>/ws?token=<access_token>
```

Server → client event envelope:

```jsonc
{ "event": "notification.new", "data": { /* notification */ }, "ts": "ISO" }
{ "event": "application.stage_changed", "data": { "application_id": "...", "stage": "interview" } }
{ "event": "presence.update", "data": { "user_id": "...", "online": true } }
```

Channels are derived from identity: each socket auto-subscribes to `user:{id}` and (recruiters) `company:{id}`.

## 13. Rate Limiting

- Auth endpoints: 10 req / min / IP.
- Apply endpoint: 30 req / min / user.
- Search: 60 req / min / user.
- Returns `429` with `Retry-After` header.
