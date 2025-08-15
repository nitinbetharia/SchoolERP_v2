/**
 * USER Module Controllers
 * HTTP request handlers following industry-standard error handling
 */

import { Request, Response } from 'express';
import * as svc from './services';
import { 
  User03001Request, User03002Request, User03003Request,
  User03004Request, User03005Request, User03006Request
} from './dtos';
import { requireSchoolAdmin, requireTrustAdmin } from '../../lib/rbac';
import { AuditLogger } from '../../lib/audit';

// Export RBAC middleware for use in routes
export const userRBAC = requireSchoolAdmin(); // TRUST_ADMIN|SCHOOL_ADMIN
export const userTrustRBAC = requireTrustAdmin(); // For trust-only activities

/** USER-03-001 — User creation & management
 *  Activity ID: USER-03-001
 *  DB: users, schools
 *  Deps: SETUP-01-002, AUTH-*
 */
export async function handle_user_03_001(req: Request, res: Response) {
  try {
    const input = User03001Request.parse(req.body ?? {});
    const result = await svc.user_03_001Service(input);
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
    
    // Handle business logic errors
    if (error.message?.includes('already exists') || 
        error.message?.includes('cannot be assigned') ||
        error.message?.includes('Invalid role')) {
      return res.status(400).json({
        success: false,
        error: { 
          code: "BUSINESS_RULE_VIOLATION", 
          message: error.message 
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

/** USER-03-002 — User-school assignments
 *  Activity ID: USER-03-002
 *  DB: user_school_assignments, users, schools
 *  Deps: USER-03-001
 */
export async function handle_user_03_002(req: Request, res: Response) {
  try {
    const input = User03002Request.parse(req.body ?? {});
    const result = await svc.user_03_002Service(input);
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
    
    // Handle business logic errors
    if (error.message?.includes('not found') || 
        error.message?.includes('already has') ||
        error.message?.includes('Invalid role')) {
      return res.status(400).json({
        success: false,
        error: { 
          code: "BUSINESS_RULE_VIOLATION", 
          message: error.message 
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

/** USER-03-003 — Role & permission assignment
 *  DB: users, trust_config
 *  Deps: AUTH-02-004
 */
export async function handle_user_03_003(req: Request, res: Response) {
  try {
    const input = User03003Request.parse(req.body ?? {});
    const { user, trustId } = req as any;
    const currentUserId = user?.id;
    
    if (!currentUserId || !trustId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
    }
    
    const result = await svc.user_03_003Service(input, trustId, currentUserId);
    
    // Audit log
    await AuditLogger.logActivity(req, 'USER-03-003', 'ROLE_UPDATED', 'users');
    
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
    
    if (error.message?.includes('not found') || 
        error.message?.includes('Only TRUST_ADMIN') ||
        error.message?.includes('Expiry date')) {
      return res.status(400).json({
        success: false,
        error: { 
          code: "BUSINESS_RULE_VIOLATION", 
          message: error.message 
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

/** USER-03-004 — Teacher subject/class allocation
 *  DB: users, classes, sections, trust_config
 *  Deps: SETUP-01-004, USER-03-001
 */
export async function handle_user_03_004(req: Request, res: Response) {
  try {
    const input = User03004Request.parse(req.body ?? {});
    const { trustId } = req as any;
    
    if (!trustId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
    }
    
    const result = await svc.user_03_004Service(input, trustId);
    
    // Audit log
    await AuditLogger.logActivity(req, 'USER-03-004', 'TEACHER_ALLOCATED', 'teacher_allocations');
    
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
    
    if (error.message?.includes('not found') || 
        error.message?.includes('not a teacher') ||
        error.message?.includes('class teacher') ||
        error.message?.includes('workload')) {
      return res.status(400).json({
        success: false,
        error: { 
          code: "BUSINESS_RULE_VIOLATION", 
          message: error.message 
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

/** USER-03-005 — Staff profile management
 *  DB: users
 *  Deps: USER-03-001
 */
export async function handle_user_03_005(req: Request, res: Response) {
  try {
    const input = User03005Request.parse(req.body ?? {});
    const { trustId } = req as any;
    
    if (!trustId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
    }
    
    const result = await svc.user_03_005Service(input, trustId);
    
    // Audit log
    await AuditLogger.logActivity(req, 'USER-03-005', 'PROFILE_UPDATED', 'users');
    
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
    
    if (error.message?.includes('not found') || 
        error.message?.includes('in the future') ||
        error.message?.includes('exceed 50')) {
      return res.status(400).json({
        success: false,
        error: { 
          code: "BUSINESS_RULE_VIOLATION", 
          message: error.message 
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

/** USER-03-006 — Parent-student linking
 *  DB: users, student_parents, students
 *  Deps: STUD-04-001
 */
export async function handle_user_03_006(req: Request, res: Response) {
  try {
    const input = User03006Request.parse(req.body ?? {});
    const { trustId } = req as any;
    
    if (!trustId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
    }
    
    const result = await svc.user_03_006Service(input, trustId);
    
    // Audit log
    await AuditLogger.logActivity(req, 'USER-03-006', 'PARENT_LINKED', 'student_parents');
    
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
    
    if (error.message?.includes('not found') || 
        error.message?.includes('not a parent') ||
        error.message?.includes('already exists') ||
        error.message?.includes('already has') ||
        error.message?.includes('priority')) {
      return res.status(400).json({
        success: false,
        error: { 
          code: "BUSINESS_RULE_VIOLATION", 
          message: error.message 
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
