import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// PUT /api/portfolio/[portfolioId]/items/[itemId] - Update portfolio item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ portfolioId: string; itemId: string }> }
) {
  const { portfolioId, itemId } = await params;
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'No token provided' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const { quantity, average_price, notes } = await request.json();

    // Verify portfolio belongs to user
    const portfolio = await queryOne(
      'SELECT id FROM portfolios WHERE id = $1 AND user_id = $2',
      [portfolioId, payload.userId]
    );

    if (!portfolio) {
      return NextResponse.json({ success: false, error: 'Portfolio not found' }, { status: 404 });
    }

    // Verify item belongs to portfolio
    const item = await queryOne(
      'SELECT id FROM portfolio_items WHERE id = $1 AND portfolio_id = $2',
      [itemId, portfolioId]
    );

    if (!item) {
      return NextResponse.json({ success: false, error: 'Portfolio item not found' }, { status: 404 });
    }

    const updatedItem = await queryOne(
      `UPDATE portfolio_items 
       SET quantity = COALESCE($1, quantity), 
           average_price = COALESCE($2, average_price), 
           notes = COALESCE($3, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 
       RETURNING *`,
      [quantity, average_price, notes, itemId]
    );

    if (!updatedItem) {
      return NextResponse.json({ success: false, error: 'Failed to update portfolio item' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: updatedItem });
  } catch (error) {
    console.error('Error updating portfolio item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update portfolio item' },
      { status: 500 }
    );
  }
}

// DELETE /api/portfolio/[portfolioId]/items/[itemId] - Remove portfolio item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ portfolioId: string; itemId: string }> }
) {
  const { portfolioId, itemId } = await params;
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

    // Verify item belongs to portfolio
    const item = await queryOne(
      'SELECT id FROM portfolio_items WHERE id = $1 AND portfolio_id = $2',
      [itemId, portfolioId]
    );

    if (!item) {
      return NextResponse.json({ success: false, error: 'Portfolio item not found' }, { status: 404 });
    }

    await query('DELETE FROM portfolio_items WHERE id = $1', [itemId]);

    return NextResponse.json({ success: true, message: 'Portfolio item removed successfully' });
  } catch (error) {
    console.error('Error removing portfolio item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove portfolio item' },
      { status: 500 }
    );
  }
}
