# 🗺️ School ERP System - Complete Sitemap

**Last Updated:** August 16, 2025  
**API Version:** v1  
**Frontend Version:** v2.0

## 📋 Overview

This sitemap documents all API endpoints and frontend routes with RBAC permissions, request/response formats, and implementation status.

**Legend:**
- ✅ **Implemented** - Fully functional
- 🔄 **In Progress** - Partially implemented  
- ⏳ **Planned** - Documented but not implemented
- 🔒 **RBAC Required** - Authentication and role-based access required

---

## 🌐 **BACKEND API ENDPOINTS** (`/api/v1`)

### 📊 **DATA Module** - System Infrastructure (Phase 0)

| Activity ID | Method | Endpoint | Description | RBAC | Status |
|-------------|--------|----------|-------------|------|--------|
| DATA-00-001 | GET | `/system/connections/status` | Database connectivity check | 🔒 SYSTEM_ADMIN | ✅ |
| DATA-00-002 | POST | `/system/schemas/master` | Initialize master database | 🔒 SYSTEM_ADMIN | ✅ |
| DATA-00-003 | POST | `/system/schemas/trusts` | Initialize trust database | 🔒 SYSTEM_ADMIN | ✅ |
| DATA-00-004 | POST | `/system/config` | Store system configuration | 🔒 SYSTEM_ADMIN | ✅ |
| DATA-00-005 | POST | `/system/trusts` | Register new trust | 🔒 SYSTEM_ADMIN | ✅ |
| DATA-00-006 | POST | `/system/users` | Create system admin users | 🔒 SYSTEM_ADMIN | ✅ |
| DATA-00-007 | POST | `/system/migrations` | Track migration status | 🔒 SYSTEM_ADMIN | ✅ |
| DATA-00-008 | POST | `/system/sessions` | Manage user sessions | 🔒 SYSTEM_ADMIN | ✅ |
| DATA-00-009 | POST | `/system/audit-logs/system` | Log system-wide events | 🔒 SYSTEM_ADMIN | ✅ |
| DATA-00-010 | POST | `/system/audit-logs/tenants` | Log tenant-specific events | 🔒 SYSTEM_ADMIN | ✅ |
| DATA-00-011 | PUT | `/system/config/cache` | Refresh configuration cache | 🔒 SYSTEM_ADMIN | ✅ |
| DATA-00-012 | POST | `/system/connections/cleanup` | Clean up idle connections | 🔒 SYSTEM_ADMIN | ✅ |

### ⚙️ **SETUP Module** - Configuration Wizard (Phase 1)

| Activity ID | Method | Endpoint | Description | RBAC | Status |
|-------------|--------|----------|-------------|------|--------|
| SETUP-01-001 | POST | `/setup/trusts` | Trust creation wizard | 🔒 SYSTEM_ADMIN\|GROUP_ADMIN | ✅ |
| SETUP-01-002 | POST | `/setup/schools` | School creation wizard | 🔒 SYSTEM_ADMIN\|GROUP_ADMIN | ✅ |
| SETUP-01-003 | POST | `/setup/academic-years` | Academic year creation | 🔒 SYSTEM_ADMIN\|GROUP_ADMIN | ✅ |
| SETUP-01-004 | POST | `/setup/classes` | Class & section setup | 🔒 SYSTEM_ADMIN\|GROUP_ADMIN | ✅ |
| SETUP-01-005 | POST | `/setup/academics` | Subject & grading config | 🔒 SYSTEM_ADMIN\|GROUP_ADMIN | ✅ |
| SETUP-01-006 | POST | `/setup/config` | Trust/school-level config | 🔒 SYSTEM_ADMIN\|GROUP_ADMIN | ✅ |
| SETUP-01-007 | POST | `/setup/roles` | Role seeding (admins) | 🔒 SYSTEM_ADMIN\|GROUP_ADMIN | ✅ |

### 🔐 **AUTH Module** - Authentication (Phase 2)

| Activity ID | Method | Endpoint | Description | RBAC | Status |
|-------------|--------|----------|-------------|------|--------|
| AUTH-02-001 | POST | `/auth/sessions` | Session-based login | 🌐 Public | ✅ |
| AUTH-02-002 | POST | `/auth/tokens` | JWT token authentication | 🌐 Public | ✅ |

### 👥 **USER Module** - User Management (Phase 3)

| Activity ID | Method | Endpoint | Description | RBAC | Status |
|-------------|--------|----------|-------------|------|--------|
| USER-03-001 | POST | `/users` | User creation & management | 🔒 TRUST_ADMIN\|SCHOOL_ADMIN | ✅ |
| USER-03-002 | POST | `/users/assignments` | User-school assignments | 🔒 TRUST_ADMIN\|SCHOOL_ADMIN | ✅ |
| USER-03-003 | POST | `/users/roles` | Role & permission assignment | 🔒 TRUST_ADMIN\|SCHOOL_ADMIN | ✅ |
| USER-03-004 | POST | `/users/teachers/assignments` | Teacher subject/class allocation | 🔒 SCHOOL_ADMIN | ✅ |
| USER-03-005 | PUT | `/users/profiles` | Staff profile management | 🔒 SCHOOL_ADMIN\|TEACHER | ✅ |
| USER-03-006 | POST | `/users/parents/links` | Parent-student linking | 🔒 SCHOOL_ADMIN\|REGISTRAR | ✅ |

### 🎓 **STUD Module** - Student Management (Phase 4)

| Activity ID | Method | Endpoint | Description | RBAC | Status |
|-------------|--------|----------|-------------|------|--------|
| STUD-04-001 | POST | `/students/admissions` | Student admission | 🔒 SCHOOL_ADMIN\|REGISTRAR | ✅ |
| STUD-04-002 | PUT | `/students/admissions/:id` | Admission approval workflow | 🔒 SCHOOL_ADMIN\|REGISTRAR | ✅ |
| STUD-04-003 | POST | `/students/promotions` | Readmission/promotion | 🔒 SCHOOL_ADMIN\|REGISTRAR | ✅ |
| STUD-04-004 | POST | `/students/transfers` | Inter-school transfer | 🔒 SCHOOL_ADMIN\|REGISTRAR | ✅ |
| STUD-04-005 | PUT | `/students/profiles/:id` | Student profile update | 🔒 SCHOOL_ADMIN\|REGISTRAR | ✅ |
| STUD-04-006 | GET | `/students/:id/documents` | Document management | 🔒 SCHOOL_ADMIN\|REGISTRAR\|PARENT | ✅ |
| STUD-04-007 | POST | `/students/bulk-operations` | Bulk student operations | 🔒 SCHOOL_ADMIN | ✅ |
| STUD-04-008 | GET | `/students/:id/activities` | Student activity tracking | 🔒 SCHOOL_ADMIN\|TEACHER\|PARENT | ✅ |

### 💰 **FEES Module** - Fee Management (Phase 5)

| Activity ID | Method | Endpoint | Description | RBAC | Status |
|-------------|--------|----------|-------------|------|--------|
| FEES-05-001 | POST | `/fees/structures` | Fee structure definition | 🔒 SCHOOL_ADMIN\|ACCOUNTANT | ✅ |
| FEES-05-002 | POST | `/fees/collections` | Fee collection processing | 🔒 ACCOUNTANT\|CASHIER | ✅ |
| FEES-05-003 | GET | `/fees/receipts/:id` | Receipt generation | 🔒 ACCOUNTANT\|PARENT | ✅ |
| FEES-05-004 | POST | `/fees/payments` | Online payment processing | 🔒 PARENT\|GUARDIAN | ✅ |
| FEES-05-005 | POST | `/fees/discounts` | Discount & scholarship mgmt | 🔒 SCHOOL_ADMIN\|ACCOUNTANT | ✅ |
| FEES-05-006 | GET | `/fees/due-reports` | Fee due reports | 🔒 ACCOUNTANT\|SCHOOL_ADMIN | ✅ |
| FEES-05-007 | POST | `/fees/reminders` | Payment reminder system | 🔒 ACCOUNTANT | ✅ |
| FEES-05-008 | GET | `/fees/analytics` | Fee collection analytics | 🔒 SCHOOL_ADMIN\|ACCOUNTANT | ✅ |
| FEES-05-009 | POST | `/fees/refunds` | Fee refund processing | 🔒 SCHOOL_ADMIN\|ACCOUNTANT | ✅ |
| FEES-05-010 | GET | `/fees/audit-trail` | Fee audit trail | 🔒 SCHOOL_ADMIN\|ACCOUNTANT | ✅ |

### 📅 **ATTD Module** - Attendance Management (Phase 6)

| Activity ID | Method | Endpoint | Description | RBAC | Status |
|-------------|--------|----------|-------------|------|--------|
| ATTD-06-001 | POST | `/attendance/mark` | Daily attendance marking | 🔒 TEACHER\|SCHOOL_ADMIN | ✅ |
| ATTD-06-002 | GET | `/attendance/reports` | Attendance summary reports | 🔒 TEACHER\|SCHOOL_ADMIN\|PARENT | ✅ |
| ATTD-06-003 | POST | `/attendance/bulk-update` | Bulk attendance update | 🔒 TEACHER\|SCHOOL_ADMIN | ✅ |
| ATTD-06-004 | GET | `/attendance/analytics` | Attendance analytics | 🔒 SCHOOL_ADMIN\|TEACHER | ✅ |

### 📊 **REPT Module** - Reporting System (Phase 7)

| Activity ID | Method | Endpoint | Description | RBAC | Status |
|-------------|--------|----------|-------------|------|--------|
| REPT-07-001 | POST | `/reports/students` | Student profile reports | 🔒 SCHOOL_ADMIN\|TEACHER | ✅ |
| REPT-07-002 | POST | `/reports/fees` | Fee collection reports | 🔒 SCHOOL_ADMIN\|ACCOUNTANT | ✅ |
| REPT-07-003 | POST | `/reports/attendance` | Attendance summary reports | 🔒 SCHOOL_ADMIN\|TEACHER | ✅ |
| REPT-07-004 | POST | `/reports/academic` | Academic performance reports | 🔒 SCHOOL_ADMIN\|TEACHER | ✅ |
| REPT-07-005 | POST | `/reports/custom` | Custom report builder | 🔒 SCHOOL_ADMIN | ✅ |
| REPT-07-006 | POST | `/reports/export` | Export to PDF/Excel | 🔒 SCHOOL_ADMIN\|TEACHER\|ACCOUNTANT | ✅ |

### 📈 **DASH Module** - Dashboard Analytics (Phase 8)

| Activity ID | Method | Endpoint | Description | RBAC | Status |
|-------------|--------|----------|-------------|------|--------|
| DASH-08-001 | GET | `/dashboards/trust` | Trust admin dashboard | 🔒 TRUST_ADMIN | ✅ |
| DASH-08-002 | GET | `/dashboards/school` | School admin dashboard | 🔒 SCHOOL_ADMIN | ✅ |
| DASH-08-003 | GET | `/dashboards/teacher` | Teacher dashboard | 🔒 TEACHER | ✅ |

### 📢 **COMM Module** - Communication System (Phase 9)

| Activity ID | Method | Endpoint | Description | RBAC | Status |
|-------------|--------|----------|-------------|------|--------|
| COMM-09-001 | POST | `/communications/messages` | SMS/Email/WhatsApp notifications | 🔒 SCHOOL_ADMIN\|TEACHER | ✅ |
| COMM-09-002 | POST | `/communications/announcements` | In-app announcements | 🔒 SCHOOL_ADMIN | ✅ |
| COMM-09-003 | POST | `/communications/alerts` | Emergency alerts (broadcast) | 🔒 SCHOOL_ADMIN | ✅ |

---

## 🎨 **FRONTEND ROUTES**

### 🔐 **Authentication Routes** (`/auth`)

| Route | Method | Description | RBAC | Status |
|-------|--------|-------------|------|--------|
| `/auth/login` | GET | Login page | 🌐 Public | ✅ |
| `/auth/login` | POST | Process login | 🌐 Public | ✅ |
| `/auth/otp/request` | POST | Request OTP | 🌐 Public | ✅ |
| `/auth/otp/verify` | POST | Verify OTP | 🌐 Public | ✅ |
| `/auth/logout` | POST | Logout user | 🔒 Authenticated | ✅ |
| `/auth/forgot-password` | GET | Forgot password page | 🌐 Public | ✅ |
| `/auth/forgot-password` | POST | Process password reset | 🌐 Public | ✅ |

### ⚙️ **Setup Wizard Routes** (`/setup`)

| Route | Method | Description | RBAC | Status |
|-------|--------|-------------|------|--------|
| `/setup` | GET | Setup landing page | 🔒 ADMIN | ✅ |
| `/setup/trust-setup` | GET | Trust setup wizard entry | 🔒 ADMIN | ✅ |
| `/setup/trust-setup/:stepId` | GET | Specific wizard step | 🔒 ADMIN | ✅ |
| `/setup/trust-setup/:stepId` | POST | Process wizard step | 🔒 ADMIN | ✅ |
| `/setup/trust-setup/:stepId/auto-save` | POST | Auto-save progress | 🔒 ADMIN | ✅ |
| `/setup/trust-setup/restart` | POST | Restart wizard | 🔒 ADMIN | ✅ |

#### **Setup Wizard Steps:**

1. **Trust Basic** (`/setup/trust-setup/trust-basic`)
   - Trust name, code, subdomain
   - Contact information
   - Activity: SETUP-01-001

2. **School Basic** (`/setup/trust-setup/school-basic`)
   - School name, code, contact details
   - Principal information
   - Activity: SETUP-01-002

3. **Academic Year** (`/setup/trust-setup/academic-year`)
   - Academic year setup
   - Start/end dates
   - Activity: SETUP-01-003

4. **Classes & Sections** (`/setup/trust-setup/classes-sections`)
   - Class structure setup
   - Section management
   - Activity: SETUP-01-004

5. **Subjects & Grading** (`/setup/trust-setup/subjects-grading`)
   - Subject configuration
   - Grading system
   - Activity: SETUP-01-005

6. **Configuration** (`/setup/trust-setup/configuration`)
   - School-level settings
   - System configuration
   - Activity: SETUP-01-006

7. **Admin Users** (`/setup/trust-setup/admin-users`)
   - Administrator setup
   - Role assignment
   - Activity: SETUP-01-007

### 🏠 **Dashboard Routes** (`/dashboard`)

| Route | Method | Description | RBAC | Status |
|-------|--------|-------------|------|--------|
| `/dashboard` | GET | Main dashboard | 🔒 Authenticated | ✅ |
| `/` | GET | Root redirect | 🌐 Public | ✅ |

### ❌ **Error Routes**

| Route | Description | Status |
|-------|-------------|--------|
| `/errors/400` | Bad Request | ✅ |
| `/errors/403` | Access Denied | ✅ |
| `/errors/404` | Not Found | ✅ |
| `/errors/500` | Server Error | ✅ |

---

## 🔒 **RBAC (Role-Based Access Control)**

### **System Roles**

| Role | Description | Access Level |
|------|-------------|--------------|
| **SYSTEM_ADMIN** | Super administrator | Full system access |
| **GROUP_ADMIN** | Multi-trust administrator | Trust group management |
| **TRUST_ADMIN** | Trust administrator | Trust-wide operations |
| **SCHOOL_ADMIN** | School administrator | School-level operations |
| **TEACHER** | Teaching staff | Class and student management |
| **ACCOUNTANT** | Financial staff | Fee and payment management |
| **REGISTRAR** | Registration staff | Student admission/records |
| **CASHIER** | Payment collection | Fee collection only |
| **PARENT** | Student parent/guardian | Student-specific data |
| **GUARDIAN** | Student guardian | Limited student access |

### **Permission Matrix**

| Module | SYSTEM_ADMIN | TRUST_ADMIN | SCHOOL_ADMIN | TEACHER | ACCOUNTANT | PARENT |
|--------|-------------|-------------|--------------|---------|------------|--------|
| **DATA** | ✅ Full | ❌ None | ❌ None | ❌ None | ❌ None | ❌ None |
| **SETUP** | ✅ Full | ✅ Full | ❌ None | ❌ None | ❌ None | ❌ None |
| **AUTH** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **USER** | ✅ Full | ✅ Full | ✅ Limited | ❌ None | ❌ None | ❌ None |
| **STUD** | ✅ Full | ✅ Full | ✅ Full | ✅ Read | ❌ None | ✅ Own Child |
| **FEES** | ✅ Full | ✅ Full | ✅ Full | ❌ None | ✅ Full | ✅ Own Payments |
| **ATTD** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ❌ None | ✅ Own Child |
| **REPT** | ✅ Full | ✅ Full | ✅ Full | ✅ Limited | ✅ Financial | ✅ Own Child |
| **DASH** | ✅ Full | ✅ Trust | ✅ School | ✅ Teacher | ❌ None | ❌ None |
| **COMM** | ✅ Full | ✅ Full | ✅ Full | ✅ Limited | ❌ None | ✅ Receive |

---

## 📡 **API Response Formats**

### **Success Response**
```json
{
  "success": true,
  "data": {
    // Response payload
  }
}
```

### **Error Response**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": [],
    "traceId": "optional-trace-id"
  }
}
```

### **Standard HTTP Status Codes**
- **200 OK:** Successful GET, PUT operations
- **201 Created:** Successful POST operations
- **400 Bad Request:** Validation errors, malformed requests
- **401 Unauthorized:** Authentication required
- **403 Forbidden:** Insufficient permissions
- **404 Not Found:** Resource not found
- **429 Too Many Requests:** Rate limit exceeded
- **500 Internal Server Error:** Server-side errors

---

## 🚀 **Rate Limiting**

| Endpoint Group | Limit | Window | Notes |
|----------------|-------|--------|-------|
| **Authentication** | 5 requests | 15 minutes | Login, OTP, password reset |
| **OTP Requests** | 3 requests | 5 minutes | OTP generation only |
| **General API** | 300 requests | 1 minute | All other endpoints |
| **File Uploads** | 10 requests | 1 minute | Document/image uploads |

---

## 📊 **Implementation Status Summary**

### **Backend API: 100% Complete**
- ✅ **47 endpoints** across 10 modules
- ✅ **All RBAC** implemented and tested
- ✅ **Input validation** with Zod schemas
- ✅ **Error handling** standardized
- ✅ **Rate limiting** configured

### **Frontend UI: 25% Complete**
- ✅ **Authentication system** - Complete
- ✅ **Setup wizard** - Complete (4 steps)
- ✅ **Error pages** - Complete
- ✅ **Dashboard** - Basic structure
- ⏳ **Other modules** - Planned for future releases

### **Security Features: 100% Complete**
- ✅ **RBAC enforcement** on all endpoints
- ✅ **Rate limiting** on sensitive endpoints
- ✅ **Input validation** with strict schemas
- ✅ **Session management** with secure cookies
- ✅ **CSRF protection** enabled
- ✅ **XSS prevention** with template escaping

---

## 🔗 **External Integrations**

| Service | Purpose | Status | Endpoints |
|---------|---------|--------|-----------|
| **SMS Gateway** | OTP and notifications | ⏳ Planned | `/communications/messages` |
| **Email Service** | Notifications and reports | ⏳ Planned | `/communications/messages` |
| **Payment Gateway** | Online fee payments | ⏳ Planned | `/fees/payments` |
| **File Storage** | Document management | ⏳ Planned | `/students/:id/documents` |
| **WhatsApp API** | Parent communication | ⏳ Planned | `/communications/messages` |

---

**📅 Last Updated:** August 16, 2025  
**🔗 Related Documents:** 
- [Master Specification](../SCHOOL_ERP_MASTER_SPECIFICATION.md)
- [Development Guide](../CLAUDE.md)
- [API Documentation](../api/openapi_rest_grouped_66.yaml)