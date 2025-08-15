/** Controllers for module: REPT */
import { Request, Response } from 'express';
import * as svc from './services';
import {
  Rept07001Request,
  Rept07002Request,
  Rept07003Request,
  Rept07004Request,
  Rept07005Request,
  Rept07006Request
} from './dtos';
import { AuditLogger } from '../../lib/audit';

/** REPT-07-001 — Student profile reports
 *  DB: students, admissions
 *  Deps: STUD-*
 */
export async function handle_rept_07_001(req: Request, res: Response) {
  try {
    // Validate input
    const input = Rept07001Request.parse(req.body);
    const { user, trustId } = req as any;

    // RBAC is handled by middleware

    // Execute service
    const result = await svc.rept_07_001Service(input, trustId);

    // Audit log
    await AuditLogger.logActivity(req, 'REPT-07-001', 'STUDENT_PROFILE_REPORT_GENERATED', 'REPORT', result.report_id);

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ 
      success: false, 
      error: { 
        code: 'INTERNAL', 
        message: err?.message || 'Internal error',
        traceId: req.headers['x-trace-id']
      } 
    });
  }
}

/** REPT-07-002 — Fee collection reports
 *  DB: fee_receipts, student_fee_assignments
 *  Deps: FEES-*
 */
export async function handle_rept_07_002(req: Request, res: Response) {
  try {
    // Validate input
    const input = Rept07002Request.parse(req.body);
    const { user, trustId } = req as any;

    // RBAC is handled by middleware

    // Execute service
    const result = await svc.rept_07_002Service(input, trustId);

    // Audit log
    await AuditLogger.logActivity(req, 'REPT-07-002', 'FEE_COLLECTION_REPORT_GENERATED', 'REPORT', result.report_id);

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ 
      success: false, 
      error: { 
        code: 'INTERNAL', 
        message: err?.message || 'Internal error',
        traceId: req.headers['x-trace-id']
      } 
    });
  }
}

/** REPT-07-003 — Attendance summary reports
 *  DB: attendance_summary, students
 *  Deps: ATTD-*
 */
export async function handle_rept_07_003(req: Request, res: Response) {
  try {
    // Validate input
    const input = Rept07003Request.parse(req.body);
    const { user, trustId } = req as any;

    // RBAC is handled by middleware

    // Execute service
    const result = await svc.rept_07_003Service(input, trustId);

    // Audit log
    await AuditLogger.logActivity(req, 'REPT-07-003', 'ATTENDANCE_SUMMARY_REPORT_GENERATED', 'REPORT', result.report_id);

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ 
      success: false, 
      error: { 
        code: 'INTERNAL', 
        message: err?.message || 'Internal error',
        traceId: req.headers['x-trace-id']
      } 
    });
  }
}

/** REPT-07-004 — Academic performance reports
 *  DB: classes, sections, trust_config
 *  Deps: SETUP-*
 */
export async function handle_rept_07_004(req: Request, res: Response) {
  try {
    // Validate input
    const input = Rept07004Request.parse(req.body);
    const { user, trustId } = req as any;

    // RBAC is handled by middleware

    // Execute service
    const result = await svc.rept_07_004Service(input, trustId);

    // Audit log
    await AuditLogger.logActivity(req, 'REPT-07-004', 'ACADEMIC_PERFORMANCE_REPORT_GENERATED', 'REPORT', result.report_id);

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ 
      success: false, 
      error: { 
        code: 'INTERNAL', 
        message: err?.message || 'Internal error',
        traceId: req.headers['x-trace-id']
      } 
    });
  }
}

/** REPT-07-005 — Custom report builder
 *  DB: reports, report_templates
 *  Deps: DATA-*, SETUP-*
 */
export async function handle_rept_07_005(req: Request, res: Response) {
  try {
    // Validate input
    const input = Rept07005Request.parse(req.body);
    const { user, trustId } = req as any;

    // RBAC is handled by middleware

    // Execute service
    const result = await svc.rept_07_005Service(input, trustId);

    // Audit log
    await AuditLogger.logActivity(req, 'REPT-07-005', 'CUSTOM_REPORT_GENERATED', 'REPORT', result.report_id);

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ 
      success: false, 
      error: { 
        code: 'INTERNAL', 
        message: err?.message || 'Internal error',
        traceId: req.headers['x-trace-id']
      } 
    });
  }
}

/** REPT-07-006 — Export to PDF/Excel
 *  DB: reports
 *  Deps: REPT-07-001, REPT-07-002, REPT-07-003
 */
export async function handle_rept_07_006(req: Request, res: Response) {
  try {
    // Validate input
    const input = Rept07006Request.parse(req.body);
    const { user, trustId } = req as any;

    // RBAC is handled by middleware

    // Execute service
    const result = await svc.rept_07_006Service(input, trustId);

    // Audit log
    await AuditLogger.logActivity(req, 'REPT-07-006', 'REPORT_EXPORTED', 'REPORT_EXPORT', result.export_id);

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ 
      success: false, 
      error: { 
        code: 'INTERNAL', 
        message: err?.message || 'Internal error',
        traceId: req.headers['x-trace-id']
      } 
    });
  }
}
