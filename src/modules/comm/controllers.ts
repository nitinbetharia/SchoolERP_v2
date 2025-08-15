/**
 * COMM Module Controllers
 * HTTP request handlers for Communication and Messaging with validation and RBAC
 */

import type { Request, Response } from 'express';
import {
  Comm09001Request,
  Comm09001Response,
  Comm09002Request,
  Comm09002Response,
  Comm09003Request,
  Comm09003Response,
} from './dtos';
import * as services from './services';
import { AuditLogger } from '../../lib/audit';

// COMM-09-001: Notifications (SMS/Email/WhatsApp)
export async function handle_comm_09_001(req: Request, res: Response) {
  try {
    // Validate input
    const input = Comm09001Request.parse(req.body);
    
    // Get authenticated user context
    const { user, trustId } = req as any;
    const userId = user?.id;
    
    if (!userId || !trustId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          details: {}
        }
      });
    }

    // Call service
    const result = await services.comm_09_001Service(input, trustId, userId);

    // Validate response
    const validatedResponse = Comm09001Response.parse(result);

    // Emit audit event
    await AuditLogger.logActivity(req, 'COMM-09-001', 'MESSAGE_SENT', 'communication_messages');

    return res.status(201).json({
      success: true,
      data: validatedResponse
    });

  } catch (error: any) {
    console.error('COMM-09-001 error:', error);
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message || 'Failed to send message',
        details: error.errors || {}
      }
    });
  }
}

// COMM-09-002: In-app announcements
export async function handle_comm_09_002(req: Request, res: Response) {
  try {
    // Validate input
    const input = Comm09002Request.parse(req.body);
    
    // Get authenticated user context
    const { user, trustId } = req as any;
    const userId = user?.id;
    
    if (!userId || !trustId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          details: {}
        }
      });
    }

    // Call service
    const result = await services.comm_09_002Service(input, trustId, userId);

    // Validate response
    const validatedResponse = Comm09002Response.parse(result);

    // Emit audit event
    await AuditLogger.logActivity(req, 'COMM-09-002', 'ANNOUNCEMENT_CREATED', 'communication_announcements');

    return res.status(201).json({
      success: true,
      data: validatedResponse
    });

  } catch (error: any) {
    console.error('COMM-09-002 error:', error);
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message || 'Failed to create announcement',
        details: error.errors || {}
      }
    });
  }
}

// COMM-09-003: Emergency alerts (broadcast)
export async function handle_comm_09_003(req: Request, res: Response) {
  try {
    // Validate input
    const input = Comm09003Request.parse(req.body);
    
    // Get authenticated user context
    const { user, trustId } = req as any;
    const userId = user?.id;
    
    if (!userId || !trustId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          details: {}
        }
      });
    }

    // Call service
    const result = await services.comm_09_003Service(input, trustId, userId);

    // Validate response
    const validatedResponse = Comm09003Response.parse(result);

    // Emit audit event for emergency alert
    await AuditLogger.logActivity(req, 'COMM-09-003', 'EMERGENCY_ALERT_SENT', 'emergency_alerts');

    return res.status(201).json({
      success: true,
      data: validatedResponse
    });

  } catch (error: any) {
    console.error('COMM-09-003 error:', error);
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message || 'Failed to send emergency alert',
        details: error.errors || {}
      }
    });
  }
}