'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Loader, XCircle } from 'lucide-react';

function FailedContent() {
  const sp = useSearchParams();
  const bookingId = sp.get('bookingId') || '';
  const token = sp.get('token') || '';
  const reason = sp.get('reason') || 'Payment was not completed.';

  return (
    <div className="pt-24 pb-16 min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-lg px-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <XCircle className="h-7 w-7 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-[#000000]">Payment was not completed</h1>
          <p className="mt-2 text-sm text-gray-500">{reason}</p>
          <p className="mt-3 text-xs text-gray-400">
            Your booking was not deleted. You can retry payment from the booking form. If money was deducted, it will be confirmed automatically via Razorpay webhook once captured.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link href="/treks" className="rounded-full bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#15803d]">
              Return to treks
            </Link>
            {bookingId && token ? (
              <Link
                href={`/booking/success?bookingId=${encodeURIComponent(bookingId)}&token=${encodeURIComponent(token)}`}
                className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Check payment status
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<div className="pt-28 min-h-screen flex items-center justify-center"><Loader className="w-8 h-8 animate-spin text-[#16a34a]" /></div>}>
      <FailedContent />
    </Suspense>
  );
}
