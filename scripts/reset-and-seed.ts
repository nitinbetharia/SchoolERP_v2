#!/usr/bin/env ts-node

/**
 * Database Reset and Seeding Script
 * Resets databases and seeds with initial data for 100% testing success
 */

import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import path from 'path';
import * as argon2 from 'argon2';

dotenv.config();

class DatabaseResetSeeder {
  private masterConnection?: mysql.Connection;
  
  constructor() {
    console.log('🔄 Database Reset & Seeding Script Starting...');
  }

  async connectToMaster(): Promise<void> {
    console.log('🔌 Connecting to master database...');
    this.masterConnection = await mysql.createConnection({
      host: process.env.MASTER_DB_HOST || '127.0.0.1',
      port: parseInt(process.env.MASTER_DB_PORT || '3306'),
      user: process.env.MASTER_DB_USER || 'root',
      password: process.env.MASTER_DB_PASS || '',
      database: process.env.MASTER_DB_NAME || 'school_erp_master',
      multipleStatements: true
    });
    console.log('✅ Connected to master database');
  }

  async resetMasterDatabase(): Promise<void> {
    console.log('🗑️  Dropping and recreating master database...');
    
    // Connect without database to drop/create
    const adminConnection = await mysql.createConnection({
      host: process.env.MASTER_DB_HOST || '127.0.0.1',
      port: parseInt(process.env.MASTER_DB_PORT || '3306'),
      user: process.env.MASTER_DB_USER || 'root',
      password: process.env.MASTER_DB_PASS || '',
      multipleStatements: true
    });

    const dbName = process.env.MASTER_DB_NAME || 'school_erp_master';
    
    await adminConnection.execute(`DROP DATABASE IF EXISTS \`${dbName}\``);
    await adminConnection.execute(`CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await adminConnection.end();
    
    console.log('✅ Master database reset complete');
  }

  async initializeMasterSchema(): Promise<void> {
    console.log('📋 Initializing master database schema...');
    
    const schemaPath = path.join(__dirname, '..', 'migrations', 'master', '0001_master_init.sql');
    const schemaSQL = readFileSync(schemaPath, 'utf8');
    
    // Split statements and execute individually
    const statements = schemaSQL.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        await this.masterConnection!.execute(statement.trim());
      }
    }
    
    console.log('✅ Master schema initialized');
  }

  async seedSystemAdmin(): Promise<number> {
    console.log('👤 Creating system admin user...');
    
    const password = 'SysAdmin123!';
    const hashedPassword = await argon2.hash(password);
    
    const [result] = await this.masterConnection!.execute(
      `INSERT INTO system_users (email, full_name, password_hash, role) VALUES (?, ?, ?, ?)`,
      ['sysadmin@school-erp.com', 'System Administrator', hashedPassword, 'SYSTEM_ADMIN']
    ) as any;
    
    console.log(`✅ System admin created with ID: ${result.insertId}`);
    return result.insertId;
  }

  async seedInitialTrust(): Promise<number> {
    console.log('🏢 Creating initial trust...');
    
    const [result] = await this.masterConnection!.execute(
      `INSERT INTO trusts (trust_name, trust_code, subdomain, description, contact_email, contact_phone, address) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        'Demo Educational Trust',
        'DEMO_TRUST',
        'demo',
        'Demo trust for testing and development',
        'admin@demo-trust.edu',
        '+1234567890',
        '123 Education Ave, Learning City, LC 12345'
      ]
    ) as any;
    
    const trustId = result.insertId;
    console.log(`✅ Trust created with ID: ${trustId}`);
    return trustId;
  }

  async initializeTrustDatabase(trustId: number): Promise<void> {
    console.log(`🏢 Initializing trust database for trust ID: ${trustId}...`);
    
    const trustDbName = `school_erp_trust_${trustId}`;
    
    // Create trust database
    await this.masterConnection!.execute(`DROP DATABASE IF EXISTS \`${trustDbName}\``);
    await this.masterConnection!.execute(`CREATE DATABASE \`${trustDbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    
    // Connect to trust database
    const trustConnection = await mysql.createConnection({
      host: process.env.MASTER_DB_HOST || '127.0.0.1',
      port: parseInt(process.env.MASTER_DB_PORT || '3306'),
      user: process.env.MASTER_DB_USER || 'root',
      password: process.env.MASTER_DB_PASS || '',
      database: trustDbName,
      multipleStatements: true
    });

    // Initialize trust schema
    const trustSchemaPath = path.join(__dirname, '..', 'migrations', 'trust_template', '0001_trust_init.sql');
    const trustSchemaSQL = readFileSync(trustSchemaPath, 'utf8');
    
    // Split statements and execute individually
    const trustStatements = trustSchemaSQL.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of trustStatements) {
      if (statement.trim()) {
        await trustConnection.execute(statement.trim());
      }
    }
    
    // Seed initial trust data
    await this.seedTrustData(trustConnection, trustId);
    
    await trustConnection.end();
    console.log(`✅ Trust database initialized`);
  }

  async seedTrustData(connection: mysql.Connection, trustId: number): Promise<void> {
    console.log('🏫 Seeding trust data...');
    
    // Create school
    const [schoolResult] = await connection.execute(
      `INSERT INTO schools (trust_id, school_name, school_code, address, contact_email, contact_phone, principal_name, established_year) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        trustId,
        'Demo High School',
        'DHS',
        '456 School Street, Learning City, LC 12346',
        'principal@demo-high.edu',
        '+1555000001',
        'Dr. Sarah Johnson',
        2010
      ]
    ) as any;
    const schoolId = schoolResult.insertId;
    
    // Create academic year
    const [academicYearResult] = await connection.execute(
      `INSERT INTO academic_years (trust_id, school_id, year_name, start_date, end_date, is_current) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [trustId, schoolId, '2024-2025', '2024-04-01', '2025-03-31', true]
    ) as any;
    const academicYearId = academicYearResult.insertId;
    
    // Create classes
    const [class1Result] = await connection.execute(
      `INSERT INTO classes (trust_id, school_id, academic_year_id, class_name, class_code, class_order) VALUES (?, ?, ?, ?, ?, ?)`,
      [trustId, schoolId, academicYearId, 'Grade 1', 'G1', 1]
    ) as any;
    const class1Id = class1Result.insertId;
    
    const [class2Result] = await connection.execute(
      `INSERT INTO classes (trust_id, school_id, academic_year_id, class_name, class_code, class_order) VALUES (?, ?, ?, ?, ?, ?)`,
      [trustId, schoolId, academicYearId, 'Grade 2', 'G2', 2]
    ) as any;
    const class2Id = class2Result.insertId;
    
    // Create sections
    await connection.execute(
      `INSERT INTO sections (trust_id, class_id, section_name, capacity) VALUES (?, ?, ?, ?)`,
      [trustId, class1Id, 'A', 30]
    );
    await connection.execute(
      `INSERT INTO sections (trust_id, class_id, section_name, capacity) VALUES (?, ?, ?, ?)`,
      [trustId, class2Id, 'A', 32]
    );
    
    // Create houses
    const houses = [
      ['Red House', '#FF0000'],
      ['Blue House', '#0000FF'],
      ['Green House', '#00FF00'],
      ['Yellow House', '#FFFF00']
    ];
    
    for (const [houseName, houseColor] of houses) {
      await connection.execute(
        `INSERT INTO houses (trust_id, school_id, house_name, house_color) VALUES (?, ?, ?, ?)`,
        [trustId, schoolId, houseName, houseColor]
      );
    }
    
    // Create users
    const users = [
      {
        email: 'trustadmin@demo-trust.edu',
        full_name: 'John Trust Administrator',
        phone: '+1555000010',
        role: 'TRUST_ADMIN',
        password: 'TrustAdmin123!'
      },
      {
        email: 'principal@demo-high.edu',
        full_name: 'Dr. Sarah Johnson',
        phone: '+1555000011',
        role: 'SCHOOL_ADMIN',
        password: 'SchoolAdmin123!'
      },
      {
        email: 'accountant@demo-high.edu',
        full_name: 'Mike Financial Officer',
        phone: '+1555000012',
        role: 'ACCOUNTANT',
        password: 'Accountant123!'
      }
    ];
    
    for (const user of users) {
      const hashedPassword = await argon2.hash(user.password);
      await connection.execute(
        `INSERT INTO users (trust_id, email, full_name, phone, password_hash, role, school_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [trustId, user.email, user.full_name, user.phone, hashedPassword, user.role, schoolId]
      );
    }
    
    console.log(`✅ Trust data seeded - School ID: ${schoolId}, Classes: 2, Sections: 2, Houses: 4, Users: 3`);
  }

  async run(): Promise<void> {
    try {
      console.log('\n🚀 === DATABASE RESET & SEEDING STARTED ===');
      
      // Step 1: Reset master database
      await this.resetMasterDatabase();
      
      // Step 2: Connect to master
      await this.connectToMaster();
      
      // Step 3: Initialize master schema
      await this.initializeMasterSchema();
      
      // Step 4: Seed system admin
      const sysAdminId = await this.seedSystemAdmin();
      
      // Step 5: Seed initial trust
      const trustId = await this.seedInitialTrust();
      
      // Step 6: Initialize trust database
      await this.initializeTrustDatabase(trustId);
      
      console.log('\n✅ === DATABASE RESET & SEEDING COMPLETED ===');
      console.log(`📊 Summary:`);
      console.log(`   - System Admin ID: ${sysAdminId}`);
      console.log(`   - Trust ID: ${trustId}`);
      console.log(`   - Trust Database: school_erp_trust_${trustId}`);
      console.log(`   - Ready for API testing`);
      
    } catch (error) {
      console.error('\n💥 === SEEDING FAILED ===');
      console.error('Error:', error);
      throw error;
    } finally {
      if (this.masterConnection) {
        await this.masterConnection.end();
      }
    }
  }
}

// Run the seeder if called directly
if (require.main === module) {
  const seeder = new DatabaseResetSeeder();
  seeder.run().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

export default DatabaseResetSeeder;