# Fix: "Create a company workspace before posting jobs"

## Root Cause

Job creation is gated by `jobService.assertCanPost`, which required **three**
admin-controlled conditions:

1. the recruiter's profile is linked to a company (`profile.company_id`),
2. the recruiter is **verified** (`profile.verified === true`), and
3. the company is **approved** (`approval_status === "approved"`).

For a self-registered recruiter, none of these are true, and — critically —
there was **no UI to create a company workspace** (the `/recruiter/company`
route rendered a placeholder). So every recruiter hit the blocking error on
"Create Draft", with no path forward.

## Fix (self-serve workspace)

- **Company creation is now self-serve**: creating a workspace auto-approves the
  company and verifies the recruiter, and binds the company to both the user and
  the recruiter profile (auto-association).
- **Job creation only requires a linked, existing company** (verification /
  approval gates removed from `assertCanPost`).
- **Publishing goes live directly** so jobs appear in listings immediately.
- New **Create/Edit Company Workspace** page, a dashboard **Company Profile**
  card, and a **gated Jobs page** that routes recruiters without a company to
  the workspace form. `companyId` + `recruiterId` are attached automatically on
  job creation.
- Error copy updated to: **"You need to create a company profile before posting
  jobs."** with a **[Create Company Workspace]** button.

## Files Modified

**Backend**
- `backend/src/models/company.js` — added `linkedin_url`, `hr_email`.
- `backend/src/services/companyService.js` — self-serve `create` (auto-approve +
  verify + new fields + cache invalidation), new `getMine`, `update` accepts `location`.
- `backend/src/controllers/companyController.js` — new `myCompany` handler.
- `backend/src/routes/companyRoutes.js` — `GET /companies/mine` (before `/:slug`).
- `backend/src/validators/companyValidators.js` — new fields on create/update.
- `backend/src/services/jobService.js` — relaxed `assertCanPost`; `publish` -> PUBLISHED.

**Frontend**
- `frontend/src/pages/recruiter/CompanyWorkspacePage.tsx` — **new** create/edit page.
- `frontend/src/pages/recruiter/RecruiterJobs.tsx` — company gate + improved error + redirect.
- `frontend/src/pages/recruiter/RecruiterDashboard.tsx` — Company Profile section (View/Edit).
- `frontend/src/App.tsx` — `/recruiter/company` now renders the workspace page.
- `frontend/src/api/hooks.ts` — `useMyCompany`.
- `frontend/src/types/index.ts` — `Company` type.

## Models

No new collection — the existing `companies` collection is used. Added fields:
`companies.linkedin_url`, `companies.hr_email`. Relationship: `Company.owner_id`
+ `Company.team[]` → recruiter (a recruiter may own/manage multiple companies at
the data layer); the active workspace is bound via `users.company_id` and
`recruiter_profiles.company_id`.

## APIs Added / Changed

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/v1/companies/mine` | **new** — the recruiter's own company (or `null`) |
| POST | `/api/v1/companies` | now accepts `logo_url`, `location`, `linkedin_url`, `hr_email`; auto-approves + verifies |
| PATCH | `/api/v1/companies/:company_id` | accepts the same new fields |
| POST | `/api/v1/jobs` | unchanged contract; only requires a linked company |
| POST | `/api/v1/jobs/:job_id/publish` | now publishes directly (live in listings) |

## Testing Checklist

- [ ] New recruiter → Jobs page shows "Create Company Workspace" gate.
- [ ] Create company → saved in MongoDB (`companies`), recruiter linked
      (`users.company_id`, `recruiter_profiles.company_id`).
- [ ] After creation, recruiter can create a job draft (no block).
- [ ] Publish → job status `published`, appears in `/jobs` listings and dashboard.
- [ ] Dashboard shows the Company Profile card with View/Edit.
- [ ] Editing the company persists changes.
