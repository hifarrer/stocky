# Authentication Setup Guide

This guide explains how to set up and use the authentication system in BlockyFi.

## Prerequisites

1. **PostgreSQL Database**: Make sure you have PostgreSQL installed and running
2. **Environment Variables**: Set up the required environment variables

## Environment Variables

Add the following to your `.env.local` file:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/stocky

# JWT Secret (use a strong random string in production)
JWT_SECRET=your-secret-key-change-in-production-use-a-long-random-string
```

### Generating a Secure JWT Secret

For production, generate a secure random string:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using OpenSSL
openssl rand -hex 32
```

## Database Setup

1. **Create the database**:
   ```bash
   createdb stocky
   ```

2. **Run the schema migration**:
   ```bash
   psql -d stocky -f database/schema.sql
   ```

This will create all necessary tables including:
- `users` - User accounts and authentication data
- `user_preferences` - User settings and preferences
- And other related tables

## API Endpoints

### Register a New User

```
POST /api/auth/register
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "your-password",
  "username": "johndoe" // optional
}
```

**Response** (201 Created):
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe"
  },
  "token": "jwt-token"
}
```

### Login

```
POST /api/auth/login
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response** (200 OK):
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe"
  },
  "token": "jwt-token"
}
```

### Get Current User

```
GET /api/auth/me
```

**Headers**:
```
Authorization: Bearer <jwt-token>
```

**Response** (200 OK):
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "created_at": "2024-01-01T00:00:00.000Z",
    "last_login_at": "2024-01-02T00:00:00.000Z"
  }
}
```

## Using the Authentication UI

The authentication UI is available at `/auth`:

1. **Navigate to** `http://localhost:3000/auth`
2. Choose between **Login** or **Register** tabs
3. Fill in the form and submit
4. Upon successful authentication, you'll be redirected to the dashboard

## Using the Auth Context

The `useAuth` hook provides access to authentication state and methods:

```tsx
'use client';

import { useAuth } from '@/contexts';

export default function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <p>Welcome, {user?.email}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Available Auth Context Methods

- `user: User | null` - Current user object
- `token: string | null` - JWT token
- `isLoading: boolean` - Loading state
- `isAuthenticated: boolean` - Authentication status
- `login(email, password): Promise<void>` - Login method
- `register(email, password, username?): Promise<void>` - Register method
- `logout(): void` - Logout method
- `refreshUser(): Promise<void>` - Refresh user data

## Protected Routes

To protect routes, you can create a middleware or use the `useAuth` hook:

```tsx
'use client';

import { useAuth } from '@/contexts';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <div>Protected content</div>;
}
```

## Security Features

1. **Password Hashing**: Passwords are hashed using bcrypt with 10 salt rounds
2. **JWT Tokens**: Tokens expire after 7 days and are signed with HS256
3. **Email Validation**: Email format is validated on the server
4. **Password Strength**: Minimum 8 characters required
5. **SQL Injection Protection**: Using parameterized queries with pg
6. **Active User Check**: Inactive users cannot log in

## Token Storage

Tokens are stored in `localStorage` for persistence across sessions. Consider these security implications:

- **XSS Risk**: localStorage is vulnerable to XSS attacks
- **Better Alternative**: For production, consider using HTTP-only cookies

## Next Steps

1. **Add Logout Button**: Add a logout button in your header/navigation
2. **Protect Routes**: Add authentication checks to protected pages
3. **User Profile**: Create a user profile page
4. **Password Reset**: Implement password reset functionality
5. **Email Verification**: Add email verification for new accounts
6. **OAuth Integration**: Add Google/GitHub OAuth providers

## Troubleshooting

### Database Connection Issues

If you see database connection errors:

1. Check that PostgreSQL is running
2. Verify your `DATABASE_URL` is correct
3. Ensure the database exists: `psql -l`
4. Check network connectivity

### JWT Token Issues

If authentication fails:

1. Ensure `JWT_SECRET` is set in `.env.local`
2. Check that the token hasn't expired (7 day default)
3. Verify the token format in localStorage

### Registration Errors

If registration fails:

1. Check that email doesn't already exist
2. Verify password meets requirements (8+ characters)
3. Check database schema is properly set up

