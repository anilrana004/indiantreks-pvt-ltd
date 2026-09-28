'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, Users as UsersIcon, X } from 'lucide-react';
import {
  adminUsersExportUrl,
  fetchAdminUsers,
} from '@/lib/admin/operations-api';
import type { SiteUser } from '@/lib/operations/types';
import AdminDbUnavailable, { AdminLoading } from '@/components/admin/AdminDbState';
import AdminBadge from '@/components/admin/ui/AdminBadge';
import AdminButton from '@/components/admin/ui/AdminButton';
import AdminCard from '@/components/admin/ui/AdminCard';
import AdminEmptyState from '@/components/admin/ui/AdminEmptyState';
import AdminPageHeader from '@/components/admin/ui/AdminPageHeader';
import AdminSearchInput from '@/components/admin/ui/AdminSearchInput';
import { AdminTableHead, AdminTd, AdminTh, AdminTr, AdminTableWrap } from '@/components/admin/ui/AdminTable';

function formatPhone(user: SiteUser) {
  if (!user.phone) return '—';
  const code = user.phoneCountryCode?.trim();
  return code ? `${code} ${user.phone}` : user.phone;
}

function formatWhen(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value.slice(0, 10);
  return d.toLocaleString();
}

export default function AdminUsers() {
  const [users, setUsers] = useState<SiteUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbUnavailable, setDbUnavailable] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SiteUser | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setDbUnavailable(false);
    try {
      setUsers(await fetchAdminUsers({ q: search.trim() || undefined }));
    } catch {
      setDbUnavailable(true);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => {
      void load();
    }, 200);
    return () => clearTimeout(t);
  }, [load]);

  const download = (format: 'csv' | 'json-download') => {
    window.open(
      adminUsersExportUrl(format, { q: search.trim() || undefined }),
      '_blank',
      'noopener,noreferrer',
    );
  };

  if (loading && users.length === 0) return <AdminLoading label="Loading users…" />;
  if (dbUnavailable) return <AdminDbUnavailable onRetry={load} />;

  return (
    <div>
      <AdminPageHeader
        breadcrumb="Operations"
        title="Customer logins"
        description={`${users.length} registered accounts · download for follow-ups`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <AdminSearchInput
              placeholder="Search name, email, phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              wrapperClassName="w-48 lg:w-64"
            />
            <AdminButton
              type="button"
              variant="secondary"
              icon={<Download className="h-4 w-4" />}
              onClick={() => download('csv')}
            >
              CSV
            </AdminButton>
            <AdminButton
              type="button"
              variant="secondary"
              icon={<Download className="h-4 w-4" />}
              onClick={() => download('json-download')}
            >
              JSON
            </AdminButton>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AdminCard padding={false} className={`${selected ? 'hidden lg:block' : ''} lg:col-span-2`}>
          {users.length === 0 ? (
            <AdminEmptyState icon={UsersIcon} title="No customer accounts yet" />
          ) : (
            <AdminTableWrap>
              <AdminTableHead>
                <AdminTh>Customer</AdminTh>
                <AdminTh>Phone</AdminTh>
                <AdminTh>Login</AdminTh>
                <AdminTh>Last login</AdminTh>
                <AdminTh>Joined</AdminTh>
              </AdminTableHead>
              <tbody>
                {users.map((u) => (
                  <AdminTr key={u.id} className="cursor-pointer" onClick={() => setSelected(u)}>
                    <AdminTd className="font-medium text-slate-800">
                      <div className="flex flex-col">
                        <span>{u.name}</span>
                        <span className="text-xs font-normal text-slate-500">{u.email}</span>
                      </div>
                    </AdminTd>
                    <AdminTd className="text-slate-600">{formatPhone(u)}</AdminTd>
                    <AdminTd>
                      <AdminBadge variant={u.authProvider === 'google' ? 'info' : 'neutral'}>
                        {u.authProvider}
                      </AdminBadge>
                    </AdminTd>
                    <AdminTd className="text-xs text-slate-500">{formatWhen(u.lastLoginAt)}</AdminTd>
                    <AdminTd className="text-xs text-slate-500">{formatWhen(u.createdAt)}</AdminTd>
                  </AdminTr>
                ))}
              </tbody>
            </AdminTableWrap>
          )}
        </AdminCard>

        {selected ? (
          <AdminCard className="lg:col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Customer detail</h3>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              {selected.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selected.avatarUrl}
                  alt=""
                  className="h-14 w-14 rounded-full object-cover ring-1 ring-slate-200"
                />
              ) : null}
              <div>
                <span className="mb-0.5 block text-xs text-slate-500">Name</span>
                <span className="font-medium text-slate-800">{selected.name}</span>
              </div>
              <div>
                <span className="mb-0.5 block text-xs text-slate-500">Email</span>
                <a
                  href={`mailto:${selected.email}`}
                  className="font-medium text-emerald-700 hover:underline"
                >
                  {selected.email}
                </a>
              </div>
              <div>
                <span className="mb-0.5 block text-xs text-slate-500">Phone</span>
                <span className="font-medium text-slate-800">{formatPhone(selected)}</span>
              </div>
              <div>
                <span className="mb-0.5 block text-xs text-slate-500">Date of birth</span>
                <span className="font-medium text-slate-800">{selected.dateOfBirth || '—'}</span>
              </div>
              <div>
                <span className="mb-0.5 block text-xs text-slate-500">Gender</span>
                <span className="font-medium text-slate-800">{selected.gender || '—'}</span>
              </div>
              <div>
                <span className="mb-0.5 block text-xs text-slate-500">Nationality</span>
                <span className="font-medium text-slate-800">{selected.nationality || '—'}</span>
              </div>
              <div>
                <span className="mb-0.5 block text-xs text-slate-500">Login method</span>
                <span className="font-medium text-slate-800">{selected.authProvider}</span>
              </div>
              <div>
                <span className="mb-0.5 block text-xs text-slate-500">Email verified</span>
                <span className="font-medium text-slate-800">
                  {selected.emailVerified ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="mb-0.5 block text-xs text-slate-500">Bookings</span>
                <span className="font-medium text-slate-800">{selected.bookings}</span>
              </div>
              <div>
                <span className="mb-0.5 block text-xs text-slate-500">Last login</span>
                <span className="font-medium text-slate-800">{formatWhen(selected.lastLoginAt)}</span>
              </div>
              <div>
                <span className="mb-0.5 block text-xs text-slate-500">Joined</span>
                <span className="font-medium text-slate-800">{formatWhen(selected.createdAt)}</span>
              </div>
            </div>
          </AdminCard>
        ) : null}
      </div>
    </div>
  );
}
