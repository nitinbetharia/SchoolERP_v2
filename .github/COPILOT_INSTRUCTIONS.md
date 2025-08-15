# Copilot Instructions — School ERP (Authoritative, Zero‑Guesswork)
**Version:** 2025-08-13 • **Owner:** Nitin Betharia • **Audience:** AI coders (Copilot/Claude)

> If ANYTHING is unclear or missing, STOP and output:  
> **BLOCKED: Spec/Playbook/Migration missing for <detail>. Do not guess.**

---

## 0) Canonical Files (MUST read before coding)
- `api/openapi_rest_grouped_66.yaml` — **Contract of record** (paths, methods, `operationId`, `x-activity-id`).
- `docs/ai_coder_rest_grouped_66.md` — Per‑endpoint guide (**RBAC**, **DB entities**, **Dependencies**, **DTO names**).
- `dependency_ordered_build_and_test_plan.md` — **Build order** and per‑activity **test stub**.
- `ai_coder_master_playbook.md` — **Final authority** for patterns, rules, and decision tree.
- `DEPENDENCIES_AND_PRE_FLIGHT.md` — Install latest deps + mandatory pre‑flight checks.
- `rbac/RBAC_MATRIX.md`, `audit/AUDIT_EVENTS.md` — Authoritative **roles** and **events**.
- `migrations/**`, `seeders/**` — **Schema & seed data.** Field names must match these files.
- `tests/contract/*` — Contract tests (**Jest + Ajv**).

> If any file conflicts, follow **ai_coder_master_playbook.md** and raise an issue to reconcile later.

---

## 1) Non‑Negotiables (do these FIRST)
1. **Install latest dependencies** (see `DEPENDENCIES_AND_PRE_FLIGHT.md`).
2. **Read docs** of libs you touch (Express, Zod, MySQL2, Argon2, Helmet, Rate‑Limit, JWT, Multer, Nodemailer).
3. **Verify DB schema**: confirm **table/field names** in `migrations/**`. If missing → **BLOCKED**.
4. **Add a contract test case** to `tests/contract/cases.json` for the Activity ID you’re implementing.
5. Turn on **TypeScript strict** and use `src/lib/guards.ts` for runtime checks.

---

## 2) Activity Implementation Protocol (for each of the 66 IDs)
**Work strictly in the order from `dependency_ordered_build_and_test_plan.md`. Do not skip.**

1. Locate the row in `docs/ai_coder_rest_grouped_66.md` (method, REST path, RBAC, DB entities, deps, DTO names).  
   Confirm the matching entry in `api/openapi_rest_grouped_66.yaml` by `x-activity-id`.
2. Create **Zod DTOs** in `src/modules/<module>/dtos.ts`:
   - Request name: `<ActivityId>Request`, Response: `<ActivityId>Response`
   - Use `.strict()`; reject unknown props. IDs are integers; timestamps ISO; enums UPPER_CASE.
3. Implement **controller → service → repo** per the Playbook templates.
4. **RBAC**: enforce exact roles; on denial, `403 FORBIDDEN` and log `PERMISSION_DENIED` audit.
5. **Audit**: emit event using the **Activity ID** as suffix and include: `activityId,userId,trustId,entityType,entityId?,ip,ua,created_at`.
6. **Testing**:
   - Add/adjust the JSON test case (from the dependency plan).  
   - Set `validateAgainstOpenAPI: true` once DTO stable.  
   - Run: `CONTRACT_TOKEN=<jwt> npm run test:contract`.
7. **Commit**: `feat(<ActivityID>): <summary>`.

> **Never** change Activity IDs or `operationId`. **Never** invent fields or endpoints.

---

## 3) Error, Validation, Security (ALWAYS)
- **Error envelope (only shape allowed):**
  ```json
  { "success": false, "error": { "code": "SOME_CODE", "message": "Readable", "details": {}, "traceId": "optional" } }
  ```
  Success: `{ "success": true, "data": <payload> }`
- **Validation**: All inputs via Zod. On `ZodError`, **400** with `error.details` array.
- **Rate limits**: Strict on `/auth/*` and `/fees/*`. On throttle → **429**.
- **PII masking**: redact emails/phones/OTP in logs & error messages.
- **Sessions/JWT**: Session for web; JWT for API. Secure cookies, CSRF on forms, Helmet headers.

---

## 4) Type Safety (compile‑time + runtime)
- TypeScript **strict** on; no `any`. Infer types from Zod: `z.infer<typeof Schema>`.
- Use **runtime guards** (`src/lib/guards.ts`) before DB calls:
  - `isNonEmptyString`, `isPositiveInt`, `normalizeArray`, `invariant`, etc.
- **Arrays/strings/numbers**: handle empty/null/undefined explicitly.  
- **SQL**: parameterized queries only (no string concat).

---

## 5) Frontend Rules (EJS + Tailwind, server‑rendered)
- Use provided UI kit: `views/layout.ejs`, `partials/_head/_nav/_alerts/_pagination`.
- Screens available: `users/list.ejs`, `students/admission_form.ejs`, `fees/receipt_form.ejs`.
- Mirror Zod validation errors in the UI (field messages from `error.details`).  
- Accessibility first: labels, tab order, contrast AA. Avoid client frameworks; vanilla JS only.

---

## 6) Testing & CI (Blocking)
- **Contract tests** (Jest + Ajv) must pass for each activity:
  - `tests/contract/openapi-contract.test.ts`
  - Add to `tests/contract/cases.json` (or generate skeletons via `npm run gen:contract:cases`).
- **Tracker vs OpenAPI** consistency (CI blocking):  
  `npx ts-node scripts/verify-tracker-openapi.ts` must pass.
- Turn **schema validation** on by setting `validateAgainstOpenAPI: true` in cases.
- Load tests available (k6) for key flows (login, admissions, receipts, attendance, reports).

---

## 7) Deployment & Ops (single VM, docker‑compose)
- `docker-compose.yml` runs: `app`, `mysql`, `nginx`, `certbot`, `backup`.
- Use `ops/deploy.sh` (read comments for TLS issuance).  
- Backups: nightly dumps to `ops/backups/`.  
- Uptime: monitor `/api/v1/health`.

---

## 8) Copilot/Claude Prompt Templates (copy‑paste)

### 8.1 “Generate DTOs”
> Use `docs/ai_coder_rest_grouped_66.md` and `api/openapi_rest_grouped_66.yaml` to implement **Zod DTOs** for **<ActivityID>** at `src/modules/<module>/dtos.ts`. Names: `<ActivityID>Request` and `<ActivityID>Response`. Use `.strict()`, integer IDs, ISO timestamps, UPPER_CASE enums. **Do not** add extra fields. If schema/table fields missing in migrations, output `BLOCKED: Migration needed` and stop.

### 8.2 “Generate controller/service/repo”
> Implement **controller → service → repo** for **<ActivityID>** using the templates in the Master Playbook. Enforce RBAC per `docs/ai_coder_rest_grouped_66.md`, validate with the new DTOs, and return the **error envelope** shape. Use **parameterized** queries only and runtime guards (`src/lib/guards.ts`). Emit an **audit** with `activityId=<ActivityID>`. Add/adjust the contract test entry in `tests/contract/cases.json`, set `validateAgainstOpenAPI: true`, and run tests.

### 8.3 “Write the contract test”
> Add a test case in `tests/contract/cases.json` for **<ActivityID>** with the exact path/method from the OpenAPI. Expected status `[200,201]` on success; include a negative case (`400` for Zod invalid, or `403` for RBAC denied). Enable `validateAgainstOpenAPI` when DTOs are stable.

### 8.4 “Fix failing schema test”
> Do not change the OpenAPI unless the Playbook says so. Adjust DTO/controller to match the contract. If the contract is actually wrong, output `BLOCKED: Contract mismatch. Update Playbook/OpenAPI.`

---

## 9) Do / Don’t

**Do**
- Follow **Activity ID** order and keep IDs in code/tests/commits.
- Reuse repo patterns; keep modules cohesive (controller/service/repo/dtos).
- Short, explicit functions; handle all **edge cases** (null, undefined, empty, wrong type).

**Don’t**
- Don’t invent fields, endpoints, or roles.
- Don’t skip Zod validation, RBAC, or audit.
- Don’t write raw SQL without parameters.
- Don’t pin package versions here; fetch latest and re‑run tests.

---

## 10) PR Checklist (MUST tick all)
- [ ] Activity implemented: **<ActivityID>**
- [ ] DTOs match OpenAPI; `.strict()` used
- [ ] Controller/Service/Repo complete; **RBAC** enforced; **Audit** emitted
- [ ] Contract test added; `validateAgainstOpenAPI: true`; passing
- [ ] Tracker ↔ OpenAPI verified in CI
- [ ] No `any`, no implicit `any`, TypeScript passes `strict`
- [ ] No unparameterized SQL; inputs guarded

---

## 11) Failure & Escalation
- If a required detail is missing (field, table, role, path), output:  
  **BLOCKED: Update Playbook/Migration for <detail>**.  
  Stop and request update—do not guess.

**End of Copilot Instructions**
