import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// DELETE /api/alerts/[alertId] - Delete alert
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ alertId: string }> }
) {
  const { alertId } = await params;
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'No token provided' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Verify alert belongs to user
    const alert = await queryOne(
      'SELECT id FROM portfolio_alerts WHERE id = $1 AND user_id = $2',
      [alertId, payload.userId]
    );

    if (!alert) {
      return NextResponse.json({ success: false, error: 'Alert not found' }, { status: 404 });
    }

    await query('DELETE FROM portfolio_alerts WHERE id = $1', [alertId]);

    return NextResponse.json({ success: true, message: 'Alert deleted successfully' });
  } catch (error) {
    console.error('Error deleting alert:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete alert' },
      { status: 500 }
    );
  }
}

// PUT /api/alerts/[alertId] - Update alert
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ alertId: string }> }
) {
  const { alertId } = await params;
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'No token provided' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const { target_value, is_active } = await request.json();

    // Verify alert belongs to user
    const alert = await queryOne(
      'SELECT id FROM portfolio_alerts WHERE id = $1 AND user_id = $2',
      [alertId, payload.userId]
    );

    if (!alert) {
      return NextResponse.json({ success: false, error: 'Alert not found' }, { status: 404 });
    }

    const updatedAlert = await queryOne(
      `UPDATE portfolio_alerts 
       SET target_value = COALESCE($1, target_value), 
           is_active = COALESCE($2, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 
       RETURNING *`,
      [target_value, is_active, alertId]
    );

    if (!updatedAlert) {
      return NextResponse.json({ success: false, error: 'Failed to update alert' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: updatedAlert });
  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update alert' },
      { status: 500 }
    );
  }
}
