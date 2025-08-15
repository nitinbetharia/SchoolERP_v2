/**
 * ATTD Module DTOs
 * Data Transfer Objects for Attendance Management following industry standards
 */

import { z } from 'zod';

// Common enums for Attendance module
export const AttendanceStatusEnum = z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY']);
export const LeaveTypeEnum = z.enum(['SICK', 'CASUAL', 'EMERGENCY', 'FAMILY', 'OTHER']);
export const LeaveStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

// ATTD-06-001: Daily attendance & bulk import
export const Attd06001Request = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  class_id: z.number().int().positive(),
  section_id: z.number().int().positive().optional(),
  attendance_records: z.array(z.object({
    student_id: z.number().int().positive(),
    status: AttendanceStatusEnum,
    remarks: z.string().max(255).optional(),
    arrival_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/).optional()
  })).min(1),
  marked_by: z.number().int().positive()
}).strict();

export const Attd06001Response = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  class_id: z.number().int().positive(),
  section_id: z.number().int().positive().nullable(),
  total_students: z.number().int(),
  present_count: z.number().int(),
  absent_count: z.number().int(),
  late_count: z.number().int(),
  half_day_count: z.number().int(),
  attendance_percentage: z.number().min(0).max(100),
  records_created: z.number().int(),
  marked_at: z.string().datetime()
}).strict();

// ATTD-06-002: Leave/absence workflows
export const Attd06002Request = z.object({
  student_id: z.number().int().positive(),
  leave_type: LeaveTypeEnum,
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().min(10).max(500),
  supporting_documents: z.array(z.object({
    document_type: z.string().max(50),
    file_path: z.string().max(500)
  })).optional(),
  applied_by: z.number().int().positive(), // Parent/Guardian user ID
  contact_number: z.string().min(10).max(15).optional()
}).strict();

export const Attd06002Response = z.object({
  leave_application_id: z.number().int().positive(),
  student_id: z.number().int().positive(),
  leave_type: z.string(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  total_days: z.number().int().positive(),
  status: LeaveStatusEnum,
  application_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  created_at: z.string().datetime()
}).strict();

// ATTD-06-003: Attendance reporting/analytics
export const Attd06003Request = z.object({
  report_type: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM', 'DEFAULTERS']),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  class_id: z.number().int().positive().optional(),
  section_id: z.number().int().positive().optional(),
  student_id: z.number().int().positive().optional(),
  min_attendance_percentage: z.number().min(0).max(100).optional(),
  include_leave_data: z.boolean().default(false),
  format: z.enum(['JSON', 'PDF', 'EXCEL']).default('JSON')
}).strict();

export const Attd06003Response = z.object({
  report_type: z.string(),
  period: z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  }),
  summary: z.object({
    total_students: z.number().int(),
    total_school_days: z.number().int(),
    average_attendance: z.number().min(0).max(100),
    defaulter_count: z.number().int(),
    perfect_attendance_count: z.number().int()
  }),
  data: z.array(z.object({
    student_id: z.number().int().positive(),
    student_name: z.string(),
    class_section: z.string(),
    total_days: z.number().int(),
    present_days: z.number().int(),
    absent_days: z.number().int(),
    late_days: z.number().int(),
    half_days: z.number().int(),
    attendance_percentage: z.number().min(0).max(100),
    leave_days: z.number().int().optional()
  })),
  generated_at: z.string().datetime(),
  file_path: z.string().optional()
}).strict();

// ATTD-06-004: Student attendance profiles
export const Attd06004Request = z.object({
  student_id: z.number().int().positive(),
  academic_year_id: z.number().int().positive().optional(),
  include_monthly_breakdown: z.boolean().default(true),
  include_leave_history: z.boolean().default(true),
  include_patterns: z.boolean().default(false) // Attendance pattern analysis
}).strict();

export const Attd06004Response = z.object({
  student_id: z.number().int().positive(),
  student_info: z.object({
    name: z.string(),
    admission_number: z.string(),
    class_section: z.string(),
    academic_year: z.string()
  }),
  overall_summary: z.object({
    total_school_days: z.number().int(),
    total_present: z.number().int(),
    total_absent: z.number().int(),
    total_late: z.number().int(),
    total_half_days: z.number().int(),
    overall_percentage: z.number().min(0).max(100),
    ranking_in_class: z.number().int().optional()
  }),
  monthly_breakdown: z.array(z.object({
    month_year: z.string().regex(/^\d{4}-\d{2}$/),
    school_days: z.number().int(),
    present: z.number().int(),
    absent: z.number().int(),
    late: z.number().int(),
    half_days: z.number().int(),
    percentage: z.number().min(0).max(100)
  })).optional(),
  leave_history: z.array(z.object({
    leave_type: z.string(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    days: z.number().int(),
    status: z.string(),
    reason: z.string()
  })).optional(),
  attendance_patterns: z.object({
    frequent_absent_days: z.array(z.string()), // Day names like 'Monday'
    consecutive_absences: z.number().int(),
    improvement_trend: z.enum(['IMPROVING', 'DECLINING', 'STABLE']).optional()
  }).optional(),
  generated_at: z.string().datetime()
}).strict();

// Type exports
export type Attd06001RequestT = z.infer<typeof Attd06001Request>;
export type Attd06001ResponseT = z.infer<typeof Attd06001Response>;
export type Attd06002RequestT = z.infer<typeof Attd06002Request>;
export type Attd06002ResponseT = z.infer<typeof Attd06002Response>;
export type Attd06003RequestT = z.infer<typeof Attd06003Request>;
export type Attd06003ResponseT = z.infer<typeof Attd06003Response>;
export type Attd06004RequestT = z.infer<typeof Attd06004Request>;
export type Attd06004ResponseT = z.infer<typeof Attd06004Response>;
