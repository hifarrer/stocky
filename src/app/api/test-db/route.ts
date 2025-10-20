import { NextRequest, NextResponse } from 'next/server';
import { ensureDatabaseInitialized } from '@/lib/db-init';
import { query } from '@/lib/db';

// GET /api/test-db - Test database connection and initialization
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing database connection and initialization...');
    
    // Try to initialize the database
    await ensureDatabaseInitialized();
    
    // Test a simple query
    const result = await query('SELECT NOW() as current_time');
    
    // Try to check if portfolios table exists
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'portfolios'
    `);
    
    return NextResponse.json({
      success: true,
      message: 'Database test successful',
      data: {
        currentTime: result[0],
        portfoliosTableExists: tablesResult.length > 0,
        tables: tablesResult
      }
    });
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
