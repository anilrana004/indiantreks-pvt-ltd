import Link from 'next/link';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { trekDetailPath, type Trek } from '@/lib/data';
import { trekCover } from '@/lib/catalog';
import { STOREFRONT_BLUR_DATA_URL } from '@/lib/cloudinary';

export default function TrekCard({ trek }: { trek: Trek }) {
  const minPrice = Math.min(...trek.pricing.map((p) => p.price));
  const cover = trekCover(trek);

  return (
    <Link
      href={trekDetailPath(trek)}
      className="group block rounded-2xl overflow-hidden transition-all duration-300 relative aspect-[3/4]"
    >
      <Image
        src={cover}
        alt={trek.title}
        fill
        sizes="(max-width:1024px) 50vw, 25vw"
        placeholder="blur"
        blurDataURL={STOREFRONT_BLUR_DATA_URL}
        referrerPolicy="no-referrer"
        className="object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {trek.badge ? (
        <span className="absolute top-3 left-3 bg-[#16a34a] text-white text-[10px] font-bold px-2 py-1 rounded-md">
          {trek.badge}
        </span>
      ) : null}

      <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded-md bg-white/90 text-gray-800 shadow-sm">
        {trek.duration}
      </span>

      <div className="absolute bottom-0 left-0 right-0 p-3 lg:p-4">
        <div className="flex items-center gap-1 text-[11px] text-white/75 mb-1">
          <MapPin className="w-3 h-3 text-[#16a34a] shrink-0" />
          <span className="truncate">{trek.state}</span>
        </div>
        <h3 className="font-bold text-sm lg:text-base text-white leading-snug line-clamp-2 group-hover:text-[#16a34a] transition-colors mb-2">
          {trek.title}
        </h3>
        <span className="font-bold text-base text-[#16a34a]">₹{minPrice.toLocaleString()}</span>
      </div>
    </Link>
  );
}
