import { Pool } from 'pg';
import { ensureDatabaseInitialized } from './db-init';
import { initializeDatabaseDirectly } from './db-auto-init';

// Create a singleton pool instance
let pool: Pool | null = null;

// Check if we're in a serverless environment
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL_ENV;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Determine if we need SSL (for hosted databases like Render, Heroku, Vercel, etc.)
    const needsSSL = 
      process.env.NODE_ENV === 'production' || 
      connectionString.includes('render.com') ||
      connectionString.includes('heroku.com') ||
      connectionString.includes('amazonaws.com') ||
      connectionString.includes('supabase.co') ||
      connectionString.includes('neon.tech') ||
      isServerless;

    // For serverless, use smaller pool size and shorter timeouts
    const poolConfig = isServerless ? {
      max: 1, // Single connection for serverless (connections are short-lived)
      idleTimeoutMillis: 10000, // Shorter timeout for serverless
      connectionTimeoutMillis: 5000,
      allowExitOnIdle: true, // Allow pool to close when idle
    } : {
      max: 20, // Larger pool for traditional servers
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

    pool = new Pool({
      connectionString,
      ...poolConfig,
      ssl: needsSSL ? {
        rejectUnauthorized: false, // Required for many hosted PostgreSQL services
      } : false,
    });

    // Handle pool errors - recreate pool on critical errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      // If it's a connection termination error, reset the pool
      if (err.message && (
        err.message.includes('Connection terminated') ||
        err.message.includes('Connection ended') ||
        err.message.includes('server closed the connection')
      )) {
        console.log('🔄 Connection pool error detected, will recreate on next use');
        pool = null; // Force pool recreation on next getPool() call
      }
    });
  }

  return pool;
}

// Helper to check if a connection error is retryable
function isRetryableConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('connection terminated') ||
    message.includes('connection ended') ||
    message.includes('server closed the connection') ||
    message.includes('connection refused') ||
    message.includes('econnreset') ||
    message.includes('socket hang up')
  );
}

// Helper to execute query with retry logic
async function executeWithRetry<T>(
  queryFn: () => Promise<T>,
  retries = 2
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await queryFn();
    } catch (error) {
      lastError = error;
      
      // If it's a connection error and we have retries left, reset pool and retry
      if (isRetryableConnectionError(error) && attempt < retries) {
        console.log(`🔄 Connection error on attempt ${attempt + 1}, retrying...`);
        
        // Reset the pool to force recreation
        if (pool) {
          try {
            await pool.end();
          } catch (e) {
            // Ignore errors when closing
          }
          pool = null;
        }
        
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
        continue;
      }
      
      // If it's not retryable or we're out of retries, throw
      throw error;
    }
  }
  
  throw lastError;
}

// Helper function to execute queries
export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  return executeWithRetry(async () => {
    const pool = getPool();
    
    try {
      const result = await pool.query(text, params);
      return result.rows;
    } catch (error: unknown) {
      // If the error is about missing tables, try to initialize the database
      if (error instanceof Error && error.message && error.message.includes('relation') && error.message.includes('does not exist')) {
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
  });
}

// Helper function to execute a single query and return one row
export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  return executeWithRetry(async () => {
    const pool = getPool();
    
    try {
      const result = await pool.query(text, params);
      return result.rows[0] || null;
    } catch (error: unknown) {
      // If the error is about missing tables, try to initialize the database
      if (error instanceof Error && error.message && error.message.includes('relation') && error.message.includes('does not exist')) {
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
  });
}

// Close the pool (useful for cleanup in tests or shutdown)
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

