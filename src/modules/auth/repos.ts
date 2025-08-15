/** Repository layer for module: AUTH */
import { dbManager } from '../../lib/database';

export class AuthRepo {
  constructor() {}

  async findUserByEmail(email: string, trust_code?: string) {
    // First get all trusts or specific trust
    const masterConn = await dbManager.getMasterConnection();
    
    let trustsQuery = 'SELECT id, trust_code FROM trusts WHERE is_active = 1';
    let queryParams: any[] = [];
    
    if (trust_code) {
      trustsQuery += ' AND trust_code = ?';
      queryParams.push(trust_code);
    }
    
    const [trustRows] = await masterConn.execute(trustsQuery, queryParams);
    if (!Array.isArray(trustRows)) return null;
    
    // Search across trust databases for user
    for (const trustRow of trustRows as any[]) {
      try {
        const trustConn = await dbManager.getTrustConnection(trustRow.id);
        const [userRows] = await trustConn.execute(
          'SELECT id, email, password_hash, full_name, role, school_id, trust_id, is_active FROM users WHERE email = ? AND is_active = 1 LIMIT 1',
          [email]
        );
        
        if (Array.isArray(userRows) && userRows.length > 0) {
          const user = userRows[0] as any;
          user.trust_id = trustRow.id;
          return user;
        }
      } catch (error) {
        continue; // Try next trust
      }
    }
    
    // Also check system users
    const [systemUserRows] = await masterConn.execute(
      'SELECT id, email, password_hash, full_name, role, is_active FROM system_users WHERE email = ? AND is_active = 1 LIMIT 1',
      [email]
    );
    
    if (Array.isArray(systemUserRows) && systemUserRows.length > 0) {
      return systemUserRows[0] as any;
    }
    
    return null;
  }

  async createSession(sessionData: {
    session_id: string;
    user_id: number;
    trust_id?: number;
    expires_at: Date;
    ip_address: string;
    user_agent: string;
  }) {
    // Store session in master DB for system users, or trust DB for trust users
    if (sessionData.trust_id) {
      const trustConn = await dbManager.getTrustConnection(sessionData.trust_id);
      await trustConn.execute(
        `INSERT INTO sessions (session_id, user_id, expires_at, ip_address, user_agent, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          sessionData.session_id,
          sessionData.user_id,
          sessionData.expires_at,
          sessionData.ip_address,
          sessionData.user_agent
        ]
      );
    } else {
      const masterConn = await dbManager.getMasterConnection();
      await masterConn.execute(
        `INSERT INTO sessions (session_id, user_id, expires_at, ip_address, user_agent, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          sessionData.session_id,
          sessionData.user_id,
          sessionData.expires_at,
          sessionData.ip_address,
          sessionData.user_agent
        ]
      );
    }
  }
}

// AUTH-02-001 — Suggested tables: users, sessions, audit_logs
// AUTH-02-002 — Suggested tables: users, audit_logs
// AUTH-02-003 — Suggested tables: users, audit_logs, trust_config
// AUTH-02-004 — Suggested tables: users, trust_config
// AUTH-02-005 — Suggested tables: trust_config
// AUTH-02-006 — Suggested tables: users, audit_logs
// AUTH-02-007 — Suggested tables: users, audit_logs
// AUTH-02-008 — Suggested tables: users, audit_logs, system_audit_logs
// AUTH-02-009 — Suggested tables: audit_logs, system_audit_logs
// AUTH-02-010 — Suggested tables: trust_config, users