# School ERP System - Complete Master Implementation Documentation
## Comprehensive System Architecture & Development Guide for AI-Assisted Development

### Document Control
- **Version:** 3.0 (Merged & Corrected)
- **Date:** August 14, 2025
- **Purpose:** Single source of truth for AI-assisted development - fully merged and corrected
- **Target:** One-person company with AI development partners
- **Scope:** Complete implementation of all 66 activities across 9 modules
- **Status:** Production-ready specifications

---

## EXECUTIVE SUMMARY

This master document provides complete specifications for building a production-ready School ERP system designed for the Indian education market. The system implements **66 detailed activities across 9 modules** with a trust-centric multi-tenant architecture, supporting everything from basic school management to advanced analytics and government compliance.

### Key System Capabilities
- **Trust-centric multi-tenancy** with subdomain-based routing
- **Student-centric fee management** with flexible discounting
- **Complete attendance management** with government compliance
- **Advanced communication system** (Email/SMS/WhatsApp)
- **Comprehensive reporting** with government-ready formats
- **Role-based dashboards** with real-time analytics
- **Wizard-driven setup** for professional onboarding

---

## SYSTEM ARCHITECTURE OVERVIEW

### Core Design Principles
- **Trust-centric multi-tenancy** (not school-centric) - One trust can manage multiple schools
- **Student-centric fee management** with flexible discounting and payment options
- **Subdomain-based routing** with automatic database switching (`trust.schoolerp.com`)
- **Wizard-driven setup** for professional onboarding experience
- **Low-maintenance, cost-effective** infrastructure optimized for one-person operations
- **Government compliance** built-in for Indian education regulations

### Technology Stack
- **Frontend:** Express.js + EJS + Tailwind CSS (server-rendered for performance)
- **Backend:** TypeScript + Node.js + Express.js (type-safe development)
- **Database:** MySQL with multi-tenant architecture (master + trust databases)
- **Authentication:** Dual approach - Sessions (web) + JWT (API)
- **Storage:** Local disk with cloud adapter support
- **Payments:** Razorpay with adapter pattern for multiple gateways
- **Communication:** Multi-channel (Email/SMS/WhatsApp) with template engine

### Database Architecture
- **Master Database:** `school_erp_master` (global configuration, tenant registry, system admin)
- **Trust Databases:** `school_erp_trust_{trust_id}` (per organization data isolation)
- **Connection Strategy:** Lazy connection pools with 30-minute timeout and automatic cleanup
- **Migration Strategy:** Master-driven with automatic apply and rollback capabilities

---

## MODULE STRUCTURE & IMPLEMENTATION ORDER

### Phase 1 Modules (9 modules, 66 activities total)

```
Priority Order for Implementation:
0. DATA (Foundation) - 12 activities ⭐ CRITICAL FOUNDATION
1. SETUP (Configuration) - 8 activities 
2. AUTH (Authentication) - 10 activities
3. USER (User Management) - 6 activities
4. STUD (Student Management) - 8 activities
5. FEES (Fee Operations) - 10 activities
6. ATTD (Attendance) - 4 activities
7. REPT (Reports) - 6 activities
8. DASH (Dashboard) - 3 activities
9. COMM (Communication) - 4 activities
```

---

## MODULE 0: DATA (Database Foundation) ⭐ CRITICAL
**Module Code:** DATA  
**Total Activities:** 12  
**Sprint Priority:** 0 (Must complete first - ALL other modules depend on this)

### DATABASE ARCHITECTURE

#### Master Database Schema (`school_erp_master`)
```sql
-- System-wide configuration storage
CREATE TABLE system_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT,
    config_type ENUM('STRING', 'NUMBER', 'BOOLEAN', 'JSON') DEFAULT 'STRING',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_config_key (config_key),
    INDEX idx_public (is_public)
);

-- Trust/Organization registry (central tenant management)
CREATE TABLE trusts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    trust_name VARCHAR(200) NOT NULL,
    trust_code VARCHAR(20) NOT NULL UNIQUE,
    subdomain VARCHAR(50) NOT NULL UNIQUE,
    trust_type ENUM('EDUCATIONAL', 'CORPORATE', 'NGO') DEFAULT 'EDUCATIONAL',
    board_affiliation SET('CBSE', 'ICSE', 'STATE', 'IB', 'CAMBRIDGE') NOT NULL,
    
    -- Contact Information
    primary_email VARCHAR(255),
    primary_phone VARCHAR(15),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    pincode VARCHAR(10),
    
    -- Legal Information
    registration_number VARCHAR(100),
    pan_number VARCHAR(20),
    gst_number VARCHAR(20),
    
    -- System Configuration
    academic_year_start_month TINYINT DEFAULT 4,
    default_language VARCHAR(20) DEFAULT 'English',
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    
    -- Status & Subscription
    is_active BOOLEAN DEFAULT TRUE,
    setup_completed BOOLEAN DEFAULT FALSE,
    trial_expires_at DATE,
    subscription_plan ENUM('TRIAL', 'BASIC', 'PREMIUM', 'ENTERPRISE') DEFAULT 'TRIAL',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_subdomain (subdomain),
    INDEX idx_trust_code (trust_code),
    INDEX idx_active (is_active),
    INDEX idx_setup_status (setup_completed)
);

-- System administrators (super admins, group admins)
CREATE TABLE system_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('SYSTEM_ADMIN', 'GROUP_ADMIN') NOT NULL,
    
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    
    -- Group Admin specific (which trusts they can manage)
    managed_trust_ids JSON,
    
    -- Security
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    failed_login_attempts INT DEFAULT 0,
    account_locked_until TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_active (is_active)
);

-- Migration tracking (master and trust database versions)
CREATE TABLE migration_versions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    trust_id INT NULL, -- NULL = master database migration
    migration_version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    rollback_sql TEXT,
    status ENUM('PENDING', 'SUCCESS', 'FAILED') DEFAULT 'SUCCESS',
    error_message TEXT,
    
    FOREIGN KEY (trust_id) REFERENCES trusts(id) ON DELETE CASCADE,
    UNIQUE KEY uk_trust_migration (trust_id, migration_version),
    INDEX idx_status (status)
);

-- Session storage (Express sessions)
CREATE TABLE sessions (
    session_id VARCHAR(128) PRIMARY KEY,
    user_id INT NULL,
    trust_id INT NULL,
    expires INT NOT NULL,
    data MEDIUMTEXT,
    
    INDEX idx_expires (expires),
    INDEX idx_user (user_id),
    INDEX idx_trust (trust_id)
);

-- Global audit logs (system-level events)
CREATE TABLE system_audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    trust_id INT NULL,
    user_id INT NULL,
    activity_id VARCHAR(20), -- Activity code (e.g., DATA-00-001)
    user_type ENUM('SYSTEM_ADMIN', 'GROUP_ADMIN', 'TRUST_USER'),
    event_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    
    details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_trust_event (trust_id, event_type),
    INDEX idx_user_event (user_id, event_type),
    INDEX idx_activity (activity_id),
    INDEX idx_created_at (created_at)
);
```

#### Trust Database Schema Template (`school_erp_trust_{trust_id}`)
```sql
-- Schools within the trust
CREATE TABLE schools (
    id INT PRIMARY KEY AUTO_INCREMENT,
    trust_id INT NOT NULL,
    
    school_name VARCHAR(200) NOT NULL,
    school_code VARCHAR(20) NOT NULL,
    school_type ENUM('PRE_PRIMARY', 'PRIMARY', 'SECONDARY', 'SENIOR_SECONDARY', 'JUNIOR_COLLEGE') NOT NULL,
    
    -- Academic Structure
    classes_offered JSON, -- ["Nursery", "LKG", "Grade 1", ...]
    academic_year_start DATE,
    academic_year_end DATE,
    
    -- Infrastructure
    total_capacity INT DEFAULT 0,
    address TEXT,
    phone VARCHAR(15),
    email VARCHAR(255),
    
    -- Government Registration (CRITICAL for transfer logic)
    board_affiliation ENUM('CBSE', 'ICSE', 'STATE', 'IB', 'CAMBRIDGE'),
    affiliation_number VARCHAR(100),
    recognition_details JSON,
    registration_number VARCHAR(100), -- Unique government registration
    registration_authority VARCHAR(100), -- CBSE Regional Office, State Board, etc.
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_school_code (trust_id, school_code),
    INDEX idx_school_type (school_type),
    INDEX idx_registration (registration_number),
    INDEX idx_active (is_active)
);

-- Classes configuration (Nursery, LKG, Grade 1, etc.)
CREATE TABLE classes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    school_id INT NOT NULL,
    
    class_name VARCHAR(50) NOT NULL, -- "Nursery", "LKG", "Grade 1"
    class_code VARCHAR(10) NOT NULL, -- "NUR", "LKG", "G1"
    class_level ENUM('FOUNDATION', 'PREPARATORY', 'PRIMARY', 'MIDDLE', 'SECONDARY', 'SENIOR_SECONDARY') NOT NULL,
    display_order INT NOT NULL,
    
    -- Academic Configuration
    subjects_offered JSON,
    grading_system ENUM('MARKS', 'GRADES', 'PERCENTAGE') DEFAULT 'MARKS',
    passing_criteria JSON,
    
    -- Capacity Planning
    max_sections INT DEFAULT 3,
    max_students_per_section INT DEFAULT 40,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    UNIQUE KEY uk_class_code (school_id, class_code),
    INDEX idx_display_order (school_id, display_order)
);

-- Sections within classes (A, B, C, etc.)
CREATE TABLE sections (
    id INT PRIMARY KEY AUTO_INCREMENT,
    class_id INT NOT NULL,
    
    section_name VARCHAR(10) NOT NULL, -- "A", "B", "C"
    section_code VARCHAR(15) NOT NULL, -- "G1-A", "G2-B"
    
    -- Capacity Management
    max_students INT DEFAULT 40,
    current_strength INT DEFAULT 0,
    
    -- Assignment
    class_teacher_id INT NULL,
    room_number VARCHAR(20),
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    UNIQUE KEY uk_section_code (class_id, section_name),
    INDEX idx_class_teacher (class_teacher_id),
    INDEX idx_current_strength (current_strength)
);

-- Users within the trust (staff, parents, students)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    trust_id INT NOT NULL,
    
    -- Authentication
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    password_hash VARCHAR(255) NOT NULL,
    
    -- Role & Access
    role ENUM('TRUST_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'ACCOUNTANT', 'PARENT', 'STUDENT') NOT NULL,
    primary_school_id INT NULL,
    
    -- Personal Information
    employee_id VARCHAR(50),
    student_id VARCHAR(50),
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    gender ENUM('MALE', 'FEMALE', 'OTHER'),
    date_of_birth DATE,
    
    -- Professional Information (staff)
    designation VARCHAR(100),
    department VARCHAR(100),
    joining_date DATE,
    qualification TEXT,
    
    -- Contact & Address
    alternate_phone VARCHAR(15),
    emergency_contact VARCHAR(15),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    
    -- Security & Status
    is_active BOOLEAN DEFAULT TRUE,
    email_verified_at TIMESTAMP NULL,
    phone_verified_at TIMESTAMP NULL,
    last_login TIMESTAMP NULL,
    failed_login_attempts INT DEFAULT 0,
    account_locked_until TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (primary_school_id) REFERENCES schools(id),
    UNIQUE KEY uk_email (trust_id, email),
    UNIQUE KEY uk_employee_id (trust_id, employee_id),
    UNIQUE KEY uk_student_id (trust_id, student_id),
    INDEX idx_role_school (role, primary_school_id),
    INDEX idx_active (is_active)
);

-- Multi-school access for users
CREATE TABLE user_school_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    school_id INT NOT NULL,
    role_in_school ENUM('ADMIN', 'TEACHER', 'ACCOUNTANT', 'PARENT') NOT NULL,
    
    -- Subject/Class specific access
    subjects_taught JSON,
    classes_assigned JSON,
    permissions JSON,
    
    is_active BOOLEAN DEFAULT TRUE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INT,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id),
    UNIQUE KEY uk_user_school_role (user_id, school_id, role_in_school),
    INDEX idx_school_role (school_id, role_in_school)
);

-- House system (Red, Blue, Green, Yellow houses)
CREATE TABLE houses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    school_id INT NOT NULL,
    
    house_name VARCHAR(50) NOT NULL,
    house_color VARCHAR(20),
    house_motto VARCHAR(200),
    house_captain_id INT NULL,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (house_captain_id) REFERENCES users(id),
    UNIQUE KEY uk_house_name (school_id, house_name)
);

-- Academic year configuration
CREATE TABLE academic_years (
    id INT PRIMARY KEY AUTO_INCREMENT,
    school_id INT NOT NULL,
    
    year_name VARCHAR(20) NOT NULL, -- "2024-25"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    is_current BOOLEAN DEFAULT FALSE,
    total_working_days INT DEFAULT 200,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    UNIQUE KEY uk_year_name (school_id, year_name),
    INDEX idx_current (school_id, is_current)
);

-- Trust-level configuration
CREATE TABLE trust_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT,
    config_type ENUM('STRING', 'NUMBER', 'BOOLEAN', 'JSON') DEFAULT 'STRING',
    school_id INT NULL, -- NULL = trust-level, specific ID = school-level
    description TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_config_scope (config_key, school_id),
    INDEX idx_school_config (school_id)
);

-- Trust-level audit logs
CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    school_id INT NULL,
    activity_id VARCHAR(20), -- Activity code
    event_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    
    old_values JSON,
    new_values JSON,
    details JSON,
    
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (school_id) REFERENCES schools(id),
    INDEX idx_user_event (user_id, event_type),
    INDEX idx_school_event (school_id, event_type),
    INDEX idx_activity (activity_id),
    INDEX idx_created_at (created_at)
);
```

### DATA MODULE ACTIVITIES (12 activities)

#### Activity DATA-00-001: Connection Manager
**Priority:** Critical  
**Description:** Implement lazy connection pooling with automatic trust database switching

**Key Features:**
- Lazy connection pooling with 30-minute timeout
- Automatic subdomain-to-trust resolution with caching
- Health monitoring and automatic reconnection
- Connection cleanup and pool management

#### Activity DATA-00-002: Master DB Schema Creation
**Priority:** Critical  
**Description:** Initialize master database with all system tables

**Key Features:**
- Create all master database tables
- Insert initial system configuration
- Set up proper indexes and foreign keys
- Migration version tracking

#### Activity DATA-00-003: Trust DB Schema Template
**Priority:** Critical  
**Description:** Create template for trust database schema with dynamic creation

**Key Features:**
- Template-based trust database creation
- Dynamic schema application
- Trust-specific configuration
- Data isolation enforcement

#### Activity DATA-00-004: System Config Storage
**Priority:** High  
**Description:** Centralized configuration management

**Key Features:**
- Type-safe configuration storage
- Public/private configuration separation
- Configuration caching
- Environment-specific overrides

#### Activity DATA-00-005: Trust Registry & Subdomains
**Priority:** Critical  
**Description:** Trust registration and subdomain management

**Key Features:**
- Trust registration workflow
- Subdomain validation and uniqueness
- DNS configuration support
- Trust status management

#### Activity DATA-00-006: System Users (sys/group admin)
**Priority:** High  
**Description:** System administrator management

**Key Features:**
- System admin user creation
- Group admin with trust restrictions
- Role-based permissions
- Security policy enforcement

#### Activity DATA-00-007: Migration Tracking
**Priority:** High  
**Description:** Database migration system with rollback capabilities

**Key Features:**
- Version-controlled migrations
- Automatic rollback capability
- Migration status tracking
- Multi-database migration support

#### Activity DATA-00-008: Session Store
**Priority:** Medium  
**Description:** Session management and storage

**Key Features:**
- Express session storage
- Session cleanup and expiration
- Multi-tenant session isolation
- Security token management

#### Activity DATA-00-009: Global Audit Logging
**Priority:** High  
**Description:** System-wide audit trail

**Key Features:**
- All system-level events logging
- Security event tracking
- Performance metrics
- Compliance reporting

#### Activity DATA-00-010: Tenant Audit Logging
**Priority:** High  
**Description:** Trust-specific audit trails

**Key Features:**
- Trust-level event logging
- Data change tracking
- User activity monitoring
- Privacy compliance

#### Activity DATA-00-011: Subdomain/Config Cache
**Priority:** Medium  
**Description:** Performance optimization through caching

**Key Features:**
- Subdomain resolution caching
- Configuration caching
- Cache invalidation strategies
- Performance monitoring

#### Activity DATA-00-012: Pool Cleanup & Housekeeping
**Priority:** Medium  
**Description:** Database maintenance and optimization

**Key Features:**
- Connection pool cleanup
- Performance optimization
- Resource monitoring
- Maintenance scheduling

---

## MODULE 1: SETUP (Configuration Wizards)
**Module Code:** SETUP  
**Total Activities:** 8  
**Sprint Priority:** 1

### WIZARD ENGINE INFRASTRUCTURE

The Setup module provides a comprehensive wizard-driven configuration system that guides administrators through the complete setup process, from trust creation to system integration.

### SETUP MODULE ACTIVITIES (8 activities)

#### Activity SETUP-01-001: Wizard Engine Implementation
**Priority:** Critical  
**Description:** Core wizard framework for all configuration workflows

**Key Features:**
- Multi-step form management
- Conditional step rendering
- Data validation and persistence
- Progress tracking and resumption

#### Activity SETUP-01-002: Trust Creation Wizard
**Priority:** Critical  
**Description:** Complete trust onboarding workflow

**Key Features:**
- Basic trust information collection
- Educational framework configuration
- Legal and contact information
- Database creation and initialization

#### Activity SETUP-01-003: School Creation Wizard
**Priority:** High  
**Description:** Individual school setup within a trust

**Key Features:**
- School profile creation
- Infrastructure configuration
- Board affiliation setup
- Government registration integration

#### Activity SETUP-01-004: Fee Structure Configuration Wizard
**Priority:** High  
**Description:** Complete fee structure setup

**Key Features:**
- Fee template creation
- Component-wise fee definition
- Discount and concession policies
- Payment method configuration

#### Activity SETUP-01-005: Academic Year Setup Wizard
**Priority:** High  
**Description:** Academic calendar and year configuration

**Key Features:**
- Academic year definition
- Holiday calendar setup
- Working days configuration
- Term/semester planning

#### Activity SETUP-01-006: Class Structure Configuration Wizard
**Priority:** High  
**Description:** Class and section setup

**Key Features:**
- Class hierarchy definition
- Section creation and assignment
- Capacity planning
- Subject mapping

#### Activity SETUP-01-007: System Integration Configuration
**Priority:** Medium  
**Description:** External system integrations

**Key Features:**
- Payment gateway setup
- SMS/Email provider configuration
- Government portal integration
- Third-party system connections

#### Activity SETUP-01-008: Final System Validation
**Priority:** Medium  
**Description:** Complete system validation and go-live

**Key Features:**
- Configuration validation
- Test data creation
- System health checks
- User acceptance testing

---

## MODULE 2: AUTH (Authentication & Security)
**Module Code:** AUTH  
**Total Activities:** 10  
**Sprint Priority:** 2

### AUTHENTICATION FRAMEWORK

Comprehensive security system with multiple authentication methods, role-based access control, and enterprise-grade security features.

### SECURITY DATABASE EXTENSIONS

```sql
-- Role definitions and permissions
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    trust_id INT NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    role_code VARCHAR(20) NOT NULL,
    description TEXT,
    
    permissions JSON, -- Detailed permission matrix
    is_system_role BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (trust_id) REFERENCES trusts(id),
    UNIQUE KEY uk_trust_role_code (trust_id, role_code)
);

-- User role assignments
CREATE TABLE user_roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    school_id INT NULL, -- Role specific to a school
    
    assigned_by INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (assigned_by) REFERENCES users(id),
    
    UNIQUE KEY uk_user_role_scope (user_id, role_id, school_id)
);

-- Multi-factor authentication
CREATE TABLE user_mfa (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    backup_codes JSON,
    
    last_used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_mfa (user_id)
);

-- API tokens and keys
CREATE TABLE api_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    trust_id INT NOT NULL,
    
    token_name VARCHAR(100) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    
    permissions JSON,
    rate_limit_per_hour INT DEFAULT 1000,
    
    expires_at TIMESTAMP NULL,
    last_used_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token_hash (token_hash),
    INDEX idx_expires_at (expires_at)
);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token_hash (token_hash),
    INDEX idx_expires_at (expires_at)
);
```

### AUTH MODULE ACTIVITIES (10 activities)

#### Activity AUTH-02-001: Local Authentication (Web Sessions)
**Priority:** Critical  
**Description:** Complete login system with web session management

**Key Features:**
- Email/phone + password authentication
- Session management with Express
- Remember me functionality
- Account lockout protection

#### Activity AUTH-02-002: JWT Authentication (APIs)
**Priority:** High  
**Description:** API authentication using JSON Web Tokens

**Key Features:**
- JWT token generation and validation
- Refresh token mechanism
- API endpoint protection
- Token expiration management

#### Activity AUTH-02-003: Multi-Factor Authentication (OTP)
**Priority:** Medium  
**Description:** OTP-based two-factor authentication

**Key Features:**
- TOTP (Time-based OTP) support
- SMS-based OTP backup
- Backup codes generation
- Recovery procedures

#### Activity AUTH-02-004: RBAC (Roles & Permissions)
**Priority:** High  
**Description:** Role-based access control system

**Key Features:**
- Granular permission system
- Role hierarchy management
- Dynamic permission assignment
- School-specific roles

#### Activity AUTH-02-005: Permission Mapping
**Priority:** High  
**Description:** Permission-to-feature mapping system

**Key Features:**
- Feature-level permissions
- Dynamic menu generation
- API endpoint protection
- UI element visibility control

#### Activity AUTH-02-006: Account Lockout
**Priority:** Medium  
**Description:** Security lockout mechanisms

**Key Features:**
- Failed login attempt tracking
- Progressive lockout timing
- Admin unlock capability
- Security notification system

#### Activity AUTH-02-007: Email/Phone Verification
**Priority:** Medium  
**Description:** Contact verification system

**Key Features:**
- Email verification workflow
- Phone OTP verification
- Verification status tracking
- Re-verification triggers

#### Activity AUTH-02-008: Password Reset Flows
**Priority:** Medium  
**Description:** Self-service password reset

**Key Features:**
- Email-based reset links
- Security question backup
- Password policy enforcement
- Reset attempt limiting

#### Activity AUTH-02-009: Auth Event Logging
**Priority:** High  
**Description:** Authentication event auditing

**Key Features:**
- Login/logout tracking
- Failed attempt logging
- Security event monitoring
- Compliance reporting

#### Activity AUTH-02-010: API Keys/Tokens
**Priority:** Medium  
**Description:** API access management

**Key Features:**
- API key generation
- Rate limiting per token
- Usage analytics
- Token lifecycle management

---

## MODULE 3: USER (User Management)
**Module Code:** USER  
**Total Activities:** 6  
**Sprint Priority:** 3

### USER MANAGEMENT ACTIVITIES (6 activities)

#### Activity USER-03-001: User CRUD Operations
**Priority:** Critical  
**Description:** Complete user management system

**Key Features:**
- User creation, update, deletion
- Bulk user import/export
- Profile photo management
- Status change workflows

#### Activity USER-03-002: User Profile Management
**Priority:** High  
**Description:** Self-service profile management

**Key Features:**
- Personal information updates
- Contact detail management
- Profile photo upload
- Privacy settings

#### Activity USER-03-003: Staff Management
**Priority:** High  
**Description:** Staff-specific management features

**Key Features:**
- Employee ID generation
- Designation management
- Department assignments
- Qualification tracking

#### Activity USER-03-004: Parent-Student Linking
**Priority:** High  
**Description:** Family relationship management

**Key Features:**
- Parent-child relationship setup
- Multiple parent support
- Guardian management
- Emergency contact system

#### Activity USER-03-005: User Import/Export
**Priority:** Medium  
**Description:** Bulk user data operations

**Key Features:**
- Excel/CSV import
- Data validation and cleanup
- Export with custom fields
- Template generation

#### Activity USER-03-006: User Analytics Dashboard
**Priority:** Low  
**Description:** User management analytics

**Key Features:**
- User registration trends
- Active user metrics
- Role distribution analysis
- Usage pattern insights

---

## MODULE 4: STUD (Student Management)
**Module Code:** STUD  
**Total Activities:** 8  
**Sprint Priority:** 4

### STUDENT MANAGEMENT SCHEMA

```sql
-- Main students table
CREATE TABLE students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    trust_id INT NOT NULL,
    school_id INT NOT NULL,
    
    -- Student Identification
    student_id VARCHAR(50) NOT NULL, -- Auto-generated unique ID
    admission_number VARCHAR(50),
    roll_number VARCHAR(20),
    
    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    gender ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    date_of_birth DATE NOT NULL,
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'),
    
    -- Academic Information
    current_class_id INT NOT NULL,
    current_section_id INT,
    admission_date DATE NOT NULL,
    admission_class_id INT NOT NULL, -- Original admission class
    house_id INT,
    
    -- Category & Government IDs
    category ENUM('GENERAL', 'OBC', 'SC', 'ST', 'EWS') NOT NULL,
    aadhar_number VARCHAR(12) UNIQUE,
    
    -- Family Information
    father_name VARCHAR(200),
    mother_name VARCHAR(200),
    guardian_name VARCHAR(200),
    
    -- Address
    permanent_address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    
    -- Status
    status ENUM('ACTIVE', 'INACTIVE', 'TRANSFERRED', 'GRADUATED') DEFAULT 'ACTIVE',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (trust_id) REFERENCES trusts(id),
    FOREIGN KEY (school_id) REFERENCES schools(id),
    FOREIGN KEY (current_class_id) REFERENCES classes(id),
    FOREIGN KEY (current_section_id) REFERENCES sections(id),
    FOREIGN KEY (house_id) REFERENCES houses(id),
    
    UNIQUE KEY uk_student_id (trust_id, student_id),
    UNIQUE KEY uk_admission_number (school_id, admission_number),
    INDEX idx_current_class (current_class_id),
    INDEX idx_status (status),
    INDEX idx_admission_date (admission_date)
);

-- Student-parent relationships
CREATE TABLE student_parents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    parent_user_id INT NOT NULL,
    
    relationship ENUM('FATHER', 'MOTHER', 'GUARDIAN') NOT NULL,
    is_primary_contact BOOLEAN DEFAULT FALSE,
    is_emergency_contact BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_user_id) REFERENCES users(id),
    
    UNIQUE KEY uk_student_parent_relation (student_id, parent_user_id, relationship),
    INDEX idx_primary_contact (is_primary_contact)
);

-- Student transfers and promotions
CREATE TABLE student_transfers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    
    -- Transfer Details
    transfer_type ENUM('PROMOTION', 'TRANSFER_WITHIN_TRUST', 'TRANSFER_EXTERNAL') NOT NULL,
    
    -- From
    from_school_id INT NOT NULL,
    from_class_id INT NOT NULL,
    from_section_id INT,
    
    -- To
    to_school_id INT,
    to_class_id INT,
    to_section_id INT,
    
    -- Transfer Information
    transfer_date DATE NOT NULL,
    academic_year_id INT NOT NULL,
    reason TEXT,
    
    -- External Transfer Details
    external_school_name VARCHAR(200),
    external_school_address TEXT,
    
    -- Approval
    approved_by INT NOT NULL,
    approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (from_school_id) REFERENCES schools(id),
    FOREIGN KEY (to_school_id) REFERENCES schools(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    
    INDEX idx_transfer_date (transfer_date),
    INDEX idx_student_transfers (student_id)
);
```

### STUD MODULE ACTIVITIES (8 activities)

#### Activity STUD-04-001: Student Admission System
**Priority:** Critical  
**Description:** Complete student admission workflow

**Key Features:**
- Online admission forms
- Document upload and verification
- Admission number generation
- Fee structure assignment

#### Activity STUD-04-002: Student Profile Management
**Priority:** Critical  
**Description:** Comprehensive student profiles

**Key Features:**
- Personal information management
- Academic history tracking
- Medical information
- Emergency contacts

#### Activity STUD-04-003: Student-Parent Linking
**Priority:** High  
**Description:** Family relationship management

**Key Features:**
- Multiple parent linking
- Guardian designation
- Contact hierarchy
- Communication preferences

#### Activity STUD-04-004: Class Assignments
**Priority:** High  
**Description:** Student class and section management

**Key Features:**
- Class assignment workflow
- Section balancing
- Capacity management
- House assignment

#### Activity STUD-04-005: Promotion System
**Priority:** High  
**Description:** Year-end promotion management

**Key Features:**
- Bulk promotion processing
- Criteria-based promotion
- Exception handling
- Academic record updates

#### Activity STUD-04-006: Transfer Management
**Priority:** Medium  
**Description:** Student transfer handling

**Key Features:**
- Internal transfer workflow
- External transfer certificates
- Record maintenance
- Compliance documentation

#### Activity STUD-04-007: Student Reports
**Priority:** Medium  
**Description:** Student-centric reporting

**Key Features:**
- Academic progress reports
- Attendance summaries
- Fee payment history
- Custom report generation

#### Activity STUD-04-008: Student Analytics
**Priority:** Low  
**Description:** Student data analytics

**Key Features:**
- Enrollment trends
- Demographic analysis
- Performance metrics
- Predictive analytics

---

## MODULE 5: FEES (Fee Collection Operations)
**Module Code:** FEES  
**Total Activities:** 10  
**Sprint Priority:** 5

### FEE COLLECTION FRAMEWORK

#### Configuration Strategy
- **Scope:** School-level configuration (each school configures independently)
- **Payment Methods:** All options via configuration (cash/cheque/online/UPI)
- **Configuration Trigger:** Automatic wizard when first fee structure is created
- **Receipt System:** Configurable formats + government compliance options

### FEE COLLECTION DATABASE SCHEMA

```sql
-- Trust-level fee templates (reusable across schools)
CREATE TABLE trust_fee_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    trust_id INT NOT NULL,
    template_name VARCHAR(100) NOT NULL,
    template_code VARCHAR(20) NOT NULL,
    board_type ENUM('CBSE', 'ICSE', 'STATE', 'GENERAL'),
    level_type ENUM('PRE_PRIMARY', 'PRIMARY', 'SECONDARY', 'SENIOR_SEC'),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (trust_id) REFERENCES trusts(id),
    UNIQUE KEY uk_trust_template_code (trust_id, template_code)
);

-- Fee components within templates
CREATE TABLE trust_fee_components (
    id INT PRIMARY KEY AUTO_INCREMENT,
    template_id INT NOT NULL,
    component_name VARCHAR(100) NOT NULL,
    component_code VARCHAR(20) NOT NULL,
    component_type ENUM('MANDATORY', 'OPTIONAL', 'CONDITIONAL') NOT NULL,
    frequency ENUM('MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL', 'ONE_TIME') NOT NULL,
    base_amount DECIMAL(10,2) NOT NULL,
    gst_applicable BOOLEAN DEFAULT FALSE,
    gst_rate DECIMAL(4,2) DEFAULT 0.00,
    hsn_code VARCHAR(20),
    display_order INT DEFAULT 0,
    
    FOREIGN KEY (template_id) REFERENCES trust_fee_templates(id),
    INDEX idx_template_order (template_id, display_order)
);

-- School-specific fee structures (copied from templates)
CREATE TABLE school_fee_structures (
    id INT PRIMARY KEY AUTO_INCREMENT,
    school_id INT NOT NULL,
    class_id INT NOT NULL,
    academic_year_id INT NOT NULL,
    admission_year INT NOT NULL, -- KEY: Year when student was admitted (fee freeze)
    
    structure_name VARCHAR(100) NOT NULL,
    copied_from_template_id INT,
    
    total_annual_fee DECIMAL(12,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (school_id) REFERENCES schools(id),
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (copied_from_template_id) REFERENCES trust_fee_templates(id),
    
    UNIQUE KEY uk_school_class_year_admission (school_id, class_id, academic_year_id, admission_year),
    INDEX idx_admission_year (admission_year)
);

-- Fee components for school structures
CREATE TABLE school_fee_components (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fee_structure_id INT NOT NULL,
    component_name VARCHAR(100) NOT NULL,
    component_code VARCHAR(20) NOT NULL,
    component_type ENUM('MANDATORY', 'OPTIONAL', 'CONDITIONAL') NOT NULL,
    frequency ENUM('MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL', 'ONE_TIME') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    gst_applicable BOOLEAN DEFAULT FALSE,
    gst_rate DECIMAL(4,2) DEFAULT 0.00,
    
    installment_config JSON,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (fee_structure_id) REFERENCES school_fee_structures(id),
    INDEX idx_structure_order (fee_structure_id, display_order)
);

-- Student fee assignments
CREATE TABLE student_fee_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    fee_structure_id INT NOT NULL,
    academic_year_id INT NOT NULL,
    
    -- Discounts and Concessions
    concessions_applied JSON,
    total_discount_amount DECIMAL(10,2) DEFAULT 0.00,
    
    -- Payment Status
    total_fee_amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) DEFAULT 0.00,
    pending_amount DECIMAL(12,2) NOT NULL,
    
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INT NOT NULL,
    
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (fee_structure_id) REFERENCES school_fee_structures(id),
    FOREIGN KEY (assigned_by) REFERENCES users(id),
    
    UNIQUE KEY uk_student_fee_year (student_id, academic_year_id),
    INDEX idx_pending_amount (pending_amount)
);

-- Individual fee payments
CREATE TABLE fee_payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    academic_year_id INT NOT NULL,
    school_id INT NOT NULL,
    
    -- Payment Details
    payment_reference VARCHAR(100) NOT NULL UNIQUE,
    payment_date DATE NOT NULL,
    payment_method ENUM('CASH', 'CHEQUE', 'ONLINE', 'UPI', 'DD') NOT NULL,
    
    -- Method-specific Details
    cheque_number VARCHAR(50),
    bank_name VARCHAR(100),
    transaction_id VARCHAR(100),
    
    -- Amounts
    gross_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    late_fee_amount DECIMAL(10,2) DEFAULT 0.00,
    net_amount DECIMAL(10,2) NOT NULL,
    
    -- Components Breakdown
    fee_components_paid JSON, -- Which components were paid
    
    -- Status
    payment_status ENUM('PENDING', 'VERIFIED', 'CLEARED', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
    
    -- Receipt Information
    receipt_number VARCHAR(50) NOT NULL,
    receipt_printed BOOLEAN DEFAULT FALSE,
    
    -- Reconciliation
    bank_reconciled BOOLEAN DEFAULT FALSE,
    reconciled_at TIMESTAMP NULL,
    
    collected_by INT NOT NULL,
    verified_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (collected_by) REFERENCES users(id),
    FOREIGN KEY (verified_by) REFERENCES users(id),
    
    INDEX idx_student_academic_year (student_id, academic_year_id),
    INDEX idx_payment_date (payment_date),
    INDEX idx_payment_status (payment_status),
    INDEX idx_receipt_number (receipt_number)
);

-- Late fee policies
CREATE TABLE late_fee_policies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    trust_id INT NOT NULL,
    school_id INT,
    policy_name VARCHAR(100) NOT NULL,
    policy_code VARCHAR(20) NOT NULL,
    
    calculation_method ENUM('FLAT', 'PERCENTAGE', 'SLAB', 'DAILY', 'COMPOUND') NOT NULL,
    
    -- Configuration based on method
    flat_amount DECIMAL(8,2) DEFAULT 0,
    percentage_rate DECIMAL(5,2) DEFAULT 0,
    slab_config JSON, -- For slab-based calculation
    daily_rate DECIMAL(8,2) DEFAULT 0,
    max_late_fee DECIMAL(10,2),
    grace_period_days INT DEFAULT 0,
    
    -- Applicability
    applicable_fee_components JSON,
    applicable_fee_frequencies JSON,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (trust_id) REFERENCES trusts(id),
    FOREIGN KEY (school_id) REFERENCES schools(id),
    UNIQUE KEY uk_policy_code_scope (trust_id, school_id, policy_code)
);

-- Concession/discount types
CREATE TABLE trust_concession_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    trust_id INT NOT NULL,
    concession_code VARCHAR(20) NOT NULL,
    concession_name VARCHAR(100) NOT NULL,
    concession_type ENUM('PERCENTAGE', 'FIXED_AMOUNT', 'COMPONENT_WISE') NOT NULL,
    
    -- Discount Configuration
    discount_value DECIMAL(8,2),
    max_discount_amount DECIMAL(10,2),
    applicable_components JSON,
    
    -- Application Rules
    auto_apply BOOLEAN DEFAULT FALSE,
    requires_approval BOOLEAN DEFAULT TRUE,
    approval_authority ENUM('SCHOOL_ADMIN', 'TRUST_ADMIN', 'SYSTEM_ADMIN') DEFAULT 'SCHOOL_ADMIN',
    stackable BOOLEAN DEFAULT TRUE, -- Can combine with other concessions
    
    -- Eligibility
    eligibility_criteria JSON,
    max_beneficiaries_per_family INT DEFAULT NULL,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (trust_id) REFERENCES trusts(id),
    UNIQUE KEY uk_trust_concession_code (trust_id, concession_code)
);

-- School fee collection configuration
CREATE TABLE school_fee_collection_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    school_id INT NOT NULL,
    
    -- Payment Methods Configuration
    payment_methods JSON NOT NULL, -- ['CASH', 'CHEQUE', 'ONLINE', 'UPI']
    online_payment_enabled BOOLEAN DEFAULT FALSE,
    
    -- Gateway Configuration
    razorpay_enabled BOOLEAN DEFAULT FALSE,
    razorpay_key_id VARCHAR(100),
    razorpay_webhook_secret VARCHAR(255),
    
    -- Collection Rules
    allow_partial_payments BOOLEAN DEFAULT TRUE,
    auto_add_late_fee BOOLEAN DEFAULT TRUE,
    late_fee_policy_id INT,
    
    -- Receipt Configuration
    receipt_format ENUM('BASIC', 'DETAILED', 'CUSTOM') DEFAULT 'DETAILED',
    include_govt_compliance_fields BOOLEAN DEFAULT TRUE,
    custom_receipt_template TEXT,
    
    -- Bank Configuration
    bank_accounts_config JSON,
    
    configured_by INT NOT NULL,
    configured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (school_id) REFERENCES schools(id),
    FOREIGN KEY (late_fee_policy_id) REFERENCES late_fee_policies(id),
    UNIQUE KEY uk_school_config (school_id)
);
```

### FEES MODULE ACTIVITIES (10 activities)

#### Activity FEES-05-001: Fee Structure Creation
**Priority:** Critical  
**Description:** Complete fee structure management

**Key Features:**
- Template-based fee structures
- Component-wise fee definition
- Academic year associations
- Admission year fee freeze

#### Activity FEES-05-002: Student Fee Assignment
**Priority:** Critical  
**Description:** Assign fee structures to students

**Key Features:**
- Bulk assignment workflows
- Individual assignments
- Mid-year adjustments
- Fee calculation engine

#### Activity FEES-05-003: Fee Collection Interface
**Priority:** Critical  
**Description:** Payment collection system

**Key Features:**
- Multi-payment method support
- Receipt generation
- Payment verification
- Refund management

#### Activity FEES-05-004: Online Payment Integration
**Priority:** High  
**Description:** Digital payment processing

**Key Features:**
- Razorpay integration
- UPI payment support
- Payment gateway management
- Webhook handling

#### Activity FEES-05-005: Discount & Concession Management
**Priority:** High  
**Description:** Flexible discount system

**Key Features:**
- Multiple concession types
- Approval workflows
- Family-level discounts
- Merit-based concessions

#### Activity FEES-05-006: Late Fee Management
**Priority:** Medium  
**Description:** Automated late fee calculation

**Key Features:**
- Configurable policies
- Grace period support
- Progressive penalties
- Waiver management

#### Activity FEES-05-007: Fee Reports & Analytics
**Priority:** Medium  
**Description:** Financial reporting system

**Key Features:**
- Collection reports
- Outstanding analysis
- Payment trends
- Government compliance reports

#### Activity FEES-05-008: Receipt Management
**Priority:** Medium  
**Description:** Receipt generation and management

**Key Features:**
- Custom receipt formats
- Bulk receipt generation
- Digital receipts
- Government compliance fields

#### Activity FEES-05-009: Bank Reconciliation
**Priority:** Medium  
**Description:** Payment reconciliation system

**Key Features:**
- Bank statement import
- Auto-matching algorithms
- Manual reconciliation
- Discrepancy reporting

#### Activity FEES-05-010: Fee Forecasting
**Priority:** Low  
**Description:** Financial planning and forecasting

**Key Features:**
- Revenue projections
- Collection pattern analysis
- Cash flow forecasting
- Budget planning support

---

## MODULE 6: ATTD (Attendance Management)
**Module Code:** ATTD  
**Total Activities:** 4  
**Sprint Priority:** 6

### ATTENDANCE FRAMEWORK

#### Configuration Strategy
- **Scope:** Trust-level configuration with school-specific overrides
- **Input Methods:** Web-based, mobile-first, offline-capable with sync
- **Framework:** Complete attendance configuration including timing, categories, compliance
- **Validation:** Multi-level system with approval workflows

### ATTENDANCE DATABASE SCHEMA

```sql
-- Trust-level attendance configuration
CREATE TABLE trust_attendance_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    trust_id INT NOT NULL,
    
    -- Input Method Configuration
    enabled_input_methods JSON NOT NULL, -- ['WEB', 'MOBILE', 'OFFLINE', 'BULK_IMPORT']
    default_input_method ENUM('WEB', 'MOBILE', 'OFFLINE') DEFAULT 'WEB',
    
    -- Timing Rules
    attendance_sessions JSON, -- [{"name": "Morning", "start": "09:00", "end": "12:00"}]
    late_arrival_grace_period_minutes INT DEFAULT 15,
    early_departure_grace_period_minutes INT DEFAULT 15,
    
    -- Attendance Categories with Codes
    attendance_categories JSON, -- [{"code": "P", "name": "Present"}, {"code": "A", "name": "Absent"}]
    default_present_category VARCHAR(10) DEFAULT 'P',
    default_absent_category VARCHAR(10) DEFAULT 'A',
    
    -- Working Days Configuration
    working_days JSON, -- ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
    
    -- Minimum Attendance Requirements
    minimum_attendance_percentage DECIMAL(5,2) DEFAULT 75.00,
    
    -- Correction Rules
    allow_same_day_correction BOOLEAN DEFAULT TRUE,
    correction_cutoff_hours INT DEFAULT 24,
    require_admin_approval_after_hours INT DEFAULT 72,
    
    -- Government Compliance
    state_compliance_template VARCHAR(50), -- 'CBSE', 'MAHARASHTRA_STATE', etc.
    regulatory_reporting_enabled BOOLEAN DEFAULT TRUE,
    
    configured_by INT NOT NULL,
    configured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (trust_id) REFERENCES trusts(id),
    UNIQUE KEY uk_trust_config (trust_id)
);

-- School-specific attendance overrides
CREATE TABLE school_attendance_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    school_id INT NOT NULL,
    
    -- Override trust settings
    attendance_sessions JSON,
    working_days JSON,
    minimum_attendance_percentage DECIMAL(5,2),
    
    -- School-specific settings
    biometric_integration BOOLEAN DEFAULT FALSE,
    rfid_integration BOOLEAN DEFAULT FALSE,
    parent_notification_enabled BOOLEAN DEFAULT TRUE,
    
    configured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (school_id) REFERENCES schools(id),
    UNIQUE KEY uk_school_config (school_id)
);

-- Daily attendance records
CREATE TABLE attendance_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    school_id INT NOT NULL,
    class_id INT NOT NULL,
    section_id INT NOT NULL,
    academic_year_id INT NOT NULL,
    
    attendance_date DATE NOT NULL,
    session_name VARCHAR(20) NOT NULL, -- 'Morning', 'Afternoon'
    
    status ENUM('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'MEDICAL_LEAVE', 'AUTHORIZED_LEAVE') NOT NULL,
    status_code CHAR(2) NOT NULL, -- 'P', 'A', 'L', 'H', 'M', 'AL'
    
    -- Timing Information
    arrival_time TIME NULL,
    departure_time TIME NULL,
    
    marked_at TIMESTAMP NOT NULL,
    marked_by INT NOT NULL,
    marking_method ENUM('WEB', 'MOBILE', 'OFFLINE_SYNC', 'BULK_IMPORT', 'BIOMETRIC') NOT NULL,
    
    remarks TEXT,
    
    -- Correction Tracking
    is_corrected BOOLEAN DEFAULT FALSE,
    original_status VARCHAR(20),
    corrected_by INT,
    corrected_at TIMESTAMP NULL,
    correction_reason TEXT,
    correction_approved_by INT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (marked_by) REFERENCES users(id),
    FOREIGN KEY (corrected_by) REFERENCES users(id),
    
    UNIQUE KEY uk_student_date_session (student_id, attendance_date, session_name),
    INDEX idx_class_section_date (class_id, section_id, attendance_date),
    INDEX idx_attendance_date (attendance_date),
    INDEX idx_marked_by (marked_by)
);

-- Attendance summaries (cached for performance)
CREATE TABLE attendance_summaries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    academic_year_id INT NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    
    total_working_days INT NOT NULL,
    present_days INT DEFAULT 0,
    absent_days INT DEFAULT 0,
    late_days INT DEFAULT 0,
    half_days INT DEFAULT 0,
    medical_leave_days INT DEFAULT 0,
    authorized_leave_days INT DEFAULT 0,
    
    attendance_percentage DECIMAL(5,2) NOT NULL,
    
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES students(id),
    UNIQUE KEY uk_student_month_year (student_id, academic_year_id, month, year),
    INDEX idx_attendance_percentage (attendance_percentage)
);

-- Attendance notifications and alerts
CREATE TABLE attendance_alerts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    school_id INT NOT NULL,
    alert_type ENUM('LOW_ATTENDANCE', 'CONSECUTIVE_ABSENT', 'LATE_PATTERN') NOT NULL,
    
    alert_data JSON,
    threshold_value DECIMAL(5,2),
    current_value DECIMAL(5,2),
    
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_channels JSON, -- ['EMAIL', 'SMS', 'IN_APP']
    
    FOREIGN KEY (student_id) REFERENCES students(id),
    INDEX idx_alert_type (alert_type),
    INDEX idx_triggered_at (triggered_at)
);
```

### ATTD MODULE ACTIVITIES (4 activities)

#### Activity ATTD-06-001: Attendance Configuration System
**Priority:** Critical  
**Description:** Complete attendance system configuration

**Key Features:**
- Trust-level configuration
- School-specific overrides
- Session and timing setup
- Compliance template selection

#### Activity ATTD-06-002: Daily Attendance Marking
**Priority:** Critical  
**Description:** Multi-method attendance capture

**Key Features:**
- Web-based marking interface
- Mobile-responsive design
- Bulk marking tools
- Offline capability with sync

#### Activity ATTD-06-003: Attendance Reports & Compliance
**Priority:** High  
**Description:** Comprehensive reporting system

**Key Features:**
- Daily/monthly/annual reports
- Government compliance formats
- Low attendance alerts
- Parent notification system

#### Activity ATTD-06-004: Attendance Analytics
**Priority:** Medium  
**Description:** Advanced attendance analytics

**Key Features:**
- Pattern recognition
- Trend analysis
- Predictive alerts
- Comparative analytics

---

## MODULE 7: REPT (Reports Generation)
**Module Code:** REPT  
**Total Activities:** 6  
**Sprint Priority:** 7

### REPORTS FRAMEWORK

#### Configuration Strategy
- **Generation:** Hybrid approach (real-time current + cached historical)
- **Customization:** Configurable templates with custom fields and filters
- **Export Formats:** Government-ready suite with compliance automation
- **Caching:** Historical data cached, current period real-time

### REPORTS DATABASE SCHEMA

```sql
-- Report templates and definitions
CREATE TABLE report_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    trust_id INT NOT NULL,
    school_id INT,
    
    template_name VARCHAR(200) NOT NULL,
    template_code VARCHAR(50) NOT NULL,
    template_category ENUM('ACADEMIC', 'ATTENDANCE', 'FINANCIAL', 'COMPLIANCE', 'ADMINISTRATIVE') NOT NULL,
    
    -- Template Configuration
    base_query TEXT NOT NULL,
    configurable_fields JSON, -- Dynamic field selection
    filter_options JSON, -- Available filters
    grouping_options JSON, -- Group by options
    sorting_options JSON, -- Sort options
    
    -- Output Configuration
    supported_formats JSON, -- ['PDF', 'EXCEL', 'CSV', 'HTML']
    default_format ENUM('PDF', 'EXCEL', 'CSV', 'HTML') DEFAULT 'PDF',
    
    -- Layout Configuration
    header_template TEXT,
    footer_template TEXT,
    custom_css TEXT,
    
    -- Compliance Settings
    government_compliance_template BOOLEAN DEFAULT FALSE,
    compliance_authority VARCHAR(100), -- 'CBSE', 'ICSE', 'State Board'
    submission_frequency ENUM('MONTHLY', 'QUARTERLY', 'ANNUAL'),
    
    -- Permissions
    allowed_roles JSON,
    is_public BOOLEAN DEFAULT FALSE,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (trust_id) REFERENCES trusts(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    
    UNIQUE KEY uk_trust_template_code (trust_id, template_code),
    INDEX idx_category (template_category)
);

-- Generated reports cache
CREATE TABLE report_cache (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    template_id INT NOT NULL,
    
    cache_key VARCHAR(255) NOT NULL UNIQUE,
    generation_parameters JSON, -- Filters, date ranges, etc.
    
    -- Data Period
    data_period_start DATE,
    data_period_end DATE,
    
    -- Output
    file_path VARCHAR(500) NOT NULL,
    file_format ENUM('PDF', 'EXCEL', 'CSV', 'HTML') NOT NULL,
    file_size_bytes BIGINT,
    
    -- Performance Metrics
    generation_time_seconds DECIMAL(8,3),
    record_count INT,
    query_count INT,
    
    -- Cache Management
    expires_at TIMESTAMP,
    accessed_count INT DEFAULT 0,
    last_accessed_at TIMESTAMP,
    
    generated_by INT NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (template_id) REFERENCES report_templates(id),
    
    INDEX idx_cache_key (cache_key),
    INDEX idx_expires_at (expires_at),
    INDEX idx_template_generation (template_id, generated_at)
);

-- Report generation queue
CREATE TABLE report_generation_queue (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    template_id INT NOT NULL,
    
    request_parameters JSON,
    priority ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT') DEFAULT 'NORMAL',
    
    status ENUM('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED') DEFAULT 'QUEUED',
    progress_percentage INT DEFAULT 0,
    
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    error_message TEXT,
    
    output_file_path VARCHAR(500),
    
    requested_by INT NOT NULL,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (template_id) REFERENCES report_templates(id),
    FOREIGN KEY (requested_by) REFERENCES users(id),
    
    INDEX idx_status (status),
    INDEX idx_priority_requested (priority, requested_at)
);

-- Scheduled reports
CREATE TABLE scheduled_reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    template_id INT NOT NULL,
    
    schedule_name VARCHAR(200) NOT NULL,
    schedule_expression VARCHAR(100) NOT NULL, -- Cron expression
    
    generation_parameters JSON,
    output_format ENUM('PDF', 'EXCEL', 'CSV', 'HTML') DEFAULT 'PDF',
    
    -- Recipients
    email_recipients JSON,
    notification_message TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_run_at TIMESTAMP NULL,
    next_run_at TIMESTAMP NULL,
    last_run_status ENUM('SUCCESS', 'FAILED') NULL,
    
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (template_id) REFERENCES report_templates(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    
    INDEX idx_next_run (next_run_at),
    INDEX idx_active (is_active)
);

-- Government report submissions
CREATE TABLE government_report_submissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    template_id INT NOT NULL,
    school_id INT NOT NULL,
    
    -- Submission Details
    authority VARCHAR(100) NOT NULL,
    submission_type VARCHAR(100) NOT NULL,
    submission_period VARCHAR(50) NOT NULL,
    
    -- Report Information
    report_file_path VARCHAR(500) NOT NULL,
    submission_data JSON,
    
    -- Status Tracking
    submission_status ENUM('PENDING', 'SUBMITTED', 'ACKNOWLEDGED', 'REJECTED') DEFAULT 'PENDING',
    submission_reference VARCHAR(100),
    
    submitted_at TIMESTAMP NULL,
    acknowledged_at TIMESTAMP NULL,
    rejection_reason TEXT,
    
    submitted_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (template_id) REFERENCES report_templates(id),
    FOREIGN KEY (school_id) REFERENCES schools(id),
    FOREIGN KEY (submitted_by) REFERENCES users(id),
    
    INDEX idx_submission_status (submission_status),
    INDEX idx_authority_period (authority, submission_period)
);
```

### REPT MODULE ACTIVITIES (6 activities)

#### Activity REPT-07-001: Report Template Engine
**Priority:** Critical  
**Description:** Flexible report template system

**Key Features:**
- Template designer interface
- Dynamic field selection
- Custom formatting options
- Government compliance templates

#### Activity REPT-07-002: Academic Reports
**Priority:** High  
**Description:** Student academic reporting

**Key Features:**
- Progress reports
- Grade sheets
- Transcript generation
- Performance analytics

#### Activity REPT-07-003: Financial Reports
**Priority:** High  
**Description:** Fee and financial reporting

**Key Features:**
- Fee collection reports
- Outstanding summaries
- Financial statements
- Audit reports

#### Activity REPT-07-004: Attendance Reports
**Priority:** High  
**Description:** Comprehensive attendance reporting

**Key Features:**
- Daily attendance sheets
- Monthly summaries
- Low attendance alerts
- Government compliance reports

#### Activity REPT-07-005: Government Compliance Reports
**Priority:** Medium  
**Description:** Regulatory reporting automation

**Key Features:**
- State board reports
- CBSE compliance
- Enrollment statistics
- Automated submissions

#### Activity REPT-07-006: Custom Report Builder
**Priority:** Low  
**Description:** User-customizable reporting

**Key Features:**
- Drag-and-drop report builder
- Custom SQL support
- Advanced analytics
- Dashboard integration

---

## MODULE 8: DASH (Role-based Dashboards)
**Module Code:** DASH  
**Total Activities:** 3  
**Sprint Priority:** 8

### DASHBOARD FRAMEWORK

#### Configuration Strategy
- **Complexity:** Advanced analytics with interactive charts and predictions
- **Customization:** Configurable widgets (show/hide/rearrange)
- **Widget System:** Pre-built library with role-based access
- **Performance:** Real-time current data + cached historical data

### DASHBOARD DATABASE SCHEMA

```sql
-- Dashboard widget definitions
CREATE TABLE dashboard_widgets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    trust_id INT NOT NULL,
    
    widget_code VARCHAR(50) NOT NULL,
    widget_name VARCHAR(200) NOT NULL,
    widget_category ENUM('ANALYTICS', 'STATISTICS', 'CHARTS', 'TABLES', 'ALERTS') NOT NULL,
    
    -- Widget Configuration
    data_source_query TEXT NOT NULL,
    data_source_type ENUM('SQL', 'API', 'CALCULATED') DEFAULT 'SQL',
    refresh_interval_seconds INT DEFAULT 300,
    cache_duration_seconds INT DEFAULT 600,
    
    -- Visualization Settings
    chart_type ENUM('BAR', 'LINE', 'PIE', 'GAUGE', 'NUMBER', 'TABLE', 'HEATMAP') NOT NULL,
    chart_config JSON, -- Chart.js configuration
    
    -- Data Processing
    aggregation_function ENUM('SUM', 'COUNT', 'AVG', 'MAX', 'MIN', 'CUSTOM'),
    filter_options JSON,
    drill_down_config JSON,
    
    -- Access Control
    allowed_roles JSON, -- ['TRUST_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']
    school_specific BOOLEAN DEFAULT FALSE,
    
    -- Layout Properties
    default_width INT DEFAULT 6, -- Bootstrap grid columns
    default_height INT DEFAULT 4,
    min_width INT DEFAULT 3,
    min_height INT DEFAULT 2,
    
    -- Alerts Configuration
    alert_thresholds JSON,
    alert_notifications JSON,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (trust_id) REFERENCES trusts(id),
    
    UNIQUE KEY uk_trust_widget_code (trust_id, widget_code),
    INDEX idx_category (widget_category)
);

-- User dashboard layouts
CREATE TABLE user_dashboard_layouts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    layout_name VARCHAR(100) NOT NULL,
    
    is_default BOOLEAN DEFAULT FALSE,
    is_shared BOOLEAN DEFAULT FALSE,
    
    -- Grid Layout Configuration
    widget_positions JSON NOT NULL, -- [{"widget_id": 1, "x": 0, "y": 0, "w": 6, "h": 4}]
    hidden_widgets JSON, -- Widget IDs that are hidden
    widget_overrides JSON, -- Per-widget customizations
    
    -- Layout Metadata
    layout_description TEXT,
    shared_with_roles JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    
    UNIQUE KEY uk_user_layout_name (user_id, layout_name),
    INDEX idx_shared (is_shared)
);

-- Widget data cache
CREATE TABLE widget_data_cache (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    widget_id INT NOT NULL,
    school_id INT,
    
    cache_key VARCHAR(255) NOT NULL,
    filter_parameters JSON,
    
    cached_data JSON NOT NULL,
    data_timestamp TIMESTAMP NOT NULL,
    
    expires_at TIMESTAMP NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (widget_id) REFERENCES dashboard_widgets(id),
    
    INDEX idx_cache_key (cache_key),
    INDEX idx_expires_at (expires_at),
    INDEX idx_widget_school (widget_id, school_id)
);

-- Dashboard analytics
CREATE TABLE dashboard_usage_analytics (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    widget_id INT NOT NULL,
    school_id INT,
    
    action_type ENUM('VIEW', 'FILTER', 'DRILL_DOWN', 'EXPORT') NOT NULL,
    action_data JSON,
    
    session_id VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (widget_id) REFERENCES dashboard_widgets(id),
    
    INDEX idx_user_widget (user_id, widget_id),
    INDEX idx_created_at (created_at)
);
```

### DASH MODULE ACTIVITIES (3 activities)

#### Activity DASH-08-001: Dashboard Widget Library
**Priority:** Critical  
**Description:** Pre-built widget collection

**Key Features:**
- Student enrollment widgets
- Fee collection analytics
- Attendance trend charts
- Performance metrics

#### Activity DASH-08-002: Custom Dashboard Builder
**Priority:** High  
**Description:** User-customizable dashboards

**Key Features:**
- Drag-and-drop interface
- Layout persistence
- Widget configuration
- Share and export capabilities

#### Activity DASH-08-003: Real-time Analytics Engine
**Priority:** Medium  
**Description:** Real-time data processing

**Key Features:**
- Live data updates
- Performance monitoring
- Alert system
- Predictive analytics

---

## MODULE 9: COMM (Communication System)
**Module Code:** COMM  
**Total Activities:** 4  
**Sprint Priority:** 9

### COMMUNICATION FRAMEWORK

#### Configuration Strategy
- **Channels:** Multi-channel (Email/SMS/WhatsApp/In-app) with tenant configuration
- **Templates:** Rich HTML editor with multilingual support and A/B testing
- **Automation:** Smart rule-based workflows with escalation chains
- **Parent Response:** Bidirectional communication with response handling

### COMMUNICATION DATABASE SCHEMA

```sql
-- Trust communication configuration
CREATE TABLE trust_communication_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    trust_id INT NOT NULL,
    
    -- Enabled Channels
    email_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    whatsapp_enabled BOOLEAN DEFAULT FALSE,
    push_notification_enabled BOOLEAN DEFAULT TRUE,
    
    -- Email Configuration
    smtp_host VARCHAR(255),
    smtp_port INT DEFAULT 587,
    smtp_username VARCHAR(255),
    smtp_password_encrypted TEXT,
    from_email VARCHAR(255),
    from_name VARCHAR(200),
    
    -- SMS Configuration
    sms_provider ENUM('TWILIO', 'MSG91', 'TEXTLOCAL', 'FAST2SMS') DEFAULT 'MSG91',
    sms_api_key_encrypted TEXT,
    sms_sender_id VARCHAR(10),
    
    -- WhatsApp Configuration
    whatsapp_business_api_enabled BOOLEAN DEFAULT FALSE,
    whatsapp_api_key_encrypted TEXT,
    whatsapp_phone_number VARCHAR(15),
    
    -- Rate Limiting
    email_rate_limit_per_hour INT DEFAULT 1000,
    sms_rate_limit_per_hour INT DEFAULT 100,
    whatsapp_rate_limit_per_hour INT DEFAULT 50,
    
    -- Delivery Preferences
    delivery_retry_attempts INT DEFAULT 3,
    delivery_retry_interval_minutes INT DEFAULT 5,
    
    configured_by INT NOT NULL,
    configured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (trust_id) REFERENCES trusts(id),
    UNIQUE KEY uk_trust_config (trust_id)
);

-- Communication templates
CREATE TABLE communication_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    trust_id INT NOT NULL,
    school_id INT,
    
    template_name VARCHAR(200) NOT NULL,
    template_code VARCHAR(50) NOT NULL,
    template_category ENUM('FEE_REMINDER', 'ATTENDANCE_ALERT', 'ANNOUNCEMENT', 'EMERGENCY_ALERT', 'ACADEMIC_UPDATE', 'EVENT_NOTIFICATION') NOT NULL,
    
    -- Template Content
    subject_template TEXT,
    email_template TEXT, -- Rich HTML
    sms_template TEXT, -- Plain text, character limited
    whatsapp_template TEXT,
    push_notification_template TEXT,
    
    -- Multilingual Support
    supported_languages JSON, -- ['en', 'hi', 'mr', 'ta']
    translations JSON, -- Language-specific content
    
    -- Template Variables
    available_variables JSON, -- [{"name": "student_name", "type": "string"}]
    required_variables JSON,
    
    -- A/B Testing
    ab_testing_enabled BOOLEAN DEFAULT FALSE,
    ab_variants JSON, -- Multiple template versions for testing
    
    -- Automation Rules
    auto_send_rules JSON, -- Trigger conditions
    escalation_rules JSON, -- Follow-up rules
    
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (trust_id) REFERENCES trusts(id),
    
    UNIQUE KEY uk_trust_template_code (trust_id, template_code),
    INDEX idx_category (template_category)
);

-- Communication campaigns
CREATE TABLE communication_campaigns (
    id INT PRIMARY KEY AUTO_INCREMENT,
    trust_id INT NOT NULL,
    school_id INT,
    
    campaign_name VARCHAR(200) NOT NULL,
    template_id INT NOT NULL,
    
    -- Target Audience
    target_type ENUM('ALL_PARENTS', 'SPECIFIC_CLASSES', 'SPECIFIC_STUDENTS', 'SPECIFIC_ROLES', 'CUSTOM_FILTER') NOT NULL,
    target_criteria JSON, -- Filtering conditions
    
    -- Scheduling
    send_type ENUM('IMMEDIATE', 'SCHEDULED', 'TRIGGERED') NOT NULL,
    scheduled_at TIMESTAMP NULL,
    trigger_conditions JSON,
    
    -- Channel Configuration
    channels_to_use JSON, -- ['EMAIL', 'SMS', 'WHATSAPP', 'PUSH']
    channel_priority JSON, -- Channel preference order
    
    -- Personalization
    personalization_data JSON,
    language_preference ENUM('AUTO_DETECT', 'SPECIFIC') DEFAULT 'AUTO_DETECT',
    specific_language VARCHAR(10),
    
    -- Status Tracking
    campaign_status ENUM('DRAFT', 'SCHEDULED', 'SENDING', 'COMPLETED', 'FAILED', 'CANCELLED') DEFAULT 'DRAFT',
    total_recipients INT DEFAULT 0,
    total_sent INT DEFAULT 0,
    total_delivered INT DEFAULT 0,
    total_failed INT DEFAULT 0,
    total_opened INT DEFAULT 0,
    total_clicked INT DEFAULT 0,
    
    -- Performance Metrics
    send_started_at TIMESTAMP NULL,
    send_completed_at TIMESTAMP NULL,
    
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (trust_id) REFERENCES trusts(id),
    FOREIGN KEY (template_id) REFERENCES communication_templates(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    
    INDEX idx_status (campaign_status),
    INDEX idx_scheduled_at (scheduled_at)
);

-- Individual message records
CREATE TABLE communication_messages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    campaign_id INT,
    template_id INT NOT NULL,
    trust_id INT NOT NULL,
    
    -- Recipient Information
    recipient_type ENUM('PARENT', 'STUDENT', 'STAFF', 'EXTERNAL') NOT NULL,
    recipient_user_id INT,
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(15),
    recipient_name VARCHAR(200),
    
    -- Message Details
    subject TEXT,
    message_content TEXT,
    channel ENUM('EMAIL', 'SMS', 'WHATSAPP', 'PUSH_NOTIFICATION') NOT NULL,
    language_used VARCHAR(10) DEFAULT 'en',
    
    -- Personalization Data
    merged_variables JSON,
    
    -- Delivery Status
    message_status ENUM('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED') DEFAULT 'QUEUED',
    sent_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    
    -- Engagement Tracking
    opened_at TIMESTAMP NULL,
    clicked_at TIMESTAMP NULL,
    click_count INT DEFAULT 0,
    
    -- Error Handling
    failure_reason TEXT,
    retry_count INT DEFAULT 0,
    
    -- Response Tracking (for bidirectional communication)
    response_received BOOLEAN DEFAULT FALSE,
    response_content TEXT,
    response_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (campaign_id) REFERENCES communication_campaigns(id),
    FOREIGN KEY (template_id) REFERENCES communication_templates(id),
    
    INDEX idx_recipient_type (recipient_type),
    INDEX idx_status (message_status),
    INDEX idx_channel (channel),
    INDEX idx_sent_at (sent_at)
);

-- Communication automation rules
CREATE TABLE communication_automation_rules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    trust_id INT NOT NULL,
    school_id INT,
    
    rule_name VARCHAR(200) NOT NULL,
    rule_type ENUM('FEE_REMINDER', 'ATTENDANCE_ALERT', 'BIRTHDAY_WISH', 'CUSTOM') NOT NULL,
    
    -- Trigger Configuration
    trigger_conditions JSON, -- When to trigger
    trigger_schedule JSON, -- Cron-like schedule
    
    -- Action Configuration
    template_id INT NOT NULL,
    target_audience JSON,
    channels JSON,
    
    -- Execution Settings
    is_active BOOLEAN DEFAULT TRUE,
    last_executed_at TIMESTAMP NULL,
    next_execution_at TIMESTAMP NULL,
    execution_count INT DEFAULT 0,
    
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (trust_id) REFERENCES trusts(id),
    FOREIGN KEY (template_id) REFERENCES communication_templates(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    
    INDEX idx_next_execution (next_execution_at),
    INDEX idx_active (is_active)
);

-- Communication delivery reports
CREATE TABLE communication_delivery_reports (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    trust_id INT NOT NULL,
    
    report_date DATE NOT NULL,
    channel ENUM('EMAIL', 'SMS', 'WHATSAPP', 'PUSH_NOTIFICATION') NOT NULL,
    
    -- Volume Metrics
    total_sent INT DEFAULT 0,
    total_delivered INT DEFAULT 0,
    total_failed INT DEFAULT 0,
    total_bounced INT DEFAULT 0,
    
    -- Engagement Metrics
    total_opened INT DEFAULT 0,
    total_clicked INT DEFAULT 0,
    unique_opens INT DEFAULT 0,
    unique_clicks INT DEFAULT 0,
    
    -- Cost Metrics
    total_cost DECIMAL(10,4) DEFAULT 0.0000,
    cost_per_message DECIMAL(8,4) DEFAULT 0.0000,
    
    -- Performance Metrics
    average_delivery_time_seconds INT DEFAULT 0,
    delivery_success_rate DECIMAL(5,2) DEFAULT 0.00,
    
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (trust_id) REFERENCES trusts(id),
    
    UNIQUE KEY uk_trust_date_channel (trust_id, report_date, channel),
    INDEX idx_report_date (report_date)
);
```

### COMM MODULE ACTIVITIES (4 activities)

#### Activity COMM-09-001: Communication Template Engine
**Priority:** Critical  
**Description:** Rich template system with multilingual support

**Key Features:**
- HTML email templates
- SMS/WhatsApp templates
- Variable substitution
- Multilingual content management

#### Activity COMM-09-002: Multi-Channel Message Delivery
**Priority:** Critical  
**Description:** Unified messaging platform

**Key Features:**
- Email delivery (SMTP)
- SMS integration (multiple providers)
- WhatsApp Business API
- Push notifications

#### Activity COMM-09-003: Communication Automation
**Priority:** High  
**Description:** Rule-based automated messaging

**Key Features:**
- Fee reminder automation
- Attendance alerts
- Birthday wishes
- Custom trigger rules

#### Activity COMM-09-004: Parent Response Management
**Priority:** Medium  
**Description:** Bidirectional communication handling

**Key Features:**
- Response tracking
- Parent reply management
- Conversation threads
- Response analytics

---

## IMPLEMENTATION SUMMARY & STATISTICS

### Complete Module Breakdown
- **DATA Module:** 12 activities (Database foundation, connection management)
- **SETUP Module:** 8 activities (Wizard engine, configuration workflows)
- **AUTH Module:** 10 activities (Authentication, security, RBAC)
- **USER Module:** 6 activities (User management, profile systems)
- **STUD Module:** 8 activities (Student admission, enrollment tracking)
- **FEES Module:** 10 activities (Payment processing, receipt generation)
- **ATTD Module:** 4 activities (Attendance marking, compliance reporting)
- **REPT Module:** 6 activities (Report generation, government compliance)
- **DASH Module:** 3 activities (Dashboard widgets, analytics)
- **COMM Module:** 4 activities (Multi-channel communication, automation)

### Total Implementation Scope
- **Total Activities:** 66 detailed implementations
- **Database Tables:** 50+ comprehensive schemas with relationships
- **API Endpoints:** 120+ with complete validation and error handling
- **Configuration Wizards:** 8 sophisticated setup workflows
- **Lines of Code:** 20,000+ production-ready TypeScript/SQL
- **Government Compliance:** Built-in for Indian education regulations

### Key Architecture Features
- **Trust-centric multi-tenancy** with subdomain-based routing and database isolation
- **Student-centric fee management** with flexible discounting and payment options
- **Government compliance automation** for regulatory reporting and submissions
- **Configurable communication** across Email/SMS/WhatsApp channels
- **Advanced analytics dashboards** with real-time data and predictive insights
- **Comprehensive audit trails** for all operations with full data lineage
- **Wizard-driven setup** for professional onboarding experience
- **Role-based access control** with granular permissions

### Production Readiness
This master document provides complete specifications for building a production-ready School ERP system that can compete with established players in the Indian education technology market. All modules include:

- **Complete database schemas** with proper relationships and indexes
- **Detailed API specifications** with Zod validation and error handling
- **Business logic implementations** with real-world scenarios
- **Configuration management** systems for flexibility
- **Integration frameworks** for third-party services
- **Security and compliance** features for enterprise deployment
- **Performance optimization** strategies for scalability
- **Government compliance** templates for regulatory requirements

### Development Approach
The system is designed for **AI-assisted development** with:
- **Clear activity boundaries** for focused implementation
- **Comprehensive specifications** reducing ambiguity
- **Type-safe development** using TypeScript throughout
- **Test-driven development** with contract testing
- **Modular architecture** allowing parallel development
- **Configuration-first approach** minimizing hard-coded values

**The School ERP system is now fully specified and ready for AI-assisted development with complete confidence in production deployment!**

---

## GETTING STARTED

To begin implementation:

1. **Start with DATA Module** - Complete all 12 foundation activities
2. **Setup basic wizards** - Implement SETUP module for configuration
3. **Add authentication** - Complete AUTH module for security
4. **Build user management** - Implement USER module
5. **Continue sequentially** through remaining modules

Each module builds upon the previous ones, ensuring a solid foundation throughout the development process.

This documentation serves as the **single source of truth** for the complete School ERP implementation, providing everything needed for successful AI-assisted development of a production-ready system.