# School ERP — Agent Coding Guide for All 66 Activities
**Contract-style instructions for AI coders (Copilot/Claude). Keep activity IDs intact.**

## How to use this document
For each activity below:
- Scaffold **controller → service → repo** with the given `operationId` and endpoint path.
- Enforce the **RBAC** shown (or stricter).
- Validate request with **Zod DTO** named from the activity code (see `Request DTO` hint).
- Return `{ success: true, data }` on success; `{ success: false, error:{ code, message, details? } }` on error.
- Log an **audit event** using the activity code where applicable.

---

## ATTD — Module Instructions
**Default RBAC:** TEACHER|SCHOOL_ADMIN

| Activity ID | Activity | Method | Path | operationId | RBAC | DB Entities | Dependencies | Request DTO | Response DTO | Notes for AI Coder |
|---|---|---|---|---|---|---|---|---|---|---|
| ATTD-06-001 | Daily attendance & bulk import | POST | `/attd/attd-06-001` | `attd_attd_06_001` | TEACHER|SCHOOL_ADMIN | attendance_daily, attendance_summary | SETUP-01-004, STUD-* | `Attd06001Request` | `Attd06001Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| ATTD-06-002 | Leave/absence workflows | POST | `/attd/attd-06-002` | `attd_attd_06_002` | TEACHER|SCHOOL_ADMIN | attendance_daily, trust_config | ATTD-06-001 | `Attd06002Request` | `Attd06002Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| ATTD-06-003 | Attendance reporting/analytics | GET | `/attd/attd-06-003` | `attd_attd_06_003` | TEACHER|SCHOOL_ADMIN | attendance_summary | ATTD-06-001 | `Attd06003Request` | `Attd06003Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |

> **DTO convention**: Keep DTOs minimal & explicit. Use `created_at`, `updated_at` ISO strings; IDs as integers; enums as UPPER_CASE strings.

---

## AUTH — Module Instructions
**Default RBAC:** Public (login/reset) else TRUST_ADMIN|SCHOOL_ADMIN

| Activity ID | Activity | Method | Path | operationId | RBAC | DB Entities | Dependencies | Request DTO | Response DTO | Notes for AI Coder |
|---|---|---|---|---|---|---|---|---|---|---|
| AUTH-02-001 | Local authentication (web sessions) | POST | `/auth/auth-02-001` | `auth_auth_02_001` | Public (login/reset) else TRUST_ADMIN|SCHOOL_ADMIN | users, sessions, audit_logs | DATA-*, SETUP-01-007 | `Auth02001Request` | `Auth02001Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| AUTH-02-002 | JWT authentication (APIs) | POST | `/auth/auth-02-002` | `auth_auth_02_002` | Public (login/reset) else TRUST_ADMIN|SCHOOL_ADMIN | users, audit_logs | AUTH-02-001 | `Auth02002Request` | `Auth02002Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| AUTH-02-003 | Multi-factor (OTP) | POST | `/auth/auth-02-003` | `auth_auth_02_003` | Public (login/reset) else TRUST_ADMIN|SCHOOL_ADMIN | users, audit_logs, trust_config | AUTH-02-001 | `Auth02003Request` | `Auth02003Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| AUTH-02-004 | RBAC (roles & permissions) | POST | `/auth/auth-02-004` | `auth_auth_02_004` | Public (login/reset) else TRUST_ADMIN|SCHOOL_ADMIN | users, trust_config | SETUP-01-007 | `Auth02004Request` | `Auth02004Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| AUTH-02-005 | Permission mapping | POST | `/auth/auth-02-005` | `auth_auth_02_005` | Public (login/reset) else TRUST_ADMIN|SCHOOL_ADMIN | trust_config | AUTH-02-004 | `Auth02005Request` | `Auth02005Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| AUTH-02-006 | Account lockout | POST | `/auth/auth-02-006` | `auth_auth_02_006` | Public (login/reset) else TRUST_ADMIN|SCHOOL_ADMIN | users, audit_logs | AUTH-02-001 | `Auth02006Request` | `Auth02006Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| AUTH-02-007 | Email/phone verification | POST | `/auth/auth-02-007` | `auth_auth_02_007` | Public (login/reset) else TRUST_ADMIN|SCHOOL_ADMIN | users, audit_logs | AUTH-02-001 | `Auth02007Request` | `Auth02007Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| AUTH-02-008 | Password reset flows | POST | `/auth/auth-02-008` | `auth_auth_02_008` | Public (login/reset) else TRUST_ADMIN|SCHOOL_ADMIN | users, audit_logs, system_audit_logs | AUTH-02-001 | `Auth02008Request` | `Auth02008Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| AUTH-02-009 | Auth event logging | POST | `/auth/auth-02-009` | `auth_auth_02_009` | Public (login/reset) else TRUST_ADMIN|SCHOOL_ADMIN | audit_logs, system_audit_logs | AUTH-02-001 | `Auth02009Request` | `Auth02009Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| AUTH-02-010 | API keys/tokens | POST | `/auth/auth-02-010` | `auth_auth_02_010` | Public (login/reset) else TRUST_ADMIN|SCHOOL_ADMIN | trust_config, users | AUTH-02-002 | `Auth02010Request` | `Auth02010Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |

> **DTO convention**: Keep DTOs minimal & explicit. Use `created_at`, `updated_at` ISO strings; IDs as integers; enums as UPPER_CASE strings.

---

## COMM — Module Instructions
**Default RBAC:** TRUST_ADMIN|SCHOOL_ADMIN

| Activity ID | Activity | Method | Path | operationId | RBAC | DB Entities | Dependencies | Request DTO | Response DTO | Notes for AI Coder |
|---|---|---|---|---|---|---|---|---|---|---|
| COMM-09-001 | Notifications (SMS/Email/WhatsApp) | POST | `/comm/comm-09-001` | `comm_comm_09_001` | TRUST_ADMIN|SCHOOL_ADMIN | communication_templates, communication_messages | USER-*, STUD-*, FEES-* | `Comm09001Request` | `Comm09001Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| COMM-09-002 | In-app announcements | POST | `/comm/comm-09-002` | `comm_comm_09_002` | TRUST_ADMIN|SCHOOL_ADMIN | communication_templates, communication_campaigns | USER-* | `Comm09002Request` | `Comm09002Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| COMM-09-003 | Emergency alerts (broadcast) | POST | `/comm/comm-09-003` | `comm_comm_09_003` | TRUST_ADMIN|SCHOOL_ADMIN | communication_templates, communication_campaigns, communication_messages | USER-*, STUD-* | `Comm09003Request` | `Comm09003Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |

> **DTO convention**: Keep DTOs minimal & explicit. Use `created_at`, `updated_at` ISO strings; IDs as integers; enums as UPPER_CASE strings.

---

## DASH — Module Instructions
**Default RBAC:** Role-based (all)

| Activity ID | Activity | Method | Path | operationId | RBAC | DB Entities | Dependencies | Request DTO | Response DTO | Notes for AI Coder |
|---|---|---|---|---|---|---|---|---|---|---|
| DASH-08-001 | Trust admin dashboard | GET | `/dash/dash-08-001` | `dash_dash_08_001` | Role-based (all) | schools, users, fee_receipts, attendance_summary | DATA-*, SETUP-*, FEES-*, ATTD-* | `Dash08001Request` | `Dash08001Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| DASH-08-002 | School admin dashboard | GET | `/dash/dash-08-002` | `dash_dash_08_002` | Role-based (all) | users, students, fee_receipts, attendance_summary | SETUP-*, FEES-*, ATTD-* | `Dash08002Request` | `Dash08002Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| DASH-08-003 | Teacher dashboard | GET | `/dash/dash-08-003` | `dash_dash_08_003` | Role-based (all) | classes, sections, attendance_daily | SETUP-*, ATTD-* | `Dash08003Request` | `Dash08003Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |

> **DTO convention**: Keep DTOs minimal & explicit. Use `created_at`, `updated_at` ISO strings; IDs as integers; enums as UPPER_CASE strings.

---

## DATA — Module Instructions
**Default RBAC:** SYSTEM_ADMIN|GROUP_ADMIN

| Activity ID | Activity | Method | Path | operationId | RBAC | DB Entities | Dependencies | Request DTO | Response DTO | Notes for AI Coder |
|---|---|---|---|---|---|---|---|---|---|---|
| DATA-00-001 | Connection Manager | POST | `/data/data-00-001` | `data_data_00_001` | SYSTEM_ADMIN|GROUP_ADMIN | system_config, trusts, system_users, migration_versions, sessions, system_audit_logs, schools, classes, sections, users, user_school_assignments, houses, academic_years, trust_config, audit_logs | nan | `Data00001Request` | `Data00001Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| DATA-00-002 | Master DB schema creation | POST | `/data/data-00-002` | `data_data_00_002` | SYSTEM_ADMIN|GROUP_ADMIN | system_config, trusts, system_users, migration_versions, sessions, system_audit_logs | nan | `Data00002Request` | `Data00002Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| DATA-00-003 | Trust DB schema template | POST | `/data/data-00-003` | `data_data_00_003` | SYSTEM_ADMIN|GROUP_ADMIN | schools, classes, sections, users, user_school_assignments, houses, academic_years, trust_config, audit_logs | DATA-00-002 | `Data00003Request` | `Data00003Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| DATA-00-004 | System config storage | POST | `/data/data-00-004` | `data_data_00_004` | SYSTEM_ADMIN|GROUP_ADMIN | system_config | DATA-00-002 | `Data00004Request` | `Data00004Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| DATA-00-005 | Trust registry & subdomains | POST | `/data/data-00-005` | `data_data_00_005` | SYSTEM_ADMIN|GROUP_ADMIN | trusts | DATA-00-002 | `Data00005Request` | `Data00005Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| DATA-00-006 | System users (sys/group admin) | POST | `/data/data-00-006` | `data_data_00_006` | SYSTEM_ADMIN|GROUP_ADMIN | system_users | DATA-00-002 | `Data00006Request` | `Data00006Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| DATA-00-007 | Migration tracking | POST | `/data/data-00-007` | `data_data_00_007` | SYSTEM_ADMIN|GROUP_ADMIN | migration_versions | DATA-00-002, DATA-00-005 | `Data00007Request` | `Data00007Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| DATA-00-008 | Session store | POST | `/data/data-00-008` | `data_data_00_008` | SYSTEM_ADMIN|GROUP_ADMIN | sessions | DATA-00-002 | `Data00008Request` | `Data00008Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| DATA-00-009 | Global audit logging | POST | `/data/data-00-009` | `data_data_00_009` | SYSTEM_ADMIN|GROUP_ADMIN | system_audit_logs | DATA-00-002 | `Data00009Request` | `Data00009Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| DATA-00-010 | Tenant audit logging | POST | `/data/data-00-010` | `data_data_00_010` | SYSTEM_ADMIN|GROUP_ADMIN | audit_logs | DATA-00-003 | `Data00010Request` | `Data00010Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| DATA-00-011 | Subdomain/config cache | POST | `/data/data-00-011` | `data_data_00_011` | SYSTEM_ADMIN|GROUP_ADMIN | trusts, system_config | DATA-00-004, DATA-00-005 | `Data00011Request` | `Data00011Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| DATA-00-012 | Pool cleanup & housekeeping | POST | `/data/data-00-012` | `data_data_00_012` | SYSTEM_ADMIN|GROUP_ADMIN | nan | DATA-00-001 | `Data00012Request` | `Data00012Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |

> **DTO convention**: Keep DTOs minimal & explicit. Use `created_at`, `updated_at` ISO strings; IDs as integers; enums as UPPER_CASE strings.

---

## FEES — Module Instructions
**Default RBAC:** ACCOUNTANT|SCHOOL_ADMIN

| Activity ID | Activity | Method | Path | operationId | RBAC | DB Entities | Dependencies | Request DTO | Response DTO | Notes for AI Coder |
|---|---|---|---|---|---|---|---|---|---|---|
| FEES-05-001 | Fee heads & structures | POST | `/fees/fees-05-001` | `fees_fees_05_001` | ACCOUNTANT|SCHOOL_ADMIN | fee_heads, fee_structures, fee_installments | SETUP-* | `Fees05001Request` | `Fees05001Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| FEES-05-002 | Class & student fee mapping | POST | `/fees/fees-05-002` | `fees_fees_05_002` | ACCOUNTANT|SCHOOL_ADMIN | student_fee_assignments, fee_structures | FEES-05-001, STUD-04-001 | `Fees05002Request` | `Fees05002Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| FEES-05-003 | Discount allocation | POST | `/fees/fees-05-003` | `fees_fees_05_003` | ACCOUNTANT|SCHOOL_ADMIN | student_fee_assignments, trust_config | FEES-05-002 | `Fees05003Request` | `Fees05003Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| FEES-05-004 | Transport/optional services | POST | `/fees/fees-05-004` | `fees_fees_05_004` | ACCOUNTANT|SCHOOL_ADMIN | trust_config, student_fee_assignments | FEES-05-002 | `Fees05004Request` | `Fees05004Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| FEES-05-005 | Late fee rules (config/override) | POST | `/fees/fees-05-005` | `fees_fees_05_005` | ACCOUNTANT|SCHOOL_ADMIN | trust_config, student_fee_assignments | SETUP-01-006, FEES-05-002 | `Fees05005Request` | `Fees05005Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| FEES-05-006 | Fee collection & receipts | POST | `/fees/fees-05-006` | `fees_fees_05_006` | ACCOUNTANT|SCHOOL_ADMIN | fee_receipts, student_fee_assignments | FEES-05-002 | `Fees05006Request` | `Fees05006Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| FEES-05-007 | Payment gateway integration | POST | `/fees/fees-05-007` | `fees_fees_05_007` | ACCOUNTANT|SCHOOL_ADMIN | payment_gateway_logs, fee_receipts | FEES-05-006 | `Fees05007Request` | `Fees05007Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| FEES-05-008 | Refunds & adjustments | POST | `/fees/fees-05-008` | `fees_fees_05_008` | ACCOUNTANT|SCHOOL_ADMIN | fee_receipts | FEES-05-006 | `Fees05008Request` | `Fees05008Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| FEES-05-009 | Reports, reconciliation & defaulters | GET | `/fees/fees-05-009` | `fees_fees_05_009` | ACCOUNTANT|SCHOOL_ADMIN | fee_receipts, student_fee_assignments | FEES-05-006 | `Fees05009Request` | `Fees05009Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |

> **DTO convention**: Keep DTOs minimal & explicit. Use `created_at`, `updated_at` ISO strings; IDs as integers; enums as UPPER_CASE strings.

---

## REPT — Module Instructions
**Default RBAC:** TRUST_ADMIN|SCHOOL_ADMIN

| Activity ID | Activity | Method | Path | operationId | RBAC | DB Entities | Dependencies | Request DTO | Response DTO | Notes for AI Coder |
|---|---|---|---|---|---|---|---|---|---|---|
| REPT-07-001 | Student profile reports | GET | `/rept/rept-07-001` | `rept_rept_07_001` | TRUST_ADMIN|SCHOOL_ADMIN | students, admissions | STUD-* | `Rept07001Request` | `Rept07001Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| REPT-07-002 | Fee collection reports | GET | `/rept/rept-07-002` | `rept_rept_07_002` | TRUST_ADMIN|SCHOOL_ADMIN | fee_receipts, student_fee_assignments | FEES-* | `Rept07002Request` | `Rept07002Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| REPT-07-003 | Attendance summary reports | GET | `/rept/rept-07-003` | `rept_rept_07_003` | TRUST_ADMIN|SCHOOL_ADMIN | attendance_summary, students | ATTD-* | `Rept07003Request` | `Rept07003Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| REPT-07-004 | Academic performance reports | GET | `/rept/rept-07-004` | `rept_rept_07_004` | TRUST_ADMIN|SCHOOL_ADMIN | classes, sections, trust_config | SETUP-* | `Rept07004Request` | `Rept07004Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| REPT-07-005 | Custom report builder | GET | `/rept/rept-07-005` | `rept_rept_07_005` | TRUST_ADMIN|SCHOOL_ADMIN | reports, report_templates | DATA-*, SETUP-* | `Rept07005Request` | `Rept07005Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| REPT-07-006 | Export to PDF/Excel | GET | `/rept/rept-07-006` | `rept_rept_07_006` | TRUST_ADMIN|SCHOOL_ADMIN | reports | REPT-07-001, REPT-07-002, REPT-07-003 | `Rept07006Request` | `Rept07006Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |

> **DTO convention**: Keep DTOs minimal & explicit. Use `created_at`, `updated_at` ISO strings; IDs as integers; enums as UPPER_CASE strings.

---

## SETUP — Module Instructions
**Default RBAC:** TRUST_ADMIN

| Activity ID | Activity | Method | Path | operationId | RBAC | DB Entities | Dependencies | Request DTO | Response DTO | Notes for AI Coder |
|---|---|---|---|---|---|---|---|---|---|---|
| SETUP-01-001 | Wizard: Trust creation | POST | `/setup/setup-01-001` | `setup_setup_01_001` | TRUST_ADMIN | trusts, system_config | DATA-* | `Setup01001Request` | `Setup01001Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| SETUP-01-002 | Wizard: School creation | POST | `/setup/setup-01-002` | `setup_setup_01_002` | TRUST_ADMIN | schools | DATA-*, SETUP-01-001 | `Setup01002Request` | `Setup01002Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| SETUP-01-003 | Wizard: Academic year creation | POST | `/setup/setup-01-003` | `setup_setup_01_003` | TRUST_ADMIN | academic_years | SETUP-01-002 | `Setup01003Request` | `Setup01003Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| SETUP-01-004 | Class & section setup (+ House) | POST | `/setup/setup-01-004` | `setup_setup_01_004` | TRUST_ADMIN | classes, sections, houses | SETUP-01-003 | `Setup01004Request` | `Setup01004Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| SETUP-01-005 | Subject & grading configuration | POST | `/setup/setup-01-005` | `setup_setup_01_005` | TRUST_ADMIN | classes, trust_config | SETUP-01-004 | `Setup01005Request` | `Setup01005Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| SETUP-01-006 | Trust/school-level config | POST | `/setup/setup-01-006` | `setup_setup_01_006` | TRUST_ADMIN | trust_config | SETUP-01-002 | `Setup01006Request` | `Setup01006Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| SETUP-01-007 | Role seeding (admins) | POST | `/setup/setup-01-007` | `setup_setup_01_007` | TRUST_ADMIN | users, trust_config | SETUP-01-002 | `Setup01007Request` | `Setup01007Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |

> **DTO convention**: Keep DTOs minimal & explicit. Use `created_at`, `updated_at` ISO strings; IDs as integers; enums as UPPER_CASE strings.

---

## STUD — Module Instructions
**Default RBAC:** SCHOOL_ADMIN

| Activity ID | Activity | Method | Path | operationId | RBAC | DB Entities | Dependencies | Request DTO | Response DTO | Notes for AI Coder |
|---|---|---|---|---|---|---|---|---|---|---|
| STUD-04-001 | Student admission | POST | `/stud/stud-04-001` | `stud_stud_04_001` | SCHOOL_ADMIN | students, admissions, documents | SETUP-*, AUTH-* | `Stud04001Request` | `Stud04001Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| STUD-04-002 | Admission approval workflow | POST | `/stud/stud-04-002` | `stud_stud_04_002` | SCHOOL_ADMIN | admissions, audit_logs | STUD-04-001 | `Stud04002Request` | `Stud04002Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| STUD-04-003 | Readmission/promotion | POST | `/stud/stud-04-003` | `stud_stud_04_003` | SCHOOL_ADMIN | students, academic_years, sections | SETUP-01-003, SETUP-01-004 | `Stud04003Request` | `Stud04003Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| STUD-04-004 | Inter-school transfer (in-trust) | POST | `/stud/stud-04-004` | `stud_stud_04_004` | SCHOOL_ADMIN | student_transfers, schools, students | STUD-04-001, SETUP-01-002 | `Stud04004Request` | `Stud04004Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| STUD-04-005 | Student ID & roll allocation | POST | `/stud/stud-04-005` | `stud_stud_04_005` | SCHOOL_ADMIN | students, sections | STUD-04-001, SETUP-01-004 | `Stud04005Request` | `Stud04005Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| STUD-04-006 | Siblings & category allocation | POST | `/stud/stud-04-006` | `stud_stud_04_006` | SCHOOL_ADMIN | students, student_parents, trust_config | STUD-04-001 | `Stud04006Request` | `Stud04006Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| STUD-04-007 | Student documents & certificates | POST | `/stud/stud-04-007` | `stud_stud_04_007` | SCHOOL_ADMIN | documents, students | STUD-04-001 | `Stud04007Request` | `Stud04007Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |

> **DTO convention**: Keep DTOs minimal & explicit. Use `created_at`, `updated_at` ISO strings; IDs as integers; enums as UPPER_CASE strings.

---

## USER — Module Instructions
**Default RBAC:** TRUST_ADMIN|SCHOOL_ADMIN

| Activity ID | Activity | Method | Path | operationId | RBAC | DB Entities | Dependencies | Request DTO | Response DTO | Notes for AI Coder |
|---|---|---|---|---|---|---|---|---|---|---|
| USER-03-001 | User creation & management | POST | `/user/user-03-001` | `user_user_03_001` | TRUST_ADMIN|SCHOOL_ADMIN | users, schools | SETUP-01-002, AUTH-* | `User03001Request` | `User03001Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| USER-03-002 | User-school assignments | POST | `/user/user-03-002` | `user_user_03_002` | TRUST_ADMIN|SCHOOL_ADMIN | user_school_assignments, users, schools | USER-03-001 | `User03002Request` | `User03002Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| USER-03-003 | Role & permission assignment | POST | `/user/user-03-003` | `user_user_03_003` | TRUST_ADMIN|SCHOOL_ADMIN | users, trust_config | AUTH-02-004 | `User03003Request` | `User03003Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| USER-03-004 | Teacher subject/class allocation | POST | `/user/user-03-004` | `user_user_03_004` | TRUST_ADMIN|SCHOOL_ADMIN | users, classes, sections, trust_config | SETUP-01-004, USER-03-001 | `User03004Request` | `User03004Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| USER-03-005 | Staff profile management | POST | `/user/user-03-005` | `user_user_03_005` | TRUST_ADMIN|SCHOOL_ADMIN | users | USER-03-001 | `User03005Request` | `User03005Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |
| USER-03-006 | Parent-student linking | POST | `/user/user-03-006` | `user_user_03_006` | TRUST_ADMIN|SCHOOL_ADMIN | users, student_parents, students | STUD-04-001 | `User03006Request` | `User03006Response` | Follow OpenAPI error model; apply pagination if listing; ensure parameterized queries; emit audit. |

> **DTO convention**: Keep DTOs minimal & explicit. Use `created_at`, `updated_at` ISO strings; IDs as integers; enums as UPPER_CASE strings.

---

## Global Conventions (apply to all 66 endpoints)
- **Base path**: `/api/v1` (prepend it when wiring routes).
- **Headers**: `Authorization: Bearer <token>` for protected APIs; sessions for web routes.
- **Validation**: Zod → on `ZodError`, return `400` with `details` array.
- **Pagination**: `?page=&limit=` default `1/50`, hard cap `limit=100`.
- **Errors**: Always use error model `{ code, message, details?, traceId? }`. Example codes: `AUTH_INVALID_CREDENTIALS`, `FEES_OVERPAYMENT`, `FORBIDDEN`.
- **RBAC**: use `requireRole/requirePermission` middleware; log `PERMISSION_DENIED` audits on failures.
- **Security**: enforce account lockout windows, rate limits (auth/payment/reports), and field-level PII masking in logs.
- **Audit**: At minimum record `activityId`, `userId`, `trustId`, `entityType`, `entityId?`, `ip`, `ua`, `created_at`.

## Testing & Acceptance
- **Definition of Done** per activity: unit tests (critical logic), integration tests (DB + routes), RBAC denial tests, pagination/validation edge cases, and audit assertions.
- **Fixtures**: mock adapters for payments and messaging; sample CSV/JSON for bulk flows.
- **Performance**: list endpoints < 500ms p50; heavy reports can stream or 202-async with polling.

## Example Controller Skeleton (pattern)
```ts
export async function handler(req, res) {
  try {
    // validate input with Zod
    // enforce RBAC
    // call service and return
    return res.json({ success: true, data });
  } catch (e:any) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL', message: e?.message || 'Internal error' } });
  }
}
```