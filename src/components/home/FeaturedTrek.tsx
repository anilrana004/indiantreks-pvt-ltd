import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Clock, TrendingUp, ChevronRight } from 'lucide-react';
import { photos } from '@/lib/media';

const featured = {
  title: 'Valley of Flowers Trek',
  subtitle: 'Where Alpine Flowers Meet the Himalayas',
  location: 'Joshimath, Uttarakhand',
  duration: '6D / 5N',
  maxAltitude: '3,658m (12,001ft)',
  rating: '4.8',
  reviews: '8k+ reviews',
  price: 8999,
  originalPrice: 11999,
  img: photos.vof,
  badge: 'Trek of the Week',
  gradient: 'from-[#16a34a] to-[#16a34a]',
  href: '/treks/valley-of-flowers',
};

export default function FeaturedTrek() {
  return (
    <section className="py-8 lg:py-16 bg-gradient-to-br from-[#000000] to-[#000000] overflow-hidden">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left - Image */}
          <div className="relative h-64 lg:h-[420px] rounded-2xl overflow-hidden shadow-2xl">
            <Image
              src={featured.img}
              alt={featured.title}
              fill
              sizes="(max-width:1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute top-4 left-4">
              <span className="bg-[#16a34a] text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase">{featured.badge}</span>
            </div>
          </div>
          {/* Right - Content */}
          <div className="text-white">
            <p className="text-[#16a34a] font-semibold text-xs lg:text-sm tracking-widest uppercase mb-2">Featured Trek</p>
            <h2 className="font-[family-name:var(--font-heading)] text-2xl lg:text-4xl xl:text-5xl font-bold mb-2 leading-tight">{featured.title}</h2>
            <p className="text-white/60 text-sm lg:text-lg mb-4">{featured.subtitle}</p>
            <div className="flex flex-wrap items-center gap-4 mb-5 text-white/80 text-sm">
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#16a34a]" />{featured.location}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-[#16a34a]" />{featured.duration}</span>
              <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-[#16a34a]" />{featured.maxAltitude}</span>
            </div>
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                ))}
              </div>
              <span className="text-white/80 text-sm font-semibold">{featured.rating}</span>
              <span className="text-white/40 text-sm">({featured.reviews})</span>
            </div>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl font-bold text-white">₹{featured.price.toLocaleString()}</span>
              <span className="text-white/40 text-sm line-through">₹{featured.originalPrice.toLocaleString()}</span>
              <span className="bg-[#16a34a]/20 text-[#16a34a] text-xs font-bold px-2 py-1 rounded-full">{Math.round((1-featured.price/featured.originalPrice)*100)}% OFF</span>
            </div>
            <Link href={featured.href}
              className="it-retro-pill-cta it-retro-pill-cta--case-normal">
              Book Now <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
