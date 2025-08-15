# School ERP — Agent-Ready Bundle
**Generated:** 2025-08-13

This repository bundle combines:
- ✅ Starter Pack (v3): migrations, seeders, RBAC/Audit catalogs, CI, lint/format, Postman
- ✅ REST-grouped OpenAPI 3.1 for all **66 activities** (with `x-activity-id` preserved)
- ✅ AI-Coder Guides (REST-grouped + 1-to-1 activity listing)

## Structure
- `api/openapi_rest_grouped_66.yaml` — Canonical API contract (REST-grouped), **do not break activity IDs**
- `docs/ai_coder_rest_grouped_66.md` — Endpoint-by-resource guide (RBAC, DB entities, dependencies, DTO names)
- `docs/ai_coder_guide_66_activities.md` — One-row-per-activity variant
- `migrations/*` — SQL templates for master & trust DBs
- `seeders/seed_data.json` — Minimal seeds to boot a tenant
- `rbac/RBAC_MATRIX.md`, `audit/AUDIT_EVENTS.md`
- `.github/workflows/ci.yml` — CI: lint, typecheck, OpenAPI lint
- `.eslintrc.cjs`, `.prettierrc`, `config/.env.example`
- `postman/school_erp_starter.postman_collection.json`

## How to work by Activity ID
1. Pick an activity (e.g., `FEES-05-006`).
2. Find it in `docs/ai_coder_rest_grouped_66.md` (see method/path/RBAC/DB/DTOs).
3. Locate the same ID in `api/openapi_rest_grouped_66.yaml` via `x-activity-id` and `operationId`.
4. Generate controller → service → repo + tests using the DTO names and RBAC shown.
5. Commit as `feat(FEES-05-006): <summary>` and ensure CI passes.

## CI & Quality
- Lint/format enforced.
- OpenAPI lint runs (non-blocking by default)—tighten later.
- Recommend adding contract tests (request/response validation) next.

## Notes
- Keep **activity IDs** immutable across all files.
- Update both the OpenAPI and the guides if any path or RBAC changes.

## UI Kit (EJS + Tailwind)
- `views/layout.ejs`, partials for head/nav/alerts/pagination
- Screens included: Users list, Student admission form, Fee receipt form

## Tracker ↔ OpenAPI consistency (CI blocking)
- `scripts/verify-tracker-openapi.ts` compares `x-activity-id` in OpenAPI with tracker Unique Codes.
- CI now fails if mismatch is found.

## Load tests (k6)
Set env and run any scenario:
```bash
BASE=http://localhost:3000/api/v1 TOKEN=<jwt> npm run load:k6:login
BASE=http://localhost:3000/api/v1 TOKEN=<jwt> npm run load:k6:admission
BASE=http://localhost:3000/api/v1 TOKEN=<jwt> npm run load:k6:receipt
BASE=http://localhost:3000/api/v1 TOKEN=<jwt> npm run load:k6:attendance
BASE=http://localhost:3000/api/v1 TOKEN=<jwt> npm run load:k6:reports
```
