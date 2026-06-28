<div align="center">

# 🚀 Placera

### The Venture-Scale Internship & Placement Platform

*Internshala × LinkedIn Jobs × Wellfound × Lever ATS — reimagined as a premium, dark-themed SaaS product.*

[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61DAFB?logo=react&logoColor=white)](#)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](#)
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?logo=mongodb&logoColor=white)](#)
[![Cache](https://img.shields.io/badge/Cache-Redis-DC382D?logo=redis&logoColor=white)](#)
[![Storage](https://img.shields.io/badge/Storage-Cloudinary-3448C5?logo=cloudinary&logoColor=white)](#)

</div>

---

## What is Placera?

Placera is a **production-grade, multi-tenant SaaS platform** that connects students, recruiters, and platform administrators in one workspace-driven product. It is architected to scale to **100,000+ users** with a modular backend, repository pattern, API versioning, Redis caching, and real-time updates over WebSockets.

This is **not** a CRUD placement website. It is a startup-ready product with:

- A **workspace-based** information architecture (like Linear / Lever).
- A premium **dark theme** design system with glassmorphism and motion.
- **Role-based** experiences for Students, Recruiters, and Admins.
- An **ATS-grade** recruiter pipeline and an **AI-assisted** student career suite.

## Monorepo Layout

```
placera/
├── frontend/          # React 19 + Vite + TS + Tailwind + Framer Motion + Zustand + TanStack Query + shadcn
├── backend/           # FastAPI + Motor (MongoDB) + Redis + JWT/RBAC + WebSockets + repository pattern
├── shared/            # Cross-cutting contracts: role enums, status codes, API constants
├── docs/              # Architecture, schema, API design, auth flow, ERD, component hierarchy, deployment
├── docker-compose.yml # Local full-stack orchestration (api + web + mongo + redis)
└── README.md
```

## The Three Workspaces

| Role          | Workspace experience |
|---------------|----------------------|
| 🎓 **Student**   | AI resume analysis & ATS score, profile strength meter, one-click apply, application tracker, job/internship recommendations, skill-gap analysis, interview prep hub, mock interviews, career roadmap generator. |
| 🧑‍💼 **Recruiter** | Company workspace, job-posting wizard, candidate pipeline (Kanban ATS), resume screening, candidate ranking, interview scheduling, team collaboration, notes & feedback. |
| 🛡️ **Admin**     | User management, recruiter verification, company approval, job moderation, platform analytics, monitoring, revenue metrics. |

## Tech Stack

**Frontend** — React, Vite, TypeScript, TailwindCSS, Framer Motion, Zustand, TanStack Query, React Hook Form, shadcn/ui, Recharts, PWA.

**Backend** — Python 3.11+, FastAPI, Motor (async MongoDB), Redis, JWT auth, Role-Based Access Control, WebSockets, Pydantic v2, repository + service pattern, API versioning (`/api/v1`).

**Data & Infra** — MongoDB Atlas, Redis, Cloudinary (file storage), Docker, GitHub Actions CI.

## Quick Start

> **Prerequisites:** Node 20+, Python 3.11+, and either Docker or local MongoDB + Redis.

### Option A — Docker (recommended)

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up --build
# Web → http://localhost:5173    API → http://localhost:8000/docs
```

### Option B — Run services individually

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # fill in Mongo/Redis/Cloudinary/JWT secrets
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env
npm run dev
```

Seed demo data (students, recruiters, jobs):

```bash
cd backend && python -m app.scripts.seed
```

## Documentation

| Doc | Description |
|-----|-------------|
| [Architecture](docs/ARCHITECTURE.md) | System diagram, layers, scaling strategy |
| [Database Schema](docs/DATABASE_SCHEMA.md) | All MongoDB collections + indexes |
| [Database Relations](docs/DATABASE_RELATIONS.md) | ERD and relationship model |
| [API Design](docs/API_DESIGN.md) | REST surface, versioning, conventions |
| [Auth Flow](docs/AUTH_FLOW.md) | JWT access/refresh + RBAC |
| [Component Hierarchy](docs/COMPONENT_HIERARCHY.md) | Frontend UI tree & design tokens |
| [Deployment](docs/DEPLOYMENT.md) | Docker, CI, hosting topology |

## License

MIT © Placera
