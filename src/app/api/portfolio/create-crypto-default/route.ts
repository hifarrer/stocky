import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// POST /api/portfolio/create-crypto-default - Create default crypto portfolio for new users
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

    // Check if user already has crypto portfolios
    const existingCryptoPortfolios = await query(
      'SELECT id FROM portfolios WHERE user_id = $1 AND name ILIKE $2',
      [payload.userId, '%crypto%']
    );

    if (existingCryptoPortfolios.length > 0) {
      // Return the existing crypto portfolio
      const cryptoPortfolios = await query(
        'SELECT * FROM portfolios WHERE user_id = $1 AND name ILIKE $2 ORDER BY created_at ASC',
        [payload.userId, '%crypto%']
      );
      
      return NextResponse.json({ 
        success: true, 
        data: cryptoPortfolios[0], // Return the first crypto portfolio
        message: 'User already has crypto portfolios' 
      });
    }

    // Create default crypto portfolio
    const portfolio = await queryOne(
      `INSERT INTO portfolios (user_id, name, description, is_default) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [payload.userId, 'Crypto Portfolio', 'Default portfolio for tracking cryptocurrency investments', true]
    );

    if (!portfolio) {
      return NextResponse.json({ success: false, error: 'Failed to create default crypto portfolio' }, { status: 500 });
    }

    // Add BTC as default crypto symbol
    try {
      await query(
        `INSERT INTO portfolio_items (portfolio_id, symbol, market_type, quantity, average_price, notes) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [portfolio.id, 'BTC', 'crypto', 0.1, 50000, 'Default Bitcoin holding - adjust quantity as needed']
      );
    } catch (error) {
      console.warn('Failed to add default BTC symbol:', error);
      // Continue even if BTC addition fails
    }

    return NextResponse.json({ success: true, data: portfolio });
  } catch (error) {
    console.error('Error creating default crypto portfolio:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create default crypto portfolio' },
      { status: 500 }
    );
  }
}
