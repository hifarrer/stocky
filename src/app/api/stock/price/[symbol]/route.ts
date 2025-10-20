import { NextRequest, NextResponse } from 'next/server';
import { createPolygonClient } from '@/lib/polygon';

const polygonClient = createPolygonClient(
  process.env.POLYGON_API_KEY || process.env.NEXT_PUBLIC_POLYGON_API_KEY || 'demo'
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol: symbolParam } = await params;
  const symbol = symbolParam.toUpperCase();

  console.log('Stock price API called for symbol:', symbol);

  if (!symbol) {
    return NextResponse.json(
      { error: 'Symbol parameter is required' },
      { status: 400 }
    );
  }

  try {
    console.log('Fetching snapshot from Polygon for:', symbol);
    // Get current price for the stock symbol using Polygon's snapshot endpoint
    const snapshotResponse = await polygonClient.snapshot.getTicker(symbol);
    console.log('Polygon snapshot response:', JSON.stringify(snapshotResponse, null, 2));
    
    // The response structure is { ticker: { ... } } not { results: { ... } }
    if (!snapshotResponse || !snapshotResponse.ticker) {
      console.log('No snapshot ticker found for:', symbol);
      return NextResponse.json(
        {
          success: false,
          error: 'Stock not found',
          symbol,
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const snapshot = snapshotResponse.ticker;
    console.log('Snapshot data:', JSON.stringify(snapshot, null, 2));
    
    // Get the current price from the snapshot
    const currentPrice = snapshot.day?.c || snapshot.prevDay?.c || snapshot.lastTrade?.p || null;
    console.log('Extracted current price:', currentPrice);
    
    return NextResponse.json({
      success: true,
      data: {
        symbol: symbol,
        current_price: currentPrice,
        currency: 'usd',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Stock price API error:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch stock price',
        symbol,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

