import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, updateUserPassword } from '@/lib/auth';

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
    const { currentPassword, newPassword } = body;

    // Validation
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Update password
    await updateUserPassword(payload.userId, currentPassword, newPassword);

    return NextResponse.json({
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Update password error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Current password is incorrect') {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }
      
      if (error.message.includes('not using local authentication')) {
        return NextResponse.json(
          { error: 'Password change is only available for local accounts' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'An error occurred while updating password' },
      { status: 500 }
    );
  }
}

