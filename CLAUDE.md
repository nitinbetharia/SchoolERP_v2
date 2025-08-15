# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ IMPORTANT: Updated Documentation Structure

**Primary Authority:** `SCHOOL_ERP_MASTER_SPECIFICATION.md` - The unified, industry-standard specification that supersedes all other documentation.

**This file (CLAUDE.md):** Quick reference for Claude Code users - development commands and basic patterns.

**Legacy docs:** Moved to `docs/legacy_instructions/` (archived, do not use).

## Development Commands

### Build and Development
- `npm run build` - Compile TypeScript to JavaScript in `dist/` directory
- `npm run dev` - Run development server with TypeScript via ts-node
- `npm start` - Run production server from compiled JavaScript

### Testing
- `npm run test:contract` - Run contract tests against OpenAPI specification (requires `CONTRACT_TOKEN` env var)
- `npm run gen:contract:cases` - Generate contract test case skeletons from OpenAPI spec

### Load Testing
- `npm run load:k6:login` - Run k6 load test for login endpoint
- `npm run load:k6:admission` - Run k6 load test for admission flow
- `npm run load:k6:receipt` - Run k6 load test for fee receipt flow
- `npm run load:k6:attendance` - Run k6 load test for attendance endpoints
- `npm run load:k6:reports` - Run k6 load test for reporting endpoints

### Verification
- `npm run verify:tracker` - Verify consistency between implementation tracker and OpenAPI spec

## Architecture Overview

This is a School ERP system built with a **modular, activity-driven architecture** implementing 66 specific activities across 9 modules. The system follows strict patterns for consistency and maintainability.

### Tech Stack
- **Backend**: Node.js 20 + TypeScript + Express.js
- **Frontend**: Server-rendered EJS templates with Tailwind CSS
- **Database**: MySQL 8 (multi-tenant with master + per-trust schemas)
- **Authentication**: Dual mode - Sessions for web UI, JWT for API access
- **Validation**: Zod schemas with strict type safety

### Module Structure
Each module follows the exact same pattern:
```
src/modules/{module}/
├── controllers.ts    # HTTP request handlers (one per activity)
├── services.ts       # Business logic layer
├── repos.ts         # Data access layer with parameterized queries
├── dtos.ts          # Zod validation schemas
├── validators.ts    # Re-exports of DTOs for clarity
└── index.ts         # Barrel exports
```

**Modules**: `data`, `setup`, `auth`, `user`, `stud`, `fees`, `attd`, `rept`, `dash`, `comm`

### Activity-Driven Development
- All development is organized around **66 specific Activity IDs** (e.g., `FEES-05-006`, `AUTH-02-001`)
- Each activity has exact specifications in `docs/ai_coder_rest_grouped_66.md`
- Activity IDs must appear in: operationId (OpenAPI), controller names, audit events, commit messages
- Follow dependency order from `dependency_ordered_build_and_test_plan.md`

## Implementation Requirements

### Contract-First Development
1. **OpenAPI Contract**: `api/openapi_rest_grouped_66.yaml` is the authoritative API contract
2. **Activity Guide**: `docs/ai_coder_rest_grouped_66.md` contains per-endpoint RBAC, DB entities, dependencies, and DTO names
3. **Implementation follows contract** - never modify OpenAPI unless explicitly required

### Mandatory Patterns

#### Error Handling
All endpoints must return this exact error envelope:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {},
    "traceId": "optional"
  }
}
```
Success responses: `{ "success": true, "data": <payload> }`

#### DTO Naming Convention
- Request DTOs: `{ActivityId}Request` (e.g., `FEES05006Request`)
- Response DTOs: `{ActivityId}Response` (e.g., `FEES05006Response`)
- Use `.strict()` in Zod schemas to reject unknown properties
- IDs are integers, timestamps are ISO strings, enums are UPPER_CASE

#### RBAC Enforcement
- Enforce exact roles specified in the activity guide
- Return `403 FORBIDDEN` on permission denial
- Emit `PERMISSION_DENIED` audit event

#### Audit Logging
- Emit audit events for sensitive operations using Activity ID as event suffix
- Include: `activityId`, `userId`, `trustId`, `entityType`, `entityId`, `ip`, `ua`, `created_at`

### Database Guidelines
- Use parameterized queries only (no string concatenation)
- Follow existing table/field names in `migrations/` directory
- Multi-tenant: master DB + per-trust schemas
- Master DB tables: `system_*`, `trusts`, `migration_versions`
- Trust DB tables: `schools`, `users`, `students`, `fee_*`, `attendance_*`, etc.

### Testing Requirements
- Add contract test cases to `tests/contract/cases.json` for each activity
- Set `validateAgainstOpenAPI: true` once DTOs are stable
- Contract tests use Jest + Ajv for OpenAPI validation
- Tests must pass before any commit

## Quality Standards

### TypeScript
- Use `strict: true` mode (already configured)
- No `any` types allowed
- Use runtime guards from `src/lib/guards.ts`
- Infer types from Zod schemas with `z.infer<typeof Schema>`

### Security
- Rate limiting on `/auth/*` and `/fees/*` endpoints
- PII masking in logs (never log full emails/phones/OTPs)
- Helmet security headers enabled
- CORS configured appropriately

### Frontend (EJS)
- Server-rendered views only
- Use provided partials: `_head.ejs`, `_nav.ejs`, `_alerts.ejs`, `_pagination.ejs`
- Form validation must mirror server-side Zod validation
- Accessibility: proper labels, tab order, contrast compliance

## Development Workflow

### For Each Activity Implementation
1. Read the activity specification in `docs/ai_coder_rest_grouped_66.md`
2. Verify dependencies are implemented (follow `dependency_ordered_build_and_test_plan.md`)
3. Create Zod DTOs in `dtos.ts`
4. Implement controller → service → repo pattern
5. Add contract test case
6. Run tests and ensure they pass
7. Commit with format: `feat(ACTIVITY-ID): description`

### Before Starting Work
1. Install latest dependencies: `npm i`
2. Verify database schema matches migrations
3. Read official docs for any libraries you'll use
4. Check RBAC matrix in `rbac/RBAC_MATRIX.md`

### Master Reference Files
- `SCHOOL_ERP_MASTER_SPECIFICATION.md` - **THE SINGLE SOURCE OF TRUTH** for all development
- `DEPENDENCIES_AND_PRE_FLIGHT.md` - Dependency installation and pre-flight checks
- `docs/legacy_instructions/` - Archived conflicting documentation (DO NOT USE)

### Deployment
- Single VM deployment using `docker-compose.yml`
- Components: Node app + MySQL + Nginx + Certbot + automated backups
- Use `ops/deploy.sh` for deployment
- Health check: `/api/v1/health`

## Process Management Rules
- **NEVER use `taskkill //F //IM node.exe`** - This kills all Node.js processes including the current session
- **USE background bash properly:**
  - Start processes with `run_in_background: true`
  - Track bash IDs returned from background processes
  - Use `BashOutput` with specific bash ID to monitor output
  - Use `KillBash` with specific bash ID to terminate processes
- **Example workflow:**
  ```
  1. Start: Bash("npm run dev", run_in_background: true) → returns bash_id
  2. Monitor: BashOutput(bash_id) to check output
  3. Terminate: KillBash(bash_id) when done
  ```

## Important Rules
- **Never break Activity IDs** - they are immutable across all files
- **Never invent fields or endpoints** - follow specifications exactly
- **Never skip RBAC, validation, or audit logging**
- **Never use raw SQL without parameters**
- **Always validate against OpenAPI contract in tests**
- **Follow the Master Playbook** - it has final authority on all decisions