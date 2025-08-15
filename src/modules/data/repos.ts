/** Repository layer for module: DATA */
import { dbManager } from '../../lib/database';
import fs from 'fs/promises';
import path from 'path';

export class DataRepo {
  constructor() {}

  async getConnectionStatus(trustId?: number) {
    const masterStatus = await dbManager.testMasterConnection();
    let trustStatus;
    
    if (trustId) {
      trustStatus = await dbManager.testTrustConnection(trustId);
    }

    return {
      master: masterStatus,
      trust: trustStatus,
      timestamp: new Date().toISOString(),
    };
  }

  async initializeMasterSchema(): Promise<{ tables_created: string[], execution_time_ms: number }> {
    const startTime = Date.now();
    await dbManager.initializeMasterSchema();
    
    // Get list of tables created
    const connection = await dbManager.getMasterConnection();
    const [rows] = await connection.execute('SHOW TABLES');
    const tables = Array.isArray(rows) ? rows.map((row: any) => Object.values(row)[0] as string) : [];
    
    return {
      tables_created: tables,
      execution_time_ms: Date.now() - startTime
    };
  }

  async initializeTrustSchema(trustId: number): Promise<{ trust_code: string, tables_created: string[], execution_time_ms: number }> {
    const startTime = Date.now();
    
    // Get trust code first
    const masterConn = await dbManager.getMasterConnection();
    const [trustRows] = await masterConn.execute(
      'SELECT trust_code FROM trusts WHERE id = ? AND is_active = 1',
      [trustId]
    );
    
    if (!Array.isArray(trustRows) || trustRows.length === 0) {
      throw new Error(`Trust ${trustId} not found or inactive`);
    }
    
    const trustCode = (trustRows[0] as any).trust_code;
    
    await dbManager.initializeTrustSchema(trustId);
    
    // Get list of tables created
    const trustConn = await dbManager.getTrustConnection(trustId);
    const [rows] = await trustConn.execute('SHOW TABLES');
    const tables = Array.isArray(rows) ? rows.map((row: any) => Object.values(row)[0] as string) : [];
    
    return {
      trust_code: trustCode,
      tables_created: tables,
      execution_time_ms: Date.now() - startTime
    };
  }

  async storeSystemConfig(data: {
    config_key: string;
    config_value: string;
    config_type: string;
    description?: string;
    is_public: boolean;
  }) {
    const connection = await dbManager.getMasterConnection();
    
    const [result] = await connection.execute(
      `INSERT INTO system_config (config_key, config_value, config_type, description, is_public) 
       VALUES (?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
       config_value = VALUES(config_value), 
       config_type = VALUES(config_type),
       description = VALUES(description),
       is_public = VALUES(is_public),
       updated_at = CURRENT_TIMESTAMP`,
      [data.config_key, data.config_value, data.config_type, data.description || null, data.is_public]
    );

    const insertId = (result as any).insertId;
    
    // Fetch the created/updated record
    const [rows] = await connection.execute(
      'SELECT * FROM system_config WHERE id = ? OR config_key = ?',
      [insertId, data.config_key]
    );
    
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  }

  async createTrust(data: {
    trust_name: string;
    trust_code: string;
    subdomain: string;
    is_active: boolean;
  }) {
    const connection = await dbManager.getMasterConnection();
    
    const [result] = await connection.execute(
      'INSERT INTO trusts (trust_name, trust_code, subdomain, is_active) VALUES (?, ?, ?, ?)',
      [data.trust_name, data.trust_code, data.subdomain, data.is_active]
    );

    const insertId = (result as any).insertId;
    
    // Fetch the created record
    const [rows] = await connection.execute(
      'SELECT * FROM trusts WHERE id = ?',
      [insertId]
    );
    
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  }

  async createSystemUser(data: {
    email: string;
    password_hash: string;
    role: string;
  }) {
    const connection = await dbManager.getMasterConnection();
    
    const [result] = await connection.execute(
      'INSERT INTO system_users (email, password_hash, role) VALUES (?, ?, ?)',
      [data.email, data.password_hash, data.role]
    );

    const insertId = (result as any).insertId;
    
    // Fetch the created record (without password)
    const [rows] = await connection.execute(
      'SELECT id, email, role, created_at FROM system_users WHERE id = ?',
      [insertId]
    );
    
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  }

  async recordMigration(data: {
    trust_id?: number;
    migration_version: string;
    status: string;
  }) {
    const connection = await dbManager.getMasterConnection();
    
    const [result] = await connection.execute(
      'INSERT INTO migration_versions (trust_id, migration_version, status) VALUES (?, ?, ?)',
      [data.trust_id || null, data.migration_version, data.status]
    );

    const insertId = (result as any).insertId;
    
    // Fetch the created record
    const [rows] = await connection.execute(
      'SELECT * FROM migration_versions WHERE id = ?',
      [insertId]
    );
    
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  }

  async manageSession(action: string, data: any) {
    const connection = await dbManager.getMasterConnection();
    
    switch (action) {
      case 'CREATE':
        const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const expires = data.expires || Date.now() + (24 * 60 * 60 * 1000); // 24 hours default
        
        await connection.execute(
          'INSERT INTO sessions (session_id, user_id, trust_id, expires, data) VALUES (?, ?, ?, ?, ?)',
          [sessionId, data.user_id || null, data.trust_id || null, expires, data.data || null]
        );
        
        const [rows] = await connection.execute(
          'SELECT * FROM sessions WHERE session_id = ?',
          [sessionId]
        );
        
        return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
        
      case 'READ':
        if (!data.session_id) throw new Error('session_id required for read');
        
        const [readRows] = await connection.execute(
          'SELECT * FROM sessions WHERE session_id = ? AND expires > ?',
          [data.session_id, Date.now()]
        );
        
        return Array.isArray(readRows) && readRows.length > 0 ? readRows[0] : null;
        
      case 'DELETE':
        if (!data.session_id) throw new Error('session_id required for delete');
        
        await connection.execute(
          'DELETE FROM sessions WHERE session_id = ?',
          [data.session_id]
        );
        
        return { deleted: true };
        
      default:
        throw new Error(`Unknown session action: ${action}`);
    }
  }

  async logSystemAudit(data: {
    trust_id?: number;
    user_id?: number;
    activity_id?: string;
    event_type: string;
    entity_type?: string;
    entity_id?: number;
    details?: any;
    ip_address?: string;
    user_agent?: string;
  }) {
    const connection = await dbManager.getMasterConnection();
    
    const [result] = await connection.execute(
      `INSERT INTO system_audit_logs 
       (trust_id, user_id, activity_id, event_type, entity_type, entity_id, details, ip_address, user_agent) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.trust_id || null,
        data.user_id || null,
        data.activity_id || null,
        data.event_type,
        data.entity_type || null,
        data.entity_id || null,
        data.details ? JSON.stringify(data.details) : null,
        data.ip_address || null,
        data.user_agent || null
      ]
    );

    const insertId = (result as any).insertId;
    
    // Fetch the created record
    const [rows] = await connection.execute(
      'SELECT * FROM system_audit_logs WHERE id = ?',
      [insertId]
    );
    
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  }

  async logTenantAudit(data: {
    trust_id: number;
    user_id?: number;
    activity_id?: string;
    event_type: string;
    entity_type?: string;
    entity_id?: number;
    details?: any;
    ip_address?: string;
    user_agent?: string;
  }) {
    const connection = await dbManager.getTrustConnection(data.trust_id);
    
    const [result] = await connection.execute(
      `INSERT INTO audit_logs 
       (trust_id, user_id, activity_id, event_type, entity_type, entity_id, details, ip_address, user_agent) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.trust_id,
        data.user_id || null,
        data.activity_id || null,
        data.event_type,
        data.entity_type || null,
        data.entity_id || null,
        data.details ? JSON.stringify(data.details) : null,
        data.ip_address || null,
        data.user_agent || null
      ]
    );

    const insertId = (result as any).insertId;
    
    // Fetch the created record
    const [rows] = await connection.execute(
      'SELECT * FROM audit_logs WHERE id = ?',
      [insertId]
    );
    
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  }

  private cacheStore: Map<string, any> = new Map();

  async manageCache(action: string, data: any) {
    switch (action) {
      case 'REFRESH':
        // Refresh subdomain mappings
        const connection = await dbManager.getMasterConnection();
        const [trustRows] = await connection.execute(
          'SELECT id, trust_code, subdomain FROM trusts WHERE is_active = 1'
        );
        
        const [configRows] = await connection.execute(
          'SELECT config_key, config_value, config_type FROM system_config WHERE is_public = 1'
        );
        
        const subdomainMappings: any = {};
        if (Array.isArray(trustRows)) {
          for (const trust of trustRows) {
            const t = trust as any;
            subdomainMappings[t.subdomain] = {
              trust_id: t.id,
              trust_code: t.trust_code
            };
          }
        }
        
        const configCache: any = {};
        if (Array.isArray(configRows)) {
          for (const config of configRows) {
            const c = config as any;
            configCache[c.config_key] = {
              value: c.config_value,
              type: c.config_type
            };
          }
        }
        
        this.cacheStore.set('subdomain_mappings', subdomainMappings);
        this.cacheStore.set('config_cache', configCache);
        
        return {
          cache_refreshed: true,
          subdomain_mappings: subdomainMappings,
          config_cache: configCache,
          timestamp: new Date().toISOString()
        };
        
      case 'GET':
        return {
          cache_refreshed: false,
          subdomain_mappings: this.cacheStore.get('subdomain_mappings') || {},
          config_cache: this.cacheStore.get('config_cache') || {},
          timestamp: new Date().toISOString()
        };
        
      case 'CLEAR':
        this.cacheStore.clear();
        return {
          cache_refreshed: true,
          subdomain_mappings: {},
          config_cache: {},
          timestamp: new Date().toISOString()
        };
        
      default:
        throw new Error(`Unknown cache action: ${action}`);
    }
  }

  async cleanupConnections(maxIdleTime: number) {
    const startTime = Date.now();
    
    // In a real implementation, this would clean up idle database connections
    // For now, we'll simulate the cleanup
    const activeConnections = 5; // Simulated
    const idleConnections = 2; // Simulated
    const cleanedConnections = 1; // Simulated cleanup
    
    // Simulate cleanup work
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      cleaned_connections: cleanedConnections,
      active_connections: activeConnections - cleanedConnections,
      idle_connections: idleConnections - cleanedConnections,
      cleanup_time_ms: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  }
}

