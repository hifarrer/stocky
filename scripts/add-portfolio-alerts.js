#!/usr/bin/env node
/**
 * Add Portfolio Alerts Migration Script
 * Adds the portfolio_alerts table to the existing database
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

async function addPortfolioAlerts() {
  console.log('🔍 Adding portfolio alerts table...\n');

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
    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'database', 'add_portfolio_alerts.sql');
    console.log(`⏳ Reading migration from: ${migrationPath}`);
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found!');
      process.exit(1);
    }

    const migration = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Migration file loaded\n');

    // Connect to database
    console.log('⏳ Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected!\n');

    // Check if table already exists
    console.log('⏳ Checking if portfolio_alerts table exists...');
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'portfolio_alerts'
      );
    `);

    if (checkResult.rows[0].exists) {
      console.log('✅ portfolio_alerts table already exists!\n');
      client.release();
      await pool.end();
      return;
    }

    // Execute migration
    console.log('⏳ Executing portfolio alerts migration...');
    console.log('   This may take a moment...\n');
    
    await client.query(migration);
    
    console.log('✅ Portfolio alerts migration executed successfully!\n');

    // Verify table was created
    console.log('⏳ Verifying portfolio_alerts table...');
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'portfolio_alerts'
      ORDER BY ordinal_position;
    `);

    if (result.rows.length > 0) {
      console.log('✅ portfolio_alerts table created successfully with columns:');
      result.rows.forEach(row => {
        console.log(`   ✓ ${row.column_name} (${row.data_type})`);
      });
      console.log('');
    }

    client.release();
    console.log('✅ Portfolio alerts migration complete!\n');
    console.log('You can now create price alerts for your portfolio items.\n');

  } catch (error) {
    console.error('\n❌ Portfolio alerts migration failed:');
    console.error(`   Error: ${error.message}\n`);
    
    if (error.position) {
      console.error(`   Position: ${error.position}`);
    }
    
    console.error('\n💡 Tip: You can manually run the migration in the Render dashboard:');
    console.log('   1. Go to your Render dashboard');
    console.log('   2. Open your PostgreSQL database');
    console.log('   3. Click "Connect" -> "External Connection"');
    console.log('   4. Use the SQL editor to paste and run database/add_portfolio_alerts.sql\n');

    process.exit(1);
  } finally {
    await pool.end();
  }
}

addPortfolioAlerts();
