import { NextRequest, NextResponse } from 'next/server';
import {
  forbiddenResponse,
  requireAdminPermission,
  unauthorizedResponse,
} from '@/lib/admin/auth';
import { cldBlogImage } from '@/lib/cloudinary';
import { isCloudinaryUploadConfigured, uploadToCloudinary } from '@/lib/cloudinary-server';
import { assertSafeImageFile, sanitizeUploadFolder } from '@/lib/security/uploads';

const MAX_ADMIN_IMAGE_BYTES = 8 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const gate = await requireAdminPermission('content.write');
  if (!gate.admin) return unauthorizedResponse();
  if (gate.forbidden) return forbiddenResponse();

  if (!isCloudinaryUploadConfigured()) {
    return NextResponse.json(
      {
        error:
          'Cloudinary upload is not configured. Add CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, or CLOUDINARY_UPLOAD_PRESET to your environment.',
      },
      { status: 503 },
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const folder = sanitizeUploadFolder(
      String(formData.get('folder') || 'indiantreks/blog'),
      'indiantreks/blog',
    );

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'A valid image file is required.' }, { status: 400 });
    }

    await assertSafeImageFile(file, MAX_ADMIN_IMAGE_BYTES);

    const uploaded = await uploadToCloudinary(file, folder);
    const altBase = file.name.replace(/\.[^.]+$/, '').replace(/-/g, ' ').slice(0, 80);

    return NextResponse.json({
      url: uploaded.secureUrl,
      publicId: uploaded.publicId,
      width: uploaded.width,
      height: uploaded.height,
      featuredUrl: cldBlogImage(uploaded.secureUrl, 'featured'),
      inlineUrl: cldBlogImage(uploaded.secureUrl, 'inline'),
      markdown: `![${altBase}](${uploaded.secureUrl} "${altBase}")`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    const status =
      /image|Image|KB|recognized|required|supported|MB/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
