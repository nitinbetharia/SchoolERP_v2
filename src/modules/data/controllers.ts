/** Controllers for module: DATA */
import { Request, Response } from 'express';
import * as svc from './services';
import { 
  Data00001Request, Data00002Request, Data00003Request, Data00004Request,
  Data00005Request, Data00006Request, Data00007Request, Data00008Request,
  Data00009Request, Data00010Request, Data00011Request, Data00012Request
} from './dtos';
import { z } from 'zod';
import { requireSystemAdmin } from '../../lib/rbac';
// import { auditDataActivity } from '../../lib/audit';

// Export RBAC middleware for use in routes
export const dataRBAC = requireSystemAdmin();

/** 
 * Smart dispatcher for /system endpoint that routes to different handlers based on request body
 */
export async function handle_system_dispatcher(req: Request, res: Response) {
  try {
    const body = req.body || {};
    
    // Route based on request body fields to determine which activity this is
    if (body.trust_name || body.trust_code || body.subdomain) {
      // DATA-00-005: Trust registry & subdomains
      console.log('Routing to DATA-00-005: Trust registry');
      return handle_data_00_005(req, res);
    } else if (body.email && body.password && body.role) {
      // DATA-00-006: System users
      console.log('Routing to DATA-00-006: System users');
      return handle_data_00_006(req, res);
    } else if (body.force_recreate !== undefined) {
      // DATA-00-002: Master DB schema creation
      console.log('Routing to DATA-00-002: Master schema');
      return handle_data_00_002(req, res);
    } else {
      // Default to schema creation if no specific fields
      console.log('Routing to DATA-00-002: Default master schema');
      return handle_data_00_002(req, res);
    }
  } catch (err: any) {
    res.status(500).json({ 
      success: false, 
      error: { 
        code: 'INTERNAL', 
        message: err?.message || 'System dispatcher error' 
      } 
    });
  }
}

/** DATA-00-001 — Connection Manager
 *  DB: system_config, trusts, system_users, migration_versions, sessions, system_audit_logs, schools, classes, sections, users, user_school_assignments, houses, academic_years, trust_config, audit_logs
 *  Deps: nan
 *  RBAC: SYSTEM_ADMIN|GROUP_ADMIN
 */
export async function handle_data_00_001(req: Request, res: Response) {
  try {
    // 1) RBAC enforced by middleware
    // 2) Validate input
    const input = Data00001Request.parse(req.body ?? {});

    // 3) Business logic
    const result = await svc.data_00_001Service(input);

    // 4) Audit logging (temporarily disabled)
    // await auditDataActivity(req, 'DATA-00-001', 'CONNECTION_STATUS_CHECKED', result);

    // 5) Response
    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return res.status(400).json({ 
        success: false, 
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'Invalid input', 
          details: err.issues 
        } 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: { 
        code: 'INTERNAL', 
        message: err?.message || 'Internal error' 
      } 
    });
  }
}

/** DATA-00-002 — Master DB schema creation
 *  DB: system_config, trusts, system_users, migration_versions, sessions, system_audit_logs
 *  Deps: nan
 *  RBAC: SYSTEM_ADMIN|GROUP_ADMIN
 */
export async function handle_data_00_002(req: Request, res: Response) {
  try {
    // 1) RBAC enforced by middleware
    // 2) Validate input
    const input = Data00002Request.parse(req.body ?? {});

    // 3) Business logic
    const result = await svc.data_00_002Service(input);

    // 4) Audit logging (temporarily disabled)
    // await auditDataActivity(req, 'DATA-00-002', 'MASTER_SCHEMA_INITIALIZED', result);

    // 5) Response
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return res.status(400).json({ 
        success: false, 
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'Invalid input', 
          details: err.issues 
        } 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: { 
        code: 'INTERNAL', 
        message: err?.message || 'Internal error' 
      } 
    });
  }
}

/** DATA-00-003 — Trust DB schema template
 *  DB: schools, classes, sections, users, user_school_assignments, houses, academic_years, trust_config, audit_logs
 *  Deps: DATA-00-002
 *  RBAC: SYSTEM_ADMIN|GROUP_ADMIN
 */
export async function handle_data_00_003(req: Request, res: Response) {
  try {
    // 1) RBAC - TODO: Implement proper role checking
    // requireRole(["SYSTEM_ADMIN", "GROUP_ADMIN"]);

    // 2) Validate input
    const input = Data00003Request.parse(req.body ?? {});

    // 3) Business logic
    const result = await svc.data_00_003Service(input);

    // 4) Audit logging (temporarily disabled)
    // await auditDataActivity(req, 'DATA-00-003', 'TRUST_SCHEMA_INITIALIZED', result);

    // 5) Response
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return res.status(400).json({ 
        success: false, 
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'Invalid input', 
          details: err.issues 
        } 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: { 
        code: 'INTERNAL', 
        message: err?.message || 'Internal error' 
      } 
    });
  }
}

/** DATA-00-004 — System config storage
 *  DB: system_config
 *  Deps: DATA-00-002
 *  RBAC: SYSTEM_ADMIN|GROUP_ADMIN
 */
export async function handle_data_00_004(req: Request, res: Response) {
  try {
    // 1) RBAC - TODO: Implement proper role checking
    // requireRole(["SYSTEM_ADMIN", "GROUP_ADMIN"]);

    // 2) Validate input
    const input = Data00004Request.parse(req.body ?? {});

    // 3) Business logic
    const result = await svc.data_00_004Service(input);

    // 4) Audit logging (temporarily disabled)
    // await auditDataActivity(req, 'DATA-00-004', 'SYSTEM_CONFIG_STORED', result);

    // 5) Response
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return res.status(400).json({ 
        success: false, 
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'Invalid input', 
          details: err.issues 
        } 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: { 
        code: 'INTERNAL', 
        message: err?.message || 'Internal error' 
      } 
    });
  }
}

/** DATA-00-005 — Trust registry & subdomains
 *  DB: trusts
 *  Deps: DATA-00-002
 *  RBAC: SYSTEM_ADMIN|GROUP_ADMIN
 */
export async function handle_data_00_005(req: Request, res: Response) {
  try {
    // 1) RBAC - TODO: Implement proper role checking
    // requireRole(["SYSTEM_ADMIN", "GROUP_ADMIN"]);

    // 2) Validate input
    const input = Data00005Request.parse(req.body ?? {});

    // 3) Business logic
    const result = await svc.data_00_005Service(input);

    // 4) Audit logging (temporarily disabled)
    // await auditDataActivity(req, 'DATA-00-005', 'TRUST_REGISTERED', result);

    // 5) Response
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return res.status(400).json({ 
        success: false, 
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'Invalid input', 
          details: err.issues 
        } 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: { 
        code: 'INTERNAL', 
        message: err?.message || 'Internal error' 
      } 
    });
  }
}

/** DATA-00-006 — System users (sys/group admin)
 *  DB: system_users
 *  Deps: DATA-00-002
 *  RBAC: SYSTEM_ADMIN|GROUP_ADMIN
 */
export async function handle_data_00_006(req: Request, res: Response) {
  try {
    // 1) RBAC - TODO: Implement proper role checking
    // requireRole(["SYSTEM_ADMIN", "GROUP_ADMIN"]);

    // 2) Validate input
    const input = Data00006Request.parse(req.body ?? {});

    // 3) Business logic
    const result = await svc.data_00_006Service(input);

    // 4) Audit logging (temporarily disabled)
    // await auditDataActivity(req, 'DATA-00-006', 'SYSTEM_USER_CREATED', result);

    // 5) Response
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return res.status(400).json({ 
        success: false, 
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'Invalid input', 
          details: err.issues 
        } 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: { 
        code: 'INTERNAL', 
        message: err?.message || 'Internal error' 
      } 
    });
  }
}

/** DATA-00-007 — Migration tracking
 *  DB: migration_versions
 *  Deps: DATA-00-002, DATA-00-005
 *  RBAC: SYSTEM_ADMIN|GROUP_ADMIN
 */
export async function handle_data_00_007(req: Request, res: Response) {
  try {
    // 1) RBAC - TODO: Implement proper role checking
    // requireRole(["SYSTEM_ADMIN", "GROUP_ADMIN"]);

    // 2) Validate input
    const input = Data00007Request.parse(req.body ?? {});

    // 3) Business logic
    const result = await svc.data_00_007Service(input);

    // 4) Audit logging (temporarily disabled)
    // await auditDataActivity(req, 'DATA-00-007', 'MIGRATION_TRACKED', result);

    // 5) Response
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return res.status(400).json({ 
        success: false, 
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'Invalid input', 
          details: err.issues 
        } 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: { 
        code: 'INTERNAL', 
        message: err?.message || 'Internal error' 
      } 
    });
  }
}

/** DATA-00-008 — Session store
 *  DB: sessions
 *  Deps: DATA-00-002
 *  RBAC: SYSTEM_ADMIN|GROUP_ADMIN
 */
export async function handle_data_00_008(req: Request, res: Response) {
  try {
    // 1) RBAC - TODO: Implement proper role checking
    // requireRole(["SYSTEM_ADMIN", "GROUP_ADMIN"]);

    // 2) Validate input
    const input = Data00008Request.parse(req.body ?? {});

    // 3) Business logic
    const result = await svc.data_00_008Service(input);

    // 4) Audit logging (temporarily disabled)
    // await auditDataActivity(req, 'DATA-00-008', 'SESSION_MANAGED', result);

    // 5) Response
    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return res.status(400).json({ 
        success: false, 
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'Invalid input', 
          details: err.issues 
        } 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: { 
        code: 'INTERNAL', 
        message: err?.message || 'Internal error' 
      } 
    });
  }
}

/** DATA-00-009 — Global audit logging
 *  DB: system_audit_logs
 *  Deps: DATA-00-002
 *  RBAC: SYSTEM_ADMIN|GROUP_ADMIN
 */
export async function handle_data_00_009(req: Request, res: Response) {
  try {
    // 1) RBAC - TODO: Implement proper role checking
    // requireRole(["SYSTEM_ADMIN", "GROUP_ADMIN"]);

    // 2) Validate input
    const input = Data00009Request.parse(req.body ?? {});

    // 3) Business logic
    const result = await svc.data_00_009Service(input);

    // 4) Audit logging (temporarily disabled)
    // await auditDataActivity(req, 'DATA-00-009', 'SYSTEM_AUDIT_LOGGED', result);

    // 5) Response
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return res.status(400).json({ 
        success: false, 
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'Invalid input', 
          details: err.issues 
        } 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: { 
        code: 'INTERNAL', 
        message: err?.message || 'Internal error' 
      } 
    });
  }
}

/** DATA-00-010 — Tenant audit logging
 *  DB: audit_logs
 *  Deps: DATA-00-003
 *  RBAC: SYSTEM_ADMIN|GROUP_ADMIN
 */
export async function handle_data_00_010(req: Request, res: Response) {
  try {
    // 1) RBAC - TODO: Implement proper role checking
    // requireRole(["SYSTEM_ADMIN", "GROUP_ADMIN"]);

    // 2) Validate input
    const input = Data00010Request.parse(req.body ?? {});

    // 3) Business logic
    const result = await svc.data_00_010Service(input);

    // 4) Audit logging (temporarily disabled)
    // await auditDataActivity(req, 'DATA-00-010', 'TENANT_AUDIT_LOGGED', result);

    // 5) Response
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return res.status(400).json({ 
        success: false, 
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'Invalid input', 
          details: err.issues 
        } 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: { 
        code: 'INTERNAL', 
        message: err?.message || 'Internal error' 
      } 
    });
  }
}

/** DATA-00-011 — Subdomain/config cache
 *  DB: trusts, system_config
 *  Deps: DATA-00-004, DATA-00-005
 *  RBAC: SYSTEM_ADMIN|GROUP_ADMIN
 */
export async function handle_data_00_011(req: Request, res: Response) {
  try {
    // 1) RBAC - TODO: Implement proper role checking
    // requireRole(["SYSTEM_ADMIN", "GROUP_ADMIN"]);

    // 2) Validate input
    const input = Data00011Request.parse(req.body ?? {});

    // 3) Business logic
    const result = await svc.data_00_011Service(input);

    // 4) Audit logging (temporarily disabled)
    // await auditDataActivity(req, 'DATA-00-011', 'CACHE_MANAGED', result);

    // 5) Response
    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return res.status(400).json({ 
        success: false, 
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'Invalid input', 
          details: err.issues 
        } 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: { 
        code: 'INTERNAL', 
        message: err?.message || 'Internal error' 
      } 
    });
  }
}

/** DATA-00-012 — Pool cleanup & housekeeping
 *  DB: nan
 *  Deps: DATA-00-001
 *  RBAC: SYSTEM_ADMIN|GROUP_ADMIN
 */
export async function handle_data_00_012(req: Request, res: Response) {
  try {
    // 1) RBAC - TODO: Implement proper role checking
    // requireRole(["SYSTEM_ADMIN", "GROUP_ADMIN"]);

    // 2) Validate input
    const input = Data00012Request.parse(req.body ?? {});

    // 3) Business logic
    const result = await svc.data_00_012Service(input);

    // 4) Audit logging (temporarily disabled)
    // await auditDataActivity(req, 'DATA-00-012', 'POOL_CLEANUP_PERFORMED', result);

    // 5) Response
    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return res.status(400).json({ 
        success: false, 
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'Invalid input', 
          details: err.issues 
        } 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: { 
        code: 'INTERNAL', 
        message: err?.message || 'Internal error' 
      } 
    });
  }
}
