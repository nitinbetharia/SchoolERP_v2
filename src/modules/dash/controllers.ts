/**
 * DASH Module Controllers
 * HTTP request handlers for Dashboard and Analytics with proper validation and RBAC
 */

import type { Request, Response } from 'express';
import * as svc from './services';
import {
  Dash08001Request,
  Dash08002Request,
  Dash08003Request,
} from './dtos';
import { AuditLogger } from '../../lib/audit';

/** DASH-08-001 — Trust admin dashboard
 *  DB: schools, users, fee_receipts, attendance_summary
 *  Deps: DATA-*, SETUP-*, FEES-*, ATTD-*
 */
export async function handle_dash_08_001(req: Request, res: Response) {
  try {
    // Validate input - query parameters for GET request
    const input = Dash08001Request.parse({
      time_range: req.query.time_range || 'THIS_MONTH',
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      school_ids: req.query.school_ids ? JSON.parse(req.query.school_ids as string) : undefined,
      include_trends: req.query.include_trends === 'true',
      include_financial: req.query.include_financial === 'true',
      include_analytics: req.query.include_analytics === 'true'
    });
    
    const { user, trustId } = req as any;

    // RBAC is handled by middleware

    // Execute service
    const result = await svc.dash_08_001Service(input, trustId);

    // Audit log
    await AuditLogger.logActivity(req, 'DASH-08-001', 'TRUST_DASHBOARD_ACCESSED', 'DASHBOARD');

    res.json({ success: true, data: result });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input",
          details: err.issues,
          traceId: req.headers['x-trace-id']
        }
      });
    }
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

/** DASH-08-002 — School admin dashboard
 *  DB: users, students, fee_receipts, attendance_summary
 *  Deps: SETUP-*, FEES-*, ATTD-*
 */
export async function handle_dash_08_002(req: Request, res: Response) {
  try {
    // Validate input - query parameters for GET request
    const input = Dash08002Request.parse({
      time_range: req.query.time_range || 'THIS_MONTH',
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      class_ids: req.query.class_ids ? JSON.parse(req.query.class_ids as string) : undefined,
      include_class_breakdown: req.query.include_class_breakdown === 'true',
      include_fee_analytics: req.query.include_fee_analytics === 'true',
      include_staff_summary: req.query.include_staff_summary === 'true'
    });
    
    const { user, trustId } = req as any;

    // Get school ID from user context or query
    const schoolId = user?.schoolId || parseInt(req.query.school_id as string);
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_SCHOOL_ID', message: 'School ID is required' }
      });
    }

    // RBAC is handled by middleware

    // Execute service
    const result = await svc.dash_08_002Service(input, trustId, schoolId);

    // Audit log
    await AuditLogger.logActivity(req, 'DASH-08-002', 'SCHOOL_DASHBOARD_ACCESSED', 'DASHBOARD', schoolId);

    res.json({ success: true, data: result });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input",
          details: err.issues,
          traceId: req.headers['x-trace-id']
        }
      });
    }
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

/** DASH-08-003 — Teacher dashboard
 *  DB: classes, sections, attendance_daily
 *  Deps: SETUP-*, ATTD-*
 */
export async function handle_dash_08_003(req: Request, res: Response) {
  try {
    // Validate input - query parameters for GET request
    const input = Dash08003Request.parse({
      time_range: req.query.time_range || 'THIS_WEEK',
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      class_ids: req.query.class_ids ? JSON.parse(req.query.class_ids as string) : undefined,
      include_student_performance: req.query.include_student_performance === 'true',
      include_attendance_details: req.query.include_attendance_details === 'true'
    });
    
    const { user, trustId } = req as any;

    // Get teacher ID from user context
    const teacherId = user?.id;
    if (!teacherId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_TEACHER_ID', message: 'Teacher ID is required' }
      });
    }

    // RBAC is handled by middleware

    // Execute service
    const result = await svc.dash_08_003Service(input, trustId, teacherId);

    // Audit log
    await AuditLogger.logActivity(req, 'DASH-08-003', 'TEACHER_DASHBOARD_ACCESSED', 'DASHBOARD', teacherId);

    res.json({ success: true, data: result });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input",
          details: err.issues,
          traceId: req.headers['x-trace-id']
        }
      });
    }
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
