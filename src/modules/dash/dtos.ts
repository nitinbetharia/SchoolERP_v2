/**
 * DASH Module DTOs
 * Data Transfer Objects for Dashboard and Analytics following industry standards
 */

import { z } from 'zod';

// Common enums for Dashboard module
export const TimeRangeEnum = z.enum(['TODAY', 'YESTERDAY', 'THIS_WEEK', 'LAST_WEEK', 'THIS_MONTH', 'LAST_MONTH', 'THIS_YEAR', 'CUSTOM']);
export const DashboardTypeEnum = z.enum(['TRUST_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']);

// DASH-08-001: Trust admin dashboard
export const Dash08001Request = z.object({
  time_range: TimeRangeEnum.default('THIS_MONTH'),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  school_ids: z.array(z.number().int().positive()).optional(),
  include_trends: z.boolean().default(true),
  include_financial: z.boolean().default(true),
  include_analytics: z.boolean().default(true)
}).strict();

export const Dash08001Response = z.object({
  dashboard_type: z.string(),
  time_period: z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  }),
  summary: z.object({
    total_schools: z.number().int(),
    total_students: z.number().int(),
    total_teachers: z.number().int(),
    total_revenue: z.number(),
    pending_fees: z.number(),
    overall_attendance_rate: z.number().min(0).max(100)
  }),
  schools_overview: z.array(z.object({
    school_id: z.number().int().positive(),
    school_name: z.string(),
    student_count: z.number().int(),
    teacher_count: z.number().int(),
    fee_collection_rate: z.number().min(0).max(100),
    attendance_rate: z.number().min(0).max(100),
    last_updated: z.string().datetime()
  })),
  financial_summary: z.object({
    revenue_trends: z.array(z.object({
      period: z.string(),
      collected: z.number(),
      pending: z.number()
    })),
    collection_efficiency: z.number().min(0).max(100),
    top_defaulters: z.array(z.object({
      school_name: z.string(),
      pending_amount: z.number(),
      overdue_days: z.number().int()
    }))
  }).optional(),
  attendance_analytics: z.object({
    attendance_trends: z.array(z.object({
      period: z.string(),
      attendance_rate: z.number().min(0).max(100)
    })),
    school_comparison: z.array(z.object({
      school_name: z.string(),
      attendance_rate: z.number().min(0).max(100)
    }))
  }).optional(),
  generated_at: z.string().datetime()
}).strict();

// DASH-08-002: School admin dashboard
export const Dash08002Request = z.object({
  time_range: TimeRangeEnum.default('THIS_MONTH'),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  class_ids: z.array(z.number().int().positive()).optional(),
  include_class_breakdown: z.boolean().default(true),
  include_fee_analytics: z.boolean().default(true),
  include_staff_summary: z.boolean().default(true)
}).strict();

export const Dash08002Response = z.object({
  dashboard_type: z.string(),
  school_info: z.object({
    school_id: z.number().int().positive(),
    school_name: z.string(),
    academic_year: z.string()
  }),
  time_period: z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  }),
  summary: z.object({
    total_students: z.number().int(),
    total_teachers: z.number().int(),
    total_classes: z.number().int(),
    total_fee_collected: z.number(),
    pending_fees: z.number(),
    average_attendance: z.number().min(0).max(100)
  }),
  class_analytics: z.array(z.object({
    class_id: z.number().int().positive(),
    class_name: z.string(),
    student_count: z.number().int(),
    attendance_rate: z.number().min(0).max(100),
    fee_collection_rate: z.number().min(0).max(100),
    teacher_assigned: z.boolean()
  })).optional(),
  fee_analytics: z.object({
    collection_trends: z.array(z.object({
      period: z.string(),
      collected: z.number(),
      pending: z.number()
    })),
    defaulter_summary: z.object({
      total_defaulters: z.number().int(),
      total_pending: z.number(),
      critical_cases: z.number().int()
    })
  }).optional(),
  staff_summary: z.object({
    active_teachers: z.number().int(),
    teacher_student_ratio: z.number(),
    pending_assignments: z.number().int()
  }).optional(),
  recent_activities: z.array(z.object({
    activity_type: z.string(),
    description: z.string(),
    timestamp: z.string().datetime(),
    user_name: z.string()
  })),
  generated_at: z.string().datetime()
}).strict();

// DASH-08-003: Teacher dashboard
export const Dash08003Request = z.object({
  time_range: TimeRangeEnum.default('THIS_WEEK'),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  class_ids: z.array(z.number().int().positive()).optional(),
  include_student_performance: z.boolean().default(true),
  include_attendance_details: z.boolean().default(true)
}).strict();

export const Dash08003Response = z.object({
  dashboard_type: z.string(),
  teacher_info: z.object({
    teacher_id: z.number().int().positive(),
    teacher_name: z.string(),
    designation: z.string().optional()
  }),
  time_period: z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  }),
  summary: z.object({
    total_classes: z.number().int(),
    total_students: z.number().int(),
    classes_today: z.number().int(),
    average_attendance: z.number().min(0).max(100),
    pending_tasks: z.number().int()
  }),
  my_classes: z.array(z.object({
    class_id: z.number().int().positive(),
    class_name: z.string(),
    section: z.string().optional(),
    student_count: z.number().int(),
    today_attendance: z.object({
      present: z.number().int(),
      absent: z.number().int(),
      marked: z.boolean()
    }),
    recent_attendance_rate: z.number().min(0).max(100)
  })),
  attendance_summary: z.object({
    weekly_trends: z.array(z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      attendance_rate: z.number().min(0).max(100)
    })),
    class_comparison: z.array(z.object({
      class_name: z.string(),
      attendance_rate: z.number().min(0).max(100)
    }))
  }).optional(),
  student_performance: z.object({
    top_performers: z.array(z.object({
      student_id: z.number().int().positive(),
      student_name: z.string(),
      class_name: z.string(),
      attendance_rate: z.number().min(0).max(100)
    })),
    attention_needed: z.array(z.object({
      student_id: z.number().int().positive(),
      student_name: z.string(),
      class_name: z.string(),
      attendance_rate: z.number().min(0).max(100),
      issues: z.array(z.string())
    }))
  }).optional(),
  upcoming_tasks: z.array(z.object({
    task_type: z.string(),
    description: z.string(),
    due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH'])
  })),
  generated_at: z.string().datetime()
}).strict();

// Type exports
export type Dash08001RequestT = z.infer<typeof Dash08001Request>;
export type Dash08001ResponseT = z.infer<typeof Dash08001Response>;
export type Dash08002RequestT = z.infer<typeof Dash08002Request>;
export type Dash08002ResponseT = z.infer<typeof Dash08002Response>;
export type Dash08003RequestT = z.infer<typeof Dash08003Request>;
export type Dash08003ResponseT = z.infer<typeof Dash08003Response>;
