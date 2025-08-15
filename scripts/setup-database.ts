#!/usr/bin/env ts-node

/**
 * Database Setup Script for School ERP
 * Creates master DB, trust DB, and seeds minimal data for testing
 */

import mysql2 from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import * as argon2 from 'argon2';

const config = {
  host: process.env.MASTER_DB_HOST || '127.0.0.1',
  port: parseInt(process.env.MASTER_DB_PORT || '3306'),
  user: process.env.MASTER_DB_USER || 'root',
  password: process.env.MASTER_DB_PASS || 'Nitin@123#',
};

class DatabaseSetup {
  private connection: mysql2.Connection | null = null;

  async connect() {
    try {
      this.connection = await mysql2.createConnection(config);
      console.log('✅ Connected to MySQL server');
    } catch (error: any) {
      console.error('❌ Failed to connect to MySQL:', error.message);
      throw error;
    }
  }

  async createMasterDatabase() {
    if (!this.connection) throw new Error('No connection');
    
    console.log('🔧 Creating master database...');
    
    // Create master database
    await this.connection.query('CREATE DATABASE IF NOT EXISTS school_erp_master CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    await this.connection.query('USE school_erp_master');
    
    // Create master tables
    const masterSchema = `
CREATE TABLE IF NOT EXISTS system_config (
  id INT PRIMARY KEY AUTO_INCREMENT,
  config_key VARCHAR(100) NOT NULL UNIQUE,
  config_value TEXT,
  config_type ENUM('STRING','NUMBER','BOOLEAN','JSON') DEFAULT 'STRING',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trusts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trust_name VARCHAR(200) NOT NULL,
  trust_code VARCHAR(20) NOT NULL UNIQUE,
  subdomain VARCHAR(50) NOT NULL UNIQUE,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(15),
  address TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('SYSTEM_ADMIN','GROUP_ADMIN') NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS migration_versions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trust_id INT,
  version VARCHAR(50) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_trust_version (trust_id, version)
);`;

    const statements = masterSchema.split(';').filter(s => s.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        await this.connection.query(statement);
      }
    }
    
    console.log('✅ Master database created');
  }

  async createDemoTrust() {
    if (!this.connection) throw new Error('No connection');
    
    console.log('🏢 Creating demo trust...');
    
    // Insert demo trust
    await this.connection.execute(`
      INSERT IGNORE INTO trusts (trust_name, trust_code, subdomain, contact_email, contact_phone, address)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      'Demo Trust School System',
      'demo_trust',
      'demo',
      'admin@demo-trust.edu',
      '+1-555-123-4567',
      '123 Education Street, Learning City, LC 12345'
    ]);
    
    console.log('✅ Demo trust created');
  }

  async createSystemAdmin() {
    if (!this.connection) throw new Error('No connection');
    
    console.log('👤 Creating system admin user...');
    
    const passwordHash = await argon2.hash('SysAdmin123!');
    
    await this.connection.execute(`
      INSERT IGNORE INTO system_users (email, password_hash, role)
      VALUES (?, ?, ?)
    `, [
      'sysadmin@school-erp.com',
      passwordHash,
      'SYSTEM_ADMIN'
    ]);
    
    console.log('✅ System admin user created');
  }

  async createTrustDatabase() {
    if (!this.connection) throw new Error('No connection');
    
    console.log('🏗️ Creating trust database...');
    
    // Create trust database
    await this.connection.query('CREATE DATABASE IF NOT EXISTS school_erp_trust_demo_trust CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    await this.connection.query('USE school_erp_trust_demo_trust');
    
    // Read and execute trust schema
    const schemaPath = path.join(process.cwd(), 'migrations', 'trust_template', '0001_trust_init.sql');
    const schemaContent = await fs.readFile(schemaPath, 'utf-8');
    
    // Clean up SQL content
    const cleanedContent = schemaContent
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim() !== '')
      .join('\n');
    
    const statements = cleanedContent.split(';').filter(s => s.trim());
    
    console.log(`📄 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        try {
          console.log(`   Executing statement ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
          await this.connection.query(statement);
        } catch (error: any) {
          console.error(`   ❌ Failed to execute statement ${i + 1}: ${error.message}`);
          console.error(`   Statement: ${statement}`);
          throw error;
        }
      }
    }
    
    console.log('✅ Trust database created');
  }

  async seedBasicData() {
    if (!this.connection) throw new Error('No connection');
    
    console.log('🌱 Seeding basic trust data...');
    
    await this.connection.query('USE school_erp_trust_demo_trust');
    
    // Insert demo school
    await this.connection.execute(`
      INSERT IGNORE INTO schools (trust_id, school_name, school_code, address, contact_email, contact_phone, principal_name, established_year)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      1,
      'Greenwood High School',
      'GHS',
      '456 School Avenue, Education City, EC 67890',
      'principal@greenwood-high.edu',
      '+1-555-234-5678',
      'Dr. Sarah Johnson',
      2010
    ]);
    
    // Insert demo academic year
    await this.connection.execute(`
      INSERT IGNORE INTO academic_years (trust_id, school_id, year_name, start_date, end_date, is_current)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      1,
      1,
      '2024-25',
      '2024-04-01',
      '2025-03-31',
      true
    ]);
    
    console.log('✅ Basic data seeded');
  }

  async close() {
    if (this.connection) {
      await this.connection.end();
      console.log('✅ Database connection closed');
    }
  }

  async run() {
    try {
      console.log('🚀 Starting database setup...\n');
      
      await this.connect();
      await this.createMasterDatabase();
      await this.createDemoTrust();
      await this.createSystemAdmin();
      await this.createTrustDatabase();
      await this.seedBasicData();
      
      console.log('\n🎉 Database setup completed successfully!');
      console.log('\n📋 Summary:');
      console.log('✅ Master database: school_erp_master');
      console.log('✅ Trust database: school_erp_trust_demo_trust');
      console.log('✅ System admin: sysadmin@school-erp.com / SysAdmin123!');
      console.log('✅ Demo trust: Demo Trust School System (demo_trust)');
      console.log('✅ Demo school: Greenwood High School (GHS)');
      
    } catch (error: any) {
      console.error('\n❌ Database setup failed:', error.message);
      throw error;
    } finally {
      await this.close();
    }
  }
}

// Run the setup
const setup = new DatabaseSetup();
setup.run().catch((error) => {
  console.error('Setup failed:', error);
  process.exit(1);
});