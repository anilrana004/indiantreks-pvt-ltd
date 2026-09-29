'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Check, Loader, Shield } from 'lucide-react';

type Summary = {
  bookingId: string;
  referenceCode?: string | null;
  trekTitle: string;
  date: string;
  persons: number;
  package: string;
  name: string;
  email: string;
  phone: string;
  amountRupees: number;
  status: string;
  paymentStatus: string;
  razorpayPaymentId?: string | null;
  method?: string | null;
};

function readCheckoutToken(bookingId: string, queryToken: string): string {
  if (queryToken) return queryToken;
  if (!bookingId || typeof window === 'undefined') return '';
  try {
    return sessionStorage.getItem(`it-checkout:${bookingId}`) || '';
  } catch {
    return '';
  }
}

function SuccessContent() {
  const sp = useSearchParams();
  const bookingId = sp.get('bookingId') || '';
  const queryToken = sp.get('token') || '';
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = readCheckoutToken(bookingId, queryToken);
      if (!bookingId || !token) {
        setError('Missing booking reference.');
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}`, {
          credentials: 'include',
          cache: 'no-store',
          headers: { 'X-Checkout-Token': token },
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Unable to load booking');
        if (!cancelled) setSummary(body);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load booking');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingId, queryToken]);

  if (loading) {
    return (
      <div className="pt-28 min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#16a34a]" />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="pt-28 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold mb-2">Booking confirmation pending</h1>
          <p className="text-sm text-gray-500 mb-4">{error || 'We could not load your booking yet. If you paid, your booking will still be confirmed once payment is verified.'}</p>
          <Link href="/treks" className="text-[#16a34a] font-semibold">Browse treks</Link>
        </div>
      </div>
    );
  }

  const confirmed = summary.status === 'confirmed' || summary.paymentStatus === 'paid';

  return (
    <div className="pt-24 pb-16 min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-lg px-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:p-8 text-center">
          <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${confirmed ? 'bg-[#16a34a]/10' : 'bg-amber-50'}`}>
            {confirmed ? <Check className="h-7 w-7 text-[#16a34a]" /> : <Shield className="h-7 w-7 text-amber-600" />}
          </div>
          <h1 className="text-2xl font-bold text-[#000000]">
            {confirmed ? 'Booking confirmed' : 'Payment received — confirming'}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {confirmed
              ? 'Your payment was verified by our servers. Save your booking reference.'
              : 'If checkout succeeded, confirmation may arrive via webhook shortly. Refresh this page in a moment.'}
          </p>

          <div className="mt-6 space-y-2.5 rounded-xl bg-gray-50 p-4 text-left text-sm">
            <div className="flex justify-between gap-3"><span className="text-gray-500">Booking ID</span><span className="font-semibold">{summary.referenceCode || summary.bookingId}</span></div>
            <div className="flex justify-between gap-3"><span className="text-gray-500">Trek</span><span className="font-semibold text-right">{summary.trekTitle}</span></div>
            <div className="flex justify-between gap-3"><span className="text-gray-500">Date</span><span className="font-semibold">{summary.date || '—'}</span></div>
            <div className="flex justify-between gap-3"><span className="text-gray-500">Package</span><span className="font-semibold">{summary.package}</span></div>
            <div className="flex justify-between gap-3"><span className="text-gray-500">Travellers</span><span className="font-semibold">{summary.persons}</span></div>
            <div className="flex justify-between gap-3"><span className="text-gray-500">Lead</span><span className="font-semibold">{summary.name}</span></div>
            <div className="flex justify-between gap-3"><span className="text-gray-500">Amount paid</span><span className="font-semibold text-[#16a34a]">₹{summary.amountRupees.toLocaleString()}</span></div>
            {summary.razorpayPaymentId ? (
              <div className="flex justify-between gap-3"><span className="text-gray-500">Payment ref</span><span className="font-semibold text-right break-all">{summary.razorpayPaymentId}</span></div>
            ) : null}
            {summary.method ? (
              <div className="flex justify-between gap-3"><span className="text-gray-500">Method</span><span className="font-semibold capitalize">{summary.method}</span></div>
            ) : null}
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link href="/user-dashboard/upcoming-treks" className="rounded-full bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#15803d]">
              My bookings
            </Link>
            <Link href="/treks" className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Explore more treks
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<div className="pt-28 min-h-screen flex items-center justify-center"><Loader className="w-8 h-8 animate-spin text-[#16a34a]" /></div>}>
      <SuccessContent />
    </Suspense>
  );
}
