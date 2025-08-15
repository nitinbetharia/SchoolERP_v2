/**
 * STUD Module Controllers
 * HTTP request handlers following industry-standard error handling
 */

import { Request, Response } from 'express';
import * as svc from './services';
import { 
  Stud04001Request, Stud04002Request, Stud04003Request,
  Stud04004Request, Stud04005Request, Stud04006Request,
  Stud04007Request, Stud04008Request
} from './dtos';
import { requireSchoolAdmin } from '../../lib/rbac';
import { AuditLogger } from '../../lib/audit';

// Export RBAC middleware for use in routes
export const studRBAC = requireSchoolAdmin(); // SCHOOL_ADMIN (as per specifications)

/** STUD-04-001 — Student admission
 *  Activity ID: STUD-04-001
 *  DB: students, admissions, documents
 *  Deps: SETUP-*, AUTH-*
 */
export async function handle_stud_04_001(req: Request, res: Response) {
  try {
    const input = Stud04001Request.parse(req.body ?? {});
    const result = await svc.stud_04_001Service(input);
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
        error.message?.includes('not found') ||
        error.message?.includes('required')) {
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

/** STUD-04-002 — Admission approval workflow
 *  Activity ID: STUD-04-002
 *  DB: admissions, audit_logs
 *  Deps: STUD-04-001
 */
export async function handle_stud_04_002(req: Request, res: Response) {
  try {
    const input = Stud04002Request.parse(req.body ?? {});
    const result = await svc.stud_04_002Service(input);
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
    
    // Handle business logic errors
    if (error.message?.includes('not found') || 
        error.message?.includes('already been processed') ||
        error.message?.includes('required')) {
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

/** STUD-04-003 — Readmission/promotion
 *  DB: students, academic_years, sections
 *  Deps: SETUP-01-003, SETUP-01-004
 */
export async function handle_stud_04_003(req: Request, res: Response) {
  try {
    const input = Stud04003Request.parse(req.body ?? {});
    const result = await svc.stud_04_003Service(input);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL', message: err?.message || 'Internal error' } });
  }
}

/** STUD-04-004 — Inter-school transfer (in-trust)
 *  DB: student_transfers, schools, students
 *  Deps: STUD-04-001, SETUP-01-002
 */
export async function handle_stud_04_004(req: Request, res: Response) {
  try {
    const input = Stud04004Request.parse(req.body ?? {});
    const { trustId } = req as any;
    const result = await svc.stud_04_004Service(input, trustId);
    await AuditLogger.logActivity(req, 'STUD-04-004', 'STUDENT_TRANSFERRED', 'student_transfers');
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    if (err?.name === "ZodError") return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
    res.status(500).json({ success: false, error: { code: 'INTERNAL', message: err?.message || 'Internal error' } });
  }
}

/** STUD-04-005 — Student ID & roll allocation
 *  DB: students, sections
 *  Deps: STUD-04-001, SETUP-01-004
 */
export async function handle_stud_04_005(req: Request, res: Response) {
  try {
    const input = Stud04005Request.parse(req.body ?? {});
    const { trustId } = req as any;
    const result = await svc.stud_04_005Service(input, trustId);
    await AuditLogger.logActivity(req, 'STUD-04-005', 'STUDENT_ROLL_ALLOCATED', 'students');
    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    if (err?.name === "ZodError") return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
    res.status(500).json({ success: false, error: { code: 'INTERNAL', message: err?.message || 'Internal error' } });
  }
}

/** STUD-04-006 — Siblings & category allocation
 *  DB: students, student_parents, trust_config
 *  Deps: STUD-04-001
 */
export async function handle_stud_04_006(req: Request, res: Response) {
  try {
    const input = Stud04006Request.parse(req.body ?? {});
    const { trustId } = req as any;
    const result = await svc.stud_04_006Service(input, trustId);
    await AuditLogger.logActivity(req, 'STUD-04-006', 'STUDENT_CATEGORIES_UPDATED', 'students');
    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    if (err?.name === "ZodError") return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
    res.status(500).json({ success: false, error: { code: 'INTERNAL', message: err?.message || 'Internal error' } });
  }
}

/** STUD-04-007 — Student documents & certificates
 *  DB: documents, students
 *  Deps: STUD-04-001
 */
export async function handle_stud_04_007(req: Request, res: Response) {
  try {
    const input = Stud04007Request.parse(req.body ?? {});
    const { trustId } = req as any;
    const result = await svc.stud_04_007Service(input, trustId);
    await AuditLogger.logActivity(req, 'STUD-04-007', 'STUDENT_DOCUMENT_ADDED', 'student_documents');
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    if (err?.name === "ZodError") return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
    res.status(500).json({ success: false, error: { code: 'INTERNAL', message: err?.message || 'Internal error' } });
  }
}

/** STUD-04-008 — Student analytics
 *  DB: students, academic_years, etc.
 *  Deps: STUD-04-001
 */
export async function handle_stud_04_008(req: Request, res: Response) {
  try {
    const input = Stud04008Request.parse(req.body ?? {});
    const { trustId } = req as any;
    const result = await svc.stud_04_008Service(input, trustId);
    await AuditLogger.logActivity(req, 'STUD-04-008', 'STUDENT_ANALYTICS_GENERATED', 'analytics');
    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    if (err?.name === "ZodError") return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
    res.status(500).json({ success: false, error: { code: 'INTERNAL', message: err?.message || 'Internal error' } });
  }
}