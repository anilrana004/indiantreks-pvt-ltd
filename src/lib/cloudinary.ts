import { getCloudinaryCloudName } from '@/lib/env/cloudinary-env';

export type CldCrop = 'fill' | 'fit' | 'scale' | 'pad' | 'thumb';

export interface CldOptions {
  w?: number;
  h?: number;
  crop?: CldCrop;
  quality?: number | 'auto';
  gravity?: 'auto' | 'center' | 'face';
  /** Pad background — e.g. "rgb:eef2f6" or "auto" (edge-aware). Used with crop: "pad". */
  background?: string;
}

export type BlogImageRole = 'featured' | 'inline' | 'break' | 'card' | 'thumb';

const BLOG_PRESETS: Record<BlogImageRole, CldOptions> = {
  featured: { w: 1600, h: 900, crop: 'fill', quality: 'auto', gravity: 'auto' },
  inline: { w: 960, h: 640, crop: 'fill', quality: 'auto', gravity: 'auto' },
  break: { w: 1280, h: 640, crop: 'fill', quality: 'auto', gravity: 'auto' },
  card: { w: 600, h: 400, crop: 'fill', quality: 'auto', gravity: 'auto' },
  thumb: { w: 320, h: 200, crop: 'fill', quality: 'auto', gravity: 'auto' },
};

export function cloudinaryCloudName(): string {
  return getCloudinaryCloudName();
}

function uploadBase(): string {
  return `https://res.cloudinary.com/${getCloudinaryCloudName()}/image/upload`;
}

function fetchBase(): string {
  return `https://res.cloudinary.com/${getCloudinaryCloudName()}/image/fetch`;
}

/** Build a Cloudinary upload URL from a versioned asset path (e.g. v1234/photo.jpg). */
export function cloudinaryAssetUrl(assetPath: string, opts?: CldOptions): string {
  const path = assetPath.replace(/^\//, '');
  return `${uploadBase()}/${buildTransformSegment(opts)}/${path}`;
}

/** Normalize stored Cloudinary URLs to the configured account. */
export function normalizeCloudinaryCloud(url: string): string {
  const cloud = getCloudinaryCloudName();
  return url.replace(/res\.cloudinary\.com\/[^/]+\/image\//i, `res.cloudinary.com/${cloud}/image/`);
}

export function isCloudinaryUrl(src: string): boolean {
  return /res\.cloudinary\.com\/[^/]+\/image\//i.test(src.trim());
}

/**
 * Non-destructive: prepend f_auto,q_auto on Cloudinary upload/fetch URLs when missing.
 * Does not replace existing crop/size transforms (avoids visual crop shifts).
 */
export function ensureCldAuto(src: string): string {
  const trimmed = normalizeCloudinaryCloud(src.trim());
  if (!trimmed || !isCloudinaryUrl(trimmed)) return trimmed;
  if (/(?:^|[,/])f_auto(?:$|[,/])/.test(trimmed) && /(?:^|[,/])q_auto(?:$|[,/])/.test(trimmed)) {
    return trimmed;
  }
  return trimmed.replace(/\/image\/(upload|fetch)\//i, '/image/$1/f_auto,q_auto/');
}

/** Tiny neutral JPEG for next/image `placeholder="blur"` on gallery/card surfaces. */
export const STOREFRONT_BLUR_DATA_URL =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGcP//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//Z';

function buildTransformSegment(opts?: CldOptions): string {
  // f_auto → AVIF/WebP by browser; q_auto → perceptually tuned compression.
  const params: string[] = ['f_auto'];
  if (opts?.quality === 'auto' || opts?.quality === undefined) {
    params.push('q_auto');
  } else {
    params.push(`q_${opts.quality}`);
  }
  if (opts?.w) params.push(`w_${opts.w}`);
  if (opts?.h) params.push(`h_${opts.h}`);
  params.push(`c_${opts?.crop || 'fill'}`);
  params.push(`g_${opts?.gravity || 'auto'}`);
  if (opts?.background) params.push(`b_${opts.background}`);
  return params.join(',');
}

/** Remote or site-relative URL via Cloudinary fetch. */
export function cldUrl(src: string, opts?: CldOptions): string {
  if (!src) return '';
  const trimmed = normalizeCloudinaryCloud(src.trim());
  const fetchBaseUrl = fetchBase();
  if (trimmed.startsWith(fetchBaseUrl)) return trimmed;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? '';
    if (site) return `${fetchBaseUrl}/${buildTransformSegment(opts)}/${encodeURIComponent(`${site}${trimmed}`)}`;
  }
  if (isCloudinaryUrl(trimmed)) return cldOptimize(trimmed, opts);
  return `${fetchBaseUrl}/${buildTransformSegment(opts)}/${encodeURIComponent(trimmed)}`;
}

/** Rebuild an upload/fetch Cloudinary URL with fresh transforms. */
export function cldOptimize(src: string, opts?: CldOptions): string {
  const trimmed = normalizeCloudinaryCloud(src.trim());
  if (!trimmed) return '';

  if (!isCloudinaryUrl(trimmed)) {
    return cldUrl(trimmed, opts);
  }

  const marker = '/image/upload/';
  const idx = trimmed.indexOf(marker);
  if (idx === -1) return trimmed;

  const prefix = trimmed.slice(0, idx + marker.length);
  const suffix = trimmed.slice(idx + marker.length);
  const segments = suffix.split('/');
  const versionIdx = segments.findIndex((part) => /^v\d+$/.test(part));
  const assetPath = versionIdx >= 0 ? segments.slice(versionIdx).join('/') : suffix;

  return `${prefix}${buildTransformSegment(opts)}/${assetPath}`;
}

/** Blog storefront images — featured hero, inline body, section breaks, cards. */
export function cldBlogImage(
  src: string | undefined | null,
  role: BlogImageRole = 'inline',
): string {
  if (!src?.trim()) return '';
  return cldOptimize(src.trim(), BLOG_PRESETS[role]);
}

/** Markdown snippet for an inline article image with optional visible caption. */
export function blogImageMarkdown(url: string, description = ''): string {
  const desc = description.trim();
  const alt = desc || 'Trek photo';
  const safeDesc = desc.replace(/"/g, "'");
  if (safeDesc) {
    return `\n\n![${alt}](${url} "${safeDesc}")\n\n`;
  }
  return `\n\n![${alt}](${url})\n\n`;
}
