
# School ERP — **AI Coder Master Playbook** (Fool‑Proof, Zero‑Guesswork)

**Purpose:** This document is the *only* source of truth for AI coders.  
If anything is unclear elsewhere, **follow this file**. Do **not** invent behavior.

> **Golden Rule:** If a choice is not covered here, **fail the task** and emit an error stating the missing rule. Do **not** guess.

---

## 0) Canonical Scope & Authority

- **Activity IDs (immutable):** The 66 activities enumerated in the tracker are the only deliverables. IDs must appear in:
  - `operationId` (OpenAPI) + `x-activity-id`
  - Controller handler names, audit events, commit messages
- **Contract of record:** `api/openapi_rest_grouped_66.yaml` (REST-grouped).  
  Paths, methods, and `operationId`s are authoritative.
- **Endpoint catalog:** `docs/ai_coder_rest_grouped_66.md` (per-resource) & the flat variant `docs/ai_coder_guide_66_activities.md` (one row per activity).
- **Build order:** `dependency_ordered_build_and_test_plan.md` (phase-wise). Do not reorder.
- **RBAC/Audit catalog:** `rbac/RBAC_MATRIX.md`, `audit/AUDIT_EVENTS.md`.
- **DB baseline:** `migrations/master/*`, `migrations/trust_template/*` (+ future migrations).

> **If any file conflicts with this Playbook → this Playbook wins.** Raise an issue to reconcile later.

---

## 1) Tech Stack (Fixed)

- **Backend:** Node.js 20, TypeScript, Express.
- **Frontend:** EJS + TailwindCSS (server-rendered).
- **Database:** MySQL 8 (one master DB + one schema per tenant).
- **Auth:** Session (web) + JWT (API).
- **Payments:** Razorpay adapter.
- **Messaging:** SMTP/SMS/WhatsApp adapters via a pluggable interface.
- **Ops:** Single VM with `docker-compose` (Node, MySQL, Nginx, Certbot, Backup).

> **No deviations** (no microservices, no GraphQL, no SPA frontends).

---

## 2) Repository & Directory Layout (Fixed)

```
/api/openapi_rest_grouped_66.yaml        # Contract of record
/docs/ai_coder_rest_grouped_66.md        # REST-grouped guide (method, path, RBAC, DB, deps, DTO names)
/docs/ai_coder_guide_66_activities.md    # Flat one-row-per-activity reference
/dependency_ordered_build_and_test_plan.md

/src/modules/<module>/
  controllers.ts   # one exported handler per activity
  services.ts      # one exported service fn per activity
  repos.ts         # Repo class methods with parameterized queries
  dtos.ts          # Zod schemas (Request/Response) used by controllers
  validators.ts    # Re-export dtos; keep validators here for clarity
  index.ts         # Barrel exports

/migrations/master/*.sql
/migrations/trust_template/*.sql
/seeders/seed_data.json
/rbac/RBAC_MATRIX.md
/audit/AUDIT_EVENTS.md
/tests/contract/
  cases.json                   # Hand-curated tests (activity-bound)
  cases.generated.json         # Auto-generated skeletons
  generate-cases.ts            # Generates skeletons from OpenAPI
  openapi-contract.test.ts     # Jest runner with Ajv OpenAPI validation

/.github/workflows/ci.yml
/config/.env.example
/ops/nginx/nginx.conf, /ops/deploy.sh, /docker-compose.yml
```

---

## 3) Non‑Functional **Rails** (Never Break)

### 3.1 Error Envelope (Always)

```json
{ "success": false, "error": { "code": "SOME_CODE", "message": "Human readable", "details": { /* optional */ }, "traceId": "optional" } }
```

- **Do not** return raw stack traces.
- Success shape: `{ "success": true, "data": <payload> }`.

### 3.2 Validation (Zod everywhere)

- All incoming requests validated with Zod DTOs in `dtos.ts`.
- On `ZodError`: return **400** with `error.details` = list of field issues.

### 3.3 RBAC (Strict)

- Enforce **exact** role mapping shown in `docs/ai_coder_rest_grouped_66.md` and `rbac/RBAC_MATRIX.md`.
- On denial: return **403** with `error.code = "FORBIDDEN"` & emit `PERMISSION_DENIED` audit.

### 3.4 Audit Logging

- Emit audit for sensitive actions. Use **Activity ID** as `event_type` suffix where applicable.
- Minimum fields: `activityId`, `userId`, `trustId`, `entityType`, `entityId?`, `ip`, `ua`, `created_at`.

### 3.5 Rate Limits

- `/auth/*` and `/fees/*`: strict; others default.
- On throttle: **429** `TOO_MANY_REQUESTS`.

### 3.6 PII Masking

- Never log full email, phone, or OTP. Mask to safe patterns.

---

## 4) DTO Rules (Zero Guess)

- **Naming:**  
  - Request: `<ActivityId>Request` (e.g., `FEES05006Request`)  
  - Response: `<ActivityId>Response`
- **Primitive rules:**  
  - IDs = integers; timestamps = ISO strings; enums = UPPER_CASE strings.
- **Pagination:** `page: number`, `limit: number` (default 1/50, max 100).
- **Consistency:** Field names mirror DB column names unless explicitly mapped.

> If a field is not specified in OpenAPI or the Guides, **omit it**. Do not invent fields.

---

## 5) Controller → Service → Repo Template (Copy Exactly)

### 5.1 Controller (pattern)

```ts
// controllers.ts
import { Request, Response } from "express";
import { FEES05006Request } from "./dtos";
import * as svc from "./services";
import { z } from "zod";

export async function handle_fees_05_006(req: Request, res: Response) {
  try {
    // 1) RBAC
    // requireRole("ACCOUNTANT","SCHOOL_ADMIN"); // implement shared middleware

    // 2) Validate
    const schema = FEES05006Request; // Zod schema
    const input = schema.parse(req.body ?? {});

    // 3) Business logic
    const data = await svc.fees_05_006Service(input, { user: req.user, trustId: req.trustId });

    // 4) Respond
    return res.json({ success: true, data });
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: e.issues } });
    }
    return res.status(500).json({ success: false, error: { code: "INTERNAL", message: e?.message || "Internal error" } });
  }
}
```

### 5.2 Service (pattern)

```ts
// services.ts
import { FeesRepo } from "./repos";
export async function fees_05_006Service(input: any, ctx: { user: any; trustId: number }) {
  // Business rules ONLY; no SQL here.
  // Example: check overpayment, balance computation, etc.
  return await new FeesRepo().createReceipt(ctx.trustId, input);
}
```

### 5.3 Repository (pattern)

```ts
// repos.ts
export class FeesRepo {
  async createReceipt(trustId: number, input: any) {
    // Parameterized queries or ORM. NO string concat SQL.
    // Use existing indexes; add migration if a new index is needed.
    return { id: 1 }; // placeholder
  }
}
```

---

## 6) Testing (Must Pass Before Commit)

- **Contract tests** live in `tests/contract/cases.json` (hand-curated) and `cases.generated.json` (generated).
- For each Activity ID:
  1. Add a test case with the exact path/method from OpenAPI.
  2. Set `validateAgainstOpenAPI: true` once DTOs are stable.
  3. Expected statuses: prefer `200/201`, otherwise `400` for validation errors; `403` for RBAC.
- Run locally:
  ```bash
  npm i
  npm run gen:contract:cases     # optional skeletons
  CONTRACT_TOKEN=<jwt> npm run test:contract
  ```

> If schema validation fails, **fix the DTO/controller**—do not change the contract unless the Playbook is updated.

---

## 7) Frontend Rules (EJS + Tailwind)

- **Server-rendered** views only.
- Build reusable partials: `_layout.ejs`, `_form.ejs`, `_table.ejs`, `_pagination.ejs`, `_errors.ejs`.
- **Form validation** mirrors Zod: display field-specific errors from `error.details`.
- **Accessibility:** all inputs have `<label for>`, tab order correct, color contrast AA.
- **No client-side framework**; vanilla JS only for minor interactions.

---

## 8) Migrations, Indexing & Seeds

- Migrations must be **idempotent** and **reversible** (up/down). Filename prefix with sequence.
- Add indexes to match list filters and joins; never index blindly.
- Seeders must allow bootstrapping a tenant end-to-end for tests.

---

## 9) Activity Implementation **Protocol** (per item)

For **each** Activity ID (see `dependency_ordered_build_and_test_plan.md` for order):

1. Read row in `docs/ai_coder_rest_grouped_66.md`  
   → identify **method, path, RBAC, DB entities, dependencies, DTO names**.
2. Code Zod Request/Response DTOs in `dtos.ts`.
3. Implement controller → service → repo (use templates above).
4. Emit audit with **Activity ID**.
5. Add a `tests/contract/cases.json` entry (copy from the dependency plan).
6. Run tests → commit with message:  
   `feat(<ActivityID>): <short description>`.

> **Never** skip dependencies; always follow the dependency-ordered plan.

---

## 10) Decision Tree (When in Doubt)

- **Q:** Field not listed in DTO?  
  **A:** Omit it. Return `400` if request contains unknown properties.
- **Q:** Role unclear?  
  **A:** Enforce the **strictest** role set among the candidates listed for the module in the Guides.
- **Q:** DB table missing?  
  **A:** Fail the task and raise a migration request; do not write to a non-existent table.
- **Q:** Reporting/export format unspecified?  
  **A:** Return CSV by default, with header row from column names.
- **Q:** Pagination unspecified?  
  **A:** Default `page=1&limit=50`, cap `limit=100`.
- **Q:** Any ambiguity not covered here?  
  **A:** Stop. Emit an error with: `"BLOCKED: Spec missing for <X>. Update AI Coder Master Playbook."`

---

## 11) CI & Quality Gates

- **CI pipeline** (already present) runs: lint, typecheck, OpenAPI lint, contract tests.
- Make contract tests **blocking** once the first module is stable.
- Add a nightly task to run `generate-cases.ts` and diff against `cases.json` to catch missing coverage.

---

## 12) Ops Quickstart (One VM)

```bash
docker compose up -d
# issue TLS once DNS is ready — update domains in ops/deploy.sh instructions
```

- Backups are produced nightly to `ops/backups/`.
- Uptime monitoring: ping `/api/v1/health`.

---

## 13) Commit / PR Discipline

- Branch name: `feature/<ActivityID>-short-slug`
- PR title: `feat(<ActivityID>): <summary>`
- PR checklist (must be checked):
  - [ ] DTOs exist & match OpenAPI
  - [ ] Controller/Service/Repo implemented
  - [ ] RBAC enforced
  - [ ] Audit emitted
  - [ ] Contract test added & passing
  - [ ] No lint/type errors

---

## 14) Examples (Authoritative Patterns)

### 14.1 Zod DTO Example

```ts
// dtos.ts (pattern)
import { z } from "zod";

export const FEES05006Request = z.object({
  student_id: z.number().int().positive(),
  amount: z.number().positive(),
  mode: z.enum(["CASH","BANK","UPI","ONLINE"]),
  reference: z.string().optional()
});

export type FEES05006RequestT = z.infer<typeof FEES05006Request>;

export const FEES05006Response = z.object({
  id: z.number().int().positive(),
  receipt_no: z.string(),
  balance_after: z.number()
});
```

### 14.2 Contract Test Case Example

```json
{
  "activityId": "FEES-05-006",
  "name": "Create receipt",
  "method": "POST",
  "path": "/fees/receipts",
  "headers": {
    "Authorization": "Bearer ${TOKEN}",
    "Content-Type": "application/json"
  },
  "body": {
    "student_id": 101,
    "amount": 5000,
    "mode": "ONLINE"
  },
  "expect": [201],
  "validateAgainstOpenAPI": true
}
```

---

## 15) Final Word

- This Playbook eliminates decision-making for AI coders.  
- If **any** required detail is missing, **stop** and log `"BLOCKED: Update Playbook"`.

**End of document.**

---

## 0.a Pre‑Flight (Dependencies & Schema) — **MANDATORY**

- Install **latest** runtime & dev dependencies using commands in `DEPENDENCIES_AND_PRE_FLIGHT.md`.
- **Read official documentation** for any library you’ll call (Express, Zod, MySQL2, Argon2, Helmet, Rate‑Limit, JWT, Multer, Nodemailer). Do not rely on stale snippets.
- **Verify DB schema**: confirm tables and **field names** in `migrations/**` and the tracker before writing queries. If a required field/table is missing, **STOP** and output: `BLOCKED: Migration needed for <table/field>`.
- **Type Safety**: Use TypeScript `strict` mode and runtime guards from `/src/lib/guards.ts`. Disallow `any`. Validate arrays/strings/numbers/null/empty before use.
- **Tests first**: Add a contract test case (activity‑linked) in `tests/contract/cases.json` before starting code.
