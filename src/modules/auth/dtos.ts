/** Zod DTOs for module: AUTH (auto-generated) */
import { z } from 'zod';

// Shared primitives
export const PaginatedQuery = z.object({ page: z.number().int().min(1).default(1), limit: z.number().int().min(1).max(100).default(50) });
export const IdParam = z.object({ id: z.number().int().positive() });

// AUTH-02-001: Local authentication (web sessions)
// DB Entities: users, sessions, audit_logs
// Dependencies: DATA-*, SETUP-01-007
export const Auth02001Request = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  trust_code: z.string().optional(),
  remember_me: z.boolean().default(false)
}).strict();

export const Auth02001Response = z.object({
  session_id: z.string(),
  user_id: z.number().int().positive(),
  email: z.string(),
  role: z.string(),
  trust_id: z.number().int().positive().optional(),
  school_id: z.number().int().positive().optional(),
  expires_at: z.string().datetime(),
  created_at: z.string().datetime()
}).strict();

// AUTH-02-002: JWT authentication (APIs)
// DB Entities: users, audit_logs
// Dependencies: AUTH-02-001
export const Auth02002Request = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  trust_code: z.string().optional()
}).strict();

export const Auth02002Response = z.object({
  access_token: z.string(),
  token_type: z.literal('Bearer'),
  expires_in: z.number().int().positive(),
  user_id: z.number().int().positive(),
  email: z.string(),
  role: z.string(),
  trust_id: z.number().int().positive().optional(),
  school_id: z.number().int().positive().optional(),
  created_at: z.string().datetime()
}).strict();

// AUTH-02-003: Multi-factor (OTP)
// DB Entities: users, audit_logs, trust_config
// Dependencies: AUTH-02-001
export const Auth02003Input = z.object({});

// AUTH-02-004: RBAC (roles & permissions)
// DB Entities: users, trust_config
// Dependencies: SETUP-01-007
export const Auth02004Input = z.object({});

// AUTH-02-005: Permission mapping
// DB Entities: trust_config
// Dependencies: AUTH-02-004
export const Auth02005Input = z.object({});

// AUTH-02-006: Account lockout
// DB Entities: users, audit_logs
// Dependencies: AUTH-02-001
export const Auth02006Input = z.object({});

// AUTH-02-007: Email/phone verification
// DB Entities: users, audit_logs
// Dependencies: AUTH-02-001
export const Auth02007Input = z.object({});

// AUTH-02-008: Password reset flows
// DB Entities: users, audit_logs, system_audit_logs
// Dependencies: AUTH-02-001
export const Auth02008Input = z.object({});

// AUTH-02-009: Auth event logging
// DB Entities: audit_logs, system_audit_logs
// Dependencies: AUTH-02-001
export const Auth02009Input = z.object({});

// AUTH-02-010: API keys/tokens
// DB Entities: trust_config, users
// Dependencies: AUTH-02-002
export const Auth02010Input = z.object({});
