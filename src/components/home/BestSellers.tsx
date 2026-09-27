'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Clock, MapPin, Zap } from 'lucide-react';
import { getBestSellerBuckets } from '@/lib/catalog';
import {
  HOME_BEST_SELLERS_PROMO,
  HOME_BEST_SELLERS_SECTION,
  HOME_BEST_SELLERS_TABS,
  type HomeBestSellersTab,
} from '@/lib/content/home-best-sellers';
import { STOREFRONT_BLUR_DATA_URL } from '@/lib/cloudinary';

export default function BestSellers() {
  const data = useMemo(() => getBestSellerBuckets(), []);
  const [activeTab, setActiveTab] = useState<HomeBestSellersTab>('Top Treks');
  const items = data[activeTab] || [];

  return (
    <section id="best-sellers" className="py-8 lg:py-16 bg-white">
      <div className="container mx-auto">
        <div className="bg-[#16a34a] rounded-xl p-4 lg:p-6 mb-6 lg:mb-8 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 lg:w-6 lg:h-6 text-[#4ade80]" />
            <div>
              <h3 className="font-bold text-sm lg:text-lg">{HOME_BEST_SELLERS_PROMO.title}</h3>
              <p className="text-white/80 text-xs lg:text-sm">{HOME_BEST_SELLERS_PROMO.subtitle}</p>
            </div>
          </div>
          <span className="text-2xl lg:text-3xl font-bold">{HOME_BEST_SELLERS_PROMO.discountLabel}</span>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-[#16a34a] font-semibold text-xs lg:text-sm tracking-widest uppercase mb-1">{HOME_BEST_SELLERS_SECTION.kicker}</p>
            <h2 className="text-xl lg:text-3xl font-bold text-[#000000]">{HOME_BEST_SELLERS_SECTION.title}</h2>
          </div>
          <Link href={HOME_BEST_SELLERS_SECTION.viewAllHref} className="text-[#16a34a] text-sm font-semibold hover:text-[#15803d] whitespace-nowrap">{HOME_BEST_SELLERS_SECTION.viewAllLabel} &rarr;</Link>
        </div>
        <div className="flex justify-start gap-2 overflow-x-auto scrollbar-none pb-2 mb-6 lg:justify-center">
          {HOME_BEST_SELLERS_TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveTab(t)}
              className={`shrink-0 px-5 py-1.5 rounded-full text-xs lg:text-sm font-medium transition-all ${
                activeTab === t ? 'bg-[#16a34a] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
          {items.slice(0, 4).map((t) => (
            <Link key={t.id} href={t.href} className="group rounded-xl overflow-hidden transition-all relative aspect-[4/5]">
              <Image
                src={t.img}
                alt={t.title}
                fill
                sizes="(max-width:1024px) 50vw, 25vw"
                placeholder="blur"
                blurDataURL={STOREFRONT_BLUR_DATA_URL}
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              {t.badge && (
                <span className="absolute top-2 left-2 bg-[#16a34a] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">{t.badge}</span>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="flex items-center gap-1 text-white/70 text-[10px] mb-0.5">
                  <MapPin className="w-2.5 h-2.5 text-[#16a34a]" />
                  <span className="truncate">{t.loc}</span>
                </div>
                <h3 className="font-semibold text-xs lg:text-sm text-white line-clamp-2 mb-1">{t.title}</h3>
                <div className="flex items-center gap-1.5 text-[10px] text-white/60 mb-1.5">
                  <Clock className="w-2.5 h-2.5 text-[#16a34a]" />
                  {t.dur}
                  <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400 ml-1" />
                  {t.rating}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#16a34a] font-bold text-sm">₹{t.price.toLocaleString()}</span>
                  {t.origPrice > t.price && (
                    <span className="text-white/40 text-[10px] line-through">₹{t.origPrice.toLocaleString()}</span>
                  )}
                </div>
                <span className="inline-block mt-1 text-[9px] text-[#bbf7d0] font-semibold bg-[#14532d]/70 px-1.5 py-0.5 rounded">
                  {HOME_BEST_SELLERS_SECTION.payLaterLabel}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
