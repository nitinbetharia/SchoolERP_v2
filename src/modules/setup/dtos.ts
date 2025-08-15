/** Zod DTOs for module: SETUP (auto-generated) */
import { z } from 'zod';

// Shared primitives
export const PaginatedQuery = z.object({ page: z.number().int().min(1).default(1), limit: z.number().int().min(1).max(100).default(50) });
export const IdParam = z.object({ id: z.number().int().positive() });

// SETUP-01-001: Wizard: Trust creation
// DB Entities: trusts, system_config
// Dependencies: DATA-*
export const Setup01001Request = z.object({
  trust_name: z.string().min(1).max(255),
  trust_code: z.string().min(2).max(20).regex(/^[A-Z0-9_]+$/),
  description: z.string().optional(),
  subdomain: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  contact_email: z.string().email(),
  contact_phone: z.string().min(10).max(15).optional(),
  address: z.string().optional(),
  is_active: z.boolean().default(true)
}).strict();

export const Setup01001Response = z.object({
  trust_id: z.number().int().positive(),
  trust_name: z.string(),
  trust_code: z.string(),
  subdomain: z.string(),
  created_at: z.string().datetime(),
  is_active: z.boolean()
}).strict();

// SETUP-01-002: Wizard: School creation
// DB Entities: schools
// Dependencies: DATA-*, SETUP-01-001
export const Setup01002Request = z.object({
  school_name: z.string().min(1).max(255),
  school_code: z.string().min(2).max(20).regex(/^[A-Z0-9_]+$/),
  trust_id: z.number().int().positive(),
  address: z.string().optional(),
  contact_email: z.string().email(),
  contact_phone: z.string().min(10).max(15).optional(),
  principal_name: z.string().optional(),
  established_year: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  is_active: z.boolean().default(true)
}).strict();

export const Setup01002Response = z.object({
  school_id: z.number().int().positive(),
  school_name: z.string(),
  school_code: z.string(),
  trust_id: z.number().int().positive(),
  created_at: z.string().datetime(),
  is_active: z.boolean()
}).strict();

// SETUP-01-003: Wizard: Academic year creation
// DB Entities: academic_years
// Dependencies: SETUP-01-002
export const Setup01003Request = z.object({
  school_id: z.number().int().positive(),
  year_name: z.string().min(1).max(50),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  is_current: z.boolean().default(false),
  is_active: z.boolean().default(true)
}).strict();

export const Setup01003Response = z.object({
  academic_year_id: z.number().int().positive(),
  year_name: z.string(),
  school_id: z.number().int().positive(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  is_current: z.boolean(),
  created_at: z.string().datetime()
}).strict();

// SETUP-01-004: Class & section setup (+ House)
// DB Entities: classes, sections, houses
// Dependencies: SETUP-01-003
export const Setup01004Request = z.object({
  school_id: z.number().int().positive(),
  academic_year_id: z.number().int().positive(),
  classes: z.array(z.object({
    class_name: z.string().min(1).max(50),
    class_order: z.number().int().min(1),
    sections: z.array(z.object({
      section_name: z.string().min(1).max(10),
      capacity: z.number().int().min(1).max(200)
    }))
  })),
  houses: z.array(z.object({
    house_name: z.string().min(1).max(50),
    house_color: z.string().optional()
  })).optional()
}).strict();

export const Setup01004Response = z.object({
  classes_created: z.number().int(),
  sections_created: z.number().int(),
  houses_created: z.number().int(),
  created_at: z.string().datetime()
}).strict();

// SETUP-01-005: Subject & grading configuration
// DB Entities: classes, trust_config
// Dependencies: SETUP-01-004
export const Setup01005Request = z.object({
  school_id: z.number().int().positive(),
  subjects: z.array(z.object({
    subject_name: z.string().min(1).max(100),
    subject_code: z.string().min(1).max(10),
    class_ids: z.array(z.number().int().positive())
  })),
  grading_system: z.object({
    type: z.enum(['PERCENTAGE', 'GRADE', 'BOTH']),
    pass_percentage: z.number().min(0).max(100).optional(),
    grades: z.array(z.object({
      grade: z.string().min(1).max(5),
      min_percentage: z.number().min(0).max(100),
      max_percentage: z.number().min(0).max(100)
    })).optional()
  })
}).strict();

export const Setup01005Response = z.object({
  subjects_created: z.number().int(),
  grading_configured: z.boolean(),
  created_at: z.string().datetime()
}).strict();

// SETUP-01-006: Trust/school-level config
// DB Entities: trust_config
// Dependencies: SETUP-01-002
export const Setup01006Request = z.object({
  school_id: z.number().int().positive(),
  config: z.object({
    session_timeout_minutes: z.number().int().min(5).max(480).default(60),
    fee_late_days: z.number().int().min(0).max(365).default(30),
    fee_late_penalty_percent: z.number().min(0).max(100).default(5),
    attendance_required_percent: z.number().min(0).max(100).default(75),
    academic_year_start_month: z.number().int().min(1).max(12).default(4),
    enable_sms: z.boolean().default(true),
    enable_email: z.boolean().default(true),
    enable_whatsapp: z.boolean().default(false)
  })
}).strict();

export const Setup01006Response = z.object({
  config_updated: z.boolean(),
  updated_at: z.string().datetime()
}).strict();

// SETUP-01-007: Role seeding (admins)
// DB Entities: users, trust_config
// Dependencies: SETUP-01-002
export const Setup01007Request = z.object({
  school_id: z.number().int().positive(),
  admin_users: z.array(z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
    full_name: z.string().min(1).max(255),
    role: z.enum(['TRUST_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT']),
    phone: z.string().min(10).max(15).optional()
  }))
}).strict();

export const Setup01007Response = z.object({
  users_created: z.number().int(),
  roles_assigned: z.number().int(),
  created_at: z.string().datetime()
}).strict();
