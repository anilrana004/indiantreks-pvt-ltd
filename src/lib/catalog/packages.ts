import { and, asc, eq, sql } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';
import { treks, trekDetailPath, type PricingTier } from '@/lib/data';

const { trekPackages } = schema;

function requireDb() {
  const db = getDb();
  if (!db) throw new Error('DATABASE_URL is not configured');
  return db;
}

export function packageKeyFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export type DbPackage = {
  id: string;
  trekId: string;
  packageKey: string;
  name: string;
  priceInr: number;
  originalPriceInr: number | null;
  depositInr: number;
  badge: string;
  inclusions: string[];
  exclusions: string[];
  status: string;
  sortOrder: number;
};

function parseJsonArray(raw: string | null | undefined): string[] {
  try {
    const v = JSON.parse(raw || '[]');
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

function toDbPackage(row: typeof trekPackages.$inferSelect): DbPackage {
  return {
    id: row.id,
    trekId: row.trekId,
    packageKey: row.packageKey,
    name: row.name,
    priceInr: row.priceInr,
    originalPriceInr: row.originalPriceInr,
    depositInr: row.depositInr,
    badge: row.badge || '',
    inclusions: parseJsonArray(row.inclusionsJson),
    exclusions: parseJsonArray(row.exclusionsJson),
    status: row.status,
    sortOrder: row.sortOrder,
  };
}

export function dbPackageToPricingTier(pkg: DbPackage): PricingTier {
  const name = pkg.name as PricingTier['name'];
  return {
    name: ['Economic', 'Standard', 'Premium'].includes(name) ? name : 'Standard',
    price: pkg.priceInr,
    originalPrice: pkg.originalPriceInr ?? undefined,
    deposit: pkg.depositInr,
    badge: pkg.badge || undefined,
    inclusions: pkg.inclusions,
    exclusions: pkg.exclusions,
  };
}

function isCurrentlyValid(row: typeof trekPackages.$inferSelect, now = new Date()): boolean {
  if (row.status !== 'active') return false;
  if (row.validFrom && row.validFrom.getTime() > now.getTime()) return false;
  if (row.validUntil && row.validUntil.getTime() < now.getTime()) return false;
  return true;
}

/** Upsert catalog tiers into Postgres for one trek (does not overwrite admin-edited rows if preserveExistingPrices). */
export async function syncTrekPackagesFromCatalog(
  trekId: string,
  opts?: { overwritePrices?: boolean },
): Promise<number> {
  const trek = treks.find((t) => t.id === trekId);
  if (!trek?.pricing?.length) return 0;
  const db = requireDb();
  const overwrite = Boolean(opts?.overwritePrices);
  let count = 0;

  for (let i = 0; i < trek.pricing.length; i++) {
    const tier = trek.pricing[i]!;
    const packageKey = packageKeyFromName(tier.name);
    const existing = await db
      .select()
      .from(trekPackages)
      .where(and(eq(trekPackages.trekId, trekId), eq(trekPackages.packageKey, packageKey)))
      .limit(1);

    if (existing[0] && !overwrite) {
      // Keep admin prices; refresh copy fields only.
      await db
        .update(trekPackages)
        .set({
          name: tier.name,
          badge: tier.badge || '',
          inclusionsJson: JSON.stringify(tier.inclusions || []),
          exclusionsJson: JSON.stringify(tier.exclusions || []),
          sortOrder: i,
          updatedAt: new Date(),
        })
        .where(eq(trekPackages.id, existing[0].id));
      count += 1;
      continue;
    }

    if (existing[0] && overwrite) {
      await db
        .update(trekPackages)
        .set({
          name: tier.name,
          priceInr: tier.price,
          originalPriceInr: tier.originalPrice ?? null,
          depositInr: tier.deposit,
          badge: tier.badge || '',
          inclusionsJson: JSON.stringify(tier.inclusions || []),
          exclusionsJson: JSON.stringify(tier.exclusions || []),
          status: 'active',
          sortOrder: i,
          updatedAt: new Date(),
        })
        .where(eq(trekPackages.id, existing[0].id));
      count += 1;
      continue;
    }

    await db.insert(trekPackages).values({
      trekId,
      packageKey,
      name: tier.name,
      priceInr: tier.price,
      originalPriceInr: tier.originalPrice ?? null,
      depositInr: tier.deposit,
      badge: tier.badge || '',
      inclusionsJson: JSON.stringify(tier.inclusions || []),
      exclusionsJson: JSON.stringify(tier.exclusions || []),
      status: 'active',
      sortOrder: i,
      updatedAt: new Date(),
    });
    count += 1;
  }

  return count;
}

export async function syncAllTrekPackagesFromCatalog(opts?: { overwritePrices?: boolean }) {
  let total = 0;
  for (const trek of treks) {
    total += await syncTrekPackagesFromCatalog(trek.id, opts);
  }
  return total;
}

/** Ensure packages exist for a trek; seed from catalog if empty. */
export async function ensureTrekPackages(trekId: string): Promise<DbPackage[]> {
  const db = requireDb();
  const rows = await db
    .select()
    .from(trekPackages)
    .where(eq(trekPackages.trekId, trekId))
    .orderBy(asc(trekPackages.sortOrder), asc(trekPackages.name));

  if (rows.length === 0) {
    await syncTrekPackagesFromCatalog(trekId, { overwritePrices: true });
    const again = await db
      .select()
      .from(trekPackages)
      .where(eq(trekPackages.trekId, trekId))
      .orderBy(asc(trekPackages.sortOrder), asc(trekPackages.name));
    return again.filter((r) => isCurrentlyValid(r)).map(toDbPackage);
  }

  return rows.filter((r) => isCurrentlyValid(r)).map(toDbPackage);
}

export async function listActivePackagesForTrek(trekId: string): Promise<DbPackage[]> {
  return ensureTrekPackages(trekId);
}

/** Hot-path package lookup — no catalog seed. Falls back to null → catalog pricing. */
export async function findActivePackage(
  trekId: string,
  packageNameOrKey: string,
): Promise<DbPackage | null> {
  const db = requireDb();
  const key = packageKeyFromName(packageNameOrKey);
  const rows = await db
    .select()
    .from(trekPackages)
    .where(and(eq(trekPackages.trekId, trekId), eq(trekPackages.status, 'active')))
    .orderBy(asc(trekPackages.sortOrder), asc(trekPackages.name));

  const valid = rows.filter((r) => isCurrentlyValid(r));
  if (!valid.length) return null;

  const exact =
    valid.find((p) => p.packageKey === key) ||
    valid.find((p) => p.name.toLowerCase() === packageNameOrKey.trim().toLowerCase());
  if (exact) return toDbPackage(exact);

  return toDbPackage([...valid].sort((a, b) => a.priceInr - b.priceInr)[0]!);
}

export type PackagePriceUpdate = {
  priceInr?: number;
  originalPriceInr?: number | null;
  depositInr?: number;
  badge?: string;
  status?: 'active' | 'inactive';
  validFrom?: Date | null;
  validUntil?: Date | null;
};

/** Admin-safe field whitelist for package price updates. */
export async function updateTrekPackage(
  packageId: string,
  patch: PackagePriceUpdate,
): Promise<DbPackage | null> {
  const db = requireDb();
  const [existing] = await db
    .select()
    .from(trekPackages)
    .where(eq(trekPackages.id, packageId))
    .limit(1);
  if (!existing) return null;

  const next: Partial<typeof trekPackages.$inferInsert> = { updatedAt: new Date() };
  if (patch.priceInr !== undefined) {
    const n = Math.floor(Number(patch.priceInr));
    if (!Number.isFinite(n) || n < 0) throw Object.assign(new Error('Invalid price'), { status: 400 });
    next.priceInr = n;
  }
  if (patch.originalPriceInr !== undefined) {
    if (patch.originalPriceInr === null) next.originalPriceInr = null;
    else {
      const n = Math.floor(Number(patch.originalPriceInr));
      if (!Number.isFinite(n) || n < 0) throw Object.assign(new Error('Invalid original price'), { status: 400 });
      next.originalPriceInr = n;
    }
  }
  if (patch.depositInr !== undefined) {
    const n = Math.floor(Number(patch.depositInr));
    if (!Number.isFinite(n) || n < 0) throw Object.assign(new Error('Invalid deposit'), { status: 400 });
    next.depositInr = n;
  }
  if (patch.badge !== undefined) next.badge = String(patch.badge).slice(0, 80);
  if (patch.status !== undefined) {
    if (patch.status !== 'active' && patch.status !== 'inactive') {
      throw Object.assign(new Error('Invalid status'), { status: 400 });
    }
    next.status = patch.status;
  }
  if (patch.validFrom !== undefined) next.validFrom = patch.validFrom;
  if (patch.validUntil !== undefined) next.validUntil = patch.validUntil;

  const [row] = await db
    .update(trekPackages)
    .set(next)
    .where(eq(trekPackages.id, packageId))
    .returning();

  return row ? toDbPackage(row) : null;
}

/** Best-effort Next.js cache invalidation after admin price changes. */
export async function invalidateTrekPackageCaches(trekId: string) {
  try {
    const { revalidatePath, revalidateTag } = await import('next/cache');
    revalidateTag(`trek-packages:${trekId}`, 'max');
    revalidateTag('trek-packages', 'max');
    const trek = treks.find((t) => t.id === trekId);
    if (trek) {
      revalidatePath(trekDetailPath(trek));
      revalidatePath(`/booking/${trekId}`);
    }
  } catch {
    /* not in Next request context / tag unsupported */
  }
}

export async function countTrekPackages(): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const [row] = await db.select({ value: sql<number>`count(*)::int` }).from(trekPackages);
  return Number(row?.value || 0);
}
