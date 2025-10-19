import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// GET /api/portfolio/[portfolioId]/items - Get portfolio items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ portfolioId: string }> }
) {
  const { portfolioId } = await params;
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'No token provided' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Verify portfolio belongs to user
    const portfolio = await queryOne(
      'SELECT id FROM portfolios WHERE id = $1 AND user_id = $2',
      [portfolioId, payload.userId]
    );

    if (!portfolio) {
      return NextResponse.json({ success: false, error: 'Portfolio not found' }, { status: 404 });
    }

    const items = await query(
      'SELECT * FROM portfolio_items WHERE portfolio_id = $1 ORDER BY added_at ASC',
      [portfolioId]
    );

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error('Error fetching portfolio items:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch portfolio items' },
      { status: 500 }
    );
  }
}

// POST /api/portfolio/[portfolioId]/items - Add item to portfolio
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ portfolioId: string }> }
) {
  const { portfolioId } = await params;
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'No token provided' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const { symbol, market_type, quantity = 0, average_price, notes } = await request.json();

    if (!symbol || !market_type) {
      return NextResponse.json({ success: false, error: 'Symbol and market type are required' }, { status: 400 });
    }

    // Verify portfolio belongs to user
    const portfolio = await queryOne(
      'SELECT id FROM portfolios WHERE id = $1 AND user_id = $2',
      [portfolioId, payload.userId]
    );

    if (!portfolio) {
      return NextResponse.json({ success: false, error: 'Portfolio not found' }, { status: 404 });
    }

    // Check if symbol already exists in portfolio
    const existingItem = await queryOne(
      'SELECT id FROM portfolio_items WHERE portfolio_id = $1 AND symbol = $2',
      [portfolioId, symbol]
    );

    if (existingItem) {
      return NextResponse.json({ success: false, error: 'Symbol already exists in portfolio' }, { status: 409 });
    }

    const item = await queryOne(
      `INSERT INTO portfolio_items (portfolio_id, symbol, market_type, quantity, average_price, notes) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [portfolioId, symbol, market_type, quantity, average_price, notes]
    );

    if (!item) {
      return NextResponse.json({ success: false, error: 'Failed to add item to portfolio' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('Error adding portfolio item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add item to portfolio' },
      { status: 500 }
    );
  }
}
