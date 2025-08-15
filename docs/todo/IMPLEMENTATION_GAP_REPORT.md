# School ERP — Implementation Gap Report

Generated: 2025-08-15

Purpose: Provide a precise, actionable checklist to align the codebase with the OpenAPI and activity tracker (all 66 activities). Use this to systematically correct routes, enforce RBAC/validation, implement services/repos, and harden tests.

Scope Sources:

- API contracts: `api/openapi_rest_grouped_66.yaml` (REST-grouped; needs cleanup) and `api/openapi.yaml` (one-to-one variant)
- Server: `src/app.ts`
- Modules: `src/modules/*`
- Infra libs: `src/lib/*`
- Contract tests: `tests/contract/*`

Note on current tests: 29 tests pass but several endpoints collide on the same path, so different activities are hitting the same handler. Treat current green as smoke-level only.

---

## Executive summary

- Routing collisions: Multiple distinct activities are mounted on identical method+path (e.g., many POST /system or POST /auth). Only the first matching handler runs, making others unreachable. This hides gaps in tests.
- Spec misalignment: Methods/paths differ from normalized spec (e.g., GET /system/connections/status vs POST /system/connections; PUT /system/config/cache expected but POST is used).
- OpenAPI file issues: `openapi_rest_grouped_66.yaml` contains duplicated mapping keys causing parse warnings; schema validation is effectively off in tests.
- RBAC & validation: RBAC middleware exists but is not applied to routes; Zod validation present in several controllers but not consistent across modules.
- Persistence depth: DATA has real repo/service logic; SETUP/AUTH largely stubs; USER 03-001/002 use real repo logic; other modules are unwired.
- Testing: Contract tests allow 200/201/400 and do not validate response schema; several activities share same path in tests, masking collisions.

Priority remediation plan:

1. Fix the OpenAPI (remove duplicates), pick canonical paths/methods, and align routes accordingly.
2. Remove route collisions: one activity per route (or an explicit dispatcher per consolidated path), then apply RBAC and DTO validation.
3. Make tests strict: validate status+shape, and ensure each activity hits the intended route/handler.
4. Implement missing services/repos in order: AUTH → USER → STUD → FEES → ATTD → REPT → DASH → COMM.

---

## Global fixes (apply once)

- OpenAPI cleanup

  - Action: Fix duplicated mapping keys in `api/openapi_rest_grouped_66.yaml`. Ensure all 66 activities exist with unique method+path and `x-activity-id`.
  - Action: Decide canonical mapping (prefer normalized paths from `api/openapi.yaml`), or regenerate grouped spec to match code routing; keep IDs immutable.
  - Action: Re-enable strict OpenAPI validation in tests once fixed.

- Routing guidelines

  - Avoid multiple registrations on the same method+path for different activities. Either:
    - Use unique paths per activity (preferred, matches normalized spec), or
    - Use a single consolidated route with an internal dispatcher that branches on a clear discriminator field, and do NOT also register separate routes for the same path.

- RBAC and auth

  - Apply `requireSystemAdmin`, `requireTrustAdmin`, `requireSchoolAdmin`, etc., per activity definition.
  - Replace AUTH stubs with real logic (password verify, JWT/session, MFA, lockout, verification).

- Validation

  - Ensure every controller parses request with the proper Zod DTO and returns typed responses.

- Testing
  - In `tests/contract/cases.json`, point each activity to the correct unique method+path. Assert status and minimal JSON shape.
  - Remove permissive `[200,201,400]` expectations except where transitional; lock to expected code.
  - Enable OpenAPI response validation once spec is fixed.

---

## Module-by-module checklist

Legend:

- Status: Implemented | Stub | Missing | Collides | Unmounted | Spec mismatch
- Fixes: concrete steps to resolve.

### DATA (00-001 .. 00-012)

Files: `src/modules/data/*` (controllers/services/repos) — robust; `src/app.ts` wiring — colliding; `src/lib/database.ts` — real.

- DATA-00-001 Connection Manager

  - Spec: GET `/system/connections/status`
  - Code: POST `/system/connections` → controller+service implemented; uses `DataRepo.getConnectionStatus()`
  - Status: Implemented, Spec mismatch (method+path), Collides with 00-012 sharing same path
  - Fixes: Change to GET `/system/connections/status` (or add GET and deprecate POST); give 00-012 its own cleanup path.

- DATA-00-002 Master DB schema creation

  - Spec: POST `/system/schemas/master` (201)
  - Code: POST `/system` (collides with 00-005/006); service initializes master schema
  - Status: Implemented, Collides, Spec mismatch
  - Fixes: Mount as POST `/system/schemas/master` only; remove other `/system` registrations or replace with dispatcher-only approach.

- DATA-00-003 Trust DB schema template

  - Spec: POST `/system/schemas/trusts` (201)
  - Code: Controller/service exist; Not mounted in `src/app.ts`
  - Status: Implemented (logic), Unmounted
  - Fixes: Mount POST `/system/schemas/trusts` and wire controller.

- DATA-00-004 System config storage

  - Spec: POST `/system/config` (201)
  - Code: POST `/system/config` mounted; service stores config in master DB
  - Status: Implemented; Collides with 00-011 also using `/system/config`
  - Fixes: Keep 00-004 on POST `/system/config`; move 00-011 to PUT `/system/config/cache` per spec.

- DATA-00-005 Trust registry & subdomains

  - Spec: POST `/system/trusts` (201)
  - Code: POST `/system` (collision)
  - Status: Implemented, Collides, Spec mismatch
  - Fixes: Mount POST `/system/trusts` only; remove duplicate `/system` route for this activity.

- DATA-00-006 System users (sys/group admin)

  - Spec: POST `/system/users` (201)
  - Code: POST `/system` (collision)
  - Status: Implemented, Collides, Spec mismatch
  - Fixes: Mount POST `/system/users` only.

- DATA-00-007 Migration tracking

  - Spec: POST `/system/migrations` (201)
  - Code: POST `/system/migrations` mounted
  - Status: Implemented; Spec OK
  - Fixes: Ensure 201 returned; validate DTO.

- DATA-00-008 Session store

  - Spec: POST `/system/sessions` (201)
  - Code: POST `/system/sessions` mounted; returns 200
  - Status: Implemented; Spec mismatch (expected 201)
  - Fixes: Return 201 for create operations; refine to permit read/delete actions if required.

- DATA-00-009 Global audit logging

  - Spec: POST `/system/audit-logs/system` (201)
  - Code: POST `/system/audit-logs` (collision with 00-010)
  - Status: Implemented, Collides, Spec mismatch
  - Fixes: Mount POST `/system/audit-logs/system` for 00-009; separate 00-010.

- DATA-00-010 Tenant audit logging

  - Spec: POST `/system/audit-logs/tenants` (201)
  - Code: POST `/system/audit-logs` (collision)
  - Status: Implemented, Collides, Spec mismatch
  - Fixes: Mount POST `/system/audit-logs/tenants` for 00-010.

- DATA-00-011 Subdomain/config cache

  - Spec: PUT `/system/config/cache` (200)
  - Code: POST `/system/config` (collision with 00-004)
  - Status: Implemented, Collides, Spec mismatch
  - Fixes: Mount as PUT `/system/config/cache` and return 200.

- DATA-00-012 Pool cleanup & housekeeping
  - Spec: POST `/system/connections/cleanup` (200)
  - Code: POST `/system/connections` (collision with 00-001)
  - Status: Implemented, Collides, Spec mismatch
  - Fixes: Mount POST `/system/connections/cleanup` only.

Additional DATA tasks:

- Apply RBAC middleware (`requireSystemAdmin`) to DATA routes.
- Ensure all controllers use Zod DTOs consistently (already good here) and return correct 200/201.
- Reinstate audit hooks when available.

### SETUP (01-001 .. 01-007)

Files: `src/modules/setup/*` — controllers/services present; services mainly stubs.

- SETUP-01-001 Wizard: Trust creation

  - Spec: POST `/setup/trusts`
  - Code: POST `/setup/trusts` (first registration)
  - Status: Stub; Reachable
  - Fixes: Implement service logic, Zod DTO, repo access.

- SETUP-01-002 Wizard: School creation

  - Spec: POST `/setup/schools`
  - Code: POST `/setup/schools`
  - Status: Stub; Reachable
  - Fixes: Implement service & repo; validation.

- SETUP-01-003 Wizard: Academic year creation

  - Spec: POST `/setup/academic-years`
  - Code: POST `/setup/academic-years`
  - Status: Stub; Reachable
  - Fixes: Implement service & repo; validation.

- SETUP-01-004 Class & section setup (+ House)

  - Spec: POST `/setup/classes`
  - Code: POST `/setup/classes`
  - Status: Stub; Reachable
  - Fixes: Implement service & repo; validation.

- SETUP-01-005 Subject & grading configuration

  - Spec: POST `/setup/academics`
  - Code: POST `/setup/academics`
  - Status: Stub; Reachable
  - Fixes: Implement service & repo; validation.

- SETUP-01-006 Trust/school-level config

  - Spec: POST `/setup/trusts` (config variant in grouped spec) or dedicate `/setup/config`
  - Code: POST `/setup/trusts` (second registration) → Collides with 01-001 and is unreachable
  - Status: Stub; Collides/Unreachable
  - Fixes: Use distinct path (e.g., `/setup/config`) or explicit dispatcher; ensure reachable.

- SETUP-01-007 Role seeding (admins)
  - Spec: POST `/setup/roles`
  - Code: POST `/setup/roles`
  - Status: Stub; Reachable
  - Fixes: Implement service & repo; validation.

Additional SETUP tasks:

- Apply RBAC middleware per activity (trust vs system)
- Add Zod DTOs where missing and tests for each.

### AUTH (02-001 .. 02-010)

Files: `src/modules/auth/*` — controllers exist; services stubs; repo placeholder.

- AUTH-02-001 Local authentication (web sessions)

  - Spec: POST `/auth` (OK in grouped), or separate login path
  - Code: POST `/auth` (first registration)
  - Status: Stub; Reachable
  - Fixes: Implement password verify (argon2), session creation, audit log; return session cookie/token.

- AUTH-02-002 JWT authentication (APIs)

  - Spec: POST `/auth` (grouped) or `/auth/jwt`
  - Code: POST `/auth` (second registration) → Collides (unreachable)
  - Status: Stub; Collides/Unreachable
  - Fixes: Use distinct path (e.g., `/auth/jwt/login`) or dispatcher.

- AUTH-02-003 Multi-factor (OTP)

  - Spec: POST `/auth/mfa`
  - Code: POST `/auth/mfa` (reachable)
  - Status: Stub; Reachable
  - Fixes: Implement OTP generation/verify; audit; trust config usage.

- AUTH-02-004 RBAC (roles & permissions)

  - Spec: POST `/auth` (grouped) or `/auth/rbac`
  - Code: POST `/auth` (collides)
  - Status: Stub; Collides/Unreachable
  - Fixes: Use distinct path (e.g., `/auth/rbac/evaluate`) or dispatcher.

- AUTH-02-005 Permission mapping

  - Spec: POST `/auth` (grouped) or `/auth/permissions/map`
  - Code: POST `/auth` (collides)
  - Status: Stub; Collides/Unreachable
  - Fixes: Use distinct path.

- AUTH-02-006 Account lockout

  - Spec: POST `/auth` (grouped) or `/auth/lockout`
  - Code: POST `/auth` (collides)
  - Status: Stub; Collides/Unreachable
  - Fixes: Use distinct path.

- AUTH-02-007 Email/phone verification

  - Spec: POST `/auth` (grouped) or `/auth/verify`
  - Code: POST `/auth` (collides)
  - Status: Stub; Collides/Unreachable
  - Fixes: Use distinct path.

- AUTH-02-008 Password reset flows

  - Spec: POST `/auth/password`
  - Code: POST `/auth/password` (reachable)
  - Status: Stub; Reachable
  - Fixes: Implement token/email; reset/change flows; audit.

- AUTH-02-009 Auth event logging

  - Spec: POST `/auth` (grouped) or `/auth/events`
  - Code: POST `/auth` (collides)
  - Status: Stub; Collides/Unreachable
  - Fixes: Use distinct path.

- AUTH-02-010 API keys/tokens
  - Spec: POST `/auth` (grouped) or `/auth/api-keys`
  - Code: POST `/auth` (collides)
  - Status: Stub; Collides/Unreachable
  - Fixes: Use distinct path.

Additional AUTH tasks:

- Implement JWT issuance/verification, refresh tokens, and session vs JWT separation.
- Add rate limiting for login/OTP; implement lockout thresholds.
- Apply RBAC middleware to downstream routes post-auth.

### USER (03-001 .. 03-006)

Files: `src/modules/user/*` — DTOs, controllers, services & repos present for 03-001/002; others stubs.
Routing: Not mounted in `src/app.ts` → currently unreachable.

- USER-03-001 User creation & management

  - Spec: POST `/users`
  - Code: Controller/service implemented with argon2 + repo; Unmounted
  - Status: Implemented; Unmounted
  - Fixes: Mount POST `/users`; apply RBAC; strict DTO validation.

- USER-03-002 User-school assignments

  - Spec: POST `/users/teachers/assignments` (or `/users/schools/assignments` per design); OpenAPI shows `/users/teachers/assignments` for 03-004; normalized spec shows 03-002 at `/users` as POST; ensure correct path mapping per spec
  - Code: Implemented service/repo; Unmounted
  - Status: Implemented; Unmounted; Path decision required
  - Fixes: Mount correct path (per finalized spec) for assignments.

- USER-03-003 Role & permission assignment

  - Spec: POST `/users/roles`
  - Code: Stub service; Unmounted
  - Status: Stub; Unmounted
  - Fixes: Implement service & repo; mount route.

- USER-03-004 Teacher subject/class allocation

  - Spec: POST `/users/teachers/assignments`
  - Code: Stub service; Unmounted
  - Status: Stub; Unmounted
  - Fixes: Implement & mount.

- USER-03-005 Staff profile management

  - Spec: POST `/users` (profile updates could be PATCH; confirm spec)
  - Code: Stub service; Unmounted
  - Status: Stub; Unmounted
  - Fixes: Implement & mount.

- USER-03-006 Parent-student linking
  - Spec: POST `/users/parents/links`
  - Code: Stub service; Unmounted
  - Status: Stub; Unmounted
  - Fixes: Implement & mount.

### STUD (04-001 .. 04-007)

Files: `src/modules/stud/*` exist; not mounted.

- STUD-04-001 Student admission — POST `/students/admissions`
- STUD-04-002 Admission approval — POST `/students/admissions`
- STUD-04-003 Readmission/promotion — POST `/students`
- STUD-04-004 Inter-school transfer — POST `/students/transfers`
- STUD-04-005 Student ID & roll allocation — POST `/students`
- STUD-04-006 Siblings & category allocation — POST `/students`
- STUD-04-007 Student documents & certificates — POST `/students/documents`

Status: Likely stubs; Unmounted. Fix: Mount all per spec; add DTOs, services, repos; apply RBAC.

### FEES (05-001 .. 05-009)

Files: `src/modules/fees/*` exist; not mounted.

- FEES-05-001 Fee heads & structures — POST `/fees/structures`
- FEES-05-002 Class & student fee mapping — POST `/fees`
- FEES-05-003 Discount allocation — POST `/fees/discounts`
- FEES-05-004 Transport/optional services — POST `/fees`
- FEES-05-005 Late fee rules — POST `/fees`
- FEES-05-006 Fee collection & receipts — POST `/fees/receipts`
- FEES-05-007 Payment gateway integration — POST `/fees`
- FEES-05-008 Refunds & adjustments — POST `/fees/refunds`
- FEES-05-009 Reports/reconciliation/defaulters — GET `/fees/reports`

Status: Likely stubs; Unmounted. Fix: Mount per spec; add DTOs/services/repos; RBAC; idempotency safeguards.

### ATTD (06-001 .. 06-003)

Files: `src/modules/attd/*` exist; not mounted.

- ATTD-06-001 Daily attendance & bulk import — POST `/attendance/bulk`
- ATTD-06-002 Leave/absence workflows — POST `/attendance/leaves`
- ATTD-06-003 Attendance reporting/analytics — GET `/attendance/reports`

Status: Likely stubs; Unmounted. Fix: Mount per spec; DTOs; services; performance/aggregation considerations.

### REPT (07-001 .. 07-006)

Files: `src/modules/rept/*` exist; not mounted.

- REPT-07-001 Student profile reports — GET `/reports`
- REPT-07-2 Fee collection reports — GET `/reports`
- REPT-07-3 Attendance summary reports — GET `/reports`
- REPT-07-4 Academic performance — GET `/reports`
- REPT-07-5 Custom report builder — GET `/reports`
- REPT-07-6 Export to PDF/Excel — GET `/reports`

Status: Likely stubs; Unmounted. Fix: Mount with query discriminators or split paths; pagination; export streaming.

### DASH (08-001 .. 08-003)

Files: `src/modules/dash/*` exist; not mounted.

- DASH-08-001 Trust admin dashboard — GET `/dashboards`
- DASH-08-002 School admin dashboard — GET `/dashboards`
- DASH-08-003 Teacher dashboard — GET `/dashboards`

Status: Likely stubs; Unmounted. Fix: Mount with role-based views or differentiated paths/queries.

### COMM (09-001 .. 09-003)

- COMM-09-001 Notifications (SMS/Email/WhatsApp) — POST `/communications`
- COMM-09-002 In-app announcements — POST `/communications/announcements`
- COMM-09-003 Emergency alerts (broadcast) — POST `/communications/alerts`

Status: Likely stubs; Unmounted. Fix: Mount per spec; implement providers & retries; audit.

---

## RBAC application matrix (quick guide)

- DATA: requireSystemAdmin (SYSTEM_ADMIN|GROUP_ADMIN)
- SETUP: trust/system admins; e.g., trust-level changes often require TRUST_ADMIN
- AUTH: open for login/OTP; protected for admin features (API keys, mappings)
- USER: school/trust admin; staff allocation may allow TEACHER scope for reads
- STUD: school admin; some actions require approvals chain
- FEES: accountant/school admin; trust configs by TRUST_ADMIN
- ATTD: teacher/school admin
- REPT/DASH: role-scoped read
- COMM: school/trust admin; broadcast high-privilege

Apply via `src/lib/rbac.ts` middlewares.

---

## Testing hardening plan

- Update `tests/contract/cases.json` paths/methods to exact spec, one case per activity.
- Assert response shapes minimally (e.g., `{ success: true, data: {...} }`).
- Re-enable OpenAPI validation and fail on schema mismatch.
- Add focused unit tests for service logic where non-trivial (e.g., USER-03-001 hashing/dup checks; AUTH lockout).

---

## File-by-file fix hints

- `src/app.ts`

  - Replace colliding routes with unique ones per activity (see DATA section for target paths).
  - Mount USER/STUD/FEES/ATTD/REPT/DASH/COMM routes.
  - Apply RBAC middleware per route.

- `api/openapi_rest_grouped_66.yaml`

  - Remove duplicate keys; ensure each activity has unique method+path.
  - Keep `x-activity-id` immutable; align `operationId` with module prefix.

- `tests/contract/openapi-contract.test.ts`

  - After OpenAPI fix, enable strict validation for requests/responses.

- Auth stack (`src/modules/auth/*`)

  - Implement services + repo. Add JWT/session, OTP, lockout, verification flows; audit events.

- User stack (`src/modules/user/*`)
  - Mount routes; complete services for 03-003..006; ensure Zod DTO coverage.

---

## Progress tracking template (per activity)

- Activity: <ID> — <Title>
  - Spec: <METHOD> <PATH>
  - Code route: <METHOD> <PATH or Unmounted>
  - Controller: Present | Missing; Validation: Zod | None
  - Service: Real | Stub | Missing
  - Repo: Real | Stub | N/A
  - RBAC: Applied | Missing
  - Tests: Present (strict|loose) | Missing
  - Actions:
    1. <route fix>
    2. <service/repo>
    3. <rbac/validation>
    4. <tests>

Use this template to close any remaining gaps after the initial pass.
