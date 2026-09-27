'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Clock } from 'lucide-react';
import { STOREFRONT_BLUR_DATA_URL } from '@/lib/cloudinary';
import './landing-trip-row.css';

export type LandingTripCardProps = {
  href: string;
  cover: string;
  title: string;
  subtitle?: string;
  /** Small gray line above title — e.g. tags or pickup · duration · season */
  meta: string;
  duration?: string;
  badge?: string;
  price: number;
  priceLabel?: string;
  ctaLabel?: string;
  /** Open in new tab (WhatsApp / external) */
  external?: boolean;
};

function CardLink({
  href,
  external,
  className,
  children,
}: {
  href: string;
  external?: boolean;
  className?: string;
  children: ReactNode;
}) {
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

/** Trek-section card shell — matches TrekInfoCard / trek listing visual language. */
export default function LandingTripCard({
  href,
  cover,
  title,
  subtitle,
  meta,
  duration,
  badge,
  price,
  priceLabel = 'Starting from',
  ctaLabel = 'View Trip',
  external = false,
}: LandingTripCardProps) {
  return (
    <article className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm transition-all duration-300 hover:border-[#16a34a]/25 hover:shadow-md hover:shadow-[#16a34a]/8">
      <CardLink href={href} external={external} className="relative block aspect-[16/11] overflow-hidden bg-gray-100">
        <Image
          src={cover}
          alt=""
          fill
          sizes="(max-width:768px) 100vw, 33vw"
          placeholder="blur"
          blurDataURL={STOREFRONT_BLUR_DATA_URL}
          referrerPolicy="no-referrer"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        {badge ? (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-[#16a34a] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
            {badge}
          </span>
        ) : null}
        {duration ? (
          <div className="absolute bottom-2.5 left-2.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-[#166534] backdrop-blur-sm">
              <Clock className="h-3 w-3 shrink-0" aria-hidden />
              {duration}
            </span>
          </div>
        ) : null}
      </CardLink>

      <div className="flex flex-1 flex-col p-3.5">
        <p className="text-[11px] font-medium leading-snug text-gray-500">{meta}</p>

        <CardLink href={href} external={external} className="mt-1.5 block">
          <h3 className="text-[15px] font-bold leading-snug text-gray-900 transition-colors group-hover:text-[#166534]">
            {title}
          </h3>
        </CardLink>

        {subtitle ? (
          <p className="mt-1.5 line-clamp-2 flex-1 text-[12px] leading-relaxed text-gray-500">{subtitle}</p>
        ) : (
          <div className="flex-1" aria-hidden />
        )}

        <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-gray-100 pt-3.5">
          <div className="min-w-0 shrink">
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">{priceLabel}</p>
            <p className="mt-0.5 text-lg font-bold leading-none text-[#16a34a]">
              ₹{price.toLocaleString('en-IN')}
            </p>
          </div>
          <CardLink
            href={href}
            external={external}
            className="it-retro-pill-cta it-retro-pill-cta--sm shrink-0"
          >
            {ctaLabel}
            <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
          </CardLink>
        </div>
      </div>
    </article>
  );
}
