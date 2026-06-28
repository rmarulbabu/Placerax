# shared/

Cross-cutting contracts shared conceptually between the FastAPI backend and the
React frontend: role names, account/job/application statuses, pipeline stages,
and API conventions. These are the single source of truth for enum string
values that both services must agree on.

- `contracts.json` — machine-readable enums/constants (consumed by codegen or
  imported directly in tooling).
- The backend mirrors these in `backend/app/models/enums.py`.
- The frontend mirrors the types it needs in `frontend/src/types/index.ts`.

Keeping the string values identical here is what guarantees the `stage`,
`status`, `role`, and `type` fields line up across the wire.
