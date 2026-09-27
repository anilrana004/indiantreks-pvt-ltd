'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { treks } from '@/lib/data';
import { trekCover, trekPrice } from '@/lib/catalog';
import { STOREFRONT_BLUR_DATA_URL } from '@/lib/cloudinary';

type DestCard = { name: string; count: number; price: number; img: string; href: string };

function buildDestinations(kind: 'International' | 'India'): DestCard[] {
  if (kind === 'International') {
    const nepal = treks.filter((t) => t.region === 'nepal');
    const byTitle = new Map<string, typeof nepal>();
    for (const t of nepal) {
      const key = t.title.includes('Everest')
        ? 'Everest Base Camp'
        : t.title.includes('Annapurna')
          ? 'Annapurna'
          : t.title.includes('Pokhara')
            ? 'Pokhara'
            : t.title.includes('Chitwan')
              ? 'Chitwan'
              : t.title.includes('Kathmandu')
                ? 'Kathmandu Valley'
                : t.title.includes('Nepal')
                  ? 'Nepal Circuit'
                  : t.title;
      const list = byTitle.get(key) || [];
      list.push(t);
      byTitle.set(key, list);
    }
    return [...byTitle.entries()].map(([name, list]) => {
      const sample = list[0];
      return {
        name,
        count: list.length,
        price: Math.min(...list.map(trekPrice)),
        img: trekCover(sample),
        href: sample.type === 'yatra' ? `/yatra/${sample.id}` : `/treks/${sample.id}`,
      };
    });
  }

  const groups: { name: string; match: (t: (typeof treks)[0]) => boolean; href: string }[] = [
    { name: 'Uttarakhand Treks', match: (t) => t.region === 'uttarakhand' && t.type === 'trek', href: '/treks?region=uttarakhand' },
    { name: 'Himachal Treks', match: (t) => t.region === 'himachal' && t.type === 'trek', href: '/treks?region=himachal' },
    { name: 'Kashmir Treks', match: (t) => t.region === 'kashmir' && t.type === 'trek', href: '/treks?region=kashmir' },
    { name: 'Kedarnath Yatra', match: (t) => t.id.includes('kedarnath'), href: '/yatra/kedarnath-yatra' },
    { name: 'Char Dham Yatra', match: (t) => t.id === 'char-dham', href: '/yatra/char-dham' },
    { name: 'Do Dham Yatra', match: (t) => t.id.startsWith('do-dham'), href: '/yatra/do-dham' },
  ];

  return groups
    .map((g) => {
      const list = treks.filter(g.match);
      if (!list.length) return null;
      const sample = list[0];
      return {
        name: g.name,
        count: list.length,
        price: Math.min(...list.map(trekPrice)),
        img: trekCover(sample),
        href: g.href,
      };
    })
    .filter(Boolean) as DestCard[];
}

export default function CustomizedTours() {
  const [tab, setTab] = useState<'International' | 'India'>('India');
  const items = useMemo(() => buildDestinations(tab), [tab]);

  return (
    <section className="py-8 lg:py-16 bg-gray-50">
      <div className="container mx-auto">
        <div className="mb-6 lg:mb-8 px-4 lg:px-0">
          <p className="text-[#16a34a] font-semibold text-xs lg:text-sm tracking-widest uppercase mb-1">CUSTOMISED TOURS</p>
          <h2 className="text-xl lg:text-3xl font-bold text-[#000000]">Get a Customised Tour Package</h2>
        </div>
        <div className="flex justify-center gap-2 mb-6">
          {(['India', 'International'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-5 py-1.5 rounded-full text-xs lg:text-sm font-medium transition-all ${
                tab === t
                  ? 'bg-[#16a34a] text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-[#16a34a] hover:text-[#166534]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto scrollbar-none -mx-4 px-4 lg:mx-0 lg:px-0">
          <div className="flex gap-4 pb-2 w-max lg:w-full lg:grid lg:grid-cols-4">
            {items.map((d) => (
              <Link
                key={d.name}
                href={d.href}
                className="group relative w-[220px] lg:w-auto rounded-2xl overflow-hidden shrink-0 transition-all"
              >
                <div className="relative h-[280px] lg:h-[320px] overflow-hidden">
                  <Image
                    src={d.img}
                    alt={d.name}
                    fill
                    sizes="(max-width:1024px) 220px, 25vw"
                    placeholder="blur"
                    blurDataURL={STOREFRONT_BLUR_DATA_URL}
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute top-3 left-3 bg-[#16a34a] text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    {d.count}+ Packages
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-bold text-lg text-white group-hover:text-[#16a34a] transition-colors">{d.name}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-white/70 text-xs">Starting Price</span>
                      <span className="text-[#4ade80] font-bold text-base">₹{d.price.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <div className="text-center mt-6">
          <Link href="/customized" className="text-[#16a34a] text-sm font-semibold hover:text-[#15803d] transition-colors">
            View All Customized Tours &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
