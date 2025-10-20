import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// POST /api/portfolio/create-stock-default - Create default stock portfolio for new users
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

    // Check if user already has stock portfolios
    const existingStockPortfolios = await query(
      'SELECT id FROM portfolios WHERE user_id = $1 AND name ILIKE $2',
      [payload.userId, '%stock%']
    );

    if (existingStockPortfolios.length > 0) {
      // Return the existing stock portfolio
      const stockPortfolios = await query(
        'SELECT * FROM portfolios WHERE user_id = $1 AND name ILIKE $2 ORDER BY created_at ASC',
        [payload.userId, '%stock%']
      );
      
      return NextResponse.json({ 
        success: true, 
        data: stockPortfolios[0], // Return the first stock portfolio
        message: 'User already has stock portfolios' 
      });
    }

    // Create default stock portfolio
    const portfolio = await queryOne(
      `INSERT INTO portfolios (user_id, name, description, is_default) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [payload.userId, 'Stock Portfolio', 'Default portfolio for tracking stock investments', false]
    );

    if (!portfolio) {
      return NextResponse.json({ success: false, error: 'Failed to create default stock portfolio' }, { status: 500 });
    }

    // Add AAPL as default stock symbol
    try {
      await query(
        `INSERT INTO portfolio_items (portfolio_id, symbol, market_type, quantity, average_price, notes) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [portfolio.id, 'AAPL', 'stocks', 10, 150, 'Default Apple holding - adjust quantity as needed']
      );
    } catch (error) {
      console.warn('Failed to add default AAPL symbol:', error);
      // Continue even if AAPL addition fails
    }

    return NextResponse.json({ success: true, data: portfolio });
  } catch (error) {
    console.error('Error creating default stock portfolio:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create default stock portfolio' },
      { status: 500 }
    );
  }
}
