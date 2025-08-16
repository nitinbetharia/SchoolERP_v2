#!/usr/bin/env ts-node

/**
 * Check and Fix Trust Issues
 * Creates dev-trust for local development
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Load environment
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

class TrustFixer {
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

  async checkTrusts(): Promise<void> {
    if (!this.connection) throw new Error('No database connection');

    try {
      console.log('🔍 Checking existing trusts...');
      
      const [trusts] = await this.connection.execute('SELECT * FROM trusts');
      console.log('📋 Existing trusts:');
      console.table(trusts);

    } catch (error) {
      console.error('❌ Failed to check trusts:', error);
      throw error;
    }
  }

  async createDevTrust(): Promise<void> {
    if (!this.connection) throw new Error('No database connection');

    try {
      console.log('🏗️ Creating dev-trust...');
      
      // Check if dev-trust exists
      const [existing] = await this.connection.execute(
        'SELECT id FROM trusts WHERE trust_code = ? OR subdomain = ?',
        ['DEV', 'dev-trust']
      );

      if ((existing as any[]).length > 0) {
        console.log('⚠️ dev-trust already exists, skipping...');
        return;
      }

      // Insert dev-trust
      const insertSQL = `
        INSERT INTO trusts (trust_name, trust_code, subdomain, contact_email, contact_phone, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      await this.connection.execute(insertSQL, [
        'Development Trust',
        'DEV',
        'dev-trust',
        'dev@localhost',
        '+1234567890',
        'Development trust for local testing'
      ]);

      console.log('✅ Created dev-trust successfully');
    } catch (error) {
      console.error('❌ Failed to create dev-trust:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      console.log('🔌 Database connection closed');
    }
  }

  async run(): Promise<void> {
    try {
      console.log('🚀 === TRUST CHECKER & FIXER ===');
      console.log(`📅 Timestamp: ${new Date().toISOString()}\n`);

      await this.connect();
      await this.checkTrusts();
      await this.createDevTrust();

      console.log('\n🎉 === TRUST FIXING COMPLETED ===');
      console.log('\n📋 Available access methods:');
      console.log('1. Direct access: http://localhost:3000 (uses dev-trust)');
      console.log('2. With header: curl -H "X-Trust-Slug: demo" http://localhost:3000');
      console.log('3. Subdomain (needs DNS): http://demo.localhost:3000');
    } catch (error) {
      console.error('\n💥 === TRUST FIXING FAILED ===');
      console.error('Error:', error);
      process.exit(1);
    } finally {
      await this.close();
    }
  }
}

// Run the fixer if called directly
if (require.main === module) {
  const fixer = new TrustFixer();
  fixer.run();
}

export default TrustFixer;