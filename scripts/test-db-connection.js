#!/usr/bin/env node
/**
 * Database Connection Test Script
 * Tests the database connection and verifies the schema
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^=#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (err) {
  // Continue without .env.local
}

async function testConnection() {
  console.log('🔍 Testing database connection...\n');

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ ERROR: DATABASE_URL environment variable is not set');
    console.log('Please add DATABASE_URL to your .env.local file\n');
    process.exit(1);
  }

  console.log('📡 Connection string found (partially hidden):');
  console.log(`   ${connectionString.substring(0, 30)}...${connectionString.substring(connectionString.length - 20)}\n`);

  // Determine if we need SSL
  const isProduction = process.env.NODE_ENV === 'production' || connectionString.includes('render.com');

  const pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: isProduction ? {
      rejectUnauthorized: false,
    } : false,
  });

  try {
    // Test basic connection
    console.log('⏳ Attempting to connect...');
    const client = await pool.connect();
    console.log('✅ Successfully connected to database!\n');

    // Test query execution
    console.log('⏳ Testing query execution...');
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('✅ Query executed successfully!');
    console.log(`   Current time: ${result.rows[0].current_time}`);
    console.log(`   PostgreSQL version: ${result.rows[0].postgres_version.split(',')[0]}\n`);

    // Check if users table exists
    console.log('⏳ Checking for users table...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('✅ Users table exists!\n');

      // Check user count
      const countResult = await client.query('SELECT COUNT(*) as count FROM users');
      console.log(`   Total users: ${countResult.rows[0].count}\n`);
    } else {
      console.log('⚠️  Users table does NOT exist!');
      console.log('   You need to run the database schema:\n');
      console.log('   Option 1 - Using psql:');
      console.log('   psql "$DATABASE_URL" -f database/schema.sql\n');
      console.log('   Option 2 - Copy schema.sql content and run it in Render dashboard\n');
    }

    // Check other tables
    console.log('⏳ Checking other tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    if (tablesResult.rows.length > 0) {
      console.log('✅ Found tables:');
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('⚠️  No tables found. Database schema needs to be initialized.\n');
    }

    client.release();
    console.log('\n✅ All tests passed! Database is ready to use.\n');

  } catch (error) {
    console.error('\n❌ Database connection/query failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code}\n`);

    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Troubleshooting:');
      console.log('   - Make sure PostgreSQL is running');
      console.log('   - Verify the connection string is correct\n');
    } else if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND') {
      console.log('💡 Troubleshooting:');
      console.log('   - Check your internet connection');
      console.log('   - Verify the database host is accessible');
      console.log('   - For Render/Heroku databases, ensure SSL is configured\n');
    } else if (error.code === '28P01') {
      console.log('💡 Troubleshooting:');
      console.log('   - Check username and password in DATABASE_URL');
      console.log('   - Verify database credentials are correct\n');
    }

    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnection();

