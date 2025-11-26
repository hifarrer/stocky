import bcrypt from 'bcrypt';
import { SignJWT, jwtVerify } from 'jose';
import { query, queryOne } from './db';

const SALT_ROUNDS = 10;
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);
const JWT_EXPIRY = '7d'; // Token expires in 7 days
const CLOCK_TOLERANCE = 30; // Allow 30 seconds of clock skew

export interface User {
  id: string;
  email: string;
  username: string | null;
  provider: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
}

export interface JWTPayload {
  userId: string;
  email: string;
  [key: string]: unknown;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create a JWT token for a user
 */
export async function createToken(payload: JWTPayload): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET);
  
  return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    console.error('Token verification failed: Token is empty or invalid');
    return null;
  }

  if (!JWT_SECRET || JWT_SECRET.length === 0) {
    console.error('Token verification failed: JWT_SECRET is not configured');
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      clockTolerance: CLOCK_TOLERANCE, // Allow 30 seconds of clock skew
    });
    if (payload && typeof payload === 'object' && 'userId' in payload && 'email' in payload) {
      return payload as JWTPayload;
    }
    console.error('Token verification failed: Invalid payload structure');
    return null;
  } catch (error) {
    // Handle expired tokens specifically
    // jose library throws errors with code 'ERR_JWT_EXPIRED' for expired tokens
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      const isExpired = errorMessage.includes('exp') || 
                       errorMessage.includes('expired') ||
                       errorMessage.includes('jwt expired') ||
                       (error as { code?: string }).code === 'ERR_JWT_EXPIRED';
      
      if (isExpired) {
        // Don't log expired tokens to reduce noise - this is expected behavior
        return null;
      }
      
      // Log other errors
      console.error('Token verification failed:', error.message);
    } else {
      console.error('Token verification failed: Unknown error', error);
    }
    return null;
  }
}

/**
 * Find a user by email
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  const user = await queryOne<User>(
    'SELECT id, email, username, provider, is_active, created_at, updated_at, last_login_at FROM users WHERE email = $1',
    [email]
  );
  return user;
}

/**
 * Find a user by ID
 */
export async function findUserById(userId: string): Promise<User | null> {
  const user = await queryOne<User>(
    'SELECT id, email, username, provider, is_active, created_at, updated_at, last_login_at FROM users WHERE id = $1',
    [userId]
  );
  return user;
}

/**
 * Create a new user
 */
export async function createUser(
  email: string,
  password: string,
  username?: string
): Promise<User> {
  const passwordHash = await hashPassword(password);
  
  const user = await queryOne<User>(
    `INSERT INTO users (email, username, password_hash, provider) 
     VALUES ($1, $2, $3, 'local') 
     RETURNING id, email, username, provider, is_active, created_at, updated_at, last_login_at`,
    [email, username || null, passwordHash]
  );

  if (!user) {
    throw new Error('Failed to create user');
  }

  return user;
}

/**
 * Verify user credentials and return user if valid
 */
export async function verifyCredentials(
  email: string,
  password: string
): Promise<User | null> {
  const result = await queryOne<User & { password_hash: string }>(
    'SELECT * FROM users WHERE email = $1 AND provider = $2',
    [email, 'local']
  );

  if (!result || !result.password_hash) {
    return null;
  }

  const isValid = await verifyPassword(password, result.password_hash);
  
  if (!isValid) {
    return null;
  }

  // Update last login time
  await query(
    'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
    [result.id]
  );

  // Return user without password_hash
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...user } = result;
  return user;
}

/**
 * Create default user preferences for a new user
 */
export async function createDefaultUserPreferences(userId: string): Promise<void> {
  await query(
    'INSERT INTO user_preferences (user_id) VALUES ($1) ON CONFLICT DO NOTHING',
    [userId]
  );
}

/**
 * Update user email
 */
export async function updateUserEmail(
  userId: string,
  newEmail: string
): Promise<User> {
  const user = await queryOne<User>(
    'UPDATE users SET email = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, username, provider, is_active, created_at, updated_at, last_login_at',
    [newEmail, userId]
  );

  if (!user) {
    throw new Error('Failed to update email');
  }

  return user;
}

/**
 * Update user password
 */
export async function updateUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  // Get current password hash
  const result = await queryOne<{ password_hash: string }>(
    'SELECT password_hash FROM users WHERE id = $1 AND provider = $2',
    [userId, 'local']
  );

  if (!result || !result.password_hash) {
    throw new Error('User not found or not using local authentication');
  }

  // Verify current password
  const isValid = await verifyPassword(currentPassword, result.password_hash);
  
  if (!isValid) {
    throw new Error('Current password is incorrect');
  }

  // Hash new password
  const newPasswordHash = await hashPassword(newPassword);

  // Update password
  await query(
    'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [newPasswordHash, userId]
  );
}

