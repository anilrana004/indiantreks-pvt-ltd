'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalendarCheck } from 'lucide-react';
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

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbUnavailable, setDbUnavailable] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setDbUnavailable(false);
    try {
      setBookings(await fetchAdminBookings());
    } catch {
      setDbUnavailable(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = bookings.filter(
    (book) =>
      book.name.toLowerCase().includes(search.toLowerCase()) ||
      book.trekTitle.toLowerCase().includes(search.toLowerCase()) ||
      book.phone.includes(search),
  );

  const updateStatus = async (id: string, status: BookingStatus) => {
    try {
      await patchBookingStatus(id, status);
      await load();
    } catch {
      /* keep list as-is */
    }
  };

  if (loading) return <AdminLoading label="Loading bookings…" />;
  if (dbUnavailable) return <AdminDbUnavailable onRetry={load} />;

  return (
    <div>
      <AdminPageHeader
        breadcrumb="Operations"
        title="Bookings"
        description={`${bookings.length} total reservations`}
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
        {filtered.length === 0 ? (
          <AdminEmptyState icon={CalendarCheck} title="No bookings found" description="New reservations from the storefront will appear here." />
        ) : (
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
              {filtered.map((book) => (
                <AdminTr key={book.id}>
                  <AdminTd>
                    <p className="font-medium text-slate-800">{book.name}</p>
                    <p className="text-xs text-slate-400">{book.phone}</p>
                    {book.referenceCode ? (
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">{book.referenceCode}</p>
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
                      {book.status === 'pending' || book.status === 'pending_payment' || book.status === 'payment_failed' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => updateStatus(book.id, 'confirmed')}
                            className="rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                          >
                            Confirm
                          </button>
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
        )}
      </AdminCard>
    </div>
  );
}
