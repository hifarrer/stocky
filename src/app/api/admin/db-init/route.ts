import { NextRequest, NextResponse } from 'next/server';
import { ensureDatabaseInitialized } from '@/lib/db-init';

// POST /api/admin/db-init - Manually trigger database initialization
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Manual database initialization triggered');
    await ensureDatabaseInitialized();
    
    return NextResponse.json({
      success: true,
      message: 'Database initialization completed'
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initialize database' },
      { status: 500 }
    );
  }
}
