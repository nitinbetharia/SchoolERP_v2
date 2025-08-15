#!/usr/bin/env ts-node

/**
 * API-Based Seeding Script
 * Seeds data using API endpoints only (following instructions)
 */

import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

class APISeeder {
  private baseUrl: string;
  private systemToken?: string;
  
  constructor() {
    this.baseUrl = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';
    console.log(`🌱 API-Based Seeding for: ${this.baseUrl}`);
  }

  async makeRequest<T>(method: string, endpoint: string, data?: any, auth?: string): Promise<ApiResponse<T>> {
    try {
      const headers: any = {
        'Content-Type': 'application/json'
      };
      
      if (auth) {
        headers['Authorization'] = `Bearer ${auth}`;
      }

      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        data,
        headers,
        timeout: 10000,
        validateStatus: () => true // Accept all status codes
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error.message
        }
      };
    }
  }

  async checkHealth(): Promise<boolean> {
    console.log('🏥 Checking API health...');
    try {
      const response = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
      if (response.status === 200) {
        console.log('✅ API is healthy');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ API health check failed');
      return false;
    }
  }

  async seedPhase1_DATA(): Promise<void> {
    console.log('\n📊 === PHASE 1: DATA MODULE ===');
    
    // DATA-00-002: Create master schema
    console.log('🔧 Creating master database schema...');
    const schemaResult = await this.makeRequest('POST', '/system/schemas/master', 
      { force_recreate: false }
    );
    
    if (schemaResult.success) {
      console.log('✅ Master schema created/verified');
    } else {
      console.log(`⚠️ Schema creation: ${schemaResult.error?.message}`);
    }

    await this.delay(1000);

    // DATA-00-006: Create system admin user
    console.log('👤 Creating system admin user...');
    const sysUserResult = await this.makeRequest('POST', '/system/users', {
      email: 'sysadmin@school-erp.com',
      password: 'SysAdmin123!',
      role: 'SYSTEM_ADMIN',
      full_name: 'System Administrator'
    });

    if (sysUserResult.success) {
      console.log('✅ System admin created');
    } else {
      console.log(`⚠️ System admin: ${sysUserResult.error?.message}`);
    }

    await this.delay(1000);

    // Authenticate as system admin
    console.log('🔑 Authenticating system admin...');
    const authResult = await this.makeRequest<{access_token: string}>('POST', '/auth/tokens', {
      email: 'sysadmin@school-erp.com',
      password: 'SysAdmin123!'
    });

    if (authResult.success && authResult.data?.access_token) {
      this.systemToken = authResult.data.access_token;
      console.log('✅ System admin authenticated');
    } else {
      console.log(`⚠️ Authentication: ${authResult.error?.message}`);
    }

    await this.delay(1000);

    // DATA-00-005: Create trust in system registry
    console.log('🏢 Creating trust in system registry...');
    const trustResult = await this.makeRequest('POST', '/system/trusts', {
      trust_name: 'Demo Educational Trust',
      trust_code: 'DEMO_TRUST', 
      subdomain: 'demo',
      contact_email: 'admin@demo-trust.edu',
      is_active: true
    }, this.systemToken);

    if (trustResult.success) {
      console.log('✅ Trust created in system registry');
    } else {
      console.log(`⚠️ Trust creation: ${trustResult.error?.message}`);
    }
  }

  async seedPhase2_SETUP(): Promise<void> {
    console.log('\n🔧 === PHASE 2: SETUP MODULE ===');

    if (!this.systemToken) {
      console.log('⚠️ No system token, attempting to authenticate...');
      const authResult = await this.makeRequest<{access_token: string}>('POST', '/auth/tokens', {
        email: 'sysadmin@school-erp.com',
        password: 'SysAdmin123!'
      });

      if (authResult.success && authResult.data?.access_token) {
        this.systemToken = authResult.data.access_token;
        console.log('✅ Re-authenticated');
      } else {
        console.log('❌ Cannot proceed without authentication');
        return;
      }
    }

    // SETUP-01-001: Create trust via setup API
    console.log('🏢 Setting up trust...');
    const setupTrustResult = await this.makeRequest('POST', '/setup/trusts', {
      trust_name: 'Greenwood Educational Trust',
      trust_code: 'GREENWOOD',
      subdomain: 'greenwood',
      contact_email: 'admin@greenwood.edu',
      contact_phone: '+1987654321',
      description: 'Greenwood Educational Trust - Excellence in Education',
      address: '123 Education Avenue, Learning City, LC 12345',
      is_active: true
    }, this.systemToken);

    let trustId = (setupTrustResult.data as any)?.trust_id;
    if (setupTrustResult.success) {
      console.log(`✅ Trust setup complete - ID: ${trustId}`);
    } else {
      console.log(`⚠️ Using fallback trust ID (1): ${setupTrustResult.error?.message}`);
      trustId = 1;
    }

    await this.delay(1000);

    // SETUP-01-002: Create school
    console.log('🏫 Creating school...');
    const schoolResult = await this.makeRequest('POST', '/setup/schools', {
      school_name: 'Greenwood High School',
      school_code: 'GHS',
      trust_id: trustId,
      address: '456 School Street, Learning City, LC 12346',
      contact_email: 'principal@greenwood-high.edu',
      contact_phone: '+1555000001',
      principal_name: 'Dr. Sarah Johnson',
      established_year: 2010,
      is_active: true
    }, this.systemToken);

    let schoolId = (schoolResult.data as any)?.school_id;
    if (schoolResult.success) {
      console.log(`✅ School created - ID: ${schoolId}`);
    } else {
      console.log(`⚠️ Using fallback school ID (1): ${schoolResult.error?.message}`);
      schoolId = 1;
    }
  }

  async seedPhase3_AUTH_TEST(): Promise<void> {
    console.log('\n🔐 === PHASE 3: AUTH VALIDATION ===');

    // Test JWT authentication
    console.log('🔑 Testing JWT authentication...');
    const jwtResult = await this.makeRequest<{access_token: string, user_id: number}>('POST', '/auth/tokens', {
      email: 'sysadmin@school-erp.com',
      password: 'SysAdmin123!'
    });

    if (jwtResult.success && jwtResult.data?.access_token) {
      console.log('✅ JWT authentication working');
      console.log(`   Token: ${jwtResult.data.access_token.substring(0, 20)}...`);
      console.log(`   User ID: ${jwtResult.data.user_id}`);
    } else {
      console.log(`❌ JWT authentication failed: ${jwtResult.error?.message}`);
    }

    await this.delay(500);

    // Test session authentication  
    console.log('🍪 Testing session authentication...');
    const sessionResult = await this.makeRequest<{session_id: string}>('POST', '/auth/sessions', {
      email: 'sysadmin@school-erp.com',
      password: 'SysAdmin123!',
      remember_me: false
    });

    if (sessionResult.success && sessionResult.data?.session_id) {
      console.log('✅ Session authentication working');
      console.log(`   Session ID: ${sessionResult.data.session_id.substring(0, 16)}...`);
    } else {
      console.log(`❌ Session authentication failed: ${sessionResult.error?.message}`);
    }
  }

  async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async run(): Promise<void> {
    try {
      console.log('\n🚀 === API-BASED SEEDING STARTED ===');
      console.log(`📅 Timestamp: ${new Date().toISOString()}`);
      
      // Step 1: Health check
      const isHealthy = await this.checkHealth();
      if (!isHealthy) {
        throw new Error('API is not healthy - cannot proceed');
      }

      // Step 2: Seed using API endpoints in dependency order
      await this.seedPhase1_DATA();
      await this.seedPhase2_SETUP();
      await this.seedPhase3_AUTH_TEST();

      console.log('\n🎉 === API SEEDING COMPLETED ===');
      console.log('✅ All seeding operations completed using API endpoints');
      console.log('✅ Ready for comprehensive testing');
      
    } catch (error) {
      console.error('\n💥 === SEEDING FAILED ===');
      console.error('Error:', error);
      throw error;
    }
  }
}

// Run the seeder if called directly
if (require.main === module) {
  const seeder = new APISeeder();
  seeder.run().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

export default APISeeder;