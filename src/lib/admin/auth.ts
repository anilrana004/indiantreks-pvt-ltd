import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { unauthorizedResponse, dbUnavailableResponse } from '@/lib/api/responses';
import { ADMIN_PREFIX } from '@/lib/admin/constants';
import { verifyAdminSessionToken } from '@/lib/admin/session';
import {
  adminHasPermission,
  resolveAdminRole,
  type AdminPermission,
  type AdminRole,
} from '@/lib/admin/rbac';

export { ADMIN_PREFIX, unauthorizedResponse, dbUnavailableResponse };

async function verifyToken(token: string | undefined): Promise<boolean> {
  return Boolean(await verifyAdminSessionToken(token));
}

export async function isAdminAuthenticatedFromRequest(request: NextRequest): Promise<boolean> {
  return verifyToken(request.cookies.get('admin_token')?.value);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyToken(cookieStore.get('admin_token')?.value);
}

export async function requireAdmin(): Promise<{
  email: string;
  role: AdminRole;
} | null> {
  const cookieStore = await cookies();
  const session = await verifyAdminSessionToken(cookieStore.get('admin_token')?.value);
  if (!session) return null;
  return {
    email: session.email,
    role: resolveAdminRole(),
  };
}

export async function requireAdminPermission(permission: AdminPermission) {
  const admin = await requireAdmin();
  if (!admin) return { admin: null, forbidden: false as const };
  if (!adminHasPermission(admin.role, permission)) {
    return { admin, forbidden: true as const };
  }
  return { admin, forbidden: false as const };
}

export function forbiddenResponse() {
  return NextResponse.json({ error: 'Forbidden', code: 'RBAC_DENIED' }, { status: 403 });
}
