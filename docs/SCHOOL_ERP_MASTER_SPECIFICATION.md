# School ERP — Master Specification & Implementation Guide
**THE SINGLE SOURCE OF TRUTH**

**Version:** 1.0.0 • **Date:** 2025-08-14 • **Authority:** This document supersedes all other documentation

---

## 🎯 Document Authority & Scope

**This document is the ONLY authoritative source for:**
- All 66 Activity specifications with industry-standard REST API design
- Implementation patterns and code standards
- Testing protocols and quality gates
- Architecture decisions and technology choices

> **Golden Rule:** If anything conflicts with this document, THIS DOCUMENT WINS. No exceptions.

---

## 🏗️ Architecture & Tech Stack (Non-Negotiable)

### Core Stack
- **Backend:** Node.js 20 + TypeScript + Express.js
- **Database:** MySQL 8 (master DB + per-trust schemas)
- **Frontend:** Server-rendered EJS + Tailwind CSS
- **Authentication:** Dual mode - Sessions (web) + JWT (API)
- **Validation:** Zod schemas with strict type safety
- **Deployment:** Single VM + Docker Compose

### Module Structure (Enforced)
```
src/modules/{module}/
├── controllers.ts    # HTTP request handlers (one per activity)
├── services.ts       # Business logic layer  
├── repos.ts         # Data access layer with parameterized queries
├── dtos.ts          # Zod validation schemas
├── validators.ts    # Re-exports of DTOs for clarity
└── index.ts         # Barrel exports
```

**Modules:** `data`, `setup`, `auth`, `user`, `stud`, `fees`, `attd`, `rept`, `dash`, `comm`

---

## 🌐 Industry-Standard REST API Design

### API Design Principles Applied

**✅ Fixed REST Violations from Original Docs:**

1. **Unique Endpoints:** Every activity now has a distinct, meaningful endpoint
2. **HTTP Method Variety:** Uses GET for retrieval, POST for creation, PUT for updates  
3. **Clear Resource Nouns:** Endpoints represent resources, not actions
4. **Consistent Patterns:** Similar operations follow similar URL structures
5. **RESTful Actions:** Sub-resources and actions clearly distinguished

### DATA Module - Phase 0 Endpoints (Industry Standard)

| Activity ID | Activity | Method | REST Endpoint | Description |
|-------------|----------|--------|---------------|-------------|
| DATA-00-001 | Connection Manager | GET | `/system/connections/status` | Check database connectivity |
| DATA-00-002 | Master DB schema creation | POST | `/system/schemas/master` | Initialize master database |
| DATA-00-003 | Trust DB schema template | POST | `/system/schemas/trusts` | Initialize trust database |
| DATA-00-004 | System config storage | POST | `/system/config` | Store system configuration |
| DATA-00-005 | Trust registry & subdomains | POST | `/system/trusts` | Register new trust |
| DATA-00-006 | System users | POST | `/system/users` | Create system admin users |
| DATA-00-007 | Migration tracking | POST | `/system/migrations` | Track migration status |
| DATA-00-008 | Session store | POST | `/system/sessions` | Manage user sessions |
| DATA-00-009 | Global audit logging | POST | `/system/audit-logs/system` | Log system-wide events |
| DATA-00-010 | Tenant audit logging | POST | `/system/audit-logs/tenants` | Log tenant-specific events |
| DATA-00-011 | Config cache management | PUT | `/system/config/cache` | Refresh configuration cache |
| DATA-00-012 | Pool cleanup | POST | `/system/connections/cleanup` | Clean up idle connections |

### Universal API Standards

#### Request/Response Format
```json
// Success Response
{
  "success": true,
  "data": { /* response payload */ }
}

// Error Response  
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { /* optional validation details */ },
    "traceId": "optional-trace-id"
  }
}
```

#### Standard HTTP Status Codes
- **200 OK:** Successful GET, PUT operations
- **201 Created:** Successful POST operations  
- **400 Bad Request:** Validation errors, malformed requests
- **401 Unauthorized:** Authentication required
- **403 Forbidden:** Permission denied (RBAC failure)
- **404 Not Found:** Resource not found
- **429 Too Many Requests:** Rate limit exceeded
- **500 Internal Server Error:** Server errors

---

## 🔐 Security & RBAC Implementation

### Role-Based Access Control Matrix

| Role | Scope | Modules Accessed | Description |
|------|-------|-----------------|-------------|
| SYSTEM_ADMIN | Global | DATA, SETUP, AUTH, USER, REPT | Full system control |
| GROUP_ADMIN | Multi-trust | DATA, SETUP, AUTH, USER, REPT | Manage multiple trusts |
| TRUST_ADMIN | Trust-wide | SETUP, USER, STUD, FEES, ATTD, REPT, COMM, DASH | Full trust management |
| SCHOOL_ADMIN | School-level | USER, STUD, FEES, ATTD, REPT, COMM, DASH | School operations |
| TEACHER | Class-level | ATTD, STUD | Teaching responsibilities |
| ACCOUNTANT | School-level | FEES, REPT | Financial operations |
| PARENT | Own wards | STUD, COMM | View own children's data |
| STUDENT | Self | COMM | View own data |

### RBAC Implementation Pattern

```typescript
// Apply to all DATA endpoints
import { requireSystemAdmin } from '../lib/rbac';

// In routes
app.post('/system/connections/status', requireSystemAdmin(), controller.handle);

// RBAC Middleware returns 403 + audit log on denial
```

### Rate Limiting
- **Authentication endpoints** (`/auth/*`): 5 requests/minute
- **Fee operations** (`/fees/*`): 30 requests/minute  
- **Other endpoints:** 300 requests/minute

---

## 📋 Implementation Protocol (Activity-by-Activity)

### Mandatory Implementation Steps

For each of the 66 activities (follow dependency order):

1. **Read Activity Specification** (from tables below)
2. **Create Zod DTOs** in `src/modules/{module}/dtos.ts`
   - Request: `{ActivityId}Request` (e.g., `Data00001Request`)
   - Response: `{ActivityId}Response` 
   - Use `.strict()` to reject unknown properties
3. **Implement Controller → Service → Repository** pattern
4. **Apply RBAC Middleware** (exact roles specified per activity)
5. **Implement Audit Logging** (Activity ID + context)
6. **Add Contract Test** to `tests/contract/cases.json`
7. **Validate Against Standards** (run tests + linting)
8. **Commit** with format: `feat({ActivityID}): description`

### Controller Template (Mandatory Pattern)

```typescript
export async function handle_{activityId}(req: Request, res: Response) {
  try {
    // 1) RBAC enforced by middleware
    // 2) Validate input
    const input = {ActivityId}Request.parse(req.body ?? {});
    
    // 3) Business logic
    const result = await svc.{activityId}Service(input);
    
    // 4) Audit logging
    await auditDataActivity(req, '{ACTIVITY-ID}', '{OPERATION}', result);
    
    // 5) Response
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input",
          details: error.issues
        }
      });
    }
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL",
        message: error?.message || "Internal error"
      }
    });
  }
}
```

---

## 🗃️ Database & Migration Standards

### Multi-Tenant Architecture
- **Master Database:** `school_erp_master`
  - Tables: `system_*`, `trusts`, `migration_versions`
- **Trust Databases:** `school_erp_trust_{trust_code}`
  - Tables: All business entities per trust

### Migration Requirements
- **Idempotent:** Can be run multiple times safely
- **Reversible:** Include down migration where possible
- **Indexed:** Add indexes for common query patterns
- **Parameterized Queries Only:** No string concatenation SQL

### Database Connection Pattern
```typescript
// Master DB operations
const masterConn = await dbManager.getMasterConnection();

// Trust DB operations  
const trustConn = await dbManager.getTrustConnection(trustId);
```

---

## 🧪 Testing & Quality Assurance

### Contract Testing Protocol
1. **Add test case** to `tests/contract/cases.json` for each activity:
```json
{
  "activityId": "DATA-00-001",
  "name": "Connection status check",
  "method": "GET",
  "path": "/system/connections/status", 
  "headers": {"Authorization": "Bearer ${TOKEN}"},
  "body": {},
  "expect": [200, 400],
  "validateAgainstOpenAPI": true
}
```

2. **Run contract tests:** `CONTRACT_TOKEN=<jwt> npm run test:contract`
3. **All tests must pass** before any commit

### Quality Gates (Mandatory)
- ✅ TypeScript compilation (strict mode)
- ✅ Contract tests pass
- ✅ RBAC properly implemented
- ✅ Audit logging functional
- ✅ Error handling follows standard format

---

## 📊 Complete Activity Specifications

### Phase 0: DATA Module (Foundation)

| Activity ID | Activity | Method | REST Endpoint | operationId | RBAC | DB Entities | Dependencies |
|-------------|----------|--------|---------------|-------------|------|-------------|--------------|
| DATA-00-001 | Connection Manager | GET | `/system/connections/status` | `data_data_00_001` | SYSTEM_ADMIN\|GROUP_ADMIN | system_config, trusts, system_users, migration_versions, sessions, system_audit_logs | none |
| DATA-00-002 | Master DB schema creation | POST | `/system/schemas/master` | `data_data_00_002` | SYSTEM_ADMIN\|GROUP_ADMIN | system_config, trusts, system_users, migration_versions, sessions, system_audit_logs | none |
| DATA-00-003 | Trust DB schema template | POST | `/system/schemas/trusts` | `data_data_00_003` | SYSTEM_ADMIN\|GROUP_ADMIN | schools, classes, sections, users, user_school_assignments, houses, academic_years, trust_config, audit_logs | DATA-00-002 |
| DATA-00-004 | System config storage | POST | `/system/config` | `data_data_00_004` | SYSTEM_ADMIN\|GROUP_ADMIN | system_config | DATA-00-002 |
| DATA-00-005 | Trust registry & subdomains | POST | `/system/trusts` | `data_data_00_005` | SYSTEM_ADMIN\|GROUP_ADMIN | trusts | DATA-00-002 |
| DATA-00-006 | System users | POST | `/system/users` | `data_data_00_006` | SYSTEM_ADMIN\|GROUP_ADMIN | system_users | DATA-00-002 |
| DATA-00-007 | Migration tracking | POST | `/system/migrations` | `data_data_00_007` | SYSTEM_ADMIN\|GROUP_ADMIN | migration_versions | DATA-00-002, DATA-00-005 |
| DATA-00-008 | Session store | POST | `/system/sessions` | `data_data_00_008` | SYSTEM_ADMIN\|GROUP_ADMIN | sessions | DATA-00-002 |
| DATA-00-009 | Global audit logging | POST | `/system/audit-logs/system` | `data_data_00_009` | SYSTEM_ADMIN\|GROUP_ADMIN | system_audit_logs | DATA-00-002 |
| DATA-00-010 | Tenant audit logging | POST | `/system/audit-logs/tenants` | `data_data_00_010` | SYSTEM_ADMIN\|GROUP_ADMIN | audit_logs | DATA-00-003 |
| DATA-00-011 | Config cache management | PUT | `/system/config/cache` | `data_data_00_011` | SYSTEM_ADMIN\|GROUP_ADMIN | trusts, system_config | DATA-00-004, DATA-00-005 |
| DATA-00-012 | Pool cleanup | POST | `/system/connections/cleanup` | `data_data_00_012` | SYSTEM_ADMIN\|GROUP_ADMIN | none | DATA-00-001 |

### DTO Naming Convention
- **Request DTO:** `Data00001Request`, `Data00002Request`, etc.
- **Response DTO:** `Data00001Response`, `Data00002Response`, etc.
- **Validation:** Use `.strict()` in all Zod schemas
- **Types:** IDs are integers, timestamps are ISO strings, enums are UPPER_CASE

---

## 🚀 Build & Deployment Protocol

### Development Commands
```bash
npm run build          # Compile TypeScript
npm run dev            # Development server  
npm run start          # Production server
npm run test:contract  # Contract tests
```

### Pre-Commit Checklist
- [ ] TypeScript compiles without errors
- [ ] All contract tests pass
- [ ] RBAC middleware applied
- [ ] Audit logging implemented
- [ ] Error handling follows standard format
- [ ] Database operations use parameterized queries

### Commit Message Format
```
feat(DATA-00-001): implement connection status endpoint

- Add GET /system/connections/status endpoint
- Implement RBAC for SYSTEM_ADMIN|GROUP_ADMIN
- Add audit logging for connection checks
- Add contract test case
```

---

## ⚖️ Decision Framework

When implementation questions arise:

**Q:** Field not specified in DTO?  
**A:** Omit it. Return 400 if request contains unknown properties.

**Q:** RBAC role unclear?  
**A:** Use the strictest role combination listed for that activity.

**Q:** Database table missing?  
**A:** STOP. Create migration first, do not proceed.

**Q:** Endpoint path conflicts?  
**A:** Follow this document's endpoint specifications exactly.

**Q:** HTTP method choice unclear?  
**A:** GET for retrieval, POST for creation, PUT for updates, DELETE for removal.

---

## 📝 Migration from Existing Docs

**This document replaces:**
- `docs/ai_coder_master_playbook.md` → Content merged here
- `docs/ai_coder_rest_grouped_66.md` → Content merged + REST-fixed here  
- `dependency_ordered_build_and_test_plan.md` → Content merged here
- `docs/COPILOT_INSTRUCTIONS.md` → Content merged here

**Actions Required:**
1. Update `api/openapi_rest_grouped_66.yaml` to match endpoints in this document
2. Update all existing route implementations to match this specification
3. Update contract tests to match corrected endpoints
4. Archive old documentation files

---

**This document is COMPLETE and AUTHORITATIVE. Follow it exactly.**