import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin } from 'lucide-react';
import { photos } from '@/lib/media';
import { STOREFRONT_BLUR_DATA_URL } from '@/lib/cloudinary';

const trips = [
  { title: 'Valley of Flowers Trek', loc: 'Joshimath, Uttarakhand', rating: '4.8', rev: '8k+', img: photos.vof, href: '/treks/valley-of-flowers', badge: 'UNESCO Site' },
  { title: 'Kedarkantha Trek', loc: 'Sankri, Uttarakhand', rating: '4.9', rev: '10k+', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800&q=80', href: '/treks/kedarkantha', badge: 'Winter Special' },
  { title: 'Everest Base Camp Trek', loc: 'Lukla, Nepal', rating: '4.9', rev: '20k+', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800&q=80', href: '/treks/everest-base-camp', badge: 'Bucket List' },
  { title: 'Hampta Pass Trek', loc: 'Manali, Himachal', rating: '4.7', rev: '8k+', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800&q=80', href: '/treks/hampta-pass', badge: 'Valley Cross' },
];

export default function BestTripsGrid() {
  return (
    <section className="py-8 lg:py-16 bg-gray-50">
      <div className="container mx-auto">
        <div className="text-center mb-6 lg:mb-8">
          <p className="text-[#16a34a] font-semibold text-xs lg:text-sm tracking-widest uppercase mb-1">BEST TRIPS</p>
          <h2 className="font-[family-name:var(--font-heading)] text-xl lg:text-3xl font-bold text-[#000000]">Most Loved Experiences</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {trips.map(t => (
            <Link key={t.title} href={t.href} className="group relative rounded-xl overflow-hidden h-52 lg:h-64">
              <Image
                src={t.img}
                alt={t.title}
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                placeholder="blur"
                blurDataURL={STOREFRONT_BLUR_DATA_URL}
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              {t.badge && <span className="absolute top-3 left-3 bg-[#16a34a] text-white text-[10px] lg:text-xs font-bold px-2.5 py-1 rounded-full">{t.badge}</span>}
              <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                <div className="flex items-center gap-1.5 text-white/80 text-[11px] lg:text-xs mb-1">
                  <MapPin className="w-3 h-3" />{t.loc}
                </div>
                <h3 className="font-[family-name:var(--font-heading)] font-bold text-white text-base lg:text-xl mb-2">{t.title}</h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-white text-xs font-bold">{t.rating}</span>
                  </div>
                  <span className="text-white/70 text-xs">{t.rev} reviews</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
