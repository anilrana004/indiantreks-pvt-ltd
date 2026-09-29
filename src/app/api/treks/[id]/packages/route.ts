import { NextRequest, NextResponse } from 'next/server';
import { dbUnavailableResponse } from '@/lib/api/responses';
import { isDbConfigured } from '@/lib/db';
import {
  dbPackageToPricingTier,
  listActivePackagesForTrek,
} from '@/lib/catalog/packages';
import { treks } from '@/lib/data';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

/** Public package pricing for a trek — Postgres-backed when available. */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const trek = treks.find((t) => t.id === id);
  if (!trek) return NextResponse.json({ error: 'Trek not found' }, { status: 404 });

  if (!isDbConfigured()) {
    return NextResponse.json(
      {
        trekId: id,
        priceSource: 'catalog_fallback',
        packages: trek.pricing,
      },
      { headers: { 'Cache-Control': 'public, max-age=60' } },
    );
  }

  try {
    const rows = await listActivePackagesForTrek(id);
    return NextResponse.json(
      {
        trekId: id,
        priceSource: 'postgres',
        packages: rows.map(dbPackageToPricingTier),
        packageRows: rows.map((p) => ({
          id: p.id,
          packageKey: p.packageKey,
          name: p.name,
          priceInr: p.priceInr,
          originalPriceInr: p.originalPriceInr,
          depositInr: p.depositInr,
          badge: p.badge,
          status: p.status,
        })),
      },
      { headers: { 'Cache-Control': 'private, max-age=30' } },
    );
  } catch {
    return dbUnavailableResponse();
  }
}
