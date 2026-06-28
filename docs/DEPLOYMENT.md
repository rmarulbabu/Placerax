# Placera — Deployment Guide

> Containerized full stack. Local via `docker compose`; production via container platform (Render / Fly / AWS ECS / Kubernetes) with managed MongoDB Atlas + Redis + Cloudinary.

## 1. Topology

```
                  ┌──────────────┐
   Users ───────► │   CDN/Edge   │ ──► static SPA (frontend build) + TLS
                  └──────┬───────┘
                         │ /api, /ws
                  ┌──────▼───────┐
                  │  Load Balancer│
                  └──────┬───────┘
            ┌────────────┼────────────┐
       ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
       │ api pod │  │ api pod │  │ api pod │   (FastAPI / uvicorn-gunicorn)
       └────┬────┘  └────┬────┘  └────┬────┘
            └──────┬─────┴──────┬─────┘
          ┌────────▼───┐  ┌─────▼──────┐  ┌────────────┐
          │ MongoDB    │  │   Redis    │  │ Cloudinary │
          │ Atlas      │  │ (managed)  │  │ (managed)  │
          └────────────┘  └────────────┘  └────────────┘
```

## 2. Environment Variables

### Backend (`backend/.env`)
```
ENV=production
APP_NAME=Placera
SECRET_KEY=<long-random>
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
MONGODB_URI=mongodb+srv://<user>:<pw>@cluster.mongodb.net
MONGODB_DB=placera
REDIS_URL=redis://default:<pw>@host:6379/0
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CORS_ORIGINS=https://app.placera.io
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=https://api.placera.io/api/v1
VITE_WS_URL=wss://api.placera.io/ws
VITE_APP_NAME=Placera
```

## 3. Local Development (Docker Compose)

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up --build
```

Services started:
- `web` → Vite dev server on `:5173`
- `api` → FastAPI (uvicorn --reload) on `:8000`
- `mongo` → MongoDB on `:27017`
- `redis` → Redis on `:6379`

## 4. Production Build

### Backend image
Multi-stage: install deps → run with gunicorn + uvicorn workers.
```bash
docker build -t placera-api ./backend
docker run -p 8000:8000 --env-file backend/.env placera-api
```
Process manager: `gunicorn app.main:app -k uvicorn.workers.UvicornWorker -w $(nproc) --bind 0.0.0.0:8000`

### Frontend image
Multi-stage: `npm ci && npm run build` → serve `dist/` via Nginx.
```bash
docker build -t placera-web ./frontend
```

## 5. CI/CD (GitHub Actions)

`.github/workflows/ci.yml` runs on PR:
1. **backend**: ruff + mypy + pytest.
2. **frontend**: eslint + tsc --noEmit + vite build.
3. On `main`: build & push images, deploy to environment.

## 6. Scaling Checklist

- [ ] Enable HPA on api pods (target 65% CPU / RPS).
- [ ] MongoDB Atlas: M-tier with autoscaling; add shards for `applications`/`jobs` at scale.
- [ ] Redis: enable persistence + replica; separate cache vs pub-sub instances if hot.
- [ ] CDN in front of SPA + Cloudinary for media.
- [ ] Move resume parsing/scoring to async workers behind a queue.
- [ ] Add Atlas Search / OpenSearch for global search beyond Mongo text index.
- [ ] WAF + rate limiting at the edge; security headers (HSTS, CSP).

## 7. Health & Readiness

- `GET /health` → liveness (process up).
- `GET /ready` → checks Mongo ping + Redis ping; used by LB/orchestrator.

## 8. Backups & DR

- Atlas continuous backups + point-in-time restore.
- Redis treated as ephemeral (cache rebuilds; sessions tolerate loss → users re-login).
- Cloudinary retains uploaded media independently.
