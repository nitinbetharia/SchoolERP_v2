/**
 * REPT Module DTOs
 * Data Transfer Objects for Reporting and Analytics following industry standards
 */

import { z } from 'zod';

// Common enums for Reports module
export const ReportTypeEnum = z.enum(['STUDENT_PROFILE', 'FEE_COLLECTION', 'ATTENDANCE', 'ACADEMIC_PERFORMANCE', 'CUSTOM']);
export const ReportFormatEnum = z.enum(['JSON', 'PDF', 'EXCEL', 'CSV']);
export const ReportStatusEnum = z.enum(['GENERATING', 'COMPLETED', 'FAILED']);

// REPT-07-001: Student profile reports
export const Rept07001Request = z.object({
  report_scope: z.enum(['ALL_STUDENTS', 'CLASS_WISE', 'INDIVIDUAL', 'FILTERED']),
  class_id: z.number().int().positive().optional(),
  section_id: z.number().int().positive().optional(),
  student_ids: z.array(z.number().int().positive()).optional(),
  academic_year_id: z.number().int().positive().optional(),
  include_admission_details: z.boolean().default(true),
  include_parent_details: z.boolean().default(true),
  include_documents: z.boolean().default(false),
  include_transfers: z.boolean().default(false),
  filters: z.object({
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    admission_status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
    date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
  }).optional(),
  format: ReportFormatEnum.default('JSON')
}).strict();

export const Rept07001Response = z.object({
  report_id: z.number().int().positive(),
  report_type: z.string(),
  generated_at: z.string().datetime(),
  total_students: z.number().int(),
  students: z.array(z.object({
    student_id: z.number().int().positive(),
    admission_number: z.string(),
    name: z.string(),
    class_section: z.string(),
    date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    gender: z.string().nullable(),
    admission_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    parent_details: z.object({
      father_name: z.string().nullable(),
      mother_name: z.string().nullable(),
      contact_phone: z.string().nullable(),
      contact_email: z.string().nullable()
    }).optional(),
    documents_count: z.number().int().optional(),
    is_active: z.boolean()
  })),
  file_path: z.string().optional()
}).strict();

// REPT-07-002: Fee collection reports
export const Rept07002Request = z.object({
  report_period: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM']),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  class_id: z.number().int().positive().optional(),
  payment_mode: z.enum(['CASH', 'BANK', 'UPI', 'ONLINE']).optional(),
  include_pending_fees: z.boolean().default(true),
  include_discounts: z.boolean().default(true),
  include_refunds: z.boolean().default(false),
  group_by: z.enum(['DATE', 'CLASS', 'PAYMENT_MODE', 'FEE_HEAD']).default('DATE'),
  format: ReportFormatEnum.default('JSON')
}).strict();

export const Rept07002Response = z.object({
  report_id: z.number().int().positive(),
  report_type: z.string(),
  period: z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  }),
  summary: z.object({
    total_collected: z.number(),
    total_pending: z.number(),
    total_students: z.number().int(),
    total_receipts: z.number().int(),
    collection_efficiency: z.number().min(0).max(100),
    average_collection_per_student: z.number()
  }),
  breakdown: z.array(z.object({
    period_label: z.string(),
    collected_amount: z.number(),
    pending_amount: z.number(),
    receipt_count: z.number().int(),
    student_count: z.number().int(),
    discounts_given: z.number().optional(),
    refunds_processed: z.number().optional()
  })),
  defaulters: z.array(z.object({
    student_id: z.number().int().positive(),
    student_name: z.string(),
    class_section: z.string(),
    pending_amount: z.number(),
    overdue_days: z.number().int()
  })),
  generated_at: z.string().datetime(),
  file_path: z.string().optional()
}).strict();

// REPT-07-003: Attendance summary reports
export const Rept07003Request = z.object({
  report_period: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM']),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  class_id: z.number().int().positive().optional(),
  section_id: z.number().int().positive().optional(),
  min_attendance_threshold: z.number().min(0).max(100).default(75),
  include_leave_data: z.boolean().default(false),
  group_by: z.enum(['CLASS', 'SECTION', 'MONTH', 'STUDENT']).default('CLASS'),
  format: ReportFormatEnum.default('JSON')
}).strict();

export const Rept07003Response = z.object({
  report_id: z.number().int().positive(),
  report_type: z.string(),
  period: z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  }),
  summary: z.object({
    total_students: z.number().int(),
    total_school_days: z.number().int(),
    overall_attendance_rate: z.number().min(0).max(100),
    students_above_threshold: z.number().int(),
    students_below_threshold: z.number().int(),
    perfect_attendance_count: z.number().int()
  }),
  attendance_data: z.array(z.object({
    group_label: z.string(),
    student_count: z.number().int(),
    total_present: z.number().int(),
    total_absent: z.number().int(),
    total_late: z.number().int(),
    attendance_percentage: z.number().min(0).max(100),
    leave_days: z.number().int().optional()
  })),
  defaulters: z.array(z.object({
    student_id: z.number().int().positive(),
    student_name: z.string(),
    class_section: z.string(),
    attendance_percentage: z.number().min(0).max(100),
    total_absences: z.number().int(),
    consecutive_absences: z.number().int()
  })),
  generated_at: z.string().datetime(),
  file_path: z.string().optional()
}).strict();

// REPT-07-004: Academic performance reports
export const Rept07004Request = z.object({
  academic_year_id: z.number().int().positive(),
  report_scope: z.enum(['SCHOOL_OVERVIEW', 'CLASS_PERFORMANCE', 'SUBJECT_ANALYSIS', 'TEACHER_PERFORMANCE']),
  class_id: z.number().int().positive().optional(),
  subject_id: z.number().int().positive().optional(),
  teacher_id: z.number().int().positive().optional(),
  include_trends: z.boolean().default(true),
  include_comparisons: z.boolean().default(true),
  performance_metrics: z.array(z.enum(['PASS_RATE', 'AVERAGE_MARKS', 'TOP_PERFORMERS', 'IMPROVEMENT_RATE'])).default(['PASS_RATE', 'AVERAGE_MARKS']),
  format: ReportFormatEnum.default('JSON')
}).strict();

export const Rept07004Response = z.object({
  report_id: z.number().int().positive(),
  report_type: z.string(),
  academic_year: z.string(),
  scope: z.string(),
  summary: z.object({
    total_students: z.number().int(),
    total_classes: z.number().int(),
    overall_pass_rate: z.number().min(0).max(100),
    average_score: z.number(),
    top_performing_class: z.string().optional(),
    improvement_trend: z.enum(['IMPROVING', 'DECLINING', 'STABLE']).optional()
  }),
  performance_data: z.array(z.object({
    entity_name: z.string(), // Class name, Subject name, etc.
    entity_type: z.string(),
    student_count: z.number().int(),
    pass_rate: z.number().min(0).max(100),
    average_marks: z.number(),
    highest_marks: z.number(),
    lowest_marks: z.number(),
    grade_distribution: z.record(z.string(), z.number().int()).optional()
  })),
  trends: z.array(z.object({
    period: z.string(),
    metric: z.string(),
    value: z.number(),
    change_percentage: z.number().optional()
  })).optional(),
  generated_at: z.string().datetime(),
  file_path: z.string().optional()
}).strict();

// REPT-07-005: Custom report builder
export const Rept07005Request = z.object({
  report_name: z.string().min(1).max(200),
  template_id: z.number().int().positive().optional(),
  data_sources: z.array(z.enum(['STUDENTS', 'FEES', 'ATTENDANCE', 'USERS', 'CLASSES', 'ACADEMIC_YEARS'])).min(1),
  filters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.string()), z.array(z.number())])).optional(),
  columns: z.array(z.object({
    field_name: z.string(),
    display_name: z.string(),
    data_type: z.enum(['STRING', 'NUMBER', 'DATE', 'BOOLEAN']),
    format: z.string().optional(),
    aggregation: z.enum(['SUM', 'COUNT', 'AVG', 'MIN', 'MAX', 'NONE']).default('NONE')
  })).min(1),
  grouping: z.object({
    group_by: z.array(z.string()).optional(),
    sort_by: z.string().optional(),
    sort_order: z.enum(['ASC', 'DESC']).default('ASC')
  }).optional(),
  save_as_template: z.boolean().default(false),
  format: ReportFormatEnum.default('JSON')
}).strict();

export const Rept07005Response = z.object({
  report_id: z.number().int().positive(),
  report_name: z.string(),
  template_id: z.number().int().positive().optional(),
  columns: z.array(z.object({
    field_name: z.string(),
    display_name: z.string(),
    data_type: z.string()
  })),
  total_rows: z.number().int(),
  data: z.array(z.record(z.string(), z.unknown())),
  generated_at: z.string().datetime(),
  file_path: z.string().optional()
}).strict();

// REPT-07-006: Export to PDF/Excel
export const Rept07006Request = z.object({
  report_id: z.number().int().positive(),
  export_format: z.enum(['PDF', 'EXCEL', 'CSV']),
  include_charts: z.boolean().default(true),
  include_summary: z.boolean().default(true),
  page_orientation: z.enum(['PORTRAIT', 'LANDSCAPE']).default('PORTRAIT'),
  custom_styling: z.object({
    header_color: z.string().optional(),
    font_size: z.number().min(8).max(16).optional(),
    include_logo: z.boolean().default(true)
  }).optional()
}).strict();

export const Rept07006Response = z.object({
  export_id: z.number().int().positive(),
  original_report_id: z.number().int().positive(),
  export_format: z.string(),
  file_path: z.string(),
  file_size: z.number().int(),
  download_url: z.string(),
  expires_at: z.string().datetime(),
  created_at: z.string().datetime()
}).strict();

// Type exports
export type Rept07001RequestT = z.infer<typeof Rept07001Request>;
export type Rept07001ResponseT = z.infer<typeof Rept07001Response>;
export type Rept07002RequestT = z.infer<typeof Rept07002Request>;
export type Rept07002ResponseT = z.infer<typeof Rept07002Response>;
export type Rept07003RequestT = z.infer<typeof Rept07003Request>;
export type Rept07003ResponseT = z.infer<typeof Rept07003Response>;
export type Rept07004RequestT = z.infer<typeof Rept07004Request>;
export type Rept07004ResponseT = z.infer<typeof Rept07004Response>;
export type Rept07005RequestT = z.infer<typeof Rept07005Request>;
export type Rept07005ResponseT = z.infer<typeof Rept07005Response>;
export type Rept07006RequestT = z.infer<typeof Rept07006Request>;
export type Rept07006ResponseT = z.infer<typeof Rept07006Response>;
