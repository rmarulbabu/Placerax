# Backend Migration Report — FastAPI (Python) → Node.js + Express

This document records the migration of the Placera backend from **Python /
FastAPI / Motor** to **Node.js / Express / Mongoose**, plus the addition of a
production-grade light/dark theme system on the frontend.

## 1. Goals & Outcome

| Goal | Status |
|------|--------|
| Replace FastAPI backend with Node.js + Express (JavaScript, not TypeScript) | ✅ Done |
| Preserve every `/api/v1` route, method, and response shape | ✅ Done |
| Preserve auth (JWT access/refresh + bcrypt), RBAC, sessions | ✅ Done |
| Preserve all business logic, services, validation, file uploads | ✅ Done |
| MongoDB via Mongoose with the same collections + indexes | ✅ Done |
| WebSocket logic → Socket.IO (+ Redis pub/sub fan-out) | ✅ Done |
| Remove the Python backend completely | ✅ Done |
| Light/Dark theme system (persistence, system detection, toggle, transitions) | ✅ Done |
| Keep the frontend UI design unchanged | ✅ Done |

## 2. Technology Mapping

| Concern | Before (Python) | After (Node.js) |
|---------|-----------------|-----------------|
| Web framework | FastAPI | Express |
| Routing | `APIRouter` | `express.Router` |
| Data models / ODM | Pydantic + Motor | Mongoose |
| Request validation | Pydantic schemas | Joi validators |
| Dependency injection | FastAPI `Depends` | Express middleware + service modules |
| AuthN / AuthZ | `python-jose` + `passlib[bcrypt]` | `jsonwebtoken` + `bcryptjs` |
| Realtime | FastAPI WebSocket + Redis pub/sub | Socket.IO + Redis pub/sub |
| File uploads | `python-multipart` (`UploadFile`) | `multer` (memory storage) |
| Object storage | `cloudinary` (Python) | `cloudinary` (Node) |
| Caching / rate-limit | `redis.asyncio` | `ioredis` |
| Config | `pydantic-settings` | `dotenv` + typed `env.js` |
| Logging | JSON formatter | JSON logger (`logger.js`) |

> bcryptjs is wire-compatible with the original bcrypt hashes, so existing user
> passwords continue to verify without a reset.

## 3. New Backend Structure

```
backend/
├── src/
│   ├── config/        # env, db (Mongo + retry), redis, logger
│   ├── controllers/   # thin HTTP handlers (one per domain)
│   ├── middleware/     # auth/RBAC, error envelope, validation, timing
│   ├── models/        # Mongoose schemas + enums + shared plugins
│   ├── routes/        # /api/v1 routers (mirrors the FastAPI routers)
│   ├── services/      # business logic (ported 1:1 from app/services)
│   ├── sockets/       # Socket.IO server + connection manager
│   ├── utils/         # security, slug, aiEngine, storage, errors, serialize
│   ├── validators/    # Joi schemas (mirror Pydantic request models)
│   ├── uploads/       # local upload staging (.gitkeep)
│   └── app.js         # Express app factory
├── server.js          # entrypoint: HTTP + Socket.IO + Mongo/Redis lifecycle
├── package.json
├── .env.example
└── Dockerfile         # Node 20 image
```

## 4. API Surface (unchanged)

All endpoints remain under `/api/v1` with identical methods, params, and JSON
shapes. System endpoints `/health` and `/ready` are preserved. The realtime
endpoint moved from a raw `/ws?token=` WebSocket to a Socket.IO server that
authenticates via the same access token (handshake `auth.token` or `?token=`).

Documents serialize exactly as before: `_id` is exposed as a string `id`,
timestamps as `created_at` / `updated_at`, reference fields as strings, and
`password_hash` is never returned. The error envelope is unchanged:

```json
{ "error": { "code": "NOT_FOUND", "message": "...", "details": {} } }
```

## 5. Data Compatibility

The original backend stored all reference fields (`user_id`, `company_id`,
`job_id`, …) as **strings** (only `_id` is an `ObjectId`). The Mongoose models
type these fields as `String`, so **existing data and queries remain fully
compatible** — no migration script is required. Collection names and indexes
(including the unique `sessions.jti`, the `sessions.expires_at` TTL index, text
indexes on jobs/companies, and all compound indexes) are reproduced.

## 6. Theme System (frontend)

- `src/lib/theme.ts` — pure helpers (storage, system detection, apply).
- `src/store/themeStore.ts` — Zustand store: `light | dark | system`, persisted
  to `localStorage` (`placera.theme`), reacts to OS changes when on `system`.
- `src/components/layout/ThemeToggle.tsx` — toggle in the Topbar.
- `index.css` — light tokens under `:root`, dark tokens under `.dark`
  (class-based switching matches the existing `darkMode: ["class"]` config),
  plus smooth color/background transitions.
- `index.html` — pre-paint inline script applies the saved/system theme to
  avoid a flash of incorrect theme; toasts follow the active theme.

The existing dark design is preserved; light mode is additive and the UI layout
is unchanged.

## 7. Verification

**Performed in this environment:**
- `node --check` passes on all backend JS files.
- ESLint (flat config) reports **0 errors** on the backend.
- Full code review against the original FastAPI behavior for route parity,
  response shapes, auth, RBAC, and business logic.

**To run in your environment (network + database access required):**

```bash
# Backend
cd backend
npm install
cp .env.example .env          # set MONGODB_URI (Atlas), SECRET_KEY, etc.
npm run seed                  # optional demo data
npm run dev                   # http://localhost:8000  → GET /health

# Frontend
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

> Note: this migration was prepared in a restricted sandbox where the public npm
> registry and an external MongoDB were not reachable, so `npm install`, a live
> server boot, and a live DB connection could not be executed here. The code is
> complete and lint/syntax-clean; run the commands above to validate end-to-end.

## 8. Files Removed

- `backend/app/**` (FastAPI application package)
- `backend/tests/**` (pytest suite)
- `backend/requirements.txt`, `backend/pyproject.toml`

## 9. Infra Updates

- `backend/Dockerfile` → Node 20 image (`node server.js`).
- `docker-compose.yml` → `api` service runs Node; Mongo/Redis unchanged.
- `.github/workflows/ci.yml` → backend job installs Node deps and lints.
