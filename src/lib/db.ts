import { Pool, Client } from 'pg';
import { ensureDatabaseInitialized } from './db-init';
import { initializeDatabaseDirectly } from './db-auto-init';

// Create a singleton pool instance (for non-serverless)
let pool: Pool | null = null;

// Check if we're in a serverless environment
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL_ENV;

// Helper function to reset the pool
function resetPool(): void {
  pool = null;
}

// Get connection configuration
function getConnectionConfig() {
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

  const config = {
    connectionString,
    ssl: needsSSL ? {
      rejectUnauthorized: false, // Required for many hosted PostgreSQL services
    } : false,
  };

  // Log connection info (without exposing sensitive data)
  if (isServerless) {
    const dbHost = connectionString.match(/@([^:]+)/)?.[1] || 'unknown';
    console.log(`🔗 Connecting to database at ${dbHost} (SSL: ${needsSSL}, Serverless: true)`);
  }

  return config;
}

// Get a pool - optimized for serverless or traditional environments
export function getPool(): Pool {
  if (!pool) {
    const config = getConnectionConfig();
    
    // For serverless, use minimal pool configuration
    // For traditional servers, use larger pool
    const poolConfig = isServerless ? {
      max: 1, // Single connection for serverless
      min: 0, // Don't maintain idle connections
      idleTimeoutMillis: 10000, // Close idle connections quickly
      connectionTimeoutMillis: 10000, // 10 second connection timeout
      allowExitOnIdle: true, // Allow pool to close when idle
    } : {
      max: 20, // Larger pool for traditional servers
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

    pool = new Pool({
      ...config,
      ...poolConfig,
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
        resetPool(); // Force pool recreation on next getPool() call
      }
    });

    // Handle connect errors
    pool.on('connect', () => {
      if (isServerless) {
        console.log('✅ Database connection established (serverless)');
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
      
      // If it's a connection error and we have retries left, retry
      if (isRetryableConnectionError(error) && attempt < retries) {
        console.log(`🔄 Connection error on attempt ${attempt + 1}, retrying...`);
        
        // Reset the pool to force recreation (for non-serverless)
        if (!isServerless && pool) {
          try {
            await pool.end();
          } catch (e) {
            // Ignore errors when closing
          }
          resetPool();
        }
        
        // Wait a bit before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 200 * (attempt + 1)));
        continue;
      }
      
      // If it's not retryable or we're out of retries, throw
      throw error;
    }
  }
  
  throw lastError;
}

// Execute query using pool (works for both serverless and traditional)
async function executeQuery<T>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const pool = getPool();
  let client;
  
  try {
    // Get a client from the pool
    client = await pool.connect();
    
    // Execute the query
    const result = await client.query(text, params);
    return result.rows as T[];
  } catch (error) {
    // Log the error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('❌ Query execution error:', errorMessage);
    if (errorStack && isServerless) {
      console.error('Stack trace:', errorStack);
    }
    
    // If it's a connection error in serverless, try to reset the pool
    if (isServerless && isRetryableConnectionError(error)) {
      console.log('🔄 Serverless connection error detected, will reset pool on retry...');
      try {
        await pool.end();
      } catch (e) {
        // Ignore cleanup errors
      }
      resetPool(); // Force pool recreation
    }
    
    throw error;
  } finally {
    // Always release the client back to the pool if we got one
    if (client) {
      try {
        client.release();
      } catch (e) {
        // Ignore release errors (client might already be released or closed)
        console.warn('⚠️ Error releasing client:', e instanceof Error ? e.message : 'Unknown');
      }
    }
  }
}

// Helper function to execute queries
export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  return executeWithRetry(async () => {
    try {
      return await executeQuery<T>(text, params);
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
        return await executeQuery<T>(text, params);
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
    try {
      const rows = await executeQuery<T>(text, params);
      return rows[0] || null;
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
        const rows = await executeQuery<T>(text, params);
        return rows[0] || null;
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

