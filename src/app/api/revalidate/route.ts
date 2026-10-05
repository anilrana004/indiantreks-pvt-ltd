import { NextRequest, NextResponse } from 'next/server';
import { ENTITY_TYPES } from '@/lib/knowledge/config';
import { revalidatePublishedPostSurfaces } from '@/lib/knowledge/revalidation';
import type { EntityLink, EntityType, PostSection } from '@/lib/knowledge/types';
import { timingSafeEqualString } from '@/lib/security/timing';

type RevalidatePayload = {
  slug?: string;
  section?: string;
  primaryEntityType?: string | null;
  primaryEntityId?: string | null;
  entityLinks?: EntityLink[];
};

function parseEntityType(value: unknown): EntityType | null {
  if (typeof value !== 'string') return null;
  return ENTITY_TYPES.includes(value as EntityType) ? (value as EntityType) : null;
}

export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: 'Revalidation not configured' }, { status: 503 });
  }

  const auth = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') || '';
  if (!auth || !timingSafeEqualString(auth, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: RevalidatePayload;
  try {
    body = (await req.json()) as RevalidatePayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
  if (!slug) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 });
  }

  const section = (typeof body.section === 'string' ? body.section : 'blog') as PostSection;

  revalidatePublishedPostSurfaces({
    slug,
    section,
    primaryEntityType: parseEntityType(body.primaryEntityType),
    primaryEntityId: body.primaryEntityId ?? null,
    entityLinks: Array.isArray(body.entityLinks) ? body.entityLinks : undefined,
  });

  return NextResponse.json({ revalidated: true, slug, section });
}
