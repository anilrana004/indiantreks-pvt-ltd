import { ObjectId, type Collection, type WithId, type Document } from 'mongodb';
import { createHash } from 'crypto';
import { getMongoDb, isMongoConfigured } from '@/lib/mongo';
import {
  GUEST_REVIEWS_COLLECTION,
  type AdminGuestReview,
  type CreateGuestReviewInput,
  type GuestReviewStatus,
  type PackageKind,
  type PublicGuestReview,
} from '@/lib/reviews/types';

type GuestReviewDoc = {
  packageId: string;
  packageTitle: string;
  packageHref: string;
  packageKind: PackageKind;
  name: string;
  email: string;
  rating: number;
  text: string;
  avatarUrl: string | null;
  photoUrls: string[];
  avatarPublicId: string | null;
  photoPublicIds: string[];
  status: GuestReviewStatus;
  createdAt: Date;
  moderatedAt: Date | null;
  moderatedBy: string | null;
  userAgent: string | null;
  ipHash: string | null;
};

function reviews(): Promise<Collection<GuestReviewDoc>> {
  return getMongoDb().then((db) => db.collection<GuestReviewDoc>(GUEST_REVIEWS_COLLECTION));
}

function toIso(value: Date | null | undefined): string | null {
  if (!value) return null;
  return value.toISOString();
}

function mapPublic(doc: WithId<GuestReviewDoc>): PublicGuestReview {
  return {
    id: String(doc._id),
    packageId: doc.packageId,
    packageTitle: doc.packageTitle,
    packageHref: doc.packageHref,
    packageKind: doc.packageKind,
    name: doc.name,
    rating: doc.rating,
    text: doc.text,
    avatarUrl: doc.avatarUrl,
    photoUrls: doc.photoUrls ?? [],
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
  };
}

function mapAdmin(doc: WithId<GuestReviewDoc>): AdminGuestReview {
  return {
    ...mapPublic(doc),
    email: doc.email,
    avatarPublicId: doc.avatarPublicId,
    photoPublicIds: doc.photoPublicIds ?? [],
    moderatedAt: toIso(doc.moderatedAt),
    moderatedBy: doc.moderatedBy,
    userAgent: doc.userAgent,
    ipHash: doc.ipHash,
  };
}

let indexesReady = false;

async function ensureIndexes(col: Collection<GuestReviewDoc>) {
  if (indexesReady) return;
  await Promise.all([
    col.createIndex({ packageId: 1, status: 1, createdAt: -1 }),
    col.createIndex({ status: 1, createdAt: -1 }),
    col.createIndex({ email: 1, createdAt: -1 }),
    col.createIndex({ createdAt: -1 }),
  ]);
  indexesReady = true;
}

export { isMongoConfigured };

export function hashReviewIp(ip: string): string {
  return createHash('sha256').update(`it-review:${ip}`).digest('hex').slice(0, 32);
}

export async function createGuestReview(input: CreateGuestReviewInput): Promise<PublicGuestReview> {
  const col = await reviews();
  await ensureIndexes(col);

  const doc: GuestReviewDoc = {
    packageId: input.packageId,
    packageTitle: input.packageTitle,
    packageHref: input.packageHref,
    packageKind: input.packageKind,
    name: input.name,
    email: input.email.toLowerCase(),
    rating: input.rating,
    text: input.text,
    avatarUrl: input.avatarUrl ?? null,
    photoUrls: input.photoUrls ?? [],
    avatarPublicId: input.avatarPublicId ?? null,
    photoPublicIds: input.photoPublicIds ?? [],
    status: 'pending',
    createdAt: new Date(),
    moderatedAt: null,
    moderatedBy: null,
    userAgent: input.userAgent ?? null,
    ipHash: input.ipHash ?? null,
  };

  const result = await col.insertOne(doc);
  return mapPublic({ ...doc, _id: result.insertedId });
}

export async function listApprovedReviewsForPackage(
  packageId: string,
  limit = 40,
): Promise<PublicGuestReview[]> {
  const col = await reviews();
  await ensureIndexes(col);
  const rows = await col
    .find({ packageId, status: 'approved' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  return rows.map(mapPublic);
}

export async function listAdminGuestReviews(opts?: {
  status?: GuestReviewStatus | 'all';
  search?: string;
  limit?: number;
}): Promise<AdminGuestReview[]> {
  const col = await reviews();
  await ensureIndexes(col);

  const filter: Document = {};
  if (opts?.status && opts.status !== 'all') {
    filter.status = opts.status;
  }
  const search = opts?.search?.trim();
  if (search) {
    const re = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    filter.$or = [{ name: re }, { email: re }, { packageTitle: re }, { packageId: re }, { text: re }];
  }

  const rows = await col
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(opts?.limit ?? 500)
    .toArray();
  return rows.map(mapAdmin);
}

export async function updateGuestReviewStatus(
  id: string,
  status: GuestReviewStatus,
  moderatedBy: string,
): Promise<AdminGuestReview | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await reviews();
  const updated = await col.findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: {
        status,
        moderatedAt: new Date(),
        moderatedBy,
      },
    },
    { returnDocument: 'after' },
  );
  return updated ? mapAdmin(updated) : null;
}

export function guestReviewsToCsv(rows: AdminGuestReview[]): string {
  const headers = [
    'id',
    'status',
    'packageKind',
    'packageId',
    'packageTitle',
    'packageHref',
    'name',
    'email',
    'rating',
    'text',
    'avatarUrl',
    'photoUrls',
    'createdAt',
    'moderatedAt',
    'moderatedBy',
  ];

  const escape = (value: unknown) => {
    const raw = value == null ? '' : String(value);
    if (/[",\n\r]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
    return raw;
  };

  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(
      [
        row.id,
        row.status,
        row.packageKind,
        row.packageId,
        row.packageTitle,
        row.packageHref,
        row.name,
        row.email,
        row.rating,
        row.text,
        row.avatarUrl ?? '',
        row.photoUrls.join(' | '),
        row.createdAt,
        row.moderatedAt ?? '',
        row.moderatedBy ?? '',
      ]
        .map(escape)
        .join(','),
    );
  }
  return lines.join('\n');
}
