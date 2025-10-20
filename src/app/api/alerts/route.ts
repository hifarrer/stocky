import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export interface Alert {
  id: string;
  user_id: string;
  portfolio_item_id: string;
  symbol: string;
  market_type: 'stocks' | 'crypto' | 'forex';
  alert_type: 'price_up' | 'price_down' | 'change_up' | 'change_down';
  target_value: number;
  current_price?: number;
  is_triggered: boolean;
  triggered_at?: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// GET /api/alerts - Get user's alerts
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

    const { triggered } = request.nextUrl.searchParams;
    const showTriggered = triggered === 'true';

    let queryStr = `
      SELECT a.*, pi.symbol, pi.market_type, p.name as portfolio_name
      FROM portfolio_alerts a
      JOIN portfolio_items pi ON a.portfolio_item_id = pi.id
      JOIN portfolios p ON pi.portfolio_id = p.id
      WHERE a.user_id = $1
    `;
    
    const params = [payload.userId];
    
    if (showTriggered) {
      queryStr += ' AND a.is_triggered = true';
    } else {
      queryStr += ' AND a.is_active = true';
    }
    
    queryStr += ' ORDER BY a.created_at DESC LIMIT 20';

    const alerts = await query<Alert>(queryStr, params);

    return NextResponse.json({ success: true, data: alerts });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

// POST /api/alerts - Create new alert
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

    const { portfolio_item_id, alert_type, target_value } = await request.json();

    if (!portfolio_item_id || !alert_type || !target_value) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Verify portfolio item belongs to user
    const portfolioItem = await queryOne(
      `SELECT pi.*, p.user_id 
       FROM portfolio_items pi 
       JOIN portfolios p ON pi.portfolio_id = p.id 
       WHERE pi.id = $1 AND p.user_id = $2`,
      [portfolio_item_id, payload.userId]
    );

    if (!portfolioItem) {
      return NextResponse.json({ success: false, error: 'Portfolio item not found' }, { status: 404 });
    }

    // Check if alert already exists for this item and type
    const existingAlert = await queryOne(
      'SELECT id FROM portfolio_alerts WHERE portfolio_item_id = $1 AND alert_type = $2 AND is_active = true',
      [portfolio_item_id, alert_type]
    );

    if (existingAlert) {
      return NextResponse.json({ success: false, error: 'Alert already exists for this item and type' }, { status: 409 });
    }

    const alert = await queryOne<Alert>(
      `INSERT INTO portfolio_alerts (user_id, portfolio_item_id, alert_type, target_value, is_active) 
       VALUES ($1, $2, $3, $4, true) 
       RETURNING *`,
      [payload.userId, portfolio_item_id, alert_type, target_value]
    );

    if (!alert) {
      return NextResponse.json({ success: false, error: 'Failed to create alert' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: alert });
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create alert' },
      { status: 500 }
    );
  }
}
