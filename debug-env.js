// Simulate how the app loads environment variables
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables the same way as the app
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log('Environment variables loaded by app:');
console.log('MASTER_DB_HOST:', process.env.MASTER_DB_HOST);
console.log('MASTER_DB_PORT:', process.env.MASTER_DB_PORT);
console.log('MASTER_DB_USER:', process.env.MASTER_DB_USER);
console.log('MASTER_DB_PASS:', process.env.MASTER_DB_PASS);
console.log('MASTER_DB_NAME:', process.env.MASTER_DB_NAME);

// Test the exact database configuration used by the app
const mysql2 = require('mysql2/promise');

async function testAppConfig() {
  const config = {
    host: process.env.MASTER_DB_HOST || 'localhost',
    port: parseInt(process.env.MASTER_DB_PORT || '3306'),
    user: process.env.MASTER_DB_USER || 'root',
    password: process.env.MASTER_DB_PASS || '',
    database: process.env.MASTER_DB_NAME || 'school_erp_master',
    charset: 'utf8mb4',
    timezone: '+00:00'
  };
  
  console.log('\nDatabase config used by app:');
  console.log('host:', config.host);
  console.log('port:', config.port);
  console.log('user:', config.user);
  console.log('password:', config.password);
  console.log('database:', config.database);
  
  try {
    const connection = await mysql2.createConnection(config);
    console.log('\n✓ Connection successful with app config');
    await connection.end();
  } catch (error) {
    console.log('\n✗ Connection failed with app config:', error.message);
  }
}

testAppConfig();