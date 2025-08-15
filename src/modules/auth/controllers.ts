/** Controllers for module: AUTH */
import { Request, Response } from 'express';
import * as svc from './services';
import { Auth02001Request, Auth02002Request } from './dtos';
// import { auditAuthActivity } from '../../lib/audit';

/** AUTH-02-001 — Local authentication (web sessions)
 *  DB: users, sessions, audit_logs
 *  Deps: DATA-*, SETUP-01-007
 *  RBAC: Public (rate-limited)
 */
export async function handle_auth_02_001(req: Request, res: Response) {
  try {
    // 1) No RBAC for login endpoint
    // 2) Validate input
    const input = Auth02001Request.parse(req.body ?? {});
    
    // 3) Business logic
    const result = await svc.auth_02_001Service(input, req);
    
    // 4) Audit logging (temporarily disabled)
    // await auditAuthActivity(req, 'AUTH-02-001', 'SESSION_LOGIN', result);
    
    // 5) Response
    res.status(200).json({ success: true, data: result });
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
    if (error?.message?.includes('Invalid credentials')) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password"
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

/** AUTH-02-002 — JWT authentication (APIs)
 *  DB: users, audit_logs
 *  Deps: AUTH-02-001
 *  RBAC: Public (rate-limited)
 */
export async function handle_auth_02_002(req: Request, res: Response) {
  try {
    // 1) No RBAC for login endpoint
    // 2) Validate input
    const input = Auth02002Request.parse(req.body ?? {});
    
    // 3) Business logic
    const result = await svc.auth_02_002Service(input, req);
    
    // 4) Audit logging (temporarily disabled)
    // await auditAuthActivity(req, 'AUTH-02-002', 'JWT_LOGIN', result);
    
    // 5) Response
    res.status(200).json({ success: true, data: result });
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
    if (error?.message?.includes('Invalid credentials')) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password"
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

/** AUTH-02-003 — Multi-factor (OTP)
 *  DB: users, audit_logs, trust_config
 *  Deps: AUTH-02-001
 */
export async function handle_auth_02_003(req: Request, res: Response) {
  try {
    const result = await svc.auth_02_003Service();
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL', message: err?.message || 'Internal error' } });
  }
}

/** AUTH-02-004 — RBAC (roles & permissions)
 *  DB: users, trust_config
 *  Deps: SETUP-01-007
 */
export async function handle_auth_02_004(req: Request, res: Response) {
  try {
    const result = await svc.auth_02_004Service();
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL', message: err?.message || 'Internal error' } });
  }
}

/** AUTH-02-005 — Permission mapping
 *  DB: trust_config
 *  Deps: AUTH-02-004
 */
export async function handle_auth_02_005(req: Request, res: Response) {
  try {
    const result = await svc.auth_02_005Service();
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL', message: err?.message || 'Internal error' } });
  }
}

/** AUTH-02-006 — Account lockout
 *  DB: users, audit_logs
 *  Deps: AUTH-02-001
 */
export async function handle_auth_02_006(req: Request, res: Response) {
  try {
    const result = await svc.auth_02_006Service();
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL', message: err?.message || 'Internal error' } });
  }
}

/** AUTH-02-007 — Email/phone verification
 *  DB: users, audit_logs
 *  Deps: AUTH-02-001
 */
export async function handle_auth_02_007(req: Request, res: Response) {
  try {
    const result = await svc.auth_02_007Service();
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL', message: err?.message || 'Internal error' } });
  }
}

/** AUTH-02-008 — Password reset flows
 *  DB: users, audit_logs, system_audit_logs
 *  Deps: AUTH-02-001
 */
export async function handle_auth_02_008(req: Request, res: Response) {
  try {
    const result = await svc.auth_02_008Service();
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL', message: err?.message || 'Internal error' } });
  }
}

/** AUTH-02-009 — Auth event logging
 *  DB: audit_logs, system_audit_logs
 *  Deps: AUTH-02-001
 */
export async function handle_auth_02_009(req: Request, res: Response) {
  try {
    const result = await svc.auth_02_009Service();
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL', message: err?.message || 'Internal error' } });
  }
}

/** AUTH-02-010 — API keys/tokens
 *  DB: trust_config, users
 *  Deps: AUTH-02-002
 */
export async function handle_auth_02_010(req: Request, res: Response) {
  try {
    const result = await svc.auth_02_010Service();
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL', message: err?.message || 'Internal error' } });
  }
}
