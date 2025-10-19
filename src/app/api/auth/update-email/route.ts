import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, updateUserEmail, findUserByEmail, createToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify token
    const payload = await verifyToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email } = body;

    // Validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser && existingUser.id !== payload.userId) {
      return NextResponse.json(
        { error: 'Email is already in use' },
        { status: 409 }
      );
    }

    // Update email
    const updatedUser = await updateUserEmail(payload.userId, email);

    // Create new token with updated email
    const newToken = await createToken({
      userId: updatedUser.id,
      email: updatedUser.email,
    });

    return NextResponse.json({
      message: 'Email updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
      },
      token: newToken,
    });
  } catch (error) {
    console.error('Update email error:', error);
    
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'Email is already in use' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while updating email' },
      { status: 500 }
    );
  }
}

