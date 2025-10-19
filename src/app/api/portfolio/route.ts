import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_default: boolean;
  color?: string;
  created_at: Date;
  updated_at: Date;
}

export interface PortfolioItem {
  id: string;
  portfolio_id: string;
  symbol: string;
  market_type: 'stocks' | 'crypto' | 'forex';
  quantity: number;
  average_price?: number;
  notes?: string;
  added_at: Date;
  updated_at: Date;
}

// GET /api/portfolio - Get user's portfolios
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'No token provided' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Get user's portfolios
    const portfolios = await query<Portfolio>(
      'SELECT * FROM portfolios WHERE user_id = $1 ORDER BY is_default DESC, created_at ASC',
      [payload.userId]
    );

    // Get portfolio items for each portfolio
    const portfoliosWithItems = await Promise.all(
      portfolios.map(async (portfolio) => {
        const items = await query<PortfolioItem>(
          'SELECT * FROM portfolio_items WHERE portfolio_id = $1 ORDER BY added_at ASC',
          [portfolio.id]
        );
        return { ...portfolio, items };
      })
    );

    return NextResponse.json({ success: true, data: portfoliosWithItems });
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch portfolios' },
      { status: 500 }
    );
  }
}

// POST /api/portfolio - Create new portfolio
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

    const { name, description, color, is_default = false } = await request.json();

    if (!name) {
      return NextResponse.json({ success: false, error: 'Portfolio name is required' }, { status: 400 });
    }

    // If this is being set as default, unset other defaults
    if (is_default) {
      await query('UPDATE portfolios SET is_default = false WHERE user_id = $1', [payload.userId]);
    }

    const portfolio = await queryOne<Portfolio>(
      `INSERT INTO portfolios (user_id, name, description, color, is_default) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [payload.userId, name, description, color, is_default]
    );

    if (!portfolio) {
      return NextResponse.json({ success: false, error: 'Failed to create portfolio' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: portfolio });
  } catch (error) {
    console.error('Error creating portfolio:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create portfolio' },
      { status: 500 }
    );
  }
}
