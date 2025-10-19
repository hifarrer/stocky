#!/usr/bin/env node
/**
 * Database Initialization Script
 * Runs the schema.sql file to create all tables
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

async function initDatabase() {
  console.log('🔍 Initializing database schema...\n');

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ ERROR: DATABASE_URL environment variable is not set');
    console.log('Please add DATABASE_URL to your .env.local file\n');
    process.exit(1);
  }

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
    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    console.log(`⏳ Reading schema from: ${schemaPath}`);
    
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Schema file not found!');
      process.exit(1);
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('✅ Schema file loaded\n');

    // Connect to database
    console.log('⏳ Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected!\n');

    // Execute schema
    console.log('⏳ Executing schema SQL...');
    console.log('   This may take a moment...\n');
    
    await client.query(schema);
    
    console.log('✅ Schema executed successfully!\n');

    // Verify tables were created
    console.log('⏳ Verifying tables...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    if (result.rows.length > 0) {
      console.log('✅ Tables created successfully:');
      result.rows.forEach(row => {
        console.log(`   ✓ ${row.table_name}`);
      });
      console.log('');
    }

    client.release();
    console.log('✅ Database initialization complete!\n');
    console.log('You can now register users and use the authentication system.\n');

  } catch (error) {
    console.error('\n❌ Database initialization failed:');
    console.error(`   Error: ${error.message}\n`);
    
    if (error.position) {
      console.error(`   Position: ${error.position}`);
    }
    
    console.error('\n💡 Tip: You can manually run the schema in the Render dashboard:');
    console.log('   1. Go to your Render dashboard');
    console.log('   2. Open your PostgreSQL database');
    console.log('   3. Click "Connect" -> "External Connection"');
    console.log('   4. Use the SQL editor to paste and run database/schema.sql\n');

    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDatabase();

