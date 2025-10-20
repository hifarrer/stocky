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
      // Return the existing portfolios instead of an error
      const portfolios = await query(
        'SELECT * FROM portfolios WHERE user_id = $1 ORDER BY is_default DESC, created_at ASC',
        [payload.userId]
      );
      
      return NextResponse.json({ 
        success: true, 
        data: portfolios[0], // Return the first (default) portfolio
        message: 'User already has portfolios' 
      });
    }

    // Create default portfolios for both crypto and stocks
    const cryptoPortfolio = await queryOne(
      `INSERT INTO portfolios (user_id, name, description, is_default) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [payload.userId, 'Crypto Portfolio', 'Default portfolio for tracking cryptocurrency investments', true]
    );

    const stockPortfolio = await queryOne(
      `INSERT INTO portfolios (user_id, name, description, is_default) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [payload.userId, 'Stock Portfolio', 'Default portfolio for tracking stock investments', false]
    );

    // Add default symbols to both portfolios
    try {
      // Add BTC to crypto portfolio
      await query(
        `INSERT INTO portfolio_items (portfolio_id, symbol, market_type, quantity, average_price, notes) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [cryptoPortfolio.id, 'BTC', 'crypto', 0.1, 50000, 'Default Bitcoin holding - adjust quantity as needed']
      );

      // Add AAPL to stock portfolio
      await query(
        `INSERT INTO portfolio_items (portfolio_id, symbol, market_type, quantity, average_price, notes) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [stockPortfolio.id, 'AAPL', 'stocks', 10, 150, 'Default Apple holding - adjust quantity as needed']
      );
    } catch (error) {
      console.warn('Failed to add default symbols:', error);
      // Continue even if symbol addition fails
    }

    // Return the crypto portfolio as the primary default
    const portfolio = cryptoPortfolio;

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
