# School ERP — Dependency-Ordered Build Plan & Test Protocol
This plan sequences all 66 activities to avoid broken dependencies and attaches a simple test protocol per activity.

## Phase 0
**Gate:** all activities in this phase pass contract tests; migrations & seeds run clean.

### 01. DATA-00-001 — Connection Manager
- **Module:** DATA
- **Endpoint:** `POST /system/connections`  
  **operationId:** `data_data_00_001`  |  **Activity ID:** `DATA-00-001`
- **DB Entities:** system_config, trusts, system_users, migration_versions, sessions, system_audit_logs, schools, classes, sections, users, user_school_assignments, houses, academic_years, trust_config, audit_logs
- **Depends on:** -
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"DATA-00-001","name":"Connection Manager","method":"POST","path":"/system/connections","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 02. DATA-00-002 — Master DB schema creation
- **Module:** DATA
- **Endpoint:** `POST /system`  
  **operationId:** `data_data_00_002`  |  **Activity ID:** `DATA-00-002`
- **DB Entities:** system_config, trusts, system_users, migration_versions, sessions, system_audit_logs
- **Depends on:** -
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"DATA-00-002","name":"Master DB schema creation","method":"POST","path":"/system","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 03. DATA-00-003 — Trust DB schema template
- **Module:** DATA
- **Endpoint:** `POST /system`  
  **operationId:** `data_data_00_003`  |  **Activity ID:** `DATA-00-003`
- **DB Entities:** schools, classes, sections, users, user_school_assignments, houses, academic_years, trust_config, audit_logs
- **Depends on:** DATA-00-002
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"DATA-00-003","name":"Trust DB schema template","method":"POST","path":"/system","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 04. DATA-00-004 — System config storage
- **Module:** DATA
- **Endpoint:** `POST /system/config`  
  **operationId:** `data_data_00_004`  |  **Activity ID:** `DATA-00-004`
- **DB Entities:** system_config
- **Depends on:** DATA-00-002
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"DATA-00-004","name":"System config storage","method":"POST","path":"/system/config","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 05. DATA-00-005 — Trust registry & subdomains
- **Module:** DATA
- **Endpoint:** `POST /system`  
  **operationId:** `data_data_00_005`  |  **Activity ID:** `DATA-00-005`
- **DB Entities:** trusts
- **Depends on:** DATA-00-002
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"DATA-00-005","name":"Trust registry & subdomains","method":"POST","path":"/system","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 06. DATA-00-006 — System users (sys/group admin)
- **Module:** DATA
- **Endpoint:** `POST /system`  
  **operationId:** `data_data_00_006`  |  **Activity ID:** `DATA-00-006`
- **DB Entities:** system_users
- **Depends on:** DATA-00-002
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"DATA-00-006","name":"System users (sys/group admin)","method":"POST","path":"/system","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 07. DATA-00-007 — Migration tracking
- **Module:** DATA
- **Endpoint:** `POST /system/migrations`  
  **operationId:** `data_data_00_007`  |  **Activity ID:** `DATA-00-007`
- **DB Entities:** migration_versions
- **Depends on:** DATA-00-002, DATA-00-005
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"DATA-00-007","name":"Migration tracking","method":"POST","path":"/system/migrations","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 08. DATA-00-008 — Session store
- **Module:** DATA
- **Endpoint:** `POST /system/sessions`  
  **operationId:** `data_data_00_008`  |  **Activity ID:** `DATA-00-008`
- **DB Entities:** sessions
- **Depends on:** DATA-00-002
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"DATA-00-008","name":"Session store","method":"POST","path":"/system/sessions","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 09. DATA-00-009 — Global audit logging
- **Module:** DATA
- **Endpoint:** `POST /system/audit-logs`  
  **operationId:** `data_data_00_009`  |  **Activity ID:** `DATA-00-009`
- **DB Entities:** system_audit_logs
- **Depends on:** DATA-00-002
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"DATA-00-009","name":"Global audit logging","method":"POST","path":"/system/audit-logs","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 10. DATA-00-010 — Tenant audit logging
- **Module:** DATA
- **Endpoint:** `POST /system/audit-logs`  
  **operationId:** `data_data_00_010`  |  **Activity ID:** `DATA-00-010`
- **DB Entities:** audit_logs
- **Depends on:** DATA-00-003
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"DATA-00-010","name":"Tenant audit logging","method":"POST","path":"/system/audit-logs","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 11. DATA-00-011 — Subdomain/config cache
- **Module:** DATA
- **Endpoint:** `POST /system/config`  
  **operationId:** `data_data_00_011`  |  **Activity ID:** `DATA-00-011`
- **DB Entities:** trusts, system_config
- **Depends on:** DATA-00-004, DATA-00-005
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"DATA-00-011","name":"Subdomain/config cache","method":"POST","path":"/system/config","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 12. DATA-00-012 — Pool cleanup & housekeeping
- **Module:** DATA
- **Endpoint:** `POST /system/connections`  
  **operationId:** `data_data_00_012`  |  **Activity ID:** `DATA-00-012`
- **DB Entities:** -
- **Depends on:** DATA-00-001
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"DATA-00-012","name":"Pool cleanup & housekeeping","method":"POST","path":"/system/connections","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

## Phase 1
**Gate:** all activities in this phase pass contract tests; migrations & seeds run clean.

### 13. SETUP-01-001 — Wizard: Trust creation
- **Module:** SETUP
- **Endpoint:** `POST /setup/trusts`  
  **operationId:** `setup_setup_01_001`  |  **Activity ID:** `SETUP-01-001`
- **DB Entities:** trusts, system_config
- **Depends on:** DATA-*
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"SETUP-01-001","name":"Wizard: Trust creation","method":"POST","path":"/setup/trusts","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 14. SETUP-01-002 — Wizard: School creation
- **Module:** SETUP
- **Endpoint:** `POST /setup/schools`  
  **operationId:** `setup_setup_01_002`  |  **Activity ID:** `SETUP-01-002`
- **DB Entities:** schools
- **Depends on:** DATA-*, SETUP-01-001
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"SETUP-01-002","name":"Wizard: School creation","method":"POST","path":"/setup/schools","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 15. SETUP-01-003 — Wizard: Academic year creation
- **Module:** SETUP
- **Endpoint:** `POST /setup/academic-years`  
  **operationId:** `setup_setup_01_003`  |  **Activity ID:** `SETUP-01-003`
- **DB Entities:** academic_years
- **Depends on:** SETUP-01-002
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"SETUP-01-003","name":"Wizard: Academic year creation","method":"POST","path":"/setup/academic-years","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 16. SETUP-01-004 — Class & section setup (+ House)
- **Module:** SETUP
- **Endpoint:** `POST /setup/classes`  
  **operationId:** `setup_setup_01_004`  |  **Activity ID:** `SETUP-01-004`
- **DB Entities:** classes, sections, houses
- **Depends on:** SETUP-01-003
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"SETUP-01-004","name":"Class & section setup (+ House)","method":"POST","path":"/setup/classes","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 17. SETUP-01-005 — Subject & grading configuration
- **Module:** SETUP
- **Endpoint:** `POST /setup/academics`  
  **operationId:** `setup_setup_01_005`  |  **Activity ID:** `SETUP-01-005`
- **DB Entities:** classes, trust_config
- **Depends on:** SETUP-01-004
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"SETUP-01-005","name":"Subject & grading configuration","method":"POST","path":"/setup/academics","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 18. SETUP-01-006 — Trust/school-level config
- **Module:** SETUP
- **Endpoint:** `POST /setup/trusts`  
  **operationId:** `setup_setup_01_006`  |  **Activity ID:** `SETUP-01-006`
- **DB Entities:** trust_config
- **Depends on:** SETUP-01-002
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"SETUP-01-006","name":"Trust/school-level config","method":"POST","path":"/setup/trusts","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 19. SETUP-01-007 — Role seeding (admins)
- **Module:** SETUP
- **Endpoint:** `POST /setup/roles`  
  **operationId:** `setup_setup_01_007`  |  **Activity ID:** `SETUP-01-007`
- **DB Entities:** users, trust_config
- **Depends on:** SETUP-01-002
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"SETUP-01-007","name":"Role seeding (admins)","method":"POST","path":"/setup/roles","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

## Phase 2
**Gate:** all activities in this phase pass contract tests; migrations & seeds run clean.

### 20. AUTH-02-001 — Local authentication (web sessions)
- **Module:** AUTH
- **Endpoint:** `POST /auth`  
  **operationId:** `auth_auth_02_001`  |  **Activity ID:** `AUTH-02-001`
- **DB Entities:** users, sessions, audit_logs
- **Depends on:** DATA-*, SETUP-01-007
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"AUTH-02-001","name":"Local authentication (web sessions)","method":"POST","path":"/auth","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 21. AUTH-02-002 — JWT authentication (APIs)
- **Module:** AUTH
- **Endpoint:** `POST /auth`  
  **operationId:** `auth_auth_02_002`  |  **Activity ID:** `AUTH-02-002`
- **DB Entities:** users, audit_logs
- **Depends on:** AUTH-02-001
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"AUTH-02-002","name":"JWT authentication (APIs)","method":"POST","path":"/auth","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 22. AUTH-02-003 — Multi-factor (OTP)
- **Module:** AUTH
- **Endpoint:** `POST /auth/mfa`  
  **operationId:** `auth_auth_02_003`  |  **Activity ID:** `AUTH-02-003`
- **DB Entities:** users, audit_logs, trust_config
- **Depends on:** AUTH-02-001
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"AUTH-02-003","name":"Multi-factor (OTP)","method":"POST","path":"/auth/mfa","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 23. AUTH-02-004 — RBAC (roles & permissions)
- **Module:** AUTH
- **Endpoint:** `POST /auth`  
  **operationId:** `auth_auth_02_004`  |  **Activity ID:** `AUTH-02-004`
- **DB Entities:** users, trust_config
- **Depends on:** SETUP-01-007
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"AUTH-02-004","name":"RBAC (roles & permissions)","method":"POST","path":"/auth","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 24. AUTH-02-005 — Permission mapping
- **Module:** AUTH
- **Endpoint:** `POST /auth`  
  **operationId:** `auth_auth_02_005`  |  **Activity ID:** `AUTH-02-005`
- **DB Entities:** trust_config
- **Depends on:** AUTH-02-004
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"AUTH-02-005","name":"Permission mapping","method":"POST","path":"/auth","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 25. AUTH-02-006 — Account lockout
- **Module:** AUTH
- **Endpoint:** `POST /auth`  
  **operationId:** `auth_auth_02_006`  |  **Activity ID:** `AUTH-02-006`
- **DB Entities:** users, audit_logs
- **Depends on:** AUTH-02-001
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"AUTH-02-006","name":"Account lockout","method":"POST","path":"/auth","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 26. AUTH-02-007 — Email/phone verification
- **Module:** AUTH
- **Endpoint:** `POST /auth`  
  **operationId:** `auth_auth_02_007`  |  **Activity ID:** `AUTH-02-007`
- **DB Entities:** users, audit_logs
- **Depends on:** AUTH-02-001
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"AUTH-02-007","name":"Email/phone verification","method":"POST","path":"/auth","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 27. AUTH-02-008 — Password reset flows
- **Module:** AUTH
- **Endpoint:** `POST /auth/password`  
  **operationId:** `auth_auth_02_008`  |  **Activity ID:** `AUTH-02-008`
- **DB Entities:** users, audit_logs, system_audit_logs
- **Depends on:** AUTH-02-001
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"AUTH-02-008","name":"Password reset flows","method":"POST","path":"/auth/password","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 28. AUTH-02-009 — Auth event logging
- **Module:** AUTH
- **Endpoint:** `POST /auth`  
  **operationId:** `auth_auth_02_009`  |  **Activity ID:** `AUTH-02-009`
- **DB Entities:** audit_logs, system_audit_logs
- **Depends on:** AUTH-02-001
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"AUTH-02-009","name":"Auth event logging","method":"POST","path":"/auth","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 29. AUTH-02-010 — API keys/tokens
- **Module:** AUTH
- **Endpoint:** `POST /auth`  
  **operationId:** `auth_auth_02_010`  |  **Activity ID:** `AUTH-02-010`
- **DB Entities:** trust_config, users
- **Depends on:** AUTH-02-002
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"AUTH-02-010","name":"API keys/tokens","method":"POST","path":"/auth","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

## Phase 3
**Gate:** all activities in this phase pass contract tests; migrations & seeds run clean.

### 30. USER-03-001 — User creation & management
- **Module:** USER
- **Endpoint:** `POST /users`  
  **operationId:** `user_user_03_001`  |  **Activity ID:** `USER-03-001`
- **DB Entities:** users, schools
- **Depends on:** SETUP-01-002, AUTH-*
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"USER-03-001","name":"User creation & management","method":"POST","path":"/users","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 31. USER-03-002 — User-school assignments
- **Module:** USER
- **Endpoint:** `POST /users`  
  **operationId:** `user_user_03_002`  |  **Activity ID:** `USER-03-002`
- **DB Entities:** user_school_assignments, users, schools
- **Depends on:** USER-03-001
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"USER-03-002","name":"User-school assignments","method":"POST","path":"/users","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 32. USER-03-003 — Role & permission assignment
- **Module:** USER
- **Endpoint:** `POST /users/roles`  
  **operationId:** `user_user_03_003`  |  **Activity ID:** `USER-03-003`
- **DB Entities:** users, trust_config
- **Depends on:** AUTH-02-004
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"USER-03-003","name":"Role & permission assignment","method":"POST","path":"/users/roles","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 33. USER-03-004 — Teacher subject/class allocation
- **Module:** USER
- **Endpoint:** `POST /users/teachers/assignments`  
  **operationId:** `user_user_03_004`  |  **Activity ID:** `USER-03-004`
- **DB Entities:** users, classes, sections, trust_config
- **Depends on:** SETUP-01-004, USER-03-001
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"USER-03-004","name":"Teacher subject/class allocation","method":"POST","path":"/users/teachers/assignments","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 34. USER-03-005 — Staff profile management
- **Module:** USER
- **Endpoint:** `POST /users`  
  **operationId:** `user_user_03_005`  |  **Activity ID:** `USER-03-005`
- **DB Entities:** users
- **Depends on:** USER-03-001
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"USER-03-005","name":"Staff profile management","method":"POST","path":"/users","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 35. USER-03-006 — Parent-student linking
- **Module:** USER
- **Endpoint:** `POST /users/parents/links`  
  **operationId:** `user_user_03_006`  |  **Activity ID:** `USER-03-006`
- **DB Entities:** users, student_parents, students
- **Depends on:** STUD-04-001
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"USER-03-006","name":"Parent-student linking","method":"POST","path":"/users/parents/links","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

## Phase 4
**Gate:** all activities in this phase pass contract tests; migrations & seeds run clean.

### 36. STUD-04-001 — Student admission
- **Module:** STUD
- **Endpoint:** `POST /students/admissions`  
  **operationId:** `stud_stud_04_001`  |  **Activity ID:** `STUD-04-001`
- **DB Entities:** students, admissions, documents
- **Depends on:** SETUP-*, AUTH-*
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"STUD-04-001","name":"Student admission","method":"POST","path":"/students/admissions","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 37. STUD-04-002 — Admission approval workflow
- **Module:** STUD
- **Endpoint:** `POST /students/admissions`  
  **operationId:** `stud_stud_04_002`  |  **Activity ID:** `STUD-04-002`
- **DB Entities:** admissions, audit_logs
- **Depends on:** STUD-04-001
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"STUD-04-002","name":"Admission approval workflow","method":"POST","path":"/students/admissions","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 38. STUD-04-003 — Readmission/promotion
- **Module:** STUD
- **Endpoint:** `POST /students/admissions`  
  **operationId:** `stud_stud_04_003`  |  **Activity ID:** `STUD-04-003`
- **DB Entities:** students, academic_years, sections
- **Depends on:** SETUP-01-003, SETUP-01-004
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"STUD-04-003","name":"Readmission/promotion","method":"POST","path":"/students/admissions","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 39. STUD-04-004 — Inter-school transfer (in-trust)
- **Module:** STUD
- **Endpoint:** `POST /students/transfers`  
  **operationId:** `stud_stud_04_004`  |  **Activity ID:** `STUD-04-004`
- **DB Entities:** student_transfers, schools, students
- **Depends on:** STUD-04-001, SETUP-01-002
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"STUD-04-004","name":"Inter-school transfer (in-trust)","method":"POST","path":"/students/transfers","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 40. STUD-04-005 — Student ID & roll allocation
- **Module:** STUD
- **Endpoint:** `POST /students`  
  **operationId:** `stud_stud_04_005`  |  **Activity ID:** `STUD-04-005`
- **DB Entities:** students, sections
- **Depends on:** STUD-04-001, SETUP-01-004
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"STUD-04-005","name":"Student ID & roll allocation","method":"POST","path":"/students","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 41. STUD-04-006 — Siblings & category allocation
- **Module:** STUD
- **Endpoint:** `POST /students`  
  **operationId:** `stud_stud_04_006`  |  **Activity ID:** `STUD-04-006`
- **DB Entities:** students, student_parents, trust_config
- **Depends on:** STUD-04-001
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"STUD-04-006","name":"Siblings & category allocation","method":"POST","path":"/students","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 42. STUD-04-007 — Student documents & certificates
- **Module:** STUD
- **Endpoint:** `POST /students/documents`  
  **operationId:** `stud_stud_04_007`  |  **Activity ID:** `STUD-04-007`
- **DB Entities:** documents, students
- **Depends on:** STUD-04-001
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"STUD-04-007","name":"Student documents & certificates","method":"POST","path":"/students/documents","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

## Phase 5
**Gate:** all activities in this phase pass contract tests; migrations & seeds run clean.

### 43. FEES-05-001 — Fee heads & structures
- **Module:** FEES
- **Endpoint:** `POST /fees/structures`  
  **operationId:** `fees_fees_05_001`  |  **Activity ID:** `FEES-05-001`
- **DB Entities:** fee_heads, fee_structures, fee_installments
- **Depends on:** SETUP-*
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"FEES-05-001","name":"Fee heads & structures","method":"POST","path":"/fees/structures","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 44. FEES-05-002 — Class & student fee mapping
- **Module:** FEES
- **Endpoint:** `POST /fees`  
  **operationId:** `fees_fees_05_002`  |  **Activity ID:** `FEES-05-002`
- **DB Entities:** student_fee_assignments, fee_structures
- **Depends on:** FEES-05-001, STUD-04-001
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"FEES-05-002","name":"Class & student fee mapping","method":"POST","path":"/fees","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 45. FEES-05-003 — Discount allocation
- **Module:** FEES
- **Endpoint:** `POST /fees/discounts`  
  **operationId:** `fees_fees_05_003`  |  **Activity ID:** `FEES-05-003`
- **DB Entities:** student_fee_assignments, trust_config
- **Depends on:** FEES-05-002
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"FEES-05-003","name":"Discount allocation","method":"POST","path":"/fees/discounts","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 46. FEES-05-004 — Transport/optional services
- **Module:** FEES
- **Endpoint:** `POST /fees`  
  **operationId:** `fees_fees_05_004`  |  **Activity ID:** `FEES-05-004`
- **DB Entities:** trust_config, student_fee_assignments
- **Depends on:** FEES-05-002
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"FEES-05-004","name":"Transport/optional services","method":"POST","path":"/fees","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 47. FEES-05-005 — Late fee rules (config/override)
- **Module:** FEES
- **Endpoint:** `POST /fees`  
  **operationId:** `fees_fees_05_005`  |  **Activity ID:** `FEES-05-005`
- **DB Entities:** trust_config, student_fee_assignments
- **Depends on:** SETUP-01-006, FEES-05-002
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"FEES-05-005","name":"Late fee rules (config/override)","method":"POST","path":"/fees","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 48. FEES-05-006 — Fee collection & receipts
- **Module:** FEES
- **Endpoint:** `POST /fees/receipts`  
  **operationId:** `fees_fees_05_006`  |  **Activity ID:** `FEES-05-006`
- **DB Entities:** fee_receipts, student_fee_assignments
- **Depends on:** FEES-05-002
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"FEES-05-006","name":"Fee collection & receipts","method":"POST","path":"/fees/receipts","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 49. FEES-05-007 — Payment gateway integration
- **Module:** FEES
- **Endpoint:** `POST /fees`  
  **operationId:** `fees_fees_05_007`  |  **Activity ID:** `FEES-05-007`
- **DB Entities:** payment_gateway_logs, fee_receipts
- **Depends on:** FEES-05-006
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"FEES-05-007","name":"Payment gateway integration","method":"POST","path":"/fees","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 50. FEES-05-008 — Refunds & adjustments
- **Module:** FEES
- **Endpoint:** `POST /fees/refunds`  
  **operationId:** `fees_fees_05_008`  |  **Activity ID:** `FEES-05-008`
- **DB Entities:** fee_receipts
- **Depends on:** FEES-05-006
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"FEES-05-008","name":"Refunds & adjustments","method":"POST","path":"/fees/refunds","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 51. FEES-05-009 — Reports, reconciliation & defaulters
- **Module:** FEES
- **Endpoint:** `GET /fees/reports`  
  **operationId:** `fees_fees_05_009`  |  **Activity ID:** `FEES-05-009`
- **DB Entities:** fee_receipts, student_fee_assignments
- **Depends on:** FEES-05-006
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"FEES-05-009","name":"Reports, reconciliation & defaulters","method":"GET","path":"/fees/reports","headers":{"Authorization":"Bearer ${TOKEN}"},"expect":[200,201,400]}
  ```

## Phase 6
**Gate:** all activities in this phase pass contract tests; migrations & seeds run clean.

### 52. ATTD-06-001 — Daily attendance & bulk import
- **Module:** ATTD
- **Endpoint:** `POST /attendance/bulk`  
  **operationId:** `attd_attd_06_001`  |  **Activity ID:** `ATTD-06-001`
- **DB Entities:** attendance_daily, attendance_summary
- **Depends on:** SETUP-01-004, STUD-*
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"ATTD-06-001","name":"Daily attendance & bulk import","method":"POST","path":"/attendance/bulk","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 53. ATTD-06-002 — Leave/absence workflows
- **Module:** ATTD
- **Endpoint:** `POST /attendance/leaves`  
  **operationId:** `attd_attd_06_002`  |  **Activity ID:** `ATTD-06-002`
- **DB Entities:** attendance_daily, trust_config
- **Depends on:** ATTD-06-001
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"ATTD-06-002","name":"Leave/absence workflows","method":"POST","path":"/attendance/leaves","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 54. ATTD-06-003 — Attendance reporting/analytics
- **Module:** ATTD
- **Endpoint:** `GET /attendance/reports`  
  **operationId:** `attd_attd_06_003`  |  **Activity ID:** `ATTD-06-003`
- **DB Entities:** attendance_summary
- **Depends on:** ATTD-06-001
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"ATTD-06-003","name":"Attendance reporting/analytics","method":"GET","path":"/attendance/reports","headers":{"Authorization":"Bearer ${TOKEN}"},"expect":[200,201,400]}
  ```

## Phase 7
**Gate:** all activities in this phase pass contract tests; migrations & seeds run clean.

### 55. REPT-07-001 — Student profile reports
- **Module:** REPT
- **Endpoint:** `GET /reports`  
  **operationId:** `rept_rept_07_001`  |  **Activity ID:** `REPT-07-001`
- **DB Entities:** students, admissions
- **Depends on:** STUD-*
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"REPT-07-001","name":"Student profile reports","method":"GET","path":"/reports","headers":{"Authorization":"Bearer ${TOKEN}"},"expect":[200,201,400]}
  ```

### 56. REPT-07-002 — Fee collection reports
- **Module:** REPT
- **Endpoint:** `GET /reports`  
  **operationId:** `rept_rept_07_002`  |  **Activity ID:** `REPT-07-002`
- **DB Entities:** fee_receipts, student_fee_assignments
- **Depends on:** FEES-*
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"REPT-07-002","name":"Fee collection reports","method":"GET","path":"/reports","headers":{"Authorization":"Bearer ${TOKEN}"},"expect":[200,201,400]}
  ```

### 57. REPT-07-003 — Attendance summary reports
- **Module:** REPT
- **Endpoint:** `GET /reports`  
  **operationId:** `rept_rept_07_003`  |  **Activity ID:** `REPT-07-003`
- **DB Entities:** attendance_summary, students
- **Depends on:** ATTD-*
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"REPT-07-003","name":"Attendance summary reports","method":"GET","path":"/reports","headers":{"Authorization":"Bearer ${TOKEN}"},"expect":[200,201,400]}
  ```

### 58. REPT-07-004 — Academic performance reports
- **Module:** REPT
- **Endpoint:** `GET /reports`  
  **operationId:** `rept_rept_07_004`  |  **Activity ID:** `REPT-07-004`
- **DB Entities:** classes, sections, trust_config
- **Depends on:** SETUP-*
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"REPT-07-004","name":"Academic performance reports","method":"GET","path":"/reports","headers":{"Authorization":"Bearer ${TOKEN}"},"expect":[200,201,400]}
  ```

### 59. REPT-07-005 — Custom report builder
- **Module:** REPT
- **Endpoint:** `GET /reports`  
  **operationId:** `rept_rept_07_005`  |  **Activity ID:** `REPT-07-005`
- **DB Entities:** reports, report_templates
- **Depends on:** DATA-*, SETUP-*
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"REPT-07-005","name":"Custom report builder","method":"GET","path":"/reports","headers":{"Authorization":"Bearer ${TOKEN}"},"expect":[200,201,400]}
  ```

### 60. REPT-07-006 — Export to PDF/Excel
- **Module:** REPT
- **Endpoint:** `GET /reports`  
  **operationId:** `rept_rept_07_006`  |  **Activity ID:** `REPT-07-006`
- **DB Entities:** reports
- **Depends on:** REPT-07-001, REPT-07-002, REPT-07-003
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"REPT-07-006","name":"Export to PDF/Excel","method":"GET","path":"/reports","headers":{"Authorization":"Bearer ${TOKEN}"},"expect":[200,201,400]}
  ```

## Phase 8
**Gate:** all activities in this phase pass contract tests; migrations & seeds run clean.

### 61. DASH-08-001 — Trust admin dashboard
- **Module:** DASH
- **Endpoint:** `GET /dashboards`  
  **operationId:** `dash_dash_08_001`  |  **Activity ID:** `DASH-08-001`
- **DB Entities:** schools, users, fee_receipts, attendance_summary
- **Depends on:** DATA-*, SETUP-*, FEES-*, ATTD-*
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"DASH-08-001","name":"Trust admin dashboard","method":"GET","path":"/dashboards","headers":{"Authorization":"Bearer ${TOKEN}"},"expect":[200,201,400]}
  ```

### 62. DASH-08-002 — School admin dashboard
- **Module:** DASH
- **Endpoint:** `GET /dashboards`  
  **operationId:** `dash_dash_08_002`  |  **Activity ID:** `DASH-08-002`
- **DB Entities:** users, students, fee_receipts, attendance_summary
- **Depends on:** SETUP-*, FEES-*, ATTD-*
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"DASH-08-002","name":"School admin dashboard","method":"GET","path":"/dashboards","headers":{"Authorization":"Bearer ${TOKEN}"},"expect":[200,201,400]}
  ```

### 63. DASH-08-003 — Teacher dashboard
- **Module:** DASH
- **Endpoint:** `GET /dashboards`  
  **operationId:** `dash_dash_08_003`  |  **Activity ID:** `DASH-08-003`
- **DB Entities:** classes, sections, attendance_daily
- **Depends on:** SETUP-*, ATTD-*
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"DASH-08-003","name":"Teacher dashboard","method":"GET","path":"/dashboards","headers":{"Authorization":"Bearer ${TOKEN}"},"expect":[200,201,400]}
  ```

## Phase 9
**Gate:** all activities in this phase pass contract tests; migrations & seeds run clean.

### 64. COMM-09-001 — Notifications (SMS/Email/WhatsApp)
- **Module:** COMM
- **Endpoint:** `POST /communications`  
  **operationId:** `comm_comm_09_001`  |  **Activity ID:** `COMM-09-001`
- **DB Entities:** communication_templates, communication_messages
- **Depends on:** USER-*, STUD-*, FEES-*
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"COMM-09-001","name":"Notifications (SMS/Email/WhatsApp)","method":"POST","path":"/communications","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 65. COMM-09-002 — In-app announcements
- **Module:** COMM
- **Endpoint:** `POST /communications/announcements`  
  **operationId:** `comm_comm_09_002`  |  **Activity ID:** `COMM-09-002`
- **DB Entities:** communication_templates, communication_campaigns
- **Depends on:** USER-*
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"COMM-09-002","name":"In-app announcements","method":"POST","path":"/communications/announcements","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

### 66. COMM-09-003 — Emergency alerts (broadcast)
- **Module:** COMM
- **Endpoint:** `POST /communications/alerts`  
  **operationId:** `comm_comm_09_003`  |  **Activity ID:** `COMM-09-003`
- **DB Entities:** communication_templates, communication_campaigns, communication_messages
- **Depends on:** USER-*, STUD-*
- **DoD:** Zod validation + RBAC + audit; happy/negative paths; contract test passing.
- **Contract Test (add to `tests/contract/cases.json`):**
  ```json
  {"activityId":"COMM-09-003","name":"Emergency alerts (broadcast)","method":"POST","path":"/communications/alerts","headers":{"Authorization":"Bearer ${TOKEN}"},"body":{},"expect":[200,201,400]}
  ```

---

## Frontend & Tech Stack (Minimal, Stable, Low-Maintenance)
- **Frontend**: EJS + Tailwind CSS (server-rendered).
- **Backend**: Node.js 20 + TypeScript + Express.
- **DB**: MySQL 8 (master + tenant schemas). Use provided migrations & seeders.
- **Auth**: Session for web, JWT for APIs; rate-limit + lockout on auth.
- **Payments**: Razorpay adapter (stub in dev).
- **Messaging**: SMTP/SMS/WhatsApp adapters behind an interface.
- **Deploy**: Single VM with `docker-compose` (Node app + MySQL + Nginx + Certbot + nightly backup).

### Frontend Conventions
- Form validation must mirror Zod DTOs (server-side error messages).
- Use shared EJS partials for forms, tables, and error banners.
- Accessibility: label inputs, keyboard navigation, color-contrast safe.
- Assets: Tailwind via CDN in dev; compiled/minified in prod (optional).

## Testing Tools (Lean)
- **Contract tests**: Jest runner with **Ajv OpenAPI validation** (already wired).
- **Smoke tests**: one test per activity (happy + 1 negative path).
- **Manual probes**: Postman collection provided.

## How to Run Everything
```bash
# Dev
npm i
npm run gen:contract:cases
CONTRACT_TOKEN=<jwt> npm run test:contract

# Start local app + DB + Nginx (prod-ish)
docker compose up -d

# First-time TLS (replace domains)
# docker run --rm -it -v certbot-etc:/etc/letsencrypt -v certbot-var:/var/lib/letsencrypt -p 80:80 certbot/certbot certonly --standalone -d example.com -d *.example.com

# Backups: dumps written to ops/backups nightly
```

## Ops Playbook (Quick)
- **Login failing**: check rate limits & lockouts; verify JWT/Session secrets; see `system_audit_logs`.
- **Payment failures**: verify Razorpay keys; replay webhook; inspect fee ledgers.
- **Slow queries**: add index where repo queries filter; avoid SELECT *; paginate.
- **Tenant 404**: check subdomain→trust mapping and flush config cache.

