/**
 * USER Module DTOs
 * Following industry-standard REST API design with Zod validation
 */

import { z } from 'zod';

// Common schemas
const UserRoleEnum = z.enum(['TRUST_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'ACCOUNTANT', 'PARENT', 'STUDENT']);
const UserStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING']);

// USER-03-001: User CRUD Operations
export const User03001Request = z.object({
  email: z.string().email(),
  full_name: z.string().min(1).max(255),
  phone: z.string().min(10).max(15).optional(),
  role: UserRoleEnum,
  school_id: z.number().int().positive().optional(),
  password: z.string().min(8).max(128),
  is_active: z.boolean().default(true),
  employee_id: z.string().max(50).optional(),
  designation: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  date_of_joining: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  qualification: z.string().max(255).optional(),
  address: z.string().max(500).optional(),
  emergency_contact_name: z.string().max(255).optional(),
  emergency_contact_phone: z.string().max(15).optional()
}).strict();

export const User03001Response = z.object({
  user_id: z.number().int().positive(),
  email: z.string().email(),
  full_name: z.string(),
  phone: z.string().optional(),
  role: UserRoleEnum,
  school_id: z.number().int().positive().optional(),
  trust_id: z.number().int().positive(),
  is_active: z.boolean(),
  employee_id: z.string().optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
}).strict();

// USER-03-002: User-School Assignments
export const User03002Request = z.object({
  user_id: z.number().int().positive(),
  school_id: z.number().int().positive(),
  role: UserRoleEnum,
  is_primary: z.boolean().default(false),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  permissions: z.array(z.string()).optional()
}).strict();

export const User03002Response = z.object({
  assignment_id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  school_id: z.number().int().positive(),
  role: UserRoleEnum,
  is_primary: z.boolean(),
  is_active: z.boolean(),
  created_at: z.string().datetime()
}).strict();

// USER-03-003: Role & Permission Assignment
export const User03003Request = z.object({
  user_id: z.number().int().positive(),
  role: UserRoleEnum,
  permissions: z.array(z.string()).optional(),
  effective_date: z.string().datetime().optional(),
  expiry_date: z.string().datetime().optional(),
  reason: z.string().max(255).optional()
}).strict();

export const User03003Response = z.object({
  user_id: z.number().int().positive(),
  old_role: UserRoleEnum.optional(),
  new_role: UserRoleEnum,
  permissions_granted: z.array(z.string()),
  effective_date: z.string().datetime(),
  updated_by: z.number().int().positive(),
  updated_at: z.string().datetime()
}).strict();

// USER-03-004: Teacher Subject/Class Allocation
export const User03004Request = z.object({
  teacher_id: z.number().int().positive(),
  class_ids: z.array(z.number().int().positive()),
  section_ids: z.array(z.number().int().positive()).optional(),
  subject_ids: z.array(z.number().int().positive()).optional(),
  academic_year_id: z.number().int().positive(),
  workload_hours: z.number().min(0).max(168).optional(), // Max hours per week
  is_class_teacher: z.boolean().default(false),
  effective_date: z.string().datetime().optional()
}).strict();

export const User03004Response = z.object({
  allocation_id: z.number().int().positive(),
  teacher_id: z.number().int().positive(),
  teacher_name: z.string(),
  allocations: z.array(z.object({
    class_id: z.number().int().positive(),
    class_name: z.string(),
    section_id: z.number().int().positive().optional(),
    section_name: z.string().optional(),
    subject_id: z.number().int().positive().optional(),
    subject_name: z.string().optional(),
    is_class_teacher: z.boolean()
  })),
  total_workload_hours: z.number(),
  academic_year: z.string(),
  created_at: z.string().datetime()
}).strict();

// USER-03-005: Staff Profile Management
export const User03005Request = z.object({
  user_id: z.number().int().positive().optional(), // Optional for create, required for update
  personal_info: z.object({
    full_name: z.string().min(1).max(255),
    phone: z.string().min(10).max(15).optional(),
    address: z.string().max(500).optional(),
    date_of_birth: z.string().datetime().optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    marital_status: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']).optional()
  }),
  professional_info: z.object({
    employee_id: z.string().max(50).optional(),
    designation: z.string().max(100),
    department: z.string().max(100).optional(),
    date_of_joining: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    qualification: z.string().max(255).optional(),
    experience_years: z.number().min(0).max(50).optional(),
    specialization: z.string().max(255).optional()
  }),
  emergency_contact: z.object({
    name: z.string().max(255),
    phone: z.string().max(15),
    relationship: z.string().max(50),
    address: z.string().max(500).optional()
  }),
  documents: z.array(z.object({
    document_type: z.string().max(50),
    document_number: z.string().max(100),
    file_path: z.string().max(500).optional()
  })).optional()
}).strict();

export const User03005Response = z.object({
  user_id: z.number().int().positive(),
  profile_updated: z.boolean(),
  changes_made: z.array(z.string()),
  personal_info: z.object({
    full_name: z.string(),
    phone: z.string().optional(),
    address: z.string().optional()
  }),
  professional_info: z.object({
    employee_id: z.string().optional(),
    designation: z.string(),
    department: z.string().optional(),
    date_of_joining: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable()
  }),
  updated_at: z.string().datetime()
}).strict();

// USER-03-006: Parent-Student Linking
export const User03006Request = z.object({
  parent_user_id: z.number().int().positive(),
  student_id: z.number().int().positive(),
  relationship: z.enum(['FATHER', 'MOTHER', 'GUARDIAN']),
  is_primary: z.boolean().default(false),
  has_financial_responsibility: z.boolean().default(true),
  can_pickup: z.boolean().default(true),
  emergency_contact_priority: z.number().int().min(1).max(5).default(1),
  notes: z.string().max(500).optional()
}).strict();

export const User03006Response = z.object({
  link_id: z.number().int().positive(),
  parent_user_id: z.number().int().positive(),
  parent_name: z.string(),
  parent_email: z.string().email(),
  student_id: z.number().int().positive(),
  student_name: z.string(),
  student_admission_number: z.string(),
  relationship: z.enum(['FATHER', 'MOTHER', 'GUARDIAN']),
  is_primary: z.boolean(),
  permissions: z.object({
    has_financial_responsibility: z.boolean(),
    can_pickup: z.boolean(),
    emergency_contact_priority: z.number().int()
  }),
  created_at: z.string().datetime()
}).strict();

// Type exports
export type User03001RequestT = z.infer<typeof User03001Request>;
export type User03001ResponseT = z.infer<typeof User03001Response>;
export type User03002RequestT = z.infer<typeof User03002Request>;
export type User03002ResponseT = z.infer<typeof User03002Response>;
export type User03003RequestT = z.infer<typeof User03003Request>;
export type User03003ResponseT = z.infer<typeof User03003Response>;
export type User03004RequestT = z.infer<typeof User03004Request>;
export type User03004ResponseT = z.infer<typeof User03004Response>;
export type User03005RequestT = z.infer<typeof User03005Request>;
export type User03005ResponseT = z.infer<typeof User03005Response>;
export type User03006RequestT = z.infer<typeof User03006Request>;
export type User03006ResponseT = z.infer<typeof User03006Response>;
