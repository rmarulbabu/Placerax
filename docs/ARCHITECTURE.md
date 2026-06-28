# Placera — System Architecture

> Production-grade, modular, horizontally scalable SaaS architecture designed for 100,000+ users.

## 1. High-Level Overview

Placera is a **3-tier, role-aware SaaS** composed of a React SPA/PWA client, a stateless FastAPI service layer, and a managed data plane (MongoDB Atlas + Redis + Cloudinary). The service layer is **stateless** so it can scale horizontally behind a load balancer; all shared state lives in MongoDB (durable) and Redis (ephemeral/cache/pub-sub).

```
                                   ┌──────────────────────────────────────────┐
                                   │                CLIENTS                    │
                                   │  Web SPA / PWA (React + Vite)             │
                                   │  Student · Recruiter · Admin workspaces   │
                                   └───────────────┬──────────────────────────┘
                                                   │ HTTPS (REST /api/v1) + WSS (WebSocket)
                                                   ▼
                                   ┌──────────────────────────────────────────┐
                                   │              EDGE / CDN                   │
                                   │  TLS termination · static assets · WAF    │
                                   └───────────────┬──────────────────────────┘
                                                   │
                                                   ▼
                                   ┌──────────────────────────────────────────┐
                                   │           API GATEWAY / LB                │
                                   │     (Nginx / Cloud LB, round-robin)       │
                                   └───────────────┬──────────────────────────┘
                                                   │
                  ┌────────────────────────────────┼────────────────────────────────┐
                  ▼                                 ▼                                 ▼
        ┌───────────────────┐           ┌───────────────────┐           ┌───────────────────┐
        │  FastAPI Pod #1   │           │  FastAPI Pod #2   │   ...     │  FastAPI Pod #N   │
        │  (stateless)      │           │  (stateless)      │           │  (stateless)      │
        └─────────┬─────────┘           └─────────┬─────────┘           └─────────┬─────────┘
                  │                               │                               │
   ┌──────────────┼───────────────────────────────┼───────────────────────────────┼──────────────┐
   ▼              ▼                               ▼                               ▼              ▼
┌────────┐  ┌──────────┐                   ┌──────────┐                     ┌────────────┐  ┌──────────┐
│MongoDB │  │  Redis   │                   │  Redis   │                     │ Cloudinary │  │  AI/ML   │
│ Atlas  │  │  Cache   │                   │ Pub/Sub  │                     │  Storage   │  │ Provider │
│(replica│  │ + Rate   │                   │ (WS fan- │                     │ (resumes,  │  │ (resume  │
│  set)  │  │  limit)  │                   │  out)    │                     │  avatars)  │  │ scoring) │
└────────┘  └──────────┘                   └──────────┘                     └────────────┘  └──────────┘
```

## 2. Backend Layered Architecture

Placera's backend follows a strict **Router → Service → Repository → Database** flow. Each layer has one responsibility and depends only on the layer below it.

```
┌─────────────────────────────────────────────────────────────────┐
│  API LAYER  (app/api/v1/*)                                        │
│  • FastAPI routers, request validation, response shaping          │
│  • Dependency injection of current user + RBAC guards             │
└───────────────────────────────┬───────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  SERVICE LAYER  (app/services/*)                                  │
│  • Business logic, orchestration, transactions                    │
│  • Cross-cutting: caching, events, notifications, scoring         │
└───────────────────────────────┬───────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  REPOSITORY LAYER  (app/repositories/*)                           │
│  • Data access only. One repo per collection.                     │
│  • Generic BaseRepository[T] + specialized query methods          │
└───────────────────────────────┬───────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  DATA LAYER  (Motor / Redis / Cloudinary clients)                 │
└─────────────────────────────────────────────────────────────────┘
```

**Why the repository pattern?** It isolates Mongo-specific query code from business logic, makes services unit-testable with mock repos, and lets us swap or shard storage without touching the service layer.

## 3. Module Boundaries (Modular Monolith)

Placera ships as a **modular monolith** — a single deployable with hard internal boundaries. This is the correct startup-stage choice: it keeps operational complexity low while preserving clean seams that can be extracted into microservices once a module's load justifies it.

```
app/
├── core/            # config, db, redis, security, dependencies, events
├── api/v1/          # thin HTTP routers grouped by domain
├── services/        # business logic per domain
├── repositories/    # data access per collection
├── models/          # MongoDB document models (Pydantic)
├── schemas/         # request/response DTOs
├── websockets/      # connection manager + realtime channels
└── scripts/         # seeding, migrations, ops
```

**Domains:** `auth`, `users`, `companies`, `jobs`, `applications`, `pipeline (ATS)`, `interviews`, `notifications`, `search`, `analytics`, `ai` (resume scoring / recommendations), `admin`.

### Future extraction candidates
- **AI/Scoring** → separate worker service (CPU/GPU heavy, async queue).
- **Notifications/Realtime** → dedicated WS gateway scaled independently.
- **Search** → migrate from Mongo text index to a search cluster (Atlas Search / OpenSearch).

## 4. Real-Time Layer

```
Student applies ──► ApplicationService ──► emits "application.created"
                                              │
                                              ▼
                                   Redis Pub/Sub channel
                                              │
                ┌─────────────────────────────┼─────────────────────────────┐
                ▼                              ▼                              ▼
        WS Pod #1 subscribers        WS Pod #2 subscribers          (persist notification)
        (recruiter dashboards)       (admin monitoring)             MongoDB notifications
```

WebSocket pods subscribe to **Redis Pub/Sub** so a message produced on any API pod fans out to every connected client regardless of which pod holds the socket. This is what makes real-time updates work under horizontal scaling.

## 5. Caching Strategy (Redis)

| Use case | Pattern | TTL |
|----------|---------|-----|
| Job recommendations | Cache-aside, keyed by `userId` | 10 min |
| Dashboard widgets | Cache-aside, per role+user | 60 s |
| Global search results | Cache-aside, keyed by query hash | 30 s |
| Rate limiting | Fixed-window counter per IP/user | 60 s window |
| Session/refresh denylist | Token jti set | = refresh TTL |
| WS fan-out | Pub/Sub (not cached) | — |

## 6. Security Architecture

- **JWT** access tokens (short-lived, 15 min) + **refresh** tokens (7 days, rotation + denylist).
- **RBAC** enforced via FastAPI dependencies (`require_role(...)`) and resource-ownership checks in services.
- **Password hashing** with bcrypt (passlib).
- **Input validation** with Pydantic v2 at the edge; output models prevent overexposure.
- **Rate limiting** + CORS allowlist + security headers at the gateway.
- **Recruiter/company verification** gate before posting jobs (admin-approved).

See [AUTH_FLOW.md](AUTH_FLOW.md) for sequence diagrams.

## 7. Scaling Strategy to 100k+ Users

1. **Stateless API pods** → scale horizontally via HPA on CPU/RPS.
2. **MongoDB Atlas** → replica set first; shard `applications` and `jobs` by region/company once write volume grows.
3. **Compound indexes** on every hot query path (see [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)).
4. **Redis** for read-heavy dashboards, recommendations, and search to shield Mongo.
5. **Cursor/keyset pagination** everywhere — never `skip` on large collections.
6. **Async I/O end-to-end** (Motor + httpx) so a pod handles thousands of concurrent connections.
7. **CDN + PWA caching** offloads static + repeat asset traffic from origin.
8. **Background workers** (future Celery/RQ) for resume scoring, email, and heavy AI tasks.

## 8. Observability

- Structured JSON logging with correlation IDs per request.
- `/health` (liveness) and `/ready` (DB+Redis readiness) probes.
- Metrics-ready (Prometheus middleware hook) + admin platform-monitoring dashboard.
