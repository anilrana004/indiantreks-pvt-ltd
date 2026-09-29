/** Cloudinary account — single source for uploads and storefront delivery. */

const FALLBACK_CLOUD = 'jum1mpl0';

export function getCloudinaryCloudName(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() ||
    process.env.CLOUDINARY_CLOUD_NAME?.trim() ||
    '';

  if (fromEnv) return fromEnv;

  // Production should set an explicit cloud name; keep known storefront cloud as last resort.
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production') {
    console.warn(
      JSON.stringify({
        scope: 'cloudinary',
        event: 'missing_cloud_name_env',
        fallback: FALLBACK_CLOUD,
      }),
    );
  }
  return FALLBACK_CLOUD;
}

export function getCloudinaryApiKey(): string {
  return process.env.CLOUDINARY_API_KEY?.trim() ?? '';
}

export function getCloudinaryApiSecret(): string {
  return process.env.CLOUDINARY_API_SECRET?.trim() ?? '';
}

export function getCloudinaryUploadPreset(): string {
  return (
    process.env.CLOUDINARY_UPLOAD_PRESET?.trim() ||
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim() ||
    ''
  );
}

export function isCloudinaryUploadConfigured(): boolean {
  const preset = getCloudinaryUploadPreset();
  return Boolean(preset || (getCloudinaryApiKey() && getCloudinaryApiSecret()));
}

/** True when delivery can resolve at least a known cloud (env or baked fallback). */
export function isCloudinaryDeliveryConfigured(): boolean {
  return Boolean(getCloudinaryCloudName());
}
