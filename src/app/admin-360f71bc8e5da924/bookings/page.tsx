'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalendarCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  fetchAdminBookings,
  patchBookingStatus,
} from '@/lib/admin/operations-api';
import type { Booking, BookingStatus } from '@/lib/operations/types';
import AdminDbUnavailable, { AdminLoading } from '@/components/admin/AdminDbState';
import AdminBadge, { statusToBadge } from '@/components/admin/ui/AdminBadge';
import AdminCard from '@/components/admin/ui/AdminCard';
import AdminEmptyState from '@/components/admin/ui/AdminEmptyState';
import AdminPageHeader from '@/components/admin/ui/AdminPageHeader';
import AdminSearchInput from '@/components/admin/ui/AdminSearchInput';
import { AdminTableHead, AdminTd, AdminTh, AdminTr, AdminTableWrap } from '@/components/admin/ui/AdminTable';

const PAGE_SIZE = 25;

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [dbUnavailable, setDbUnavailable] = useState(false);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setDbUnavailable(false);
    try {
      const result = await fetchAdminBookings({
        page,
        pageSize: PAGE_SIZE,
        q: query,
      });
      setBookings(result.bookings);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setPage(result.page);
    } catch {
      setDbUnavailable(true);
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setPage(1);
      setQuery(search.trim());
    }, 300);
    return () => window.clearTimeout(t);
  }, [search]);

  const updateStatus = async (id: string, status: BookingStatus) => {
    try {
      await patchBookingStatus(id, status);
      await load();
    } catch {
      /* keep list as-is */
    }
  };

  if (loading && bookings.length === 0) return <AdminLoading label="Loading bookings…" />;
  if (dbUnavailable) return <AdminDbUnavailable onRetry={load} />;

  return (
    <div>
      <AdminPageHeader
        breadcrumb="Operations"
        title="Bookings"
        description={`${total} total reservations`}
        actions={
          <AdminSearchInput
            placeholder="Search name, trek, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            wrapperClassName="w-48 lg:w-72"
          />
        }
      />

      <AdminCard padding={false}>
        {bookings.length === 0 ? (
          <AdminEmptyState icon={CalendarCheck} title="No bookings found" description="New reservations from the storefront will appear here." />
        ) : (
          <>
            <AdminTableWrap>
              <AdminTableHead>
                <AdminTh>Customer</AdminTh>
                <AdminTh>Trek</AdminTh>
                <AdminTh>Package</AdminTh>
                <AdminTh>Persons</AdminTh>
                <AdminTh>Date</AdminTh>
                <AdminTh>Amount</AdminTh>
                <AdminTh>Pay</AdminTh>
                <AdminTh>Status</AdminTh>
                <AdminTh>Actions</AdminTh>
              </AdminTableHead>
              <tbody>
                {bookings.map((book) => (
                  <AdminTr key={book.id}>
                    <AdminTd>
                      <p className="font-medium text-slate-800">{book.name}</p>
                      <p className="text-xs text-slate-400">{book.phone}</p>
                      {book.referenceCode ? (
                        <p className="mt-0.5 font-mono text-[10px] text-slate-400">{book.referenceCode}</p>
                      ) : null}
                    </AdminTd>
                    <AdminTd className="text-slate-600">{book.trekTitle}</AdminTd>
                    <AdminTd>
                      <span className="text-xs font-semibold text-emerald-700">{book.package}</span>
                    </AdminTd>
                    <AdminTd className="text-slate-600">{book.persons}</AdminTd>
                    <AdminTd className="text-slate-600">{book.date}</AdminTd>
                    <AdminTd className="font-semibold tabular-nums">₹{book.amount.toLocaleString()}</AdminTd>
                    <AdminTd>
                      <AdminBadge variant={statusToBadge(book.paymentStatus || 'unpaid')} dot>
                        {book.paymentStatus || 'unpaid'}
                      </AdminBadge>
                    </AdminTd>
                    <AdminTd>
                      <AdminBadge variant={statusToBadge(book.status)} dot>
                        {book.status}
                      </AdminBadge>
                    </AdminTd>
                    <AdminTd>
                      <div className="flex flex-wrap gap-1">
                        {book.status === 'pending' ||
                        book.status === 'pending_payment' ||
                        book.status === 'payment_failed' ? (
                          <>
                            {book.paymentStatus === 'paid' ? (
                              <button
                                type="button"
                                onClick={() => updateStatus(book.id, 'confirmed')}
                                className="rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                              >
                                Confirm
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => updateStatus(book.id, 'cancelled')}
                              className="rounded-md bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                            >
                              Cancel
                            </button>
                          </>
                        ) : null}
                        {book.status === 'confirmed' ? (
                          <button
                            type="button"
                            onClick={() => updateStatus(book.id, 'completed')}
                            className="rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                          >
                            Complete
                          </button>
                        ) : null}
                      </div>
                    </AdminTd>
                  </AdminTr>
                ))}
              </tbody>
            </AdminTableWrap>

            <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
              <p className="text-xs text-slate-500">
                Page {page} of {totalPages}
                {loading ? ' · refreshing…' : ''}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </AdminCard>
    </div>
  );
}
