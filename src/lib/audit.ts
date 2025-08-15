import { Request } from 'express';
import { dbManager } from './database';
import { AuthenticatedUser } from './rbac';

export interface AuditEvent {
  activityId?: string;
  eventType: string;
  entityType?: string;
  entityId?: number;
  details?: Record<string, any>;
  userId?: number;
  trustId?: number;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditLogger {
  
  static async logSystemAudit(event: AuditEvent): Promise<void> {
    try {
      const connection = await dbManager.getMasterConnection();
      
      await connection.execute(
        `INSERT INTO system_audit_logs 
         (trust_id, user_id, activity_id, event_type, entity_type, entity_id, details, ip_address, user_agent) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          event.trustId || null,
          event.userId || null,
          event.activityId || null,
          event.eventType,
          event.entityType || null,
          event.entityId || null,
          event.details ? JSON.stringify(event.details) : null,
          event.ipAddress || null,
          event.userAgent || null
        ]
      );
    } catch (error) {
      console.error('Failed to log system audit:', error);
    }
  }

  static async logTenantAudit(event: AuditEvent & { trustId: number }): Promise<void> {
    try {
      const connection = await dbManager.getTrustConnection(event.trustId);
      
      await connection.execute(
        `INSERT INTO audit_logs 
         (trust_id, user_id, activity_id, event_type, entity_type, entity_id, details, ip_address, user_agent) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          event.trustId,
          event.userId || null,
          event.activityId || null,
          event.eventType,
          event.entityType || null,
          event.entityId || null,
          event.details ? JSON.stringify(event.details) : null,
          event.ipAddress || null,
          event.userAgent || null
        ]
      );
    } catch (error) {
      console.error('Failed to log tenant audit:', error);
    }
  }

  static async logActivity(
    req: Request,
    activityId: string,
    eventType: string,
    entityType?: string,
    entityId?: number,
    details?: Record<string, any>
  ): Promise<void> {
    const event: AuditEvent = {
      activityId,
      eventType,
      entityType,
      entityId,
      details,
      userId: req.user?.id,
      trustId: req.trustId || req.user?.trustId,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };

    // Log to system audit logs
    await this.logSystemAudit(event);

    // Also log to tenant if trustId is available
    if (event.trustId) {
      await this.logTenantAudit({ ...event, trustId: event.trustId });
    }
  }
}

// Convenience functions for common audit events
export async function auditDataActivity(
  req: Request, 
  activityId: string, 
  operation: string,
  result?: any
): Promise<void> {
  await AuditLogger.logActivity(
    req,
    activityId,
    `${activityId.replace(/-/g, '_')}_${operation.toUpperCase()}`,
    'SYSTEM',
    undefined,
    { operation, success: !!result }
  );
}

export async function auditPermissionDenied(
  req: Request,
  activityId: string,
  requiredRoles: string[]
): Promise<void> {
  await AuditLogger.logActivity(
    req,
    activityId,
    'PERMISSION_DENIED',
    'ACCESS_CONTROL',
    undefined,
    { 
      requiredRoles,
      userRole: req.user?.role,
      path: req.path,
      method: req.method
    }
  );
}