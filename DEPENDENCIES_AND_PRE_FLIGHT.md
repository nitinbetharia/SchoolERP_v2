# Dependencies & Pre‑Flight for AI Coders (Install Latest)

This checklist ensures **zero guesswork**. Use these exact commands to install the **latest** versions (no versions pinned here; `npm` will fetch the newest).

## 1) Runtime Dependencies (install latest)
```bash
npm i   express ejs zod mysql2 dotenv helmet cors express-rate-limit express-session   jsonwebtoken argon2 nodemailer multer dayjs
```

### Why each
- **express** — HTTP framework
- **ejs** — server-rendered views
- **zod** — input DTO validation
- **mysql2** — DB driver
- **dotenv** — local env loading (dev only)
- **helmet** — security headers
- **cors** — CORS middleware
- **express-rate-limit** — rate limiting
- **express-session** — server sessions
- **jsonwebtoken** — JWT for API
- **argon2** — password hashing (preferred over bcrypt)
- **nodemailer** — email adapter
- **multer** — file uploads (CSV bulk, etc.)
- **dayjs** — date utilities

## 2) Dev/Test/Types (install latest)
```bash
npm i -D   typescript ts-node jest ts-jest @types/jest   @types/node @types/express @types/jsonwebtoken @types/cors @types/express-session @types/multer @types/ejs   ajv ajv-formats js-yaml xlsx
```

> These match our contract tests (Ajv + OpenAPI), CI scripts, and TypeScript strict mode.

## 3) Before writing any code — **Pre‑Flight Checks**
1. **Read official docs** (latest) for any library you’ll touch: *Express, Zod, MySQL2, Argon2, Helmet, express-rate-limit, JSON Web Tokens, Multer, Nodemailer*. Avoid copying outdated snippets.
2. **OpenAPI & Guides** are *authoritative*. Confirm:
   - activity **path**, **method**, **operationId**, **x-activity-id**
   - RBAC in `docs/ai_coder_rest_grouped_66.md`
3. **Database schema**: Check tables & field names **exactly** in `migrations/**` and tracker. If a field/table is absent, **stop** and raise `"BLOCKED: Migration needed"`.
4. **Type safety**: All code must compile with `strict` TS, and use runtime guards (see `/src/lib/guards.ts`). **Never** trust request payloads.
5. **Tests first**: Add or update a contract test in `tests/contract/cases.json`, then implement handlers.

## 4) Type Safety Rules (must follow)
- Validate *all* inputs with **Zod**. Reject unknown properties (use `strict()`).
- Narrow types at runtime using the guard helpers (`isNonEmptyString`, `isPositiveInt`, etc.).
- Handle **null/undefined/empty** for strings, arrays, and numbers before DB operations.
- No `any` in controllers/services/repos. Use proper types inferred from Zod DTOs.
- Only **parameterized** SQL (mysql2 placeholders). No string concatenation.

## 5) Keep Updated (latest versions)
- After cloning or pulling: update to latest with:
  ```bash
  npx npm-check-updates -u   # optional if you choose to pin later
  npm i
  ```
- Always re-run tests and OpenAPI lint after updates.
