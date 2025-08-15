/**
 * FEES Module DTOs
 * Data Transfer Objects for Fee Management following industry standards
 */

import { z } from 'zod';

// Common enums for Fees module
export const PaymentModeEnum = z.enum(['CASH', 'BANK', 'UPI', 'ONLINE']);
export const PaymentStatusEnum = z.enum(['INITIATED', 'SUCCESS', 'FAILED', 'CANCELLED']);
export const DiscountTypeEnum = z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'SIBLING', 'SCHOLARSHIP']);

// FEES-05-001: Fee heads & structures
export const Fees05001Request = z.object({
  fee_head_name: z.string().min(1).max(100),
  class_id: z.number().int().positive(),
  academic_year_id: z.number().int().positive(),
  amount: z.number().positive(),
  installments: z.array(z.object({
    installment_name: z.string().max(50),
    due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    amount: z.number().positive()
  })).min(1),
  is_mandatory: z.boolean().default(true),
  description: z.string().max(255).optional()
}).strict();

export const Fees05001Response = z.object({
  fee_structure_id: z.number().int().positive(),
  fee_head_id: z.number().int().positive(),
  fee_head_name: z.string(),
  class_id: z.number().int().positive(),
  academic_year_id: z.number().int().positive(),
  total_amount: z.number().positive(),
  installments_created: z.number().int(),
  created_at: z.string().datetime()
}).strict();

// FEES-05-002: Class & student fee mapping
export const Fees05002Request = z.object({
  student_id: z.number().int().positive(),
  fee_structure_id: z.number().int().positive(),
  discount_percentage: z.number().min(0).max(100).default(0),
  discount_amount: z.number().min(0).default(0),
  special_instructions: z.string().max(255).optional()
}).strict();

export const Fees05002Response = z.object({
  assignment_id: z.number().int().positive(),
  student_id: z.number().int().positive(),
  fee_structure_id: z.number().int().positive(),
  total_amount: z.number().positive(),
  discount_applied: z.number().min(0),
  final_amount: z.number().positive(),
  balance_amount: z.number().positive(),
  created_at: z.string().datetime()
}).strict();

// FEES-05-003: Discount allocation
export const Fees05003Request = z.object({
  student_fee_assignment_id: z.number().int().positive(),
  discount_type: DiscountTypeEnum,
  discount_percentage: z.number().min(0).max(100).optional(),
  discount_amount: z.number().min(0).optional(),
  reason: z.string().max(255),
  approved_by: z.number().int().positive(),
  valid_until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
}).strict();

export const Fees05003Response = z.object({
  assignment_id: z.number().int().positive(),
  discount_type: z.string(),
  discount_applied: z.number(),
  new_balance: z.number(),
  updated_at: z.string().datetime()
}).strict();

// FEES-05-004: Transport/optional services
export const Fees05004Request = z.object({
  student_id: z.number().int().positive(),
  service_type: z.enum(['TRANSPORT', 'LIBRARY', 'LAB', 'SPORTS', 'MEALS']),
  monthly_fee: z.number().positive(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  route_details: z.string().max(255).optional()
}).strict();

export const Fees05004Response = z.object({
  service_assignment_id: z.number().int().positive(),
  student_id: z.number().int().positive(),
  service_type: z.string(),
  monthly_fee: z.number(),
  total_months: z.number().int(),
  total_amount: z.number(),
  created_at: z.string().datetime()
}).strict();

// FEES-05-005: Late fee rules (config/override)
export const Fees05005Request = z.object({
  student_id: z.number().int().positive().optional(),
  class_id: z.number().int().positive().optional(),
  rule_type: z.enum(['GLOBAL', 'CLASS_SPECIFIC', 'STUDENT_SPECIFIC']),
  grace_period_days: z.number().int().min(0),
  late_fee_percentage: z.number().min(0).max(100).optional(),
  late_fee_fixed: z.number().min(0).optional(),
  max_late_fee: z.number().min(0).optional(),
  effective_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
}).strict();

export const Fees05005Response = z.object({
  rule_id: z.number().int().positive(),
  rule_type: z.string(),
  grace_period_days: z.number().int(),
  late_fee_config: z.object({
    percentage: z.number().nullable(),
    fixed_amount: z.number().nullable(),
    max_amount: z.number().nullable()
  }),
  created_at: z.string().datetime()
}).strict();

// FEES-05-006: Fee collection & receipts
export const Fees05006Request = z.object({
  student_id: z.number().int().positive(),
  amount: z.number().positive(),
  payment_mode: PaymentModeEnum,
  installment_ids: z.array(z.number().int().positive()).optional(),
  late_fee_amount: z.number().min(0).default(0),
  reference_number: z.string().max(100).optional(),
  remarks: z.string().max(255).optional(),
  collected_by: z.number().int().positive()
}).strict();

export const Fees05006Response = z.object({
  receipt_id: z.number().int().positive(),
  receipt_number: z.string(),
  student_id: z.number().int().positive(),
  amount_collected: z.number(),
  payment_mode: z.string(),
  balance_remaining: z.number(),
  receipt_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  created_at: z.string().datetime()
}).strict();

// FEES-05-007: Payment gateway integration
export const Fees05007Request = z.object({
  student_id: z.number().int().positive(),
  amount: z.number().positive(),
  gateway_name: z.enum(['RAZORPAY', 'PAYU', 'PAYTM', 'STRIPE']),
  return_url: z.string().url(),
  webhook_url: z.string().url().optional(),
  metadata: z.record(z.string(), z.string()).optional()
}).strict();

export const Fees05007Response = z.object({
  transaction_id: z.string(),
  gateway_transaction_id: z.string(),
  payment_url: z.string().url(),
  amount: z.number(),
  status: PaymentStatusEnum,
  expires_at: z.string().datetime(),
  created_at: z.string().datetime()
}).strict();

// FEES-05-008: Refunds & adjustments
export const Fees05008Request = z.object({
  receipt_id: z.number().int().positive(),
  refund_amount: z.number().positive(),
  refund_reason: z.string().max(255),
  refund_mode: PaymentModeEnum,
  processed_by: z.number().int().positive(),
  bank_details: z.object({
    account_number: z.string().max(20),
    ifsc_code: z.string().max(15),
    account_holder: z.string().max(100)
  }).optional()
}).strict();

export const Fees05008Response = z.object({
  refund_id: z.number().int().positive(),
  receipt_id: z.number().int().positive(),
  refund_amount: z.number(),
  refund_mode: z.string(),
  status: z.enum(['PENDING', 'PROCESSED', 'FAILED']),
  processed_at: z.string().datetime().nullable(),
  created_at: z.string().datetime()
}).strict();

// FEES-05-009: Reports, reconciliation & defaulters
export const Fees05009Request = z.object({
  report_type: z.enum(['COLLECTION', 'DEFAULTERS', 'RECONCILIATION', 'CLASS_WISE']),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  class_id: z.number().int().positive().optional(),
  payment_mode: PaymentModeEnum.optional(),
  include_pending: z.boolean().default(true)
}).strict();

export const Fees05009Response = z.object({
  report_type: z.string(),
  generated_at: z.string().datetime(),
  summary: z.object({
    total_collected: z.number(),
    total_pending: z.number(),
    total_students: z.number().int(),
    defaulter_count: z.number().int()
  }),
  data: z.array(z.record(z.string(), z.unknown())),
  filters_applied: z.record(z.string(), z.unknown())
}).strict();

// FEES-05-010: Fee forecasting (bonus activity)
export const Fees05010Request = z.object({
  academic_year_id: z.number().int().positive(),
  forecast_months: z.number().int().min(1).max(12),
  include_optional_services: z.boolean().default(true),
  scenario: z.enum(['CONSERVATIVE', 'REALISTIC', 'OPTIMISTIC']).default('REALISTIC')
}).strict();

export const Fees05010Response = z.object({
  academic_year_id: z.number().int().positive(),
  forecast_period: z.string(),
  scenario: z.string(),
  projections: z.array(z.object({
    month: z.string(),
    expected_collection: z.number(),
    projected_pending: z.number(),
    confidence_level: z.number().min(0).max(100)
  })),
  summary: z.object({
    total_projected: z.number(),
    collection_efficiency: z.number(),
    risk_factors: z.array(z.string())
  }),
  generated_at: z.string().datetime()
}).strict();

// Type exports
export type Fees05001RequestT = z.infer<typeof Fees05001Request>;
export type Fees05001ResponseT = z.infer<typeof Fees05001Response>;
export type Fees05002RequestT = z.infer<typeof Fees05002Request>;
export type Fees05002ResponseT = z.infer<typeof Fees05002Response>;
export type Fees05003RequestT = z.infer<typeof Fees05003Request>;
export type Fees05003ResponseT = z.infer<typeof Fees05003Response>;
export type Fees05004RequestT = z.infer<typeof Fees05004Request>;
export type Fees05004ResponseT = z.infer<typeof Fees05004Response>;
export type Fees05005RequestT = z.infer<typeof Fees05005Request>;
export type Fees05005ResponseT = z.infer<typeof Fees05005Response>;
export type Fees05006RequestT = z.infer<typeof Fees05006Request>;
export type Fees05006ResponseT = z.infer<typeof Fees05006Response>;
export type Fees05007RequestT = z.infer<typeof Fees05007Request>;
export type Fees05007ResponseT = z.infer<typeof Fees05007Response>;
export type Fees05008RequestT = z.infer<typeof Fees05008Request>;
export type Fees05008ResponseT = z.infer<typeof Fees05008Response>;
export type Fees05009RequestT = z.infer<typeof Fees05009Request>;
export type Fees05009ResponseT = z.infer<typeof Fees05009Response>;
export type Fees05010RequestT = z.infer<typeof Fees05010Request>;
export type Fees05010ResponseT = z.infer<typeof Fees05010Response>;