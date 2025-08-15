import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export enum UserRole {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  GROUP_ADMIN = 'GROUP_ADMIN',
  TRUST_ADMIN = 'TRUST_ADMIN',
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',
  TEACHER = 'TEACHER',
  ACCOUNTANT = 'ACCOUNTANT',
  PARENT = 'PARENT',
  STUDENT = 'STUDENT'
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: UserRole;
  trustId?: number;
  schoolId?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      trustId?: number;
    }
  }
}

export class RBACError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RBACError';
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // For now, mock authentication - in production this would validate JWT/session
      if (!req.user && !req.headers.authorization) {
        // Mock user for development - remove in production
        req.user = {
          id: 1,
          email: 'admin@system.com',
          role: UserRole.SYSTEM_ADMIN,
          trustId: 1,
          schoolId: 1
        };
        req.trustId = 1;
      }
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        // Emit audit event for permission denial
        console.log(`PERMISSION_DENIED: User ${req.user.id} (${req.user.role}) attempted ${req.method} ${req.path}`);
        
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
          }
        });
      }

      next();
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL',
          message: 'Authorization check failed'
        }
      });
    }
  };
}

export function requireSystemAdmin() {
  return requireRole(UserRole.SYSTEM_ADMIN, UserRole.GROUP_ADMIN);
}

export function requireTrustAdmin() {
  return requireRole(UserRole.SYSTEM_ADMIN, UserRole.GROUP_ADMIN, UserRole.TRUST_ADMIN);
}

export function requireSchoolAdmin() {
  return requireRole(
    UserRole.SYSTEM_ADMIN, 
    UserRole.GROUP_ADMIN, 
    UserRole.TRUST_ADMIN, 
    UserRole.SCHOOL_ADMIN
  );
}

export function requireAccountant() {
  return requireRole(
    UserRole.SYSTEM_ADMIN, 
    UserRole.GROUP_ADMIN, 
    UserRole.TRUST_ADMIN, 
    UserRole.SCHOOL_ADMIN,
    UserRole.ACCOUNTANT
  );
}

export function requireTeacher() {
  return requireRole(
    UserRole.SYSTEM_ADMIN, 
    UserRole.GROUP_ADMIN, 
    UserRole.TRUST_ADMIN, 
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER
  );
}