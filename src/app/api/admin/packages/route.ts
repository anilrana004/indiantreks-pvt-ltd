import { NextRequest, NextResponse } from 'next/server';
import {
  dbUnavailableResponse,
  forbiddenResponse,
  requireAdmin,
  requireAdminPermission,
  unauthorizedResponse,
} from '@/lib/admin/auth';
import { isDbConfigured } from '@/lib/db';
import {
  invalidateTrekPackageCaches,
  listActivePackagesForTrek,
  syncAllTrekPackagesFromCatalog,
  syncTrekPackagesFromCatalog,
  updateTrekPackage,
} from '@/lib/catalog/packages';
import { treks } from '@/lib/data';

export const runtime = 'nodejs';

/** List packages (optional ?trekId=) or sync from catalog (?sync=1&overwrite=1). */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return unauthorizedResponse();
  if (!isDbConfigured()) return dbUnavailableResponse();

  const trekId = req.nextUrl.searchParams.get('trekId') || '';
  const sync = req.nextUrl.searchParams.get('sync') === '1';
  const overwrite = req.nextUrl.searchParams.get('overwrite') === '1';

  try {
    if (sync) {
      const gate = await requireAdminPermission('packages.write');
      if (gate.forbidden) return forbiddenResponse();
      const count = trekId
        ? await syncTrekPackagesFromCatalog(trekId, { overwritePrices: overwrite })
        : await syncAllTrekPackagesFromCatalog({ overwritePrices: overwrite });
      return NextResponse.json({ ok: true, synced: count, overwrite });
    }

    if (trekId) {
      if (!treks.some((t) => t.id === trekId)) {
        return NextResponse.json({ error: 'Trek not found' }, { status: 404 });
      }
      const packages = await listActivePackagesForTrek(trekId);
      return NextResponse.json({ trekId, packages });
    }

    const all = [];
    for (const trek of treks) {
      const packages = await listActivePackagesForTrek(trek.id);
      all.push({ trekId: trek.id, trekTitle: trek.title, packages });
    }
    return NextResponse.json({ treks: all });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to load packages';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Update a package price (whitelist fields only). */
export async function PATCH(req: NextRequest) {
  const gate = await requireAdminPermission('packages.write');
  if (!gate.admin) return unauthorizedResponse();
  if (gate.forbidden) return forbiddenResponse();
  if (!isDbConfigured()) return dbUnavailableResponse();

  try {
    const body = await req.json();
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'Package id required' }, { status: 400 });

    const updated = await updateTrekPackage(id, {
      priceInr: body.priceInr !== undefined ? Number(body.priceInr) : undefined,
      originalPriceInr:
        body.originalPriceInr === null
          ? null
          : body.originalPriceInr !== undefined
            ? Number(body.originalPriceInr)
            : undefined,
      depositInr: body.depositInr !== undefined ? Number(body.depositInr) : undefined,
      badge: body.badge !== undefined ? String(body.badge) : undefined,
      status: body.status === 'active' || body.status === 'inactive' ? body.status : undefined,
    });

    if (!updated) return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    await invalidateTrekPackageCaches(updated.trekId);
    return NextResponse.json({ package: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    const status =
      typeof err === 'object' && err && 'status' in err
        ? Number((err as { status: number }).status)
        : 400;
    return NextResponse.json({ error: message }, { status: Number.isFinite(status) ? status : 400 });
  }
}
