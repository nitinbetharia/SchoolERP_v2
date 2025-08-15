import mysql2 from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';

interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database?: string;
  charset?: string;
  timezone?: string;
}

interface ConnectionStatus {
  reachable: boolean;
  host: string;
  database?: string;
  version?: string;
  uptime?: number;
  error?: string;
}

export class DatabaseManager {
  private masterConnection: mysql2.Connection | null = null;
  private trustConnections: Map<number, mysql2.Connection> = new Map();

  constructor() {}

  async getMasterConnection(): Promise<mysql2.Connection> {
    if (!this.masterConnection) {
      const config: DatabaseConfig = {
        host: process.env.MASTER_DB_HOST || 'localhost',
        port: parseInt(process.env.MASTER_DB_PORT || '3306'),
        user: process.env.MASTER_DB_USER || 'root',
        password: process.env.MASTER_DB_PASS || '',
        database: process.env.MASTER_DB_NAME || 'school_erp_master',
        charset: 'utf8mb4',
        timezone: '+00:00'
      };

      console.log('[TS-NODE DEBUG] Creating DB connection with config:', {
        ...config,
        password: config.password ? '***masked***' : '(empty)'
      });
      console.log('[TS-NODE DEBUG] Environment variables:', {
        MASTER_DB_HOST: process.env.MASTER_DB_HOST,
        MASTER_DB_PASS: process.env.MASTER_DB_PASS,
        MASTER_DB_PASSWORD: process.env.MASTER_DB_PASSWORD
      });

      this.masterConnection = await mysql2.createConnection(config);
    }
    return this.masterConnection;
  }

  async getTrustConnection(trustId: number): Promise<mysql2.Connection> {
    if (!this.trustConnections.has(trustId)) {
      // Get trust database name from master
      const masterConn = await this.getMasterConnection();
      const [rows] = await masterConn.execute(
        'SELECT trust_code FROM trusts WHERE id = ? AND is_active = 1',
        [trustId]
      );
      
      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error(`Trust ${trustId} not found or inactive`);
      }

      const trustCode = (rows[0] as any).trust_code;
      const config: DatabaseConfig = {
        host: process.env.TRUST_DB_HOST || process.env.MASTER_DB_HOST || 'localhost',
        port: parseInt(process.env.TRUST_DB_PORT || process.env.MASTER_DB_PORT || '3306'),
        user: process.env.TRUST_DB_USER || process.env.MASTER_DB_USER || 'root',
        password: process.env.TRUST_DB_PASS || process.env.MASTER_DB_PASS || '',
        database: `school_erp_trust_${trustCode}`,
        charset: 'utf8mb4',
        timezone: '+00:00'
      };

      const connection = await mysql2.createConnection(config);
      this.trustConnections.set(trustId, connection);
    }

    return this.trustConnections.get(trustId)!;
  }

  async testMasterConnection(): Promise<ConnectionStatus> {
    try {
      const connection = await this.getMasterConnection();
      const [versionRows] = await connection.execute('SELECT VERSION() as version');
      const [uptimeRows] = await connection.execute('SHOW STATUS LIKE "Uptime"');
      
      const version = Array.isArray(versionRows) && versionRows.length > 0 
        ? (versionRows[0] as any).version 
        : 'unknown';
      
      const uptime = Array.isArray(uptimeRows) && uptimeRows.length > 0
        ? parseInt((uptimeRows[0] as any).Value || '0')
        : 0;

      return {
        reachable: true,
        host: process.env.MASTER_DB_HOST || 'localhost',
        database: process.env.MASTER_DB_NAME || 'school_erp_master',
        version,
        uptime
      };
    } catch (error: any) {
      return {
        reachable: false,
        host: process.env.MASTER_DB_HOST || 'localhost',
        database: process.env.MASTER_DB_NAME || 'school_erp_master',
        error: error.message
      };
    }
  }

  async testTrustConnection(trustId: number): Promise<ConnectionStatus> {
    try {
      const connection = await this.getTrustConnection(trustId);
      const [versionRows] = await connection.execute('SELECT VERSION() as version');
      
      const version = Array.isArray(versionRows) && versionRows.length > 0 
        ? (versionRows[0] as any).version 
        : 'unknown';

      return {
        reachable: true,
        host: process.env.TRUST_DB_HOST || process.env.MASTER_DB_HOST || 'localhost',
        database: `school_erp_trust_${trustId}`,
        version
      };
    } catch (error: any) {
      return {
        reachable: false,
        host: process.env.TRUST_DB_HOST || process.env.MASTER_DB_HOST || 'localhost',
        database: `school_erp_trust_${trustId}`,
        error: error.message
      };
    }
  }

  async initializeMasterSchema(): Promise<void> {
    const connection = await this.getMasterConnection();
    const migrationPath = path.join(process.cwd(), 'migrations', 'master', '0001_master_init.sql');
    
    try {
      const sqlContent = await fs.readFile(migrationPath, 'utf-8');
      const statements = sqlContent.split(';').filter(stmt => stmt.trim().length > 0);
      
      for (const statement of statements) {
        await connection.execute(statement.trim());
      }

      // Record migration
      await connection.execute(
        'INSERT INTO migration_versions (trust_id, migration_version, status) VALUES (NULL, ?, ?) ON DUPLICATE KEY UPDATE applied_at = CURRENT_TIMESTAMP',
        ['0001_master_init', 'SUCCESS']
      );
    } catch (error: any) {
      await connection.execute(
        'INSERT INTO migration_versions (trust_id, migration_version, status) VALUES (NULL, ?, ?)',
        ['0001_master_init', 'FAILED']
      );
      throw error;
    }
  }

  async initializeTrustSchema(trustId: number): Promise<void> {
    const connection = await this.getTrustConnection(trustId);
    const migrationPath = path.join(process.cwd(), 'migrations', 'trust_template', '0001_trust_init.sql');
    
    try {
      const sqlContent = await fs.readFile(migrationPath, 'utf-8');
      const statements = sqlContent.split(';').filter(stmt => stmt.trim().length > 0);
      
      for (const statement of statements) {
        await connection.execute(statement.trim());
      }

      // Record migration in master DB
      const masterConn = await this.getMasterConnection();
      await masterConn.execute(
        'INSERT INTO migration_versions (trust_id, migration_version, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE applied_at = CURRENT_TIMESTAMP',
        [trustId, '0001_trust_init', 'SUCCESS']
      );
    } catch (error: any) {
      const masterConn = await this.getMasterConnection();
      await masterConn.execute(
        'INSERT INTO migration_versions (trust_id, migration_version, status) VALUES (?, ?, ?)',
        [trustId, '0001_trust_init', 'FAILED']
      );
      throw error;
    }
  }

  async closeAll(): Promise<void> {
    if (this.masterConnection) {
      await this.masterConnection.end();
      this.masterConnection = null;
    }

    for (const [trustId, connection] of this.trustConnections) {
      await connection.end();
    }
    this.trustConnections.clear();
  }
}

// Singleton instance
export const dbManager = new DatabaseManager();