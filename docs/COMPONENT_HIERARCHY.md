# Placera — Frontend UI Component Hierarchy & Design System

> React 19 + Vite + TypeScript · TailwindCSS · Framer Motion · Zustand · TanStack Query · React Hook Form · shadcn/ui · Recharts.
> Aesthetic: premium dark SaaS — deep charcoal canvas, glassmorphic surfaces, violet→cyan accent gradient, generous spacing, restrained motion (think Linear / Vercel / Lever / Wellfound).

## 1. Design Tokens

```
COLOR (HSL via CSS variables, see src/styles/theme.css)
  --background       240 10% 4%      // near-black canvas
  --surface          240 8% 8%       // cards / panels
  --surface-2        240 7% 12%      // raised / hover
  --border           240 6% 18%
  --foreground       0   0% 98%
  --muted            240 5% 64%
  --primary          258 90% 66%     // violet
  --primary-2        190 95% 55%     // cyan (gradient end)
  --success          152 69% 46%
  --warning          38  92% 58%
  --danger           0   84% 62%
  --ring             258 90% 66%

RADIUS    sm 8px · md 12px · lg 16px · xl 20px · 2xl 24px
SHADOW    glass: 0 1px 1px rgba(255,255,255,.04) inset, 0 8px 40px rgba(0,0,0,.45)
SPACING   4-pt base scale (4,8,12,16,20,24,32,40,48,64)
FONT      Inter (UI) · Sora/Cal Sans (display headings) · JetBrains Mono (code/scores)
MOTION    durations 120/180/240ms · easing [0.22,1,0.36,1] · spring for cards
GLASS     bg surface/60 + backdrop-blur-xl + 1px hairline border + inset highlight
```

## 2. Application Shell

```
<App>
└── <Providers>                      // QueryClientProvider, ThemeProvider, TooltipProvider, Toaster
    └── <RouterProvider>
        ├── (public)
        │   ├── <LandingPage>        // hero, gradient mesh, feature grid, CTA
        │   ├── <LoginPage>
        │   ├── <RegisterPage>       // role chooser → student | recruiter
        │   └── <JobBoardPublic>     // browse without login
        │
        ├── <OnboardingFlow>         // multi-step, role-specific, progress rail
        │
        └── <WorkspaceLayout>        // AUTH-GUARDED, role-aware
            ├── <Sidebar>            // collapsible, workspace switcher, nav groups
            ├── <Topbar>             // GlobalSearch · AIAssistant · Notifications · UserMenu
            ├── <CommandPalette>     // ⌘K global navigation/search
            └── <Outlet>             // role dashboards & feature pages
```

## 3. Shared UI Primitives (`src/components/ui/*` — shadcn-based)

```
Button · IconButton · Input · Textarea · Select · Combobox · Checkbox · Switch ·
RadioGroup · Slider · Badge · Avatar · Tooltip · Popover · Dropdown · Dialog ·
Sheet · Tabs · Accordion · Progress · Skeleton · Toast/Sonner · Card · Separator ·
ScrollArea · Table · Pagination · Calendar · DatePicker · Command(⌘K)
```

Placera-specific composites (`src/components/`):

```
GlassCard            // glassmorphic surface wrapper (blur + hairline + inset)
StatWidget           // KPI tile: label, value, delta, sparkline
GradientText         // violet→cyan headline text
ScoreRing            // animated circular score (resume/ATS/readiness)
ProgressMeter        // profile-strength / skill bars
EmptyState           // illustration + CTA
DataTable            // TanStack-table wrapper w/ sticky header, sort, filter
MotionList           // staggered Framer Motion list reveal
PageHeader           // title, breadcrumb, actions
FilterBar            // advanced filters (type, location, skills, salary)
```

## 4. Workspace Navigation (role-aware)

```
STUDENT          RECRUITER              ADMIN
─────────        ──────────────         ───────────────
Dashboard        Dashboard              Overview
Find Jobs        Jobs (post/manage)     Users
Internships      Candidates (pipeline)  Recruiters (verify)
Applications     Interviews             Companies (approve)
Saved            Team                   Job Moderation
Resume & ATS     Analytics              Analytics
Interview Prep   Company Workspace      Monitoring
Mock Interviews                         Revenue
Skill Gap
Career Roadmap
AI Assistant
```

## 5. Feature Page Trees

### Student
```
<StudentDashboard>
├── <ProfileCompletionWidget/> <ApplicationsSentWidget/> <InterviewInvitesWidget/>
├── <PlacementReadinessWidget/> (ScoreRing) <ResumeScoreWidget/> (ScoreRing)
├── <SkillProgressWidget/> (ProgressMeter[])
├── <RecommendedJobsWidget/> (job cards) 
└── <RecentActivityWidget/> (ActivityFeed)

<FindJobs> → <FilterBar/> + <JobList/> (<JobCard/> ×N) + <JobDetailDrawer/> → <OneClickApply/>
<ApplicationTracker> → <ApplicationKanban/> | <ApplicationTable/> (stage chips)
<ResumeHub> → <ResumeUploader/> <ResumeScoreRing/> <ATSReport/> <ImprovementList/>
<SkillGap> → <TargetRolePicker/> <GapMatrix/> <RecommendedCourses/>
<InterviewPrep> → <PrepTracks/> <QuestionBank/> <MockInterview/> (timer + prompts)
<CareerRoadmap> → <RoadmapTimeline/> (milestones, animated)
```

### Recruiter
```
<RecruiterDashboard>
├── <ActiveJobsWidget/> <ApplicantsWidget/> <HiringFunnelWidget/> (Recharts funnel)
├── <InterviewPipelineWidget/> <TeamActivityWidget/> <HiringAnalyticsWidget/>

<JobPostingWizard> → steps: Basics → Details → Requirements → Compensation → Review
<CandidatePipeline> → <PipelineBoard/> (Kanban columns = stages, drag to advance)
<ResumeScreening> → <CandidateDrawer/> (ScoreRing, parsed resume, notes)
<CandidateRanking> → <RankedTable/> (sort by match_score/ats_score)
<InterviewScheduling> → <Scheduler/> (calendar + panel picker)
<CompanyWorkspace> → <CompanyProfileEditor/> <TeamManager/>
```

### Admin
```
<AdminDashboard>
├── <PlatformGrowthWidget/> (area chart) <ActiveUsersWidget/> <JobsPostedWidget/>
├── <ApplicationsSubmittedWidget/> <RecruiterStatsWidget/> <RevenueMetricsWidget/>

<UserManagement> → <DataTable/> (status actions)
<RecruiterVerification> → <VerificationQueue/>
<CompanyApproval> → <ApprovalQueue/>
<JobModeration> → <ModerationQueue/>
<PlatformMonitoring> → <HealthBoard/> (service status, latency, error rate)
```

## 6. State & Data Layer

```
Zustand stores (src/store/)            TanStack Query (src/api/)
──────────────────────────             ─────────────────────────
authStore   (user, tokens, role)       queries/mutations per domain
uiStore     (sidebar, theme, palette)  query keys: ['jobs', filters], ['dashboard', role]
notifStore  (unread, live feed)        optimistic updates for apply / stage moves
            ◄── WebSocket bridge ──►    invalidation on realtime events
```

- **React Hook Form** + Zod for all forms (auth, onboarding, job wizard).
- **Framer Motion** for page transitions, staggered lists, score-ring fills, drawer/sheet springs.
- **Recharts** for funnels, growth/area, and distribution charts.
- **PWA** via `vite-plugin-pwa` (installable, offline shell, asset caching).

## 7. Responsiveness

- Sidebar collapses to icon rail < `lg`, becomes a `Sheet` drawer < `md`.
- Dashboards: 12-col grid → 6 → 1 across breakpoints.
- Kanban boards switch to horizontal scroll-snap on touch.
- All hit targets ≥ 44px; respects `prefers-reduced-motion`.
