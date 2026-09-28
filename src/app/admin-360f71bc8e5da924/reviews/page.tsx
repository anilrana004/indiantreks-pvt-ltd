'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Star, X } from 'lucide-react';
import {
  adminGuestReviewsExportUrl,
  fetchAdminGuestReviews,
  patchGuestReviewStatus,
  type AdminGuestReviewRow,
} from '@/lib/admin/operations-api';
import AdminDbUnavailable, { AdminLoading } from '@/components/admin/AdminDbState';
import AdminBadge from '@/components/admin/ui/AdminBadge';
import AdminButton from '@/components/admin/ui/AdminButton';
import AdminCard from '@/components/admin/ui/AdminCard';
import AdminEmptyState from '@/components/admin/ui/AdminEmptyState';
import AdminPageHeader from '@/components/admin/ui/AdminPageHeader';
import AdminSearchInput from '@/components/admin/ui/AdminSearchInput';
import { AdminTableHead, AdminTd, AdminTh, AdminTr, AdminTableWrap } from '@/components/admin/ui/AdminTable';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

function statusBadge(status: AdminGuestReviewRow['status']) {
  if (status === 'approved') return 'success' as const;
  if (status === 'rejected') return 'danger' as const;
  return 'warning' as const;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminGuestReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbUnavailable, setDbUnavailable] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [selected, setSelected] = useState<AdminGuestReviewRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setDbUnavailable(false);
    try {
      setReviews(
        await fetchAdminGuestReviews({
          status: status === 'all' ? undefined : status,
          q: search.trim() || undefined,
        }),
      );
    } catch {
      setDbUnavailable(true);
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const t = setTimeout(() => {
      void load();
    }, 200);
    return () => clearTimeout(t);
  }, [load]);

  const pendingCount = useMemo(
    () => reviews.filter((r) => r.status === 'pending').length,
    [reviews],
  );

  const setReviewStatus = async (
    review: AdminGuestReviewRow,
    next: AdminGuestReviewRow['status'],
  ) => {
    setBusyId(review.id);
    try {
      const updated = await patchGuestReviewStatus(review.id, next);
      setReviews((list) => list.map((r) => (r.id === updated.id ? updated : r)));
      setSelected(updated);
    } finally {
      setBusyId(null);
    }
  };

  const download = (format: 'csv' | 'json-download') => {
    const url = adminGuestReviewsExportUrl(format, {
      status: status === 'all' ? undefined : status,
      q: search.trim() || undefined,
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading && reviews.length === 0) return <AdminLoading label="Loading guest reviews…" />;
  if (dbUnavailable) {
    return <AdminDbUnavailable onRetry={load} />;
  }

  return (
    <div>
      <AdminPageHeader
        breadcrumb="Operations"
        title="Guest reviews"
        description={`${reviews.length} reviews · ${pendingCount} pending moderation`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <AdminSearchInput
              placeholder="Search name, email, trek…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              wrapperClassName="w-48 lg:w-64"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm"
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <AdminButton type="button" variant="secondary" icon={<Download className="h-4 w-4" />} onClick={() => download('csv')}>
              CSV
            </AdminButton>
            <AdminButton type="button" variant="secondary" icon={<Download className="h-4 w-4" />} onClick={() => download('json-download')}>
              JSON
            </AdminButton>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AdminCard padding={false} className={`${selected ? 'hidden lg:block' : ''} lg:col-span-2`}>
          {reviews.length === 0 ? (
            <AdminEmptyState icon={Star} title="No guest reviews yet" />
          ) : (
            <AdminTableWrap>
              <AdminTableHead>
                <AdminTh>Customer</AdminTh>
                <AdminTh>Package</AdminTh>
                <AdminTh>Rating</AdminTh>
                <AdminTh>Status</AdminTh>
                <AdminTh>Date</AdminTh>
              </AdminTableHead>
              <tbody>
                {reviews.map((row) => (
                  <AdminTr
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => setSelected(row)}
                  >
                    <AdminTd className="font-medium text-slate-800">
                      <div className="flex flex-col">
                        <span>{row.name}</span>
                        <span className="text-xs font-normal text-slate-500">{row.email}</span>
                      </div>
                    </AdminTd>
                    <AdminTd className="text-slate-600">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800">{row.packageTitle}</span>
                        <span className="text-xs uppercase tracking-wide text-slate-400">
                          {row.packageKind}
                        </span>
                      </div>
                    </AdminTd>
                    <AdminTd className="text-amber-600">{row.rating}/5</AdminTd>
                    <AdminTd>
                      <AdminBadge variant={statusBadge(row.status)}>{row.status}</AdminBadge>
                    </AdminTd>
                    <AdminTd className="text-xs text-slate-500">
                      {new Date(row.createdAt).toLocaleString()}
                    </AdminTd>
                  </AdminTr>
                ))}
              </tbody>
            </AdminTableWrap>
          )}
        </AdminCard>

        {selected ? (
          <AdminCard className="lg:col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Review detail</h3>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="mb-0.5 block text-xs text-slate-500">Customer</span>
                <span className="font-medium text-slate-800">{selected.name}</span>
              </div>
              <div>
                <span className="mb-0.5 block text-xs text-slate-500">Email</span>
                <a href={`mailto:${selected.email}`} className="font-medium text-emerald-700 hover:underline">
                  {selected.email}
                </a>
              </div>
              <div>
                <span className="mb-0.5 block text-xs text-slate-500">Package</span>
                <a
                  href={selected.packageHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-emerald-700 hover:underline"
                >
                  {selected.packageTitle}
                </a>
                <span className="mt-0.5 block text-xs uppercase tracking-wide text-slate-400">
                  {selected.packageKind} · {selected.packageId}
                </span>
              </div>
              <div>
                <span className="mb-0.5 block text-xs text-slate-500">Rating</span>
                <span className="font-medium text-slate-800">{selected.rating} / 5</span>
              </div>
              <div>
                <span className="mb-0.5 block text-xs text-slate-500">Submitted</span>
                <span className="font-medium text-slate-800">
                  {new Date(selected.createdAt).toLocaleString()}
                </span>
              </div>
              <hr className="border-slate-100" />
              <div>
                <span className="mb-1 block text-xs text-slate-500">Review</span>
                <p className="whitespace-pre-wrap leading-relaxed text-slate-700">{selected.text}</p>
              </div>

              {selected.avatarUrl ? (
                <div>
                  <span className="mb-1 block text-xs text-slate-500">Profile photo</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selected.avatarUrl}
                    alt=""
                    className="h-16 w-16 rounded-full object-cover ring-1 ring-slate-200"
                  />
                </div>
              ) : null}

              {selected.photoUrls.length > 0 ? (
                <div>
                  <span className="mb-1 block text-xs text-slate-500">Memory photos</span>
                  <div className="grid grid-cols-2 gap-2">
                    {selected.photoUrls.map((url) => (
                      <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt=""
                          className="aspect-square w-full rounded-lg object-cover ring-1 ring-slate-200"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2 pt-2">
                <AdminButton
                  type="button"
                  variant="primary"
                  disabled={busyId === selected.id || selected.status === 'approved'}
                  onClick={() => setReviewStatus(selected, 'approved')}
                >
                  Approve
                </AdminButton>
                <AdminButton
                  type="button"
                  variant="danger"
                  disabled={busyId === selected.id || selected.status === 'rejected'}
                  onClick={() => setReviewStatus(selected, 'rejected')}
                >
                  Reject
                </AdminButton>
                <AdminButton
                  type="button"
                  variant="secondary"
                  disabled={busyId === selected.id || selected.status === 'pending'}
                  onClick={() => setReviewStatus(selected, 'pending')}
                >
                  Mark pending
                </AdminButton>
              </div>
            </div>
          </AdminCard>
        ) : null}
      </div>
    </div>
  );
}
