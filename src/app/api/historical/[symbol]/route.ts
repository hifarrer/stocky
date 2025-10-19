import { NextRequest, NextResponse } from 'next/server';
import { createPolygonClient } from '@/lib/polygon';
import { TimeFrame } from '@/types';

const polygonClient = createPolygonClient(
  process.env.POLYGON_API_KEY || process.env.NEXT_PUBLIC_POLYGON_API_KEY || 'demo'
);

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  const symbol = params.symbol.toUpperCase();
  const { searchParams } = new URL(request.url);
  const timeframe = (searchParams.get('timeframe') || '1d') as TimeFrame;
  const period = parseInt(searchParams.get('period') || '30');

  if (!symbol) {
    return NextResponse.json(
      { error: 'Symbol parameter is required' },
      { status: 400 }
    );
  }

  try {
    const data = await polygonClient.historical.getChartData(
      symbol,
      timeframe,
      period
    );

    return NextResponse.json({
      success: true,
      data,
      symbol,
      timeframe,
      period,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`Historical data API error for ${symbol}:`, error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch historical data',
        symbol,
        timeframe,
        period,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}