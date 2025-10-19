import { NextRequest, NextResponse } from 'next/server';
import { createPolygonClient } from '@/lib/polygon';

const polygonClient = createPolygonClient(
  process.env.POLYGON_API_KEY || process.env.NEXT_PUBLIC_POLYGON_API_KEY || 'demo'
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'gainers'; // gainers, losers, or overview
  const market = searchParams.get('market') || 'stocks'; // stocks or crypto

  try {
    let data;

    if (type === 'overview') {
      // Get comprehensive market overview
      data = await polygonClient.getMarketOverview();
    } else if (market === 'crypto') {
      // Get crypto snapshots
      const response = await polygonClient.snapshot.getCryptoSnapshots();
      data = { results: response.results || [] };
    } else {
      // Get gainers or losers
      const response = await polygonClient.snapshot.getGainersLosers(
        type as 'gainers' | 'losers'
      );
      data = response;
    }

    return NextResponse.json({
      success: true,
      data,
      type,
      market,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Market API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch market data',
        type,
        market,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}