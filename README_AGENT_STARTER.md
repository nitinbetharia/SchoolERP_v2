# Agent Starter Pack — School ERP (Commented)

This pack is human-friendly but structured for AI agents (Copilot/Claude).

## Contents
- `api/openapi.yaml` — Contract-first API (commented) for auto-scaffolding
- `config/.env.example` — Env vars with explanations
- `rbac/RBAC_MATRIX.md` — Roles × permissions
- `audit/AUDIT_EVENTS.md` — Event names (canonical)
- `migrations/master/0001_master_init.sql` — Master DB
- `migrations/trust_template/0001_trust_init.sql` — Trust DB
- `seeders/seed_data.json` — Minimal seed
- `postman/school_erp_starter.postman_collection.json` — Sanity collection
- `.github/workflows/ci.yml` — CI pipeline
- `.eslintrc.cjs` / `.prettierrc` — Lint/format
- `docs/AGENT_PROMPTS.md` — Copy-paste generation prompts

## Quick Start
1. `cp config/.env.example .env` → fill creds
2. Create DBs and run migrations
3. `npm ci && npm run dev`
4. Import Postman collection and test `/auth/login` & `/users`
