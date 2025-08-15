# FRONTEND_GUIDE.md
**School ERP — Frontend Implementation Guide (SSR: Express + EJS + Tailwind)**  
**Audience:** Human developers and AI-coders (Copilot, Claude)  
**Status:** Authoritative companion to the Master Specification. This guide never invents endpoints or payloads; it consumes what the spec defines.

---

## 0) Goals & Non‑Negotiables
- **Rendering model:** Server‑side rendering (SSR) with **EJS**.
- **Styling:** **Tailwind CSS** compiled to a single `public/css/app.css`.
- **Language:** **TypeScript** across routes and handlers.
- **Transport:** UI talks to the backend **only via the REST endpoints defined in the Master Specification** (no ad‑hoc endpoints).
- **Permissions:** UI reflects **RBAC** (hide in UI) but **server guards are the source of truth** (enforce in middleware).
- **Multi‑tenancy:** Subdomain → Trust context determines branding, theme, and data scope.
- **Validation:** Server‑side using **Zod** DTOs that mirror backend schemas.
- **State:** Session store for auth and wizard progress.
- **Rate limits:** Respect module limits exposed by the backend (throttle UI actions, disable double‑submit).

> Golden Rule for AI-coders: **Do not create or alter API endpoints.** Read endpoint, method, body, and response envelope from the Master Specification and use as‑is.

---

## 1) Project Layout (UI-relevant)
```
src/
  web/
    views/
      layouts/
        base.ejs            # HTML shell: <head>, <main>, alerts, footer
      partials/
        navbar.ejs          # Built from res.locals.perms (RBAC map)
        breadcrumbs.ejs
        alerts.ejs          # Renders {success, error:{code,message,details}}
        form-controls/      # input.ejs, select.ejs, date.ejs, money.ejs, textarea.ejs
        tables/             # table.ejs, paginate.ejs, empty-state.ejs
        wizard/             # wizard-nav.ejs, wizard-actions.ejs, step-indicator.ejs
      data/                 # module folders (one EJS per Activity when UI exists)
      setup/
      auth/
      user/
      stud/
      fees/
      attd/
      rept/
      dash/
      comm/
    public/
      css/app.css           # Tailwind build output
      js/main.js            # Progressive enhancement only
  routes/
    data.ts | setup.ts | auth.ts | ...
  middleware/
    rbac.ts | trust-context.ts | rate-limit.ts | error-envelope.ts
  ui/
    dto/                     # Zod schemas used by the UI
    adapters/                # Mapping API envelope → UI models
```

**Activity-centric convention**  
Every screen is keyed to its **Activity ID** from the spec. Example: activity `DATA-00-001` gets a view at `views/data/DATA-00-001.ejs`, and a route in `routes/data.ts` that calls the exact documented endpoint.

---

## 2) Tailwind & Assets
**tailwind.config.js**
```js
module.exports = {
  content: ["./src/web/views/**/*.ejs", "./src/web/public/js/**/*.js"],
  theme: { extend: {} },
  plugins: [],
};
```
**NPM scripts**
```json
{
  "scripts": {
    "css:build": "tailwindcss -i ./src/web/input.css -o ./src/web/public/css/app.css --minify",
    "css:dev": "tailwindcss -i ./src/web/input.css -o ./src/web/public/css/app.css --watch"
  }
}
```
**`src/web/input.css`**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## 3) Layout & Partials
**`views/layouts/base.ejs` (excerpt)**
```ejs
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title><%= title || 'School ERP' %></title>
    <link rel="stylesheet" href="/css/app.css" />
  </head>
  <body class="min-h-screen bg-gray-50 text-gray-900">
    <%- include('../partials/navbar') %>
    <main class="mx-auto max-w-7xl p-4">
      <%- include('../partials/alerts', { flash: flash }) %>
      <%- body %>
    </main>
    <script src="/js/main.js"></script>
  </body>
</html>
```
**`views/partials/alerts.ejs`**
```ejs
<% if (flash && flash.error) { %>
  <div class="mb-4 rounded-lg border border-red-300 bg-red-50 p-3">
    <p class="font-semibold">Error: <%= flash.error.code %></p>
    <p><%= flash.error.message %></p>
    <% if (flash.error.details && flash.error.details.length) { %>
      <ul class="list-disc pl-5">
        <% flash.error.details.forEach(d => { %><li><%= d %></li><% }) %>
      </ul>
    <% } %>
  </div>
<% } %>
<% if (flash && flash.success) { %>
  <div class="mb-4 rounded-lg border border-green-300 bg-green-50 p-3">
    <p class="font-semibold"><%= flash.success %></p>
  </div>
<% } %>
```

---

## 4) Route ↔ View ↔ Activity (Pattern)
**Server route (TypeScript)**
```ts
// src/routes/data.ts
import { Router } from "express";
import { requireSystemAdmin } from "../middleware/rbac";
import { asFlash } from "../middleware/error-envelope";
import { api } from "../ui/adapters/api-client";

export const dataRouter = Router();

// Example: DATA-00-001 (Connection Status) — GET endpoint from spec
dataRouter.get("/system/connections/status", requireSystemAdmin, async (req, res) => {
  try {
    const resp = await api.get("/system/connections/status", { ctx: res.locals.ctx });
    res.render("data/DATA-00-001", { title: "System Connections", data: resp.data, flash: null });
  } catch (e) {
    res.render("data/DATA-00-001", { title: "System Connections", data: null, flash: asFlash(e) });
  }
});
```
**View tied to Activity ID**
```ejs
<!-- src/web/views/data/DATA-00-001.ejs -->
<% layout('../layouts/base') -%>
<section class="space-y-4">
  <h1 class="text-2xl font-bold">System Connections</h1>
  <% if (data) { %>
    <table class="w-full table-auto border-separate border-spacing-y-1">
      <thead><tr><th class="text-left">Service</th><th>Status</th><th>Latency</th></tr></thead>
      <tbody>
        <% data.items.forEach((s) => { %>
          <tr class="bg-white shadow-sm">
            <td class="p-3"><%= s.name %></td>
            <td class="p-3"><%= s.status %></td>
            <td class="p-3"><%= s.latencyMs %> ms</td>
          </tr>
        <% }) %>
      </tbody>
    </table>
  <% } %>
</section>
```

---

## 5) Trust Context & Multi‑Tenancy
**Middleware: `trust-context.ts`**
```ts
import { Request, Response, NextFunction } from "express";

export function trustContext(req: Request, res: Response, next: NextFunction) {
  const host = req.hostname;                   // e.g., mytrust.schoolerp.com
  const trustSlug = host.split(".")[0];        // derive trust from subdomain
  // In a real app, look up trust config from cache / backend
  res.locals.trust = { slug: trustSlug, name: trustSlug.toUpperCase(), logo: null, theme: "default" };
  res.locals.ctx = { trust: trustSlug };       // pass to API client
  next();
}
```
Use `res.locals.trust` in `base.ejs` for logo/name and optional theming.

---

## 6) RBAC in UI (reflect) & Server (enforce)
**Server enforcement** happens with middleware (e.g., `requireSystemAdmin`, `requireRole("SCHOOL_ADMIN")`).  
**UI reflection** builds navigation from a permission map:

```ejs
<!-- views/partials/navbar.ejs -->
<nav class="bg-white border-b">
  <div class="mx-auto max-w-7xl px-4 py-2 flex gap-6">
    <a href="/" class="font-semibold">ERP</a>
    <% if (perms.data?.view) { %><a href="/system/connections/status">System</a><% } %>
    <% if (perms.setup?.view) { %><a href="/setup">Setup</a><% } %>
    <% if (perms.fees?.view) { %><a href="/fees">Fees</a><% } %>
    <!-- ... other modules based on perms ... -->
    <span class="ml-auto"><%= trust?.name %></span>
  </div>
</nav>
```

---

## 7) Wizard Engine (SETUP module)
**Routes**
```
GET  /setup/:wiz/:step     → render step
POST /setup/:wiz/:step     → validate → persist via spec endpoint → redirect next
```
**Session-backed progress**: Store `wizardId`, `currentStep`, and `payload` in the session.  
**UI Partials**: `wizard-nav.ejs` (steps & progress), `wizard-actions.ejs` (Prev/Next/Save & Exit).

**Controller snippet**
```ts
import { Router } from "express";
import { z } from "zod";
import { api } from "../ui/adapters/api-client";

const WizardStepSchema = z.object({
  // fields per step as specified in DTOs
});

export const setupRouter = Router();

setupRouter.get("/setup/:wiz/:step", async (req, res) => {
  res.render("setup/SETUP-01-001", { step: req.params.step, data: req.session?.wizardData, flash: null });
});

setupRouter.post("/setup/:wiz/:step", async (req, res) => {
  const parsed = WizardStepSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.render("setup/SETUP-01-001", { step: req.params.step, data: req.body, flash: { error: { code: "VALIDATION", message: "Please fix the highlighted fields", details: parsed.error.issues.map(i => i.message) } } });
  }
  try {
    await api.post(`/setup/${req.params.wiz}/${req.params.step}`, parsed.data, { ctx: res.locals.ctx });
    // update session wizard state here
    res.redirect(`/setup/${req.params.wiz}/next-step`);
  } catch (e) {
    res.render("setup/SETUP-01-001", { step: req.params.step, data: req.body, flash: asFlash(e) });
  }
});
```

---

## 8) Forms, Validation & Error Envelope
- Use **Zod** schemas in `src/ui/dto/*` to validate incoming form data before calling APIs.
- Adapt API error envelopes to the `alerts.ejs` partial via `asFlash`:

```ts
// middleware/error-envelope.ts
export function asFlash(e: any) {
  if (e?.response?.data?.error) return { error: e.response.data.error };
  if (e?.message) return { error: { code: "UNEXPECTED", message: e.message, details: [] } };
  return { error: { code: "UNKNOWN", message: "Unknown error", details: [] } };
}
```

- Map field errors to `{ field, message }[]` so each control can highlight its own error.

```ejs
<!-- views/partials/form-controls/input.ejs -->
<div class="mb-4">
  <label class="mb-1 block"><%= label %></label>
  <input name="<%= name %>" value="<%= value || '' %>" class="w-full rounded border p-2" aria-invalid="<%= !!error %>"/>
  <% if (error) { %><p class="mt-1 text-sm text-red-600"><%= error %></p><% } %>
</div>
```

---

## 9) Rate Limits (UX)
- Debounce search inputs (300–500ms).
- Disable submit buttons on first click; re‑enable on response or after a timeout.
- Avoid polling-heavy widgets unless the backend exposes explicit streaming or events.
- Surface `429 Too Many Requests` with actionable UI copy (“Please wait and try again”).

---

## 10) Accessibility, I18n, Timezone
- Use proper labels, `aria-invalid`, and error summaries that link to fields.
- Render all dates/times in **Asia/Kolkata** (or trust-configured timezone) on the server.
- Keep color contrast ≥ WCAG AA; Tailwind utilities make this straightforward.

---

## 11) Testing the UI (SSR)
Use **Jest + Supertest + Cheerio** to assert HTML output and RBAC-driven visibility.

```ts
import request from "supertest";
import * as cheerio from "cheerio";
import { app } from "../app";

test("DATA-00-001 renders table for authorized user", async () => {
  const res = await request(app).get("/system/connections/status").set("x-test-role", "SYSTEM_ADMIN");
  expect(res.status).toBe(200);
  const $ = cheerio.load(res.text);
  expect($("h1").text()).toContain("System Connections");
  expect($("table").length).toBeGreaterThan(0);
});
```

---

## 12) “Definition of Done” (UI per Activity)
1. **View file** at `views/{module}/{ACTIVITY_ID}.ejs` with accessible controls.
2. **Route handler** implemented in `routes/{module}.ts`, calling the **exact** spec endpoint & method.
3. **Server validation** with Zod; field errors shown near controls and in an error summary.
4. **RBAC** enforced in middleware; menu/buttons hidden based on `res.locals.perms`.
5. **Rate limit‑safe** UI (no rapid re‑submits; handles 429 gracefully).
6. **Tests** assert render + basic interactions.
7. **No inline styles**; Tailwind classes only; assets compiled.

---

## 13) Copilot / Claude Prompts (Deterministic)
**A) Generate Activity View**
```
You are an AI coder. Tech: Express 4 + TypeScript, EJS, Tailwind.
Create views/{module}/{ACTIVITY_ID}.ejs implementing the screen for the documented REST endpoint:
- GET/POST paths: paste exact from the Master Specification.
- Use partials: layouts/base, partials/navbar, partials/alerts, form-controls/*.
- Render data from the standard { success, error } envelope.
- Add ARIA attributes and an error summary linking to invalid fields.
```

**B) Wire Router & Handler**
```
Generate routes/{module}.ts for Activity {ACTIVITY_ID}:
- GET renders the EJS view; POST/PUT calls the documented REST endpoint.
- Use asFlash() to map API envelope to alerts.ejs.
- Enforce RBAC via a middleware name I provide (e.g., requireSystemAdmin).
```

**C) Build Wizard Step (SETUP-01-00X)**
```
Create GET/POST for /setup/{wiz}/{step}:
- Zod-validate fields; on success, call the documented /setup/{wiz}/{step} endpoint.
- Persist progress in the session (wizardId, currentStep, payload).
- UI: use wizard-nav.ejs and wizard-actions.ejs partials.
```

---

## 14) Scaffolding Script (Optional)
Create a tiny generator to avoid hand‑wiring files:

```ts
// scripts/scaffold-activity.ts
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const [moduleName, activityId] = process.argv.slice(2);
const viewsDir = join("src/web/views", moduleName);
mkdirSync(viewsDir, { recursive: true });
writeFileSync(join(viewsDir, `${activityId}.ejs`), "<% layout('../layouts/base') -%>\n<h1 class='text-2xl font-bold'>" + activityId + "</h1>\n");

console.log("Created view:", join(viewsDir, `${activityId}.ejs`));
```

Run: `ts-node scripts/scaffold-activity.ts fees FEES-01-001`

---

## 15) Naming & Conventions
- **Activity IDs:** `{MODULE}-{MM}-{SEQ}` (e.g., `FEES-01-003`).
- **Files:** One EJS view per Activity; kebab-case for other filenames.
- **Routes:** Prefer resource nouns and the exact method from the spec.
- **CSS:** Tailwind utilities; extract frequently reused patterns into partials, not CSS.
- **JS:** Keep to progressive enhancement; SSR remains the primary interaction model.

---

## 16) Safety Rails for AI-Coders
- Never invent endpoints, fields, or status codes—**read them from the spec**.
- Preserve the standard response **envelope**: `{ success: boolean, data?: any, error?: { code, message, details? } }`.
- Respect **RBAC**: ask for the required middleware name if not provided.
- Obey **rate limits**: add debounce and disable double-submit where relevant.
- Always name views with the **Activity ID** to retain traceability.

---

## 17) Appendix — Minimal `api-client` (UI side)
```ts
// src/ui/adapters/api-client.ts
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.BACKEND_URL || "http://localhost:4000",
  timeout: 10000,
});

// Example helper to add context (trust, auth) per request
api.interceptors.request.use((config) => {
  // Attach any context headers here using res.locals.ctx passed from server route
  return config;
});
```

---

**End of FRONTEND_GUIDE.md**
