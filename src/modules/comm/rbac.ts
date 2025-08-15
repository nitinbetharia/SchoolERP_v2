/**
 * COMM Module RBAC
 * Role-Based Access Control middleware for Communication and Messaging
 */

import type { Request, Response, NextFunction } from 'express';

// COMM-09-001: Notifications (SMS/Email/WhatsApp) - TRUST_ADMIN, SCHOOL_ADMIN, TEACHER
export function commMessagingRBAC(req: Request, res: Response, next: NextFunction) {
  const { user } = req as any;
  const userRole = user?.role;
  
  if (!userRole) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        details: {}
      }
    });
  }

  const allowedRoles = ['TRUST_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'];
  
  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'PERMISSION_DENIED',
        message: 'Insufficient permissions for messaging',
        details: { requiredRoles: allowedRoles, userRole }
      }
    });
  }

  next();
}

// COMM-09-002: In-app announcements - TRUST_ADMIN, SCHOOL_ADMIN
export function commAnnouncementRBAC(req: Request, res: Response, next: NextFunction) {
  const { user } = req as any;
  const userRole = user?.role;
  
  if (!userRole) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        details: {}
      }
    });
  }

  const allowedRoles = ['TRUST_ADMIN', 'SCHOOL_ADMIN'];
  
  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'PERMISSION_DENIED',
        message: 'Insufficient permissions for announcements',
        details: { requiredRoles: allowedRoles, userRole }
      }
    });
  }

  next();
}

// COMM-09-003: Emergency alerts (broadcast) - TRUST_ADMIN only
export function commEmergencyRBAC(req: Request, res: Response, next: NextFunction) {
  const { user } = req as any;
  const userRole = user?.role;
  
  if (!userRole) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        details: {}
      }
    });
  }

  const allowedRoles = ['TRUST_ADMIN'];
  
  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'PERMISSION_DENIED',
        message: 'Insufficient permissions for emergency alerts',
        details: { requiredRoles: allowedRoles, userRole }
      }
    });
  }

  next();
}