'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CalendarCheck, MapPin, Clock, Users, ChevronRight, Phone,
  MessageCircle, Ban, CheckCircle2, Hourglass, XCircle, Compass,
} from 'lucide-react';
import { treks } from '@/lib/data';
import { CONTACT, telUrl, whatsappChannelUrl } from '@/lib/contact';
import { cancelMyBooking, getMyBookings, type BookingStatus, type MyBooking } from '@/lib/my-bookings';

const tabs: { key: BookingStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const statusMeta: Record<BookingStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  upcoming: { label: 'Upcoming', className: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: Hourglass },
  completed: { label: 'Completed', className: 'bg-blue-50 text-blue-700 border-blue-100', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-600 border-gray-200', icon: XCircle },
};

function formatDate(iso: string) {
  try {
    return new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function BookingsPage() {
  const [tab, setTab] = useState<BookingStatus | 'all'>('all');
  const [bookings, setBookings] = useState<MyBooking[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = () => setBookings(getMyBookings());

  useEffect(() => {
    refresh();
    setReady(true);
    const onChange = () => refresh();
    window.addEventListener('indiantreks:bookings', onChange);
    return () => window.removeEventListener('indiantreks:bookings', onChange);
  }, []);

  const filtered = useMemo(
    () => (tab === 'all' ? bookings : bookings.filter(b => b.status === tab)),
    [bookings, tab],
  );

  const counts = useMemo(() => ({
    all: bookings.length,
    upcoming: bookings.filter(b => b.status === 'upcoming').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  }), [bookings]);

  const handleCancel = (id: string) => {
    if (!window.confirm('Cancel this booking? Our team will confirm within 24 hours.')) return;
    cancelMyBooking(id);
    refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 lg:pt-24 pb-24 lg:pb-16">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <Link
            href="/profile"
            className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition hover:text-[#16a34a] lg:hidden"
          >
            ← Profile
          </Link>
          <p className="text-[#16a34a] font-semibold text-xs lg:text-sm tracking-[0.2em] uppercase mb-1">My Trips</p>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#000000]">Bookings</h1>
          <p className="text-sm text-gray-500 mt-1">Track upcoming adventures, past trips, and booking status.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 mb-6" style={{ scrollbarWidth: 'none' }}>
          {tabs.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs lg:text-sm font-semibold transition-all ${
                tab === t.key
                  ? 'bg-[#000000] text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {t.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>

        {!ready ? (
          <div className="py-20 text-center text-gray-400 text-sm">Loading bookings…</div>
        ) : filtered.length === 0 ? (
          <EmptyBookings tab={tab} />
        ) : (
          <div className="space-y-4">
            {filtered.map(b => {
              const trek = treks.find(t => t.id === b.trekId);
              const meta = statusMeta[b.status];
              const StatusIcon = meta.icon;
              if (!trek) return null;
              return (
                <article
                  key={b.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row">
                    <Link href={`/treks/${trek.id}`} className="relative sm:w-44 lg:w-52 shrink-0 aspect-[16/10] sm:aspect-auto sm:min-h-[160px]">
                      <img src={trek.images[0]} alt={trek.title} className="absolute inset-0 w-full h-full object-cover" />
                      <span className={`absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border backdrop-blur-sm ${meta.className}`}>
                        <StatusIcon className="w-3 h-3" />
                        {meta.label}
                      </span>
                    </Link>

                    <div className="flex-1 p-4 lg:p-5 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <p className="text-[11px] text-gray-400 font-medium mb-0.5">Booking ID · {b.id}</p>
                          <Link href={`/treks/${trek.id}`} className="font-bold text-base lg:text-lg text-[#000000] hover:text-[#16a34a] transition-colors line-clamp-1">
                            {trek.title}
                          </Link>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] lg:text-xs text-gray-500">
                            <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3 text-[#16a34a]" />{trek.location}</span>
                            <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3 text-[#16a34a]" />{trek.duration}</span>
                            <span className="inline-flex items-center gap-1"><Users className="w-3 h-3 text-[#16a34a]" />{b.persons} {b.persons > 1 ? 'travellers' : 'traveller'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 text-xs">
                        <div className="bg-gray-50 rounded-xl px-3 py-2">
                          <p className="text-gray-400 mb-0.5">Travel date</p>
                          <p className="font-semibold text-gray-800">{formatDate(b.travelDate)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl px-3 py-2">
                          <p className="text-gray-400 mb-0.5">Package</p>
                          <p className="font-semibold text-gray-800">{b.packageName}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl px-3 py-2">
                          <p className="text-gray-400 mb-0.5">Paid</p>
                          <p className="font-semibold text-[#16a34a]">₹{b.amountPaid.toLocaleString()}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl px-3 py-2">
                          <p className="text-gray-400 mb-0.5">Trip total</p>
                          <p className="font-semibold text-gray-800">₹{b.totalAmount.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-4">
                        <Link
                          href={`/treks/${trek.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-full transition-colors"
                        >
                          View trek <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                        <a
                          href={whatsappChannelUrl(
                            'support',
                            `Hi Indian Treks, I need help with booking ${b.id} (${trek.title}).`,
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-full transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> Support
                        </a>
                        <a
                          href={telUrl(CONTACT.phones.support.tel)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-full transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-[#16a34a]" /> Call
                        </a>
                        {b.status === 'upcoming' && (
                          <button
                            type="button"
                            onClick={() => handleCancel(b.id)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-full transition-colors ml-auto"
                          >
                            <Ban className="w-3.5 h-3.5" /> Cancel
                          </button>
                        )}
                        {b.status === 'upcoming' && b.amountPaid < b.totalAmount && (
                          <Link
                            href={`/booking/${trek.id}?pkg=${encodeURIComponent(b.packageName)}`}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-900 bg-[#16a34a] hover:bg-[#15803d] px-3 py-2 rounded-full transition-colors"
                          >
                            Pay balance
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Help strip */}
        <div className="mt-8 lg:mt-10 bg-white border border-gray-100 rounded-2xl p-4 lg:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#16a34a]/15 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-5 h-5 text-[#15803d]" />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900">Need to book a new trip?</p>
              <p className="text-xs text-gray-500 mt-0.5">Browse treks & yatras  -  reserve with a small deposit.</p>
            </div>
          </div>
          <Link
            href="/treks"
            className="inline-flex items-center justify-center gap-1.5 bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-colors shrink-0"
          >
            Explore trips <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function EmptyBookings({ tab }: { tab: BookingStatus | 'all' }) {
  const copy =
    tab === 'upcoming' ? 'No upcoming trips yet.'
      : tab === 'completed' ? 'No completed trips yet.'
        : tab === 'cancelled' ? 'No cancelled bookings.'
          : 'You have no bookings yet.';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-6 py-14 text-center">
      <div className="w-16 h-16 rounded-full bg-[#16a34a]/10 flex items-center justify-center mx-auto mb-4">
        <Compass className="w-8 h-8 text-[#16a34a]" />
      </div>
      <h2 className="font-bold text-lg text-gray-900 mb-1">{copy}</h2>
      <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
        When you book a trek or yatra, it will show up here with dates, payment, and support options.
      </p>
      <Link
        href="/treks"
        className="inline-flex items-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold px-6 py-3 rounded-full transition-colors"
      >
        Browse treks <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
