'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Heart, MapPin, Clock, Star, Trash2, ChevronRight, Compass, Share2,
} from 'lucide-react';
import { treks } from '@/lib/data';
import {
  clearWishlist, getWishlistIds, removeFromWishlist, toggleWishlist,
} from '@/lib/wishlist';

export default function WishlistPage() {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = () => setIds(getWishlistIds());

  useEffect(() => {
    refresh();
    setReady(true);
    const onChange = () => refresh();
    window.addEventListener('indiantreks:wishlist', onChange);
    return () => window.removeEventListener('indiantreks:wishlist', onChange);
  }, []);

  const items = useMemo(
    () => ids.map(id => treks.find(t => t.id === id)).filter(Boolean) as typeof treks,
    [ids],
  );

  const suggestions = useMemo(
    () => treks.filter(t => !ids.includes(t.id)).slice(0, 6),
    [ids],
  );

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My Indian Treks Wishlist', url });
      } else {
        await navigator.clipboard.writeText(url);
        alert('Wishlist link copied');
      }
    } catch {
      /* user cancelled share */
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 lg:pt-24 pb-24 lg:pb-16">
      <div className="container mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 lg:mb-8">
          <div>
            <Link
              href="/profile"
              className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition hover:text-[#16a34a] lg:hidden"
            >
              ← Profile
            </Link>
            <p className="text-[#16a34a] font-semibold text-xs lg:text-sm tracking-[0.2em] uppercase mb-1">Saved</p>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#000000]">Wishlist</h1>
            <p className="text-sm text-gray-500 mt-1">
              {ready ? `${items.length} saved trip${items.length === 1 ? '' : 's'}` : 'Loading…'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:border-gray-300 px-3 py-2 rounded-full transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Clear your entire wishlist?')) {
                      clearWishlist();
                      refresh();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-full transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear all
                </button>
              </>
            )}
          </div>
        </div>

        {!ready ? (
          <div className="py-20 text-center text-gray-400 text-sm">Loading wishlist…</div>
        ) : items.length === 0 ? (
          <EmptyWishlist />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map(trek => {
              const minPrice = Math.min(...trek.pricing.map(p => p.price));
              const original = trek.pricing.find(p => p.originalPrice)?.originalPrice;
              return (
                <article
                  key={trek.id}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-[4/3]">
                    <Link href={`/treks/${trek.id}`}>
                      <img
                        src={trek.images[0]}
                        alt={trek.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </Link>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                    <button
                      type="button"
                      aria-label="Remove from wishlist"
                      onClick={() => { removeFromWishlist(trek.id); refresh(); }}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                    {trek.badge && (
                      <span className="absolute top-3 left-3 bg-[#16a34a] text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase">
                        {trek.badge}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-1 text-[11px] text-gray-500 mb-1">
                      <MapPin className="w-3 h-3 text-[#16a34a]" />
                      <span className="truncate">{trek.location}</span>
                    </div>
                    <Link href={`/treks/${trek.id}`} className="font-bold text-sm lg:text-base text-gray-900 hover:text-[#16a34a] transition-colors line-clamp-2">
                      {trek.title}
                    </Link>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-1.5 mb-3">
                      <Clock className="w-3 h-3 text-[#16a34a]" />
                      {trek.duration}
                      <span className="text-gray-200">|</span>
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      {trek.rating} ({trek.reviewCount})
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[#16a34a] font-bold">₹{minPrice.toLocaleString()}</span>
                        {original && original > minPrice && (
                          <span className="text-gray-400 text-xs line-through ml-1.5">₹{original.toLocaleString()}</span>
                        )}
                      </div>
                      <Link
                        href={`/booking/${trek.id}`}
                        className="text-xs font-bold bg-[#16a34a] hover:bg-[#15803d] text-white px-3 py-1.5 rounded-full transition-colors"
                      >
                        Book
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Suggestions to add */}
        {ready && suggestions.length > 0 && (
          <div className="mt-10 lg:mt-12">
            <div className="flex items-end justify-between gap-4 mb-4">
              <div>
                <p className="text-[#16a34a] font-semibold text-xs tracking-widest uppercase mb-1">Discover</p>
                <h2 className="text-lg lg:text-xl font-bold text-[#000000]">
                  {items.length === 0 ? 'Popular trips to save' : 'You might also like'}
                </h2>
              </div>
              <Link href="/treks" className="text-[#16a34a] text-sm font-semibold hover:text-[#15803d] whitespace-nowrap">
                View all →
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-1" style={{ scrollbarWidth: 'none' }}>
              {suggestions.map(trek => {
                const minPrice = Math.min(...trek.pricing.map(p => p.price));
                const saved = ids.includes(trek.id);
                return (
                  <div
                    key={trek.id}
                    className="relative shrink-0 w-[70vw] max-w-[240px] snap-start rounded-xl overflow-hidden aspect-[3/4] group"
                  >
                    <img src={trek.images[0]} alt={trek.title} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                    <button
                      type="button"
                      aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
                      onClick={() => { toggleWishlist(trek.id); refresh(); }}
                      className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-colors ${
                        saved ? 'bg-white text-red-500' : 'bg-black/40 text-white backdrop-blur-sm hover:bg-black/55'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <Link href={`/treks/${trek.id}`} className="font-semibold text-sm text-white line-clamp-2 hover:text-[#16a34a] transition-colors">
                        {trek.title}
                      </Link>
                      <p className="text-[#16a34a] font-bold text-sm mt-1">₹{minPrice.toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyWishlist() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-6 py-14 text-center mb-2">
      <div className="w-16 h-16 rounded-full bg-[#16a34a]/10 flex items-center justify-center mx-auto mb-4">
        <Heart className="w-8 h-8 text-[#16a34a]" />
      </div>
      <h2 className="font-bold text-lg text-gray-900 mb-1">Your wishlist is empty</h2>
      <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
        Tap the heart on trips you love. We&apos;ll keep them here so you can compare and book later.
      </p>
      <Link
        href="/treks"
        className="inline-flex items-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold px-6 py-3 rounded-full transition-colors"
      >
        <Compass className="w-4 h-4" /> Explore treks <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
