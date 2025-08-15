/**
 * STUD Module DTOs
 * Data Transfer Objects for Student Management following industry standards
 */

import { z } from 'zod';

// Common enums for Student module
export const GenderEnum = z.enum(['MALE', 'FEMALE', 'OTHER']);
export const AdmissionStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED']);
export const RelationshipEnum = z.enum(['FATHER', 'MOTHER', 'GUARDIAN']);
export const TransferStatusEnum = z.enum(['PENDING', 'APPROVED', 'COMPLETED']);

// STUD-04-001: Student Admission
export const Stud04001Request = z.object({
  school_id: z.number().int().positive(),
  academic_year_id: z.number().int().positive(),
  admission_number: z.string().min(1).max(50),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: GenderEnum,
  class_id: z.number().int().positive(),
  section_id: z.number().int().positive().optional(),
  house_id: z.number().int().positive().optional(),
  father_name: z.string().max(255).optional(),
  mother_name: z.string().max(255).optional(),
  guardian_name: z.string().max(255).optional(),
  contact_phone: z.string().min(10).max(15),
  contact_email: z.string().email().optional(),
  address: z.string().max(500).optional(),
  previous_school: z.string().max(255).optional(),
  medical_conditions: z.string().max(500).optional(),
  application_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
}).strict();

export const Stud04001Response = z.object({
  student_id: z.number().int().positive(),
  admission_id: z.number().int().positive(),
  school_id: z.number().int().positive(),
  admission_number: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  status: AdmissionStatusEnum,
  application_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  created_at: z.string().datetime()
}).strict();

// STUD-04-002: Admission Approval Workflow
export const Stud04002Request = z.object({
  admission_id: z.number().int().positive(),
  status: AdmissionStatusEnum,
  admission_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  remarks: z.string().max(500).optional(),
  reviewed_by: z.number().int().positive()
}).strict();

export const Stud04002Response = z.object({
  admission_id: z.number().int().positive(),
  status: AdmissionStatusEnum,
  admission_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  remarks: z.string().nullable(),
  reviewed_by: z.number().int().positive(),
  updated_at: z.string().datetime()
}).strict();

// STUD-04-003: Readmission/Promotion
export const Stud04003Request = z.object({
  student_id: z.number().int().positive(),
  academic_year_id: z.number().int().positive(),
  new_class_id: z.number().int().positive(),
  new_section_id: z.number().int().positive().optional(),
  promotion_type: z.enum(['PROMOTION', 'READMISSION', 'REPEAT']),
  effective_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
}).strict();

export const Stud04003Response = z.object({
  student_id: z.number().int().positive(),
  academic_year_id: z.number().int().positive(),
  previous_class_id: z.number().int().positive(),
  new_class_id: z.number().int().positive(),
  promotion_type: z.string(),
  effective_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  updated_at: z.string().datetime()
}).strict();

// STUD-04-004: Inter-school Transfer
export const Stud04004Request = z.object({
  student_id: z.number().int().positive(),
  from_school_id: z.number().int().positive(),
  to_school_id: z.number().int().positive(),
  transfer_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().max(500).optional(),
  requested_by: z.number().int().positive()
}).strict();

export const Stud04004Response = z.object({
  transfer_id: z.number().int().positive(),
  student_id: z.number().int().positive(),
  from_school_id: z.number().int().positive(),
  to_school_id: z.number().int().positive(),
  transfer_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: TransferStatusEnum,
  created_at: z.string().datetime()
}).strict();

// STUD-04-005: Student ID & Roll Allocation
export const Stud04005Request = z.object({
  student_id: z.number().int().positive(),
  roll_number: z.string().max(20),
  section_id: z.number().int().positive(),
  academic_year_id: z.number().int().positive()
}).strict();

export const Stud04005Response = z.object({
  student_id: z.number().int().positive(),
  roll_number: z.string(),
  section_id: z.number().int().positive(),
  previous_roll: z.string().nullable(),
  updated_at: z.string().datetime()
}).strict();

// STUD-04-006: Siblings & Category Allocation
export const Stud04006Request = z.object({
  student_id: z.number().int().positive(),
  sibling_student_ids: z.array(z.number().int().positive()).optional(),
  category: z.string().max(50).optional(),
  subcaste: z.string().max(100).optional(),
  religion: z.string().max(50).optional(),
  nationality: z.string().max(50).optional()
}).strict();

export const Stud04006Response = z.object({
  student_id: z.number().int().positive(),
  siblings_linked: z.number().int(),
  category: z.string().nullable(),
  subcaste: z.string().nullable(),
  religion: z.string().nullable(),
  nationality: z.string().nullable(),
  updated_at: z.string().datetime()
}).strict();

// STUD-04-007: Student Documents & Certificates
export const Stud04007Request = z.object({
  student_id: z.number().int().positive(),
  document_type: z.string().max(50),
  file_name: z.string().max(255),
  file_path: z.string().max(500),
  file_size: z.number().int().positive().optional(),
  uploaded_by: z.number().int().positive(),
  description: z.string().max(255).optional()
}).strict();

export const Stud04007Response = z.object({
  document_id: z.number().int().positive(),
  student_id: z.number().int().positive(),
  document_type: z.string(),
  file_name: z.string(),
  file_path: z.string(),
  file_size: z.number().int().nullable(),
  uploaded_at: z.string().datetime()
}).strict();

// STUD-04-008: Student Analytics (placeholder)
export const Stud04008Request = z.object({
  school_id: z.number().int().positive().optional(),
  academic_year_id: z.number().int().positive().optional(),
  class_id: z.number().int().positive().optional(),
  analytics_type: z.enum(['ENROLLMENT', 'PERFORMANCE', 'ATTENDANCE', 'DEMOGRAPHICS']),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
}).strict();

export const Stud04008Response = z.object({
  analytics_type: z.string(),
  data: z.record(z.string(), z.unknown()),
  generated_at: z.string().datetime(),
  parameters: z.record(z.string(), z.unknown())
}).strict();

// Type exports
export type Stud04001RequestT = z.infer<typeof Stud04001Request>;
export type Stud04001ResponseT = z.infer<typeof Stud04001Response>;
export type Stud04002RequestT = z.infer<typeof Stud04002Request>;
export type Stud04002ResponseT = z.infer<typeof Stud04002Response>;
export type Stud04003RequestT = z.infer<typeof Stud04003Request>;
export type Stud04003ResponseT = z.infer<typeof Stud04003Response>;
export type Stud04004RequestT = z.infer<typeof Stud04004Request>;
export type Stud04004ResponseT = z.infer<typeof Stud04004Response>;
export type Stud04005RequestT = z.infer<typeof Stud04005Request>;
export type Stud04005ResponseT = z.infer<typeof Stud04005Response>;
export type Stud04006RequestT = z.infer<typeof Stud04006Request>;
export type Stud04006ResponseT = z.infer<typeof Stud04006Response>;
export type Stud04007RequestT = z.infer<typeof Stud04007Request>;
export type Stud04007ResponseT = z.infer<typeof Stud04007Response>;
export type Stud04008RequestT = z.infer<typeof Stud04008Request>;
export type Stud04008ResponseT = z.infer<typeof Stud04008Response>;