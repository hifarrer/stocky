import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// POST /api/portfolio/create-default - Create default portfolio for new users
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'No token provided' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Check if user already has portfolios
    const existingPortfolios = await query(
      'SELECT id FROM portfolios WHERE user_id = $1',
      [payload.userId]
    );

    if (existingPortfolios.length > 0) {
      return NextResponse.json({ success: false, error: 'User already has portfolios' }, { status: 409 });
    }

    // Create default portfolio
    const portfolio = await queryOne(
      `INSERT INTO portfolios (user_id, name, description, is_default) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [payload.userId, 'My Portfolio', 'Default portfolio for tracking investments', true]
    );

    if (!portfolio) {
      return NextResponse.json({ success: false, error: 'Failed to create default portfolio' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: portfolio });
  } catch (error) {
    console.error('Error creating default portfolio:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create default portfolio' },
      { status: 500 }
    );
  }
}
