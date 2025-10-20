import { Pool } from 'pg';
import { ensureDatabaseInitialized } from './db-init';
import { initializeDatabaseDirectly } from './db-auto-init';

// Create a singleton pool instance
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Determine if we need SSL (e.g., for hosted databases like Render, Heroku, etc.)
    const isProduction = process.env.NODE_ENV === 'production' || connectionString.includes('render.com');

    pool = new Pool({
      connectionString,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // Increased timeout for remote databases
      ssl: isProduction ? {
        rejectUnauthorized: false, // Required for many hosted PostgreSQL services
      } : false,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  return pool;
}

// Helper function to execute queries
export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const pool = getPool();
  
  try {
    const result = await pool.query(text, params);
    return result.rows;
  } catch (error: any) {
    // If the error is about missing tables, try to initialize the database
    if (error.message && error.message.includes('relation') && error.message.includes('does not exist')) {
      console.log('🔧 Database tables missing, initializing...');
      try {
        await initializeDatabaseDirectly();
        console.log('✅ Database initialization completed');
      } catch (initError) {
        console.error('❌ Database initialization failed:', initError);
        // Try the other initialization method as fallback
        await ensureDatabaseInitialized();
      }
      
      // Retry the query after initialization
      const result = await pool.query(text, params);
      return result.rows;
    }
    throw error;
  }
}

// Helper function to execute a single query and return one row
export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const pool = getPool();
  
  try {
    const result = await pool.query(text, params);
    return result.rows[0] || null;
  } catch (error: any) {
    // If the error is about missing tables, try to initialize the database
    if (error.message && error.message.includes('relation') && error.message.includes('does not exist')) {
      console.log('🔧 Database tables missing, initializing...');
      try {
        await initializeDatabaseDirectly();
        console.log('✅ Database initialization completed');
      } catch (initError) {
        console.error('❌ Database initialization failed:', initError);
        // Try the other initialization method as fallback
        await ensureDatabaseInitialized();
      }
      
      // Retry the query after initialization
      const result = await pool.query(text, params);
      return result.rows[0] || null;
    }
    throw error;
  }
}

// Close the pool (useful for cleanup in tests or shutdown)
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

