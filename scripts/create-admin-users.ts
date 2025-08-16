#!/usr/bin/env ts-node

/**
 * Simple Admin User Creation Script
 * Creates test users for manual testing of the system
 */

import mysql from 'mysql2/promise';
import argon2 from 'argon2';
import dotenv from 'dotenv';
import path from 'path';

// Load environment
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

interface AdminUser {
  email: string;
  password: string;
  full_name: string;
  role: string;
  phone?: string;
}

const ADMIN_USERS: AdminUser[] = [
  {
    email: 'admin@system.local',
    password: 'SystemAdmin123!',
    full_name: 'System Administrator',
    role: 'SYSTEM_ADMIN'
  },
  {
    email: 'admin@demo.trust',
    password: 'TrustAdmin123!',
    full_name: 'Trust Administrator',
    role: 'GROUP_ADMIN'
  }
];

class AdminUserCreator {
  private connection?: mysql.Connection;

  async connect(): Promise<void> {
    try {
      console.log('🔌 Connecting to database...');
      this.connection = await mysql.createConnection({
        host: process.env.MASTER_DB_HOST || 'localhost',
        port: parseInt(process.env.MASTER_DB_PORT || '3306'),
        user: process.env.MASTER_DB_USER || 'root',
        password: process.env.MASTER_DB_PASS || '',
        database: process.env.MASTER_DB_NAME || 'school_erp_master'
      });
      console.log('✅ Connected to database successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async createSystemUsersTable(): Promise<void> {
    if (!this.connection) throw new Error('No database connection');

    try {
      console.log('🔧 Creating system_users table if it doesn\'t exist...');
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS system_users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          full_name VARCHAR(255),
          role ENUM('SYSTEM_ADMIN', 'GROUP_ADMIN') NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_email (email),
          INDEX idx_role (role),
          INDEX idx_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;

      await this.connection.execute(createTableSQL);
      console.log('✅ system_users table ready');
    } catch (error) {
      console.error('❌ Failed to create table:', error);
      throw error;
    }
  }

  async createAdminUsers(): Promise<void> {
    if (!this.connection) throw new Error('No database connection');

    console.log('👥 Creating admin users...');

    for (const user of ADMIN_USERS) {
      try {
        console.log(`📝 Creating user: ${user.email} (${user.role})`);
        
        // Hash password
        const passwordHash = await argon2.hash(user.password);
        
        // Check if user already exists
        const [existing] = await this.connection.execute(
          'SELECT id FROM system_users WHERE email = ?',
          [user.email]
        );
        
        if ((existing as any[]).length > 0) {
          console.log(`⚠️  User ${user.email} already exists, skipping...`);
          continue;
        }

        // Insert user
        const insertSQL = `
          INSERT INTO system_users (email, password_hash, full_name, role, is_active)
          VALUES (?, ?, ?, ?, TRUE)
        `;
        
        await this.connection.execute(insertSQL, [
          user.email,
          passwordHash,
          user.full_name,
          user.role
        ]);
        
        console.log(`✅ Created user: ${user.email}`);
      } catch (error) {
        console.error(`❌ Failed to create user ${user.email}:`, error);
      }
    }
  }

  async createDemoTrust(): Promise<void> {
    if (!this.connection) throw new Error('No database connection');

    try {
      console.log('🏢 Creating demo trust...');
      
      // Create trusts table if it doesn't exist
      const createTrustsTableSQL = `
        CREATE TABLE IF NOT EXISTS trusts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          trust_name VARCHAR(255) NOT NULL,
          trust_code VARCHAR(50) UNIQUE NOT NULL,
          subdomain VARCHAR(50) UNIQUE NOT NULL,
          contact_email VARCHAR(255),
          contact_phone VARCHAR(20),
          description TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_code (trust_code),
          INDEX idx_subdomain (subdomain),
          INDEX idx_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;

      await this.connection.execute(createTrustsTableSQL);

      // Check if demo trust already exists
      const [existing] = await this.connection.execute(
        'SELECT id FROM trusts WHERE trust_code = ? OR subdomain = ?',
        ['DEMO', 'demo']
      );

      if ((existing as any[]).length > 0) {
        console.log('⚠️  Demo trust already exists, skipping...');
        return;
      }

      // Insert demo trust
      const insertTrustSQL = `
        INSERT INTO trusts (trust_name, trust_code, subdomain, contact_email, contact_phone, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      await this.connection.execute(insertTrustSQL, [
        'Demo Educational Trust',
        'DEMO',
        'demo',
        'admin@demo.trust',
        '+1555000000',
        'Demo trust for testing purposes'
      ]);

      console.log('✅ Created demo trust');
    } catch (error) {
      console.error('❌ Failed to create demo trust:', error);
      throw error;
    }
  }

  async printCredentials(): Promise<void> {
    console.log('\n🎯 === TEST CREDENTIALS CREATED ===');
    console.log('\nUse these credentials to test the system:\n');
    
    ADMIN_USERS.forEach(user => {
      console.log(`📋 ${user.role}:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Name: ${user.full_name}`);
      console.log('');
    });

    console.log('🌐 Testing URLs:');
    console.log('   - Login: http://localhost:3000/auth/login');
    console.log('   - Setup: http://localhost:3000/setup');
    console.log('   - Dashboard: http://localhost:3000/dashboard');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('   1. Start the development server: npm run dev');
    console.log('   2. Visit the login page and test with any of the above credentials');
    console.log('   3. Complete the setup wizard to configure your first school');
  }

  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      console.log('🔌 Database connection closed');
    }
  }

  async run(): Promise<void> {
    try {
      console.log('🚀 === ADMIN USER CREATION STARTED ===');
      console.log(`📅 Timestamp: ${new Date().toISOString()}\n`);

      await this.connect();
      await this.createSystemUsersTable();
      await this.createDemoTrust();
      await this.createAdminUsers();
      await this.printCredentials();

      console.log('\n🎉 === ADMIN USER CREATION COMPLETED ===');
    } catch (error) {
      console.error('\n💥 === ADMIN USER CREATION FAILED ===');
      console.error('Error:', error);
      process.exit(1);
    } finally {
      await this.close();
    }
  }
}

// Run the creator if called directly
if (require.main === module) {
  const creator = new AdminUserCreator();
  creator.run();
}

export default AdminUserCreator;