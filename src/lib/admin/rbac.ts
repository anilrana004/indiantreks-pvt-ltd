/**
 * Minimal admin RBAC for the single shared admin credential.
 * Set ADMIN_ROLE=SUPER_ADMIN|ADMIN|OPERATIONS|FINANCE|CONTENT_EDITOR|SUPPORT
 * Default: SUPER_ADMIN (full access).
 */

export type AdminRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'OPERATIONS'
  | 'FINANCE'
  | 'CONTENT_EDITOR'
  | 'SUPPORT';

export type AdminPermission =
  | 'bookings.read'
  | 'bookings.write'
  | 'refunds.write'
  | 'packages.write'
  | 'users.read'
  | 'content.write'
  | 'admin.all';

const ROLE_PERMISSIONS: Record<AdminRole, readonly AdminPermission[]> = {
  SUPER_ADMIN: ['admin.all'],
  ADMIN: [
    'bookings.read',
    'bookings.write',
    'refunds.write',
    'packages.write',
    'users.read',
    'content.write',
  ],
  OPERATIONS: ['bookings.read', 'bookings.write', 'users.read'],
  FINANCE: ['bookings.read', 'refunds.write', 'packages.write'],
  CONTENT_EDITOR: ['content.write'],
  SUPPORT: ['bookings.read', 'users.read'],
};

export function resolveAdminRole(): AdminRole {
  const raw = (process.env.ADMIN_ROLE || 'SUPER_ADMIN').trim().toUpperCase();
  if (
    raw === 'SUPER_ADMIN' ||
    raw === 'ADMIN' ||
    raw === 'OPERATIONS' ||
    raw === 'FINANCE' ||
    raw === 'CONTENT_EDITOR' ||
    raw === 'SUPPORT'
  ) {
    return raw;
  }
  return 'SUPER_ADMIN';
}

export function adminHasPermission(role: AdminRole, permission: AdminPermission): boolean {
  const grants = ROLE_PERMISSIONS[role] || [];
  return grants.includes('admin.all') || grants.includes(permission);
}
