'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  Mountain,
  Star,
  TrendingUp,
} from 'lucide-react';
import { STOREFRONT_BLUR_DATA_URL } from '@/lib/cloudinary';
import {
  batchStatusMeta,
  type BatchStatus,
} from '@/lib/batches';
import {
  difficultyTone,
  type ListingTrek,
} from '@/lib/treks-listing';

function StatusDot({ status }: { status: BatchStatus }) {
  const meta = batchStatusMeta[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

export default function TrekListingCard({ trek }: { trek: ListingTrek }) {
  const openBatches = trek.batches.filter((b) => b.status !== 'sold-out').slice(0, 3);
  const save =
    trek.origPrice > trek.price
      ? Math.round(((trek.origPrice - trek.price) / trek.origPrice) * 100)
      : 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm transition-all duration-300 hover:border-[#16a34a]/25 hover:shadow-md hover:shadow-[#16a34a]/8 sm:flex-row sm:rounded-2xl">
      <Link
        href={trek.href}
        className="relative block aspect-[16/10] shrink-0 overflow-hidden bg-gray-100 sm:aspect-auto sm:w-[200px] sm:self-stretch md:w-[220px] lg:w-[240px]"
      >
        <Image
          src={trek.cover}
          alt={trek.title}
          fill
          sizes="(max-width:640px) 100vw, 240px"
          placeholder="blur"
          blurDataURL={STOREFRONT_BLUR_DATA_URL}
          referrerPolicy="no-referrer"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-black/5" />
        {trek.badge && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-[#16a34a] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
            {trek.badge}
          </span>
        )}
        {save > 0 && (
          <span className="absolute bottom-2.5 left-2.5 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-[#166534] shadow-sm">
            Save {save}%
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-3.5 sm:gap-3.5 sm:p-4 lg:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span
                className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold sm:text-[11px] ${difficultyTone(trek.difficulty)}`}
              >
                {trek.difficulty}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                <MapPin className="h-3 w-3 shrink-0 text-[#16a34a]" />
                <span className="truncate">{trek.state}</span>
              </span>
            </div>
            <Link href={trek.href} className="block">
              <h3 className="text-base font-bold leading-snug text-gray-900 transition-colors group-hover:text-[#166534] sm:text-lg lg:text-xl">
                {trek.title}
              </h3>
            </Link>
            <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-gray-500 sm:text-sm">
              {trek.subtitle}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-[#f0fdf4] px-2 py-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold text-gray-900">{trek.rating}</span>
            <span className="hidden text-[10px] text-gray-400 sm:inline">({trek.reviewCount})</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-[#f7faf7] p-2 sm:gap-2 sm:p-2.5">
          {[
            { icon: Clock, label: 'Duration', value: trek.duration },
            { icon: Mountain, label: 'Altitude', value: trek.maxAltitude },
            { icon: TrendingUp, label: 'Distance', value: trek.distance },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex min-w-0 items-center gap-1.5 sm:gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[#16a34a] shadow-sm sm:h-8 sm:w-8">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <div className="text-[9px] uppercase tracking-wide text-gray-400 sm:text-[10px]">
                  {label}
                </div>
                <div className="truncate text-[11px] font-semibold text-gray-800 sm:text-xs">
                  {value}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400 sm:text-[11px]">
            <Calendar className="h-3.5 w-3.5 text-[#16a34a]" />
            Upcoming batches
          </div>
          {openBatches.length === 0 ? (
            <p className="text-xs text-gray-400">New dates opening soon — enquire to get notified.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {openBatches.map((b) => (
                <span
                  key={b.startDate}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-700"
                >
                  {b.label}
                  <StatusDot status={b.status} />
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 border-t border-gray-100 pt-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
          <div className="col-span-2 min-w-0 sm:col-auto">
            <div className="text-[10px] uppercase tracking-wide text-gray-400">Starting from</div>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-lg font-bold text-[#16a34a] sm:text-xl">
                ₹{trek.price.toLocaleString('en-IN')}
              </span>
              {trek.origPrice > trek.price && (
                <span className="text-sm text-gray-400 line-through">
                  ₹{trek.origPrice.toLocaleString('en-IN')}
                </span>
              )}
              <span className="text-[11px] text-gray-400">/ person</span>
            </div>
            <p className="mt-0.5 truncate text-[11px] text-gray-400">
              Best season: {trek.bestSeason}
            </p>
          </div>
          <Link
            href={trek.href}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-[#16a34a] px-3 text-[12px] font-semibold text-[#166534] transition-colors hover:bg-[#f0fdf4] sm:hidden"
          >
            Get Trek Info
          </Link>
          <Link
            href={`${trek.href}#departures`}
            className="it-retro-pill-cta it-retro-pill-cta--sm sm:hidden"
          >
            View Dates
          </Link>
          <Link
            href={trek.href}
            className="it-retro-pill-cta it-retro-pill-cta--sm hidden shrink-0 sm:inline-flex"
          >
            View Trek
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
