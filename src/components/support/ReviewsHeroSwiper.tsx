'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import {
  REVIEWS_HERO_CAROUSEL,
  type HeroCarouselReview,
} from '@/lib/reviews-page-content';
import 'swiper/css';
import 'swiper/css/navigation';

const HERO_TRUNCATE_LEN = 148;

function HeroCarouselCard({ review }: { review: HeroCarouselReview }) {
  const [open, setOpen] = useState(false);
  const needsTruncate = review.text.length > HERO_TRUNCATE_LEN;
  const preview = needsTruncate ? `${review.text.slice(0, HERO_TRUNCATE_LEN).trim()}…` : review.text;

  return (
    <article className="it-rv-hero-card">
      <header className="it-rv-hero-card__head">
        <span className="it-rv-hero-card__avatar">
          <Image src={review.avatar} alt="" fill sizes="48px" />
        </span>
        <span className="it-rv-hero-card__meta">
          <strong>{review.name}</strong>
          <span>On: {review.reviewedOn}</span>
        </span>
        <span className="it-rv-hero-card__rating" aria-label={`${review.rating} out of 5`}>
          <i className="fa-solid fa-star" aria-hidden />
          {review.rating}
        </span>
      </header>
      <p className="it-rv-hero-card__text">
        {open || !needsTruncate ? review.text : preview}
        {needsTruncate ? (
          <>
            {' '}
            <button type="button" className="it-rv-hero-card__more" onClick={() => setOpen((v) => !v)}>
              {open ? 'Read less' : 'Read More'}
            </button>
          </>
        ) : null}
      </p>
      <div className="it-rv-hero-card__photos">
        {review.photos.slice(0, 4).map((src, index) => (
          <span key={`${review.id}-photo-${index}`} className="it-rv-hero-card__photo">
            <Image src={src} alt="" fill sizes="80px" />
          </span>
        ))}
      </div>
    </article>
  );
}

/** Swiper-only chunk — deferred from ReviewsPageView so the reviews route stays lean. */
export default function ReviewsHeroSwiper() {
  return (
    <Swiper
      className="it-rv-hero-carousel__swiper"
      modules={[Navigation]}
      spaceBetween={16}
      slidesPerView={1}
      navigation={{
        prevEl: '.it-rv-hero-carousel__nav--prev',
        nextEl: '.it-rv-hero-carousel__nav--next',
      }}
      breakpoints={{
        640: { slidesPerView: 1.08 },
        900: { slidesPerView: 1.12 },
        1100: { slidesPerView: 1.18 },
      }}
    >
      {REVIEWS_HERO_CAROUSEL.map((review) => (
        <SwiperSlide key={review.id}>
          <HeroCarouselCard review={review} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
