import { NextResponse } from 'next/server';

/**
 * Public Mapbox token for the trek map. `pk.` tokens are designed for browsers.
 * URL restrictions should still be set on the Mapbox dashboard.
 */
export async function GET() {
  const token = (process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '').trim();
  const headers = {
    'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400',
  };
  if (!token.startsWith('pk.') || token.length < 20) {
    return NextResponse.json({ token: null }, { status: 200, headers });
  }
  return NextResponse.json({ token }, { headers });
}
