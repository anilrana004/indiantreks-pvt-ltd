import { NextRequest, NextResponse } from 'next/server';
import { isCloudinaryUploadConfigured, uploadToCloudinary } from '@/lib/cloudinary-server';
import { clientIp, consumePaymentRateLimit } from '@/lib/payments/rate-limit';
import { rateLimitedResponse } from '@/lib/security/rate-limit';
import {
  assertSafeImageFile,
  sanitizePackageHref,
  sanitizeUploadFolder,
} from '@/lib/security/uploads';
import {
  createGuestReview,
  hashReviewIp,
  isMongoConfigured,
  listApprovedReviewsForPackage,
} from '@/lib/reviews/service';
import type { PackageKind } from '@/lib/reviews/types';
import { PACKAGE_REVIEW_LIMITS } from '@/lib/package-reviews';

const KINDS = new Set<PackageKind>(['trek', 'yatra', 'trip']);
const MAX_IMAGE_BYTES = PACKAGE_REVIEW_LIMITS.maxImageBytes;
const MAX_PHOTOS = PACKAGE_REVIEW_LIMITS.maxPhotos;
const MAX_NAME = 80;
const MAX_TEXT = 4000;
const MAX_PACKAGE_ID = 80;

function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function uploadReviewImage(file: File, folder: string) {
  await assertSafeImageFile(file, MAX_IMAGE_BYTES);
  return uploadToCloudinary(file, folder);
}

export async function GET(req: NextRequest) {
  try {
    if (!isMongoConfigured()) {
      return NextResponse.json({ reviews: [], source: 'unconfigured' });
    }
    const packageId = req.nextUrl.searchParams.get('packageId')?.trim() ?? '';
    if (!packageId) return badRequest('packageId is required.');
    if (packageId.length > MAX_PACKAGE_ID || !/^[a-zA-Z0-9_-]+$/.test(packageId)) {
      return badRequest('Invalid packageId.');
    }
    // Public list — emails never included (mapPublic strips them).
    const reviews = await listApprovedReviewsForPackage(packageId);
    return NextResponse.json({ reviews });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load reviews.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const limited = await consumePaymentRateLimit('package.reviews', ip, 8, 60_000);
    if (!limited.allowed) {
      return rateLimitedResponse(limited.retryAfterSec);
    }

    if (!isMongoConfigured()) {
      return NextResponse.json(
        {
          error:
            'Review storage is not configured. Add MONGODB_URI to the server environment.',
        },
        { status: 503 },
      );
    }

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return badRequest('Send multipart/form-data with review fields and optional images.');
    }

    const form = await req.formData();
    const name = String(form.get('name') || '').trim().slice(0, MAX_NAME);
    const email = String(form.get('email') || '').trim().toLowerCase().slice(0, 254);
    const text = String(form.get('text') || '').trim().slice(0, MAX_TEXT);
    const packageId = String(form.get('packageId') || '').trim().slice(0, MAX_PACKAGE_ID);
    const packageTitle = String(form.get('packageTitle') || '').trim().slice(0, 160);
    const packageHrefRaw = String(form.get('packageHref') || '').trim();
    const packageKindRaw = String(form.get('packageKind') || 'trek').trim() as PackageKind;
    const rating = Number(form.get('rating') || 0);

    if (!name || !email || !text || !packageId) {
      return badRequest('Name, email, review text, and package are required.');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(packageId)) {
      return badRequest('Invalid packageId.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return badRequest('Please enter a valid email address.');
    }
    if (text.length < PACKAGE_REVIEW_LIMITS.minTextLength) {
      return badRequest('Review text must be at least 40 characters.');
    }
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return badRequest('Rating must be between 1 and 5.');
    }
    if (!KINDS.has(packageKindRaw)) {
      return badRequest('packageKind must be trek, yatra, or trip.');
    }

    const fallbackHref = `/${packageKindRaw === 'yatra' ? 'yatra' : packageKindRaw === 'trip' ? 'trips' : 'treks'}/${packageId}`;
    const packageHref = sanitizePackageHref(packageHrefRaw, fallbackHref);

    const avatarFile = form.get('avatar');
    const photoFiles = form
      .getAll('photos')
      .filter((item): item is File => item instanceof File && item.size > 0)
      .slice(0, MAX_PHOTOS);

    let avatarUrl: string | null = null;
    let avatarPublicId: string | null = null;
    const photoUrls: string[] = [];
    const photoPublicIds: string[] = [];

    const hasImages =
      (avatarFile instanceof File && avatarFile.size > 0) || photoFiles.length > 0;

    if (hasImages && !isCloudinaryUploadConfigured()) {
      return NextResponse.json(
        {
          error:
            'Image upload is not configured. Add Cloudinary credentials, or submit without photos.',
        },
        { status: 503 },
      );
    }

    const folder = sanitizeUploadFolder(`indiantreks/reviews/${packageId}`, 'indiantreks/reviews');

    if (avatarFile instanceof File && avatarFile.size > 0) {
      const uploaded = await uploadReviewImage(avatarFile, folder);
      avatarUrl = uploaded.secureUrl;
      avatarPublicId = uploaded.publicId;
    }

    for (const photo of photoFiles) {
      const uploaded = await uploadReviewImage(photo, folder);
      photoUrls.push(uploaded.secureUrl);
      photoPublicIds.push(uploaded.publicId);
    }

    // createGuestReview returns PublicGuestReview (no email).
    const review = await createGuestReview({
      packageId,
      packageTitle: packageTitle || packageId,
      packageHref,
      packageKind: packageKindRaw,
      name,
      email,
      rating,
      text,
      avatarUrl,
      photoUrls,
      avatarPublicId,
      photoPublicIds,
      userAgent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
      ipHash: hashReviewIp(ip),
    });

    return NextResponse.json(
      {
        ok: true,
        review,
        moderated: false,
        message: 'Review saved. It will appear after team moderation.',
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save review right now.';
    const status =
      /image|Image|KB|recognized|required|supported/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
