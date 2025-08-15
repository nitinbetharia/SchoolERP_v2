/** Zod DTOs for module: DATA (auto-generated) */
import { z } from 'zod';

// Shared primitives
export const PaginatedQuery = z.object({ page: z.number().int().min(1).default(1), limit: z.number().int().min(1).max(100).default(50) });
export const IdParam = z.object({ id: z.number().int().positive() });

// DATA-00-001: Connection Manager
// DB Entities: system_config, trusts, system_users, migration_versions, sessions, system_audit_logs, schools, classes, sections, users, user_school_assignments, houses, academic_years, trust_config, audit_logs
// Dependencies: nan
export const Data00001Request = z.object({
  action: z.enum(['STATUS', 'TEST_MASTER', 'TEST_TRUST']).optional(),
  trust_id: z.number().int().positive().optional()
}).strict();

export const Data00001Response = z.object({
  master: z.object({
    reachable: z.boolean(),
    host: z.string(),
    database: z.string().optional(),
    version: z.string().optional(),
    uptime: z.number().optional(),
    error: z.string().optional()
  }),
  trust: z.object({
    reachable: z.boolean(),
    host: z.string(),
    database: z.string().optional(),
    version: z.string().optional(),
    error: z.string().optional()
  }).optional(),
  timestamp: z.string()
});

// DATA-00-002: Master DB schema creation
// DB Entities: system_config, trusts, system_users, migration_versions, sessions, system_audit_logs
// Dependencies: nan
export const Data00002Request = z.object({
  force_recreate: z.boolean().optional().default(false)
}).strict();

export const Data00002Response = z.object({
  initialized: z.boolean(),
  migration_version: z.string(),
  tables_created: z.array(z.string()),
  execution_time_ms: z.number()
});

// DATA-00-003: Trust DB schema template
// DB Entities: schools, classes, sections, users, user_school_assignments, houses, academic_years, trust_config, audit_logs
// Dependencies: DATA-00-002
export const Data00003Request = z.object({
  trust_id: z.number().int().positive(),
  force_recreate: z.boolean().optional().default(false)
}).strict();

export const Data00003Response = z.object({
  trust_id: z.number(),
  trust_code: z.string(),
  schema_initialized: z.boolean(),
  migration_version: z.string(),
  tables_created: z.array(z.string()),
  execution_time_ms: z.number()
});

// DATA-00-004: System config storage
// DB Entities: system_config
// Dependencies: DATA-00-002
export const Data00004Request = z.object({
  config_key: z.string().min(1).max(100),
  config_value: z.string(),
  config_type: z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'JSON']).default('STRING'),
  description: z.string().optional(),
  is_public: z.boolean().default(false)
}).strict();

export const Data00004Response = z.object({
  id: z.number(),
  config_key: z.string(),
  config_value: z.string(),
  config_type: z.string(),
  description: z.string().nullable(),
  is_public: z.boolean(),
  created_at: z.string(),
  updated_at: z.string()
});

// DATA-00-005: Trust registry & subdomains
// DB Entities: trusts
// Dependencies: DATA-00-002
export const Data00005Request = z.object({
  trust_name: z.string().min(1).max(200),
  trust_code: z.string().min(1).max(20),
  subdomain: z.string().min(1).max(50),
  is_active: z.boolean().optional().default(true)
}).strict();

export const Data00005Response = z.object({
  id: z.number(),
  trust_name: z.string(),
  trust_code: z.string(),
  subdomain: z.string(),
  is_active: z.boolean(),
  created_at: z.string()
});

// DATA-00-006: System users (sys/group admin)
// DB Entities: system_users
// Dependencies: DATA-00-002
export const Data00006Request = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['SYSTEM_ADMIN', 'GROUP_ADMIN'])
}).strict();

export const Data00006Response = z.object({
  id: z.number(),
  email: z.string(),
  role: z.string(),
  created_at: z.string()
});

// DATA-00-007: Migration tracking
// DB Entities: migration_versions
// Dependencies: DATA-00-002, DATA-00-005
export const Data00007Request = z.object({
  trust_id: z.number().int().positive().optional(),
  migration_version: z.string().min(1),
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED']).optional().default('SUCCESS')
}).strict();

export const Data00007Response = z.object({
  id: z.number(),
  trust_id: z.number().nullable(),
  migration_version: z.string(),
  applied_at: z.string(),
  status: z.string()
});

// DATA-00-008: Session store
// DB Entities: sessions
// Dependencies: DATA-00-002
export const Data00008Request = z.object({
  action: z.enum(['CREATE', 'READ', 'UPDATE', 'DELETE']),
  session_id: z.string().optional(),
  user_id: z.number().int().positive().optional(),
  trust_id: z.number().int().positive().optional(),
  expires: z.number().int().positive().optional(),
  data: z.string().optional()
}).strict();

export const Data00008Response = z.object({
  session_id: z.string(),
  user_id: z.number().nullable(),
  trust_id: z.number().nullable(),
  expires: z.number(),
  data: z.string().nullable(),
  created_at: z.string()
});

// DATA-00-009: Global audit logging
// DB Entities: system_audit_logs
// Dependencies: DATA-00-002
export const Data00009Request = z.object({
  trust_id: z.number().int().positive().optional(),
  user_id: z.number().int().positive().optional(),
  activity_id: z.string().optional(),
  event_type: z.string().min(1).max(50),
  entity_type: z.string().max(50).optional(),
  entity_id: z.number().int().positive().optional(),
  details: z.record(z.string(), z.any()).optional(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional()
}).strict();

export const Data00009Response = z.object({
  id: z.number(),
  trust_id: z.number().nullable(),
  user_id: z.number().nullable(),
  activity_id: z.string().nullable(),
  event_type: z.string(),
  entity_type: z.string().nullable(),
  entity_id: z.number().nullable(),
  details: z.record(z.string(), z.any()).nullable(),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  created_at: z.string()
});

// DATA-00-010: Tenant audit logging
// DB Entities: audit_logs
// Dependencies: DATA-00-003
export const Data00010Request = z.object({
  trust_id: z.number().int().positive(),
  user_id: z.number().int().positive().optional(),
  activity_id: z.string().optional(),
  event_type: z.string().min(1).max(50),
  entity_type: z.string().max(50).optional(),
  entity_id: z.number().int().positive().optional(),
  details: z.record(z.string(), z.any()).optional(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional()
}).strict();

export const Data00010Response = z.object({
  id: z.number(),
  trust_id: z.number(),
  user_id: z.number().nullable(),
  activity_id: z.string().nullable(),
  event_type: z.string(),
  entity_type: z.string().nullable(),
  entity_id: z.number().nullable(),
  details: z.record(z.string(), z.any()).nullable(),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  created_at: z.string()
});

// DATA-00-011: Subdomain/config cache
// DB Entities: trusts, system_config
// Dependencies: DATA-00-004, DATA-00-005
export const Data00011Request = z.object({
  action: z.enum(['REFRESH', 'GET', 'CLEAR']),
  subdomain: z.string().optional(),
  trust_id: z.number().int().positive().optional()
}).strict();

export const Data00011Response = z.object({
  cache_refreshed: z.boolean(),
  subdomain_mappings: z.record(z.string(), z.any()).optional(),
  config_cache: z.record(z.string(), z.any()).optional(),
  timestamp: z.string()
});

// DATA-00-012: Pool cleanup & housekeeping
// DB Entities: nan
// Dependencies: DATA-00-001
export const Data00012Request = z.object({
  action: z.enum(['CLEANUP', 'STATUS', 'FORCE_CLEANUP']).optional().default('CLEANUP'),
  max_idle_time: z.number().int().positive().optional().default(300000) // 5 minutes
}).strict();

export const Data00012Response = z.object({
  cleaned_connections: z.number(),
  active_connections: z.number(),
  idle_connections: z.number(),
  cleanup_time_ms: z.number(),
  timestamp: z.string()
});
