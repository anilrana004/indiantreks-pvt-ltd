import { NextRequest, NextResponse } from 'next/server';
import {
  forbiddenResponse,
  requireAdminPermission,
  unauthorizedResponse,
} from '@/lib/admin/auth';
import { dbUnavailableResponse } from '@/lib/api/responses';
import { isDbConfigured } from '@/lib/db';
import { listContactsPage } from '@/lib/operations/service';

export async function GET(req: NextRequest) {
  const gate = await requireAdminPermission('users.read');
  if (!gate.admin) return unauthorizedResponse();
  if (gate.forbidden) return forbiddenResponse();
  if (!isDbConfigured()) return dbUnavailableResponse();

  const page = Number(req.nextUrl.searchParams.get('page') || '1');
  const pageSize = Number(req.nextUrl.searchParams.get('pageSize') || '25');
  const q = req.nextUrl.searchParams.get('q') || '';

  const result = await listContactsPage({ page, pageSize, q });
  return NextResponse.json(result);
}
