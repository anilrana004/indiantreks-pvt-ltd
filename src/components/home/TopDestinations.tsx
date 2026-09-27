import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star, Clock } from 'lucide-react';
import { photos } from '@/lib/media';
import { STOREFRONT_BLUR_DATA_URL } from '@/lib/cloudinary';

const destinations = [
  { name: 'Kedarkantha', state: 'Uttarakhand', rating: '4.9', dur: '5D/4N', price: 6999, img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800&q=80', href: '/treks/kedarkantha' },
  { name: 'Valley of Flowers', state: 'Uttarakhand', rating: '4.8', dur: '6D/5N', price: 8999, img: photos.vof, href: '/treks/valley-of-flowers' },
  { name: 'Hampta Pass', state: 'Himachal', rating: '4.7', dur: '5D/4N', price: 8499, img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800&q=80', href: '/treks/hampta-pass' },
  { name: 'Chopta Tungnath', state: 'Uttarakhand', rating: '4.7', dur: '4D/3N', price: 5999, img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800&q=80', href: '/treks/chopta-tungnath' },
  { name: 'Everest Base Camp', state: 'Nepal', rating: '4.9', dur: '13D/12N', price: 74999, img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800&q=80', href: '/treks/everest-base-camp' },
  { name: 'Kedarnath Yatra', state: 'Uttarakhand', rating: '4.8', dur: '6D/5N', price: 9999, img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800&q=80', href: '/yatra/kedarnath-yatra' },
];

export default function TopDestinations() {
  return (
    <section className="py-8 lg:py-16 bg-gray-50">
      <div className="container mx-auto">
        <div className="text-center mb-8 lg:mb-10">
          <p className="text-[#16a34a] font-semibold text-xs lg:text-sm tracking-widest uppercase mb-1">TOP DESTINATIONS</p>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl lg:text-3xl font-bold text-[#000000] mb-2">Most Popular Treks</h2>
          <p className="text-gray-500 text-sm">Trusted by thousands of adventurers</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {destinations.map(d => (
            <Link key={d.name} href={d.href} className="group rounded-2xl overflow-hidden transition-all duration-300 relative aspect-[4/5]">
              <Image
                src={d.img}
                alt={d.name}
                fill
                sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                placeholder="blur"
                blurDataURL={STOREFRONT_BLUR_DATA_URL}
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-bold px-2.5 py-1 rounded-full text-[#16a34a]">
                {d.state}
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="font-bold text-white text-base lg:text-lg">{d.name}</h3>
                <div className="flex items-center gap-3 text-white/70 text-xs mb-2 mt-1">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{d.dur}</span>
                  <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />{d.rating}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#16a34a] font-bold text-base">₹{d.price.toLocaleString()}</span>
                  <span className="text-xs text-[#16a34a] font-semibold group-hover:underline">View Details →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
