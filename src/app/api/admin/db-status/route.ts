import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseStatus } from '@/lib/db-init';

// GET /api/admin/db-status - Check database initialization status
export async function GET(request: NextRequest) {
  try {
    const status = await checkDatabaseStatus();
    
    return NextResponse.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error checking database status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check database status' },
      { status: 500 }
    );
  }
}
