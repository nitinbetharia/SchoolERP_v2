/** Controllers for module: SETUP */
import { Request, Response } from 'express';
import * as svc from './services';
import { 
  Setup01001Request, Setup01002Request, Setup01003Request, Setup01004Request,
  Setup01005Request, Setup01006Request, Setup01007Request
} from './dtos';
import { requireSystemAdmin } from '../../lib/rbac';
// import { auditSetupActivity } from '../../lib/audit';

// Export RBAC middleware for use in routes
export const setupRBAC = requireSystemAdmin();

/** SETUP-01-001 — Wizard: Trust creation
 *  DB: trusts, system_config
 *  Deps: DATA-*
 *  RBAC: SYSTEM_ADMIN|GROUP_ADMIN
 */
export async function handle_setup_01_001(req: Request, res: Response) {
  try {
    // 1) RBAC enforced by middleware
    // 2) Validate input
    const input = Setup01001Request.parse(req.body ?? {});
    
    // 3) Business logic
    const result = await svc.setup_01_001Service(input);
    
    // 4) Audit logging (temporarily disabled)
    // await auditSetupActivity(req, 'SETUP-01-001', 'TRUST_CREATED', result);
    
    // 5) Response
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input",
          details: error.issues
        }
      });
    }
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL",
        message: error?.message || "Internal error"
      }
    });
  }
}

/** SETUP-01-002 — Wizard: School creation
 *  DB: schools
 *  Deps: DATA-*, SETUP-01-001
 *  RBAC: SYSTEM_ADMIN|GROUP_ADMIN
 */
export async function handle_setup_01_002(req: Request, res: Response) {
  try {
    // 1) RBAC enforced by middleware
    // 2) Validate input
    const input = Setup01002Request.parse(req.body ?? {});
    
    // 3) Business logic
    const result = await svc.setup_01_002Service(input);
    
    // 4) Audit logging (temporarily disabled)
    // await auditSetupActivity(req, 'SETUP-01-002', 'SCHOOL_CREATED', result);
    
    // 5) Response
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input",
          details: error.issues
        }
      });
    }
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL",
        message: error?.message || "Internal error"
      }
    });
  }
}

/** SETUP-01-003 — Wizard: Academic year creation
 *  DB: academic_years
 *  Deps: SETUP-01-002
 *  RBAC: SYSTEM_ADMIN|GROUP_ADMIN
 */
export async function handle_setup_01_003(req: Request, res: Response) {
  try {
    const input = Setup01003Request.parse(req.body ?? {});
    const result = await svc.setup_01_003Service(input);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input",
          details: error.issues
        }
      });
    }
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL",
        message: error?.message || "Internal error"
      }
    });
  }
}

/** SETUP-01-004 — Class & section setup (+ House)
 *  DB: classes, sections, houses
 *  Deps: SETUP-01-003
 *  RBAC: SYSTEM_ADMIN|GROUP_ADMIN
 */
export async function handle_setup_01_004(req: Request, res: Response) {
  try {
    const input = Setup01004Request.parse(req.body ?? {});
    const result = await svc.setup_01_004Service(input);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input",
          details: error.issues
        }
      });
    }
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL",
        message: error?.message || "Internal error"
      }
    });
  }
}

/** SETUP-01-005 — Subject & grading configuration
 *  DB: classes, trust_config
 *  Deps: SETUP-01-004
 *  RBAC: SYSTEM_ADMIN|GROUP_ADMIN
 */
export async function handle_setup_01_005(req: Request, res: Response) {
  try {
    const input = Setup01005Request.parse(req.body ?? {});
    const result = await svc.setup_01_005Service(input);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input",
          details: error.issues
        }
      });
    }
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL",
        message: error?.message || "Internal error"
      }
    });
  }
}

/** SETUP-01-006 — Trust/school-level config
 *  DB: trust_config
 *  Deps: SETUP-01-002
 *  RBAC: SYSTEM_ADMIN|GROUP_ADMIN
 */
export async function handle_setup_01_006(req: Request, res: Response) {
  try {
    const input = Setup01006Request.parse(req.body ?? {});
    const result = await svc.setup_01_006Service(input);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input",
          details: error.issues
        }
      });
    }
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL",
        message: error?.message || "Internal error"
      }
    });
  }
}

/** SETUP-01-007 — Role seeding (admins)
 *  DB: users, trust_config
 *  Deps: SETUP-01-002
 *  RBAC: SYSTEM_ADMIN|GROUP_ADMIN
 */
export async function handle_setup_01_007(req: Request, res: Response) {
  try {
    const input = Setup01007Request.parse(req.body ?? {});
    const result = await svc.setup_01_007Service(input);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input",
          details: error.issues
        }
      });
    }
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL",
        message: error?.message || "Internal error"
      }
    });
  }
}
