/**
 * ATTD Module Controllers
 * HTTP request handlers for Attendance Management with proper validation and RBAC
 */

import type { Request, Response } from 'express';
import { z } from 'zod';
import * as svc from './services';
import {
  Attd06001Request,
  Attd06002Request,
  Attd06003Request,
  Attd06004Request,
} from './dtos';

// RBAC middleware for ATTD module (simplified for now)
export function attdRBAC(req: Request, res: Response, next: any) {
  // TODO: Implement proper RBAC when auth system is complete
  next();
}

// ATTD-06-001: Daily attendance & bulk import
export async function handle_attd_06_001(req: Request, res: Response) {
  try {
    const validatedInput = Attd06001Request.parse(req.body);
    const trustId = 1; // TODO: Get from auth context
    const result = await svc.attd_06_001Service(validatedInput, trustId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: err.issues,
        },
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: err?.message || 'Failed to mark attendance',
      },
    });
  }
}

// ATTD-06-002: Leave/absence workflows
export async function handle_attd_06_002(req: Request, res: Response) {
  try {
    const validatedInput = Attd06002Request.parse(req.body);
    const trustId = 1; // TODO: Get from auth context
    const result = await svc.attd_06_002Service(validatedInput, trustId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: err.issues,
        },
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: err?.message || 'Failed to create leave application',
      },
    });
  }
}

// ATTD-06-003: Attendance reporting/analytics
export async function handle_attd_06_003(req: Request, res: Response) {
  try {
    const validatedInput = Attd06003Request.parse(req.body);
    const trustId = 1; // TODO: Get from auth context
    const result = await svc.attd_06_003Service(validatedInput, trustId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: err.issues,
        },
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: err?.message || 'Failed to generate attendance report',
      },
    });
  }
}

// ATTD-06-004: Student attendance profiles
export async function handle_attd_06_004(req: Request, res: Response) {
  try {
    const validatedInput = Attd06004Request.parse(req.body);
    const trustId = 1; // TODO: Get from auth context
    const result = await svc.attd_06_004Service(validatedInput, trustId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: err.issues,
        },
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: err?.message || 'Failed to generate student attendance profile',
      },
    });
  }
}
