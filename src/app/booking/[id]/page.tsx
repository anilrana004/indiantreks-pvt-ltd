import Link from 'next/link';
import { ArrowRight, Ban } from 'lucide-react';
import { getTrekById } from '@/lib/data';
import BookingCheckoutClient from '@/components/booking/BookingCheckoutClient';

export default async function BookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trek = getTrekById(id);

  if (!trek) {
    return (
      <div className="pt-28 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Ban className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-[#000000] mb-2">Package Not Found</h2>
          <p className="text-gray-500 mb-6">
            The trek, yatra, or trip you are looking for does not exist or has been removed.
          </p>
          <Link
            href="/treks"
            className="inline-flex items-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold px-6 py-3 rounded-full transition-all"
          >
            Browse All Treks <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return <BookingCheckoutClient trek={trek} />;
}
