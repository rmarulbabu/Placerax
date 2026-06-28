# Placera — Authentication & Authorization Flow

> JWT access/refresh tokens, bcrypt password hashing, refresh rotation with a server-side denylist, and Role-Based Access Control (RBAC) enforced at the dependency layer.

## 1. Token Model

| Token | Lifetime | Storage (client) | Contents |
|-------|----------|------------------|----------|
| **Access** | 15 min | in-memory (Zustand) | `sub` (user id), `role`, `email`, `exp`, `type=access` |
| **Refresh** | 7 days | httpOnly cookie *or* secure storage | `sub`, `jti`, `exp`, `type=refresh` |

Refresh tokens are tracked in the `sessions` collection by `jti`. Rotation issues a new refresh token and revokes the old `jti`, defeating replay.

## 2. Registration & Login

```
┌────────┐                         ┌──────────────┐                  ┌──────────┐
│ Client │                         │  FastAPI     │                  │ MongoDB  │
└───┬────┘                         └──────┬───────┘                  └────┬─────┘
    │  POST /auth/register {email,pw,role}│                               │
    │────────────────────────────────────►│  validate, bcrypt-hash       │
    │                                      │  insert user (+ profile)     │
    │                                      │──────────────────────────────►│
    │                                      │◄──────────────────────────────│
    │  201 {user}  (email verify sent)     │                               │
    │◄─────────────────────────────────────│                              │
    │                                      │                               │
    │  POST /auth/login {email, pw}        │                               │
    │────────────────────────────────────►│  verify bcrypt               │
    │                                      │  create session(jti)         │
    │                                      │──────────────────────────────►│
    │  200 {access, refresh, user}         │                               │
    │◄─────────────────────────────────────│                              │
```

## 3. Authenticated Request + RBAC

```
┌────────┐   GET /jobs/{id}/applicants            ┌──────────────────────────┐
│ Client │   Authorization: Bearer <access>       │        FastAPI           │
└───┬────┘────────────────────────────────────────►                          │
    │                                              │ 1. decode + verify JWT   │
    │                                              │ 2. load user (cache→db)  │
    │                                              │ 3. require_role(recruiter)│
    │                                              │ 4. ownership check       │
    │                                              │    (job.company == user) │
    │                                              │ 5. handler runs          │
    │   200 {applicants}  | 401 | 403              │                          │
    │◄──────────────────────────────────────────────                         │
    └──────────────────────────────────────────────┘
```

### RBAC layers

1. **Authentication** — `get_current_user` dependency decodes the access token; rejects expired/invalid (`401`).
2. **Role guard** — `require_role(Role.RECRUITER)` (or a set) rejects wrong role (`403`).
3. **Verification gate** — recruiters must be `verified` and their company `approved` to post jobs.
4. **Resource ownership** — services assert the actor owns/belongs to the resource (e.g., recruiter ↔ company ↔ job). This prevents horizontal privilege escalation even within a role.

```python
# Composable guards (see app/core/dependencies.py)
@router.get("/jobs/{id}/applicants")
async def applicants(
    id: str,
    user: User = Depends(require_role(Role.RECRUITER)),
    svc: ApplicationService = Depends(get_application_service),
):
    return await svc.list_for_job(job_id=id, recruiter=user)   # ownership enforced inside
```

## 4. Refresh Rotation

```
Client: access expired → POST /auth/refresh  (sends refresh token)
Server:
  - decode refresh, check type=refresh
  - look up session by jti; if revoked/expired → 401 (force re-login)
  - revoke old jti, create new session(jti')
  - return new {access, refresh'}
```

A stolen-and-replayed refresh token fails because its `jti` is already revoked after the first legitimate rotation; the anomaly can trigger a full session purge for that user.

## 5. Logout

`POST /auth/logout` revokes the current refresh `jti` (and optionally all of the user's sessions). The access token is short-lived and simply expires.

## 6. WebSocket Auth

The WS handshake carries the access token as a query param (`/ws?token=...`). The connection manager validates it, derives `user:{id}` / `company:{id}` channel subscriptions from the decoded claims, and rejects on failure with close code `4401`.

## 7. Password & Account Security

- bcrypt with per-password salt (passlib).
- Minimum strength enforced in Pydantic schema (length + complexity).
- Email verification gate before sensitive actions.
- Rate limiting on `/auth/*` (10/min/IP) to blunt credential stuffing.
- Admin can `suspend`/`ban`; suspended users fail the auth dependency with `403`.
