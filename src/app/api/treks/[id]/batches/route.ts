import { NextRequest, NextResponse } from 'next/server';
import { dbUnavailableResponse } from '@/lib/api/responses';
import { isDbConfigured } from '@/lib/db';
import { getLiveDepartureBatches } from '@/lib/inventory/service';
import { treks } from '@/lib/data';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

/**
 * Live departure availability for a trek (catalog shape + Postgres inventory).
 * Public, short-cache — inventory can change; clients should not treat as a lock.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const trek = treks.find((t) => t.id === id);
  if (!trek) {
    return NextResponse.json({ error: 'Trek not found' }, { status: 404 });
  }

  if (!isDbConfigured()) {
    // Fall back to catalog-only (non-locking) when DB is down.
    const { getDepartureBatches } = await import('@/lib/batches');
    const batches = getDepartureBatches(trek);
    return NextResponse.json(
      { trekId: id, authoritative: false, batches },
      { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=60' } },
    );
  }

  try {
    const batches = await getLiveDepartureBatches(id);
    return NextResponse.json(
      { trekId: id, authoritative: true, batches },
      { headers: { 'Cache-Control': 'private, max-age=15' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to load batches';
    if (/DATABASE|timeout|ECONN/i.test(message)) return dbUnavailableResponse();
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
