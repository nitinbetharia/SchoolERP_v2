# School ERP — REST-Grouped Endpoint Guide (All 66 Activities)
**Activity IDs preserved. Use these endpoints as resources while keeping `operationId` and `x-activity-id` for tracking.**

### Conventions
- Base path: `/api/v1`
- Response envelope: `{ success:boolean, data?:any, error?:{ code, message, details? } }`
- Validation: **Zod**, return `400` on validation failure with `details` array
- RBAC: enforce per-row mapping; log `PERMISSION_DENIED` audits on failures
- Audit: include `activityId`, `userId`, `trustId`, `entityType`, `entityId?`, `ip`, `ua`, `created_at`

## ATTD

| Activity ID | Activity | Method | REST Path | operationId | RBAC | DB Entities | Dependencies | Request DTO | Response DTO |
|---|---|---|---|---|---|---|---|---|---|
| ATTD-06-001 | Daily attendance & bulk import | POST | `/attendance/bulk` | `attd_attd_06_001` | TEACHER|SCHOOL_ADMIN | attendance_daily, attendance_summary | SETUP-01-004, STUD-* | `Attd06001Request` | `Attd06001Response` |
| ATTD-06-002 | Leave/absence workflows | POST | `/attendance/leaves` | `attd_attd_06_002` | TEACHER|SCHOOL_ADMIN | attendance_daily, trust_config | ATTD-06-001 | `Attd06002Request` | `Attd06002Response` |
| ATTD-06-003 | Attendance reporting/analytics | GET | `/attendance/reports` | `attd_attd_06_003` | TEACHER|SCHOOL_ADMIN|TRUST_ADMIN | attendance_summary | ATTD-06-001 | `Attd06003Request` | `Attd06003Response` |

---

## AUTH

| Activity ID | Activity | Method | REST Path | operationId | RBAC | DB Entities | Dependencies | Request DTO | Response DTO |
|---|---|---|---|---|---|---|---|---|---|
| AUTH-02-001 | Local authentication (web sessions) | POST | `/auth` | `auth_auth_02_001` | TRUST_ADMIN|SCHOOL_ADMIN | users, sessions, audit_logs | DATA-*, SETUP-01-007 | `Auth02001Request` | `Auth02001Response` |
| AUTH-02-002 | JWT authentication (APIs) | POST | `/auth` | `auth_auth_02_002` | TRUST_ADMIN|SCHOOL_ADMIN | users, audit_logs | AUTH-02-001 | `Auth02002Request` | `Auth02002Response` |
| AUTH-02-003 | Multi-factor (OTP) | POST | `/auth/mfa` | `auth_auth_02_003` | Public (rate-limited) | users, audit_logs, trust_config | AUTH-02-001 | `Auth02003Request` | `Auth02003Response` |
| AUTH-02-004 | RBAC (roles & permissions) | POST | `/auth` | `auth_auth_02_004` | TRUST_ADMIN|SCHOOL_ADMIN | users, trust_config | SETUP-01-007 | `Auth02004Request` | `Auth02004Response` |
| AUTH-02-005 | Permission mapping | POST | `/auth` | `auth_auth_02_005` | TRUST_ADMIN|SCHOOL_ADMIN | trust_config | AUTH-02-004 | `Auth02005Request` | `Auth02005Response` |
| AUTH-02-006 | Account lockout | POST | `/auth` | `auth_auth_02_006` | TRUST_ADMIN|SCHOOL_ADMIN | users, audit_logs | AUTH-02-001 | `Auth02006Request` | `Auth02006Response` |
| AUTH-02-007 | Email/phone verification | POST | `/auth` | `auth_auth_02_007` | TRUST_ADMIN|SCHOOL_ADMIN | users, audit_logs | AUTH-02-001 | `Auth02007Request` | `Auth02007Response` |
| AUTH-02-008 | Password reset flows | POST | `/auth/password` | `auth_auth_02_008` | Public (rate-limited) | users, audit_logs, system_audit_logs | AUTH-02-001 | `Auth02008Request` | `Auth02008Response` |
| AUTH-02-009 | Auth event logging | POST | `/auth` | `auth_auth_02_009` | TRUST_ADMIN|SCHOOL_ADMIN | audit_logs, system_audit_logs | AUTH-02-001 | `Auth02009Request` | `Auth02009Response` |
| AUTH-02-010 | API keys/tokens | POST | `/auth` | `auth_auth_02_010` | TRUST_ADMIN|SCHOOL_ADMIN | trust_config, users | AUTH-02-002 | `Auth02010Request` | `Auth02010Response` |

---

## COMM

| Activity ID | Activity | Method | REST Path | operationId | RBAC | DB Entities | Dependencies | Request DTO | Response DTO |
|---|---|---|---|---|---|---|---|---|---|
| COMM-09-001 | Notifications (SMS/Email/WhatsApp) | POST | `/communications` | `comm_comm_09_001` | TRUST_ADMIN|SCHOOL_ADMIN | communication_templates, communication_messages | USER-*, STUD-*, FEES-* | `Comm09001Request` | `Comm09001Response` |
| COMM-09-002 | In-app announcements | POST | `/communications/announcements` | `comm_comm_09_002` | TRUST_ADMIN|SCHOOL_ADMIN | communication_templates, communication_campaigns | USER-* | `Comm09002Request` | `Comm09002Response` |
| COMM-09-003 | Emergency alerts (broadcast) | POST | `/communications/alerts` | `comm_comm_09_003` | TRUST_ADMIN|SCHOOL_ADMIN | communication_templates, communication_campaigns, communication_messages | USER-*, STUD-* | `Comm09003Request` | `Comm09003Response` |

---

## DASH

| Activity ID | Activity | Method | REST Path | operationId | RBAC | DB Entities | Dependencies | Request DTO | Response DTO |
|---|---|---|---|---|---|---|---|---|---|
| DASH-08-001 | Trust admin dashboard | GET | `/dashboards` | `dash_dash_08_001` | Role-based (auto) | schools, users, fee_receipts, attendance_summary | DATA-*, SETUP-*, FEES-*, ATTD-* | `Dash08001Request` | `Dash08001Response` |
| DASH-08-002 | School admin dashboard | GET | `/dashboards` | `dash_dash_08_002` | Role-based (auto) | users, students, fee_receipts, attendance_summary | SETUP-*, FEES-*, ATTD-* | `Dash08002Request` | `Dash08002Response` |
| DASH-08-003 | Teacher dashboard | GET | `/dashboards` | `dash_dash_08_003` | Role-based (auto) | classes, sections, attendance_daily | SETUP-*, ATTD-* | `Dash08003Request` | `Dash08003Response` |

---

## DATA

| Activity ID | Activity | Method | REST Path | operationId | RBAC | DB Entities | Dependencies | Request DTO | Response DTO |
|---|---|---|---|---|---|---|---|---|---|
| DATA-00-001 | Connection Manager | POST | `/system/connections` | `data_data_00_001` | SYSTEM_ADMIN|GROUP_ADMIN | system_config, trusts, system_users, migration_versions, sessions, system_audit_logs, schools, classes, sections, users, user_school_assignments, houses, academic_years, trust_config, audit_logs | nan | `Data00001Request` | `Data00001Response` |
| DATA-00-002 | Master DB schema creation | POST | `/system` | `data_data_00_002` | SYSTEM_ADMIN|GROUP_ADMIN | system_config, trusts, system_users, migration_versions, sessions, system_audit_logs | nan | `Data00002Request` | `Data00002Response` |
| DATA-00-003 | Trust DB schema template | POST | `/system` | `data_data_00_003` | SYSTEM_ADMIN|GROUP_ADMIN | schools, classes, sections, users, user_school_assignments, houses, academic_years, trust_config, audit_logs | DATA-00-002 | `Data00003Request` | `Data00003Response` |
| DATA-00-004 | System config storage | POST | `/system/config` | `data_data_00_004` | SYSTEM_ADMIN|GROUP_ADMIN | system_config | DATA-00-002 | `Data00004Request` | `Data00004Response` |
| DATA-00-005 | Trust registry & subdomains | POST | `/system` | `data_data_00_005` | SYSTEM_ADMIN|GROUP_ADMIN | trusts | DATA-00-002 | `Data00005Request` | `Data00005Response` |
| DATA-00-006 | System users (sys/group admin) | POST | `/system` | `data_data_00_006` | SYSTEM_ADMIN|GROUP_ADMIN | system_users | DATA-00-002 | `Data00006Request` | `Data00006Response` |
| DATA-00-007 | Migration tracking | POST | `/system/migrations` | `data_data_00_007` | SYSTEM_ADMIN|GROUP_ADMIN | migration_versions | DATA-00-002, DATA-00-005 | `Data00007Request` | `Data00007Response` |
| DATA-00-008 | Session store | POST | `/system/sessions` | `data_data_00_008` | SYSTEM_ADMIN|GROUP_ADMIN | sessions | DATA-00-002 | `Data00008Request` | `Data00008Response` |
| DATA-00-009 | Global audit logging | POST | `/system/audit-logs` | `data_data_00_009` | SYSTEM_ADMIN|GROUP_ADMIN | system_audit_logs | DATA-00-002 | `Data00009Request` | `Data00009Response` |
| DATA-00-010 | Tenant audit logging | POST | `/system/audit-logs` | `data_data_00_010` | SYSTEM_ADMIN|GROUP_ADMIN | audit_logs | DATA-00-003 | `Data00010Request` | `Data00010Response` |
| DATA-00-011 | Subdomain/config cache | POST | `/system/config` | `data_data_00_011` | SYSTEM_ADMIN|GROUP_ADMIN | trusts, system_config | DATA-00-004, DATA-00-005 | `Data00011Request` | `Data00011Response` |
| DATA-00-012 | Pool cleanup & housekeeping | POST | `/system/connections` | `data_data_00_012` | SYSTEM_ADMIN|GROUP_ADMIN | nan | DATA-00-001 | `Data00012Request` | `Data00012Response` |

---

## FEES

| Activity ID | Activity | Method | REST Path | operationId | RBAC | DB Entities | Dependencies | Request DTO | Response DTO |
|---|---|---|---|---|---|---|---|---|---|
| FEES-05-001 | Fee heads & structures | POST | `/fees/structures` | `fees_fees_05_001` | SCHOOL_ADMIN|TRUST_ADMIN | fee_heads, fee_structures, fee_installments | SETUP-* | `Fees05001Request` | `Fees05001Response` |
| FEES-05-002 | Class & student fee mapping | POST | `/fees` | `fees_fees_05_002` | SCHOOL_ADMIN|TRUST_ADMIN | student_fee_assignments, fee_structures | FEES-05-001, STUD-04-001 | `Fees05002Request` | `Fees05002Response` |
| FEES-05-003 | Discount allocation | POST | `/fees/discounts` | `fees_fees_05_003` | ACCOUNTANT|SCHOOL_ADMIN|TRUST_ADMIN | student_fee_assignments, trust_config | FEES-05-002 | `Fees05003Request` | `Fees05003Response` |
| FEES-05-004 | Transport/optional services | POST | `/fees` | `fees_fees_05_004` | SCHOOL_ADMIN|TRUST_ADMIN | trust_config, student_fee_assignments | FEES-05-002 | `Fees05004Request` | `Fees05004Response` |
| FEES-05-005 | Late fee rules (config/override) | POST | `/fees` | `fees_fees_05_005` | SCHOOL_ADMIN|TRUST_ADMIN | trust_config, student_fee_assignments | SETUP-01-006, FEES-05-002 | `Fees05005Request` | `Fees05005Response` |
| FEES-05-006 | Fee collection & receipts | POST | `/fees/receipts` | `fees_fees_05_006` | ACCOUNTANT|SCHOOL_ADMIN | fee_receipts, student_fee_assignments | FEES-05-002 | `Fees05006Request` | `Fees05006Response` |
| FEES-05-007 | Payment gateway integration | POST | `/fees` | `fees_fees_05_007` | SCHOOL_ADMIN|TRUST_ADMIN | payment_gateway_logs, fee_receipts | FEES-05-006 | `Fees05007Request` | `Fees05007Response` |
| FEES-05-008 | Refunds & adjustments | POST | `/fees/refunds` | `fees_fees_05_008` | ACCOUNTANT|SCHOOL_ADMIN | fee_receipts | FEES-05-006 | `Fees05008Request` | `Fees05008Response` |
| FEES-05-009 | Reports, reconciliation & defaulters | GET | `/fees/reports` | `fees_fees_05_009` | ACCOUNTANT|SCHOOL_ADMIN | fee_receipts, student_fee_assignments | FEES-05-006 | `Fees05009Request` | `Fees05009Response` |

---

## REPT

| Activity ID | Activity | Method | REST Path | operationId | RBAC | DB Entities | Dependencies | Request DTO | Response DTO |
|---|---|---|---|---|---|---|---|---|---|
| REPT-07-001 | Student profile reports | GET | `/reports` | `rept_rept_07_001` | TRUST_ADMIN|SCHOOL_ADMIN | students, admissions | STUD-* | `Rept07001Request` | `Rept07001Response` |
| REPT-07-002 | Fee collection reports | GET | `/reports` | `rept_rept_07_002` | TRUST_ADMIN|SCHOOL_ADMIN | fee_receipts, student_fee_assignments | FEES-* | `Rept07002Request` | `Rept07002Response` |
| REPT-07-003 | Attendance summary reports | GET | `/reports` | `rept_rept_07_003` | TRUST_ADMIN|SCHOOL_ADMIN | attendance_summary, students | ATTD-* | `Rept07003Request` | `Rept07003Response` |
| REPT-07-004 | Academic performance reports | GET | `/reports` | `rept_rept_07_004` | TRUST_ADMIN|SCHOOL_ADMIN | classes, sections, trust_config | SETUP-* | `Rept07004Request` | `Rept07004Response` |
| REPT-07-005 | Custom report builder | GET | `/reports` | `rept_rept_07_005` | TRUST_ADMIN|SCHOOL_ADMIN | reports, report_templates | DATA-*, SETUP-* | `Rept07005Request` | `Rept07005Response` |
| REPT-07-006 | Export to PDF/Excel | GET | `/reports` | `rept_rept_07_006` | TRUST_ADMIN|SCHOOL_ADMIN | reports | REPT-07-001, REPT-07-002, REPT-07-003 | `Rept07006Request` | `Rept07006Response` |

---

## SETUP

| Activity ID | Activity | Method | REST Path | operationId | RBAC | DB Entities | Dependencies | Request DTO | Response DTO |
|---|---|---|---|---|---|---|---|---|---|
| SETUP-01-001 | Wizard: Trust creation | POST | `/setup/trusts` | `setup_setup_01_001` | TRUST_ADMIN | trusts, system_config | DATA-* | `Setup01001Request` | `Setup01001Response` |
| SETUP-01-002 | Wizard: School creation | POST | `/setup/schools` | `setup_setup_01_002` | TRUST_ADMIN | schools | DATA-*, SETUP-01-001 | `Setup01002Request` | `Setup01002Response` |
| SETUP-01-003 | Wizard: Academic year creation | POST | `/setup/academic-years` | `setup_setup_01_003` | TRUST_ADMIN | academic_years | SETUP-01-002 | `Setup01003Request` | `Setup01003Response` |
| SETUP-01-004 | Class & section setup (+ House) | POST | `/setup/classes` | `setup_setup_01_004` | TRUST_ADMIN | classes, sections, houses | SETUP-01-003 | `Setup01004Request` | `Setup01004Response` |
| SETUP-01-005 | Subject & grading configuration | POST | `/setup/academics` | `setup_setup_01_005` | TRUST_ADMIN | classes, trust_config | SETUP-01-004 | `Setup01005Request` | `Setup01005Response` |
| SETUP-01-006 | Trust/school-level config | POST | `/setup/trusts` | `setup_setup_01_006` | TRUST_ADMIN | trust_config | SETUP-01-002 | `Setup01006Request` | `Setup01006Response` |
| SETUP-01-007 | Role seeding (admins) | POST | `/setup/roles` | `setup_setup_01_007` | TRUST_ADMIN | users, trust_config | SETUP-01-002 | `Setup01007Request` | `Setup01007Response` |

---

## STUD

| Activity ID | Activity | Method | REST Path | operationId | RBAC | DB Entities | Dependencies | Request DTO | Response DTO |
|---|---|---|---|---|---|---|---|---|---|
| STUD-04-001 | Student admission | POST | `/students/admissions` | `stud_stud_04_001` | SCHOOL_ADMIN | students, admissions, documents | SETUP-*, AUTH-* | `Stud04001Request` | `Stud04001Response` |
| STUD-04-002 | Admission approval workflow | POST | `/students/admissions` | `stud_stud_04_002` | SCHOOL_ADMIN | admissions, audit_logs | STUD-04-001 | `Stud04002Request` | `Stud04002Response` |
| STUD-04-003 | Readmission/promotion | POST | `/students/admissions` | `stud_stud_04_003` | SCHOOL_ADMIN | students, academic_years, sections | SETUP-01-003, SETUP-01-004 | `Stud04003Request` | `Stud04003Response` |
| STUD-04-004 | Inter-school transfer (in-trust) | POST | `/students/transfers` | `stud_stud_04_004` | SCHOOL_ADMIN | student_transfers, schools, students | STUD-04-001, SETUP-01-002 | `Stud04004Request` | `Stud04004Response` |
| STUD-04-005 | Student ID & roll allocation | POST | `/students` | `stud_stud_04_005` | SCHOOL_ADMIN | students, sections | STUD-04-001, SETUP-01-004 | `Stud04005Request` | `Stud04005Response` |
| STUD-04-006 | Siblings & category allocation | POST | `/students` | `stud_stud_04_006` | SCHOOL_ADMIN | students, student_parents, trust_config | STUD-04-001 | `Stud04006Request` | `Stud04006Response` |
| STUD-04-007 | Student documents & certificates | POST | `/students/documents` | `stud_stud_04_007` | SCHOOL_ADMIN|TEACHER (read), SCHOOL_ADMIN (create) | documents, students | STUD-04-001 | `Stud04007Request` | `Stud04007Response` |

---

## USER

| Activity ID | Activity | Method | REST Path | operationId | RBAC | DB Entities | Dependencies | Request DTO | Response DTO |
|---|---|---|---|---|---|---|---|---|---|
| USER-03-001 | User creation & management | POST | `/users` | `user_user_03_001` | TRUST_ADMIN|SCHOOL_ADMIN | users, schools | SETUP-01-002, AUTH-* | `User03001Request` | `User03001Response` |
| USER-03-002 | User-school assignments | POST | `/users` | `user_user_03_002` | TRUST_ADMIN|SCHOOL_ADMIN | user_school_assignments, users, schools | USER-03-001 | `User03002Request` | `User03002Response` |
| USER-03-003 | Role & permission assignment | POST | `/users/roles` | `user_user_03_003` | TRUST_ADMIN | users, trust_config | AUTH-02-004 | `User03003Request` | `User03003Response` |
| USER-03-004 | Teacher subject/class allocation | POST | `/users/teachers/assignments` | `user_user_03_004` | TRUST_ADMIN|SCHOOL_ADMIN | users, classes, sections, trust_config | SETUP-01-004, USER-03-001 | `User03004Request` | `User03004Response` |
| USER-03-005 | Staff profile management | POST | `/users` | `user_user_03_005` | TRUST_ADMIN|SCHOOL_ADMIN | users | USER-03-001 | `User03005Request` | `User03005Response` |
| USER-03-006 | Parent-student linking | POST | `/users/parents/links` | `user_user_03_006` | TRUST_ADMIN|SCHOOL_ADMIN | users, student_parents, students | STUD-04-001 | `User03006Request` | `User03006Response` |

---
