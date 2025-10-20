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
  const { searchParams } = new URL(request.url);
  const extended = searchParams.get('extended') === 'true';

  if (!symbol) {
    return NextResponse.json(
      { error: 'Symbol parameter is required' },
      { status: 400 }
    );
  }

  try {
    if (extended) {
      // Get comprehensive ticker data
      const data = await polygonClient.getCompleteTickerData(symbol);
      
      return NextResponse.json({
        success: true,
        data,
        symbol,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Get basic snapshot data
      const response = await polygonClient.snapshot.getTicker(symbol);
      
      return NextResponse.json({
        success: true,
        data: response.ticker,
        symbol,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error(`Ticker API error for ${symbol}:`, error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch ticker data',
        symbol,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}