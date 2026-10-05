import { NextResponse } from 'next/server';
import {
  forbiddenResponse,
  requireAdminPermission,
  unauthorizedResponse,
} from '@/lib/admin/auth';
import { dbUnavailableResponse } from '@/lib/api/responses';
import { isDbConfigured } from '@/lib/db';
import { removeSubscriber } from '@/lib/operations/service';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const gate = await requireAdminPermission('users.read');
  if (!gate.admin) return unauthorizedResponse();
  if (gate.forbidden) return forbiddenResponse();
  if (!isDbConfigured()) return dbUnavailableResponse();

  const { id } = await params;
  const ok = await removeSubscriber(id);

  if (!ok) return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
