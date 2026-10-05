/** Image magic-byte + folder sanitization for user/admin uploads. */

const IMAGE_SIGNATURES: Array<{ mime: string; bytes: number[] }> = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF….WEBP checked below
];

const ALLOWED_UPLOAD_FOLDERS = new Set([
  'indiantreks/blog',
  'indiantreks/reviews',
  'indiantreks/media',
  'indiantreks/gallery',
]);

export function sanitizeUploadFolder(raw: string, fallback = 'indiantreks/blog'): string {
  const cleaned = raw
    .trim()
    .replace(/\\/g, '/')
    .replace(/\.\./g, '')
    .replace(/[^a-zA-Z0-9/_-]/g, '')
    .replace(/\/+/g, '/')
    .replace(/^\/+|\/+$/g, '')
    .slice(0, 120);

  if (!cleaned) return fallback;

  // Allow known roots or reviews/<packageId>
  if (ALLOWED_UPLOAD_FOLDERS.has(cleaned)) return cleaned;
  if (cleaned.startsWith('indiantreks/reviews/')) {
    const rest = cleaned.slice('indiantreks/reviews/'.length);
    if (/^[a-zA-Z0-9_-]{1,80}$/.test(rest)) return cleaned;
  }
  if (cleaned.startsWith('indiantreks/blog/') || cleaned.startsWith('indiantreks/media/')) {
    return cleaned.slice(0, 120);
  }
  return fallback;
}

function matchesSignature(buf: Uint8Array, sig: number[]): boolean {
  if (buf.length < sig.length) return false;
  return sig.every((b, i) => buf[i] === b);
}

function detectImageMime(buf: Uint8Array): string | null {
  for (const { mime, bytes } of IMAGE_SIGNATURES) {
    if (!matchesSignature(buf, bytes)) continue;
    if (mime === 'image/webp') {
      // RIFF....WEBP
      if (buf.length < 12) return null;
      const tag = String.fromCharCode(buf[8]!, buf[9]!, buf[10]!, buf[11]!);
      if (tag !== 'WEBP') return null;
    }
    return mime;
  }
  return null;
}

export type SafeImageCheck = {
  ok: true;
  mime: string;
  bytes: Uint8Array;
};

/**
 * Reject polyglot / non-image uploads that spoof Content-Type.
 * Call before forwarding bytes to Cloudinary.
 */
export async function assertSafeImageFile(
  file: File,
  maxBytes: number,
): Promise<SafeImageCheck> {
  if (!(file instanceof File) || file.size <= 0) {
    throw new Error('A valid image file is required.');
  }
  if (file.size > maxBytes) {
    throw new Error(`Image must be ${Math.floor(maxBytes / 1024)} KB or smaller.`);
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image uploads are supported.');
  }

  const buf = new Uint8Array(await file.arrayBuffer());
  const mime = detectImageMime(buf);
  if (!mime) {
    throw new Error('File content is not a recognized image (JPEG, PNG, GIF, or WebP).');
  }

  // Declared type can be wrong; trust magic bytes for safety.
  return { ok: true, mime, bytes: buf };
}

/** Safe relative href for review packages — blocks javascript:/external open redirects. */
export function sanitizePackageHref(raw: string, fallback: string): string {
  const value = (raw || '').trim();
  if (!value.startsWith('/')) return fallback;
  if (value.startsWith('//')) return fallback;
  if (/[\s<>"'`]/.test(value)) return fallback;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) return fallback;
  return value.slice(0, 200);
}
