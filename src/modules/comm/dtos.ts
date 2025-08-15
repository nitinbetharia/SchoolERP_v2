/**
 * COMM Module DTOs
 * Data Transfer Objects for Communication and Messaging following industry standards
 */

import { z } from 'zod';

// Common enums for Communication module
export const CommunicationTypeEnum = z.enum(['SMS', 'EMAIL', 'WHATSAPP', 'IN_APP']);
export const MessageStatusEnum = z.enum(['PENDING', 'SENT', 'DELIVERED', 'FAILED']);
export const CampaignStatusEnum = z.enum(['DRAFT', 'SCHEDULED', 'SENT', 'FAILED']);
export const RecipientTypeEnum = z.enum(['ALL_USERS', 'STUDENTS', 'PARENTS', 'TEACHERS', 'ADMINS', 'CUSTOM']);
export const PriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

// COMM-09-001: Notifications (SMS/Email/WhatsApp)
export const Comm09001Request = z.object({
  message_type: CommunicationTypeEnum,
  template_id: z.number().int().positive().optional(),
  recipient_type: RecipientTypeEnum,
  recipients: z.array(z.object({
    user_id: z.number().int().positive().optional(),
    phone: z.string().min(10).max(15).optional(),
    email: z.string().email().optional(),
    name: z.string().optional()
  })).min(1),
  subject: z.string().max(200).optional(),
  content: z.string().min(1).max(2000),
  variables: z.record(z.string(), z.string()).optional(),
  schedule_at: z.string().datetime().optional(),
  priority: PriorityEnum.default('MEDIUM'),
  track_delivery: z.boolean().default(true)
}).strict();

export const Comm09001Response = z.object({
  message_id: z.number().int().positive(),
  batch_id: z.string().optional(),
  message_type: z.string(),
  total_recipients: z.number().int(),
  content: z.string(),
  status: MessageStatusEnum,
  scheduled_at: z.string().datetime().optional(),
  sent_at: z.string().datetime().optional(),
  recipients: z.array(z.object({
    recipient_id: z.number().int().positive(),
    recipient_address: z.string(),
    recipient_name: z.string().optional(),
    status: MessageStatusEnum,
    sent_at: z.string().datetime().optional(),
    delivered_at: z.string().datetime().optional(),
    error_message: z.string().optional()
  })),
  delivery_stats: z.object({
    total_sent: z.number().int(),
    total_delivered: z.number().int(),
    total_failed: z.number().int(),
    delivery_rate: z.number().min(0).max(100)
  }),
  created_at: z.string().datetime()
}).strict();

// COMM-09-002: In-app announcements
export const Comm09002Request = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1).max(1000),
  target_audience: RecipientTypeEnum,
  specific_recipients: z.array(z.number().int().positive()).optional(),
  priority: PriorityEnum.default('MEDIUM'),
  display_from: z.string().datetime().optional(),
  display_until: z.string().datetime().optional(),
  is_dismissible: z.boolean().default(true),
  requires_acknowledgment: z.boolean().default(false),
  category: z.enum(['GENERAL', 'ACADEMIC', 'ADMINISTRATIVE', 'EMERGENCY', 'EVENT']).default('GENERAL'),
  attachments: z.array(z.object({
    file_name: z.string(),
    file_path: z.string(),
    file_size: z.number().int().positive()
  })).optional()
}).strict();

export const Comm09002Response = z.object({
  announcement_id: z.number().int().positive(),
  title: z.string(),
  content: z.string(),
  target_audience: z.string(),
  priority: z.string(),
  category: z.string(),
  total_recipients: z.number().int(),
  display_from: z.string().datetime().optional(),
  display_until: z.string().datetime().optional(),
  is_active: z.boolean(),
  requires_acknowledgment: z.boolean(),
  acknowledgment_stats: z.object({
    total_recipients: z.number().int(),
    acknowledged_count: z.number().int(),
    pending_count: z.number().int(),
    acknowledgment_rate: z.number().min(0).max(100)
  }).optional(),
  attachments: z.array(z.object({
    file_name: z.string(),
    file_path: z.string(),
    file_size: z.number().int()
  })).optional(),
  created_at: z.string().datetime(),
  created_by: z.string()
}).strict();

// COMM-09-003: Emergency alerts (broadcast)
export const Comm09003Request = z.object({
  alert_title: z.string().min(1).max(100),
  alert_message: z.string().min(1).max(500),
  alert_type: z.enum(['EMERGENCY', 'WEATHER', 'SECURITY', 'HEALTH', 'SYSTEM', 'OTHER']),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL', 'EMERGENCY']),
  channels: z.array(CommunicationTypeEnum).min(1),
  target_audience: RecipientTypeEnum,
  specific_recipients: z.array(z.number().int().positive()).optional(),
  geographic_scope: z.object({
    school_ids: z.array(z.number().int().positive()).optional(),
    class_ids: z.array(z.number().int().positive()).optional()
  }).optional(),
  auto_escalate: z.boolean().default(false),
  escalation_delay_minutes: z.number().int().min(1).max(60).optional(),
  requires_response: z.boolean().default(false),
  response_options: z.array(z.string()).optional(),
  expires_at: z.string().datetime().optional()
}).strict();

export const Comm09003Response = z.object({
  alert_id: z.number().int().positive(),
  campaign_id: z.number().int().positive(),
  alert_title: z.string(),
  alert_message: z.string(),
  alert_type: z.string(),
  severity: z.string(),
  channels: z.array(z.string()),
  total_recipients: z.number().int(),
  broadcast_stats: z.object({
    sms_sent: z.number().int(),
    emails_sent: z.number().int(),
    whatsapp_sent: z.number().int(),
    in_app_sent: z.number().int(),
    total_delivered: z.number().int(),
    total_failed: z.number().int(),
    delivery_rate: z.number().min(0).max(100)
  }),
  response_stats: z.object({
    total_responses: z.number().int(),
    response_rate: z.number().min(0).max(100),
    response_breakdown: z.record(z.string(), z.number().int())
  }).optional(),
  status: CampaignStatusEnum,
  sent_at: z.string().datetime().optional(),
  expires_at: z.string().datetime().optional(),
  created_at: z.string().datetime(),
  created_by: z.string()
}).strict();

// Type exports
export type Comm09001RequestT = z.infer<typeof Comm09001Request>;
export type Comm09001ResponseT = z.infer<typeof Comm09001Response>;
export type Comm09002RequestT = z.infer<typeof Comm09002Request>;
export type Comm09002ResponseT = z.infer<typeof Comm09002Response>;
export type Comm09003RequestT = z.infer<typeof Comm09003Request>;
export type Comm09003ResponseT = z.infer<typeof Comm09003Response>;
