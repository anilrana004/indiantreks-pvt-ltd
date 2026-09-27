'use client';

import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import {
  BUZZWORTHY_STORIES,
  GOOGLE_REVIEWS,
  GOOGLE_REVIEWS_SECTION,
  POPULAR_REVIEWS,
  PRAISE_TESTIMONIALS,
  RECENT_REVIEWS,
  REVIEW_CATEGORY_TABS,
  REVIEW_PARTNERS,
  REVIEWS_HERO_AWARD,
  REVIEWS_PAGE_HERO,
  REVIEWS_TRUST_STRIP,
  REVIEWS_VERIFICATION_STEPS,
  TOURISM_ALLIANCES,
  WHY_CHOOSE_REVIEWS,
  type GoogleReview,
  type ReviewCategory,
  type VerifiedReview,
} from '@/lib/reviews-page-content';
import { googleReviewsVerifyUrl, googleWriteReviewUrl } from '@/lib/contact';
import ExperienceReviewsSection from '@/components/support/ExperienceReviewsSection';
import './reviews-page.css';

const ReviewsHeroSwiper = dynamic(() => import('./ReviewsHeroSwiper'), {
  ssr: false,
  loading: () => (
    <div className="it-rv-hero-carousel__swiper" style={{ minHeight: 220 }} aria-hidden />
  ),
});

const TRUNCATE_LEN = 220;
const POPULAR_PAGE = 3;
const RECENT_PAGE = 12;

function ReviewsHeroFold() {
  return (
    <header className="it-reviews-fold">
      <div className="it-reviews__wrap">
        <h1 className="it-reviews-fold__title">
          <span className="it-reviews-fold__brand">{REVIEWS_PAGE_HERO.brandName}</span>{' '}
          <span className="it-reviews-fold__reviews">{REVIEWS_PAGE_HERO.reviewsWord}</span>
        </h1>
        <p className="it-reviews-fold__subtitle">{REVIEWS_PAGE_HERO.subtitle}</p>

        <div className="it-reviews-fold__body">
          <aside className="it-rv-award" aria-label="Awards and ratings">
            <div className="it-rv-award__top">
              <span className="it-rv-award__trophy" aria-hidden>
                {REVIEWS_HERO_AWARD.trophy}
              </span>
              <div>
                <p className="it-rv-award__headline">{REVIEWS_HERO_AWARD.headline}</p>
                <p className="it-rv-award__subline">{REVIEWS_HERO_AWARD.subline}</p>
              </div>
            </div>

            <div className="it-rv-award__badge" aria-hidden>
              <span className="it-rv-award__laurel it-rv-award__laurel--left" />
              <span className="it-rv-award__badge-inner">
                <span className="it-rv-award__badge-kicker">The Economic Times</span>
                <strong>{REVIEWS_HERO_AWARD.badgeTitle}</strong>
                <span>{REVIEWS_HERO_AWARD.badgeSub}</span>
                <em>{REVIEWS_HERO_AWARD.badgeEdition}</em>
              </span>
              <span className="it-rv-award__laurel it-rv-award__laurel--right" />
            </div>

            <div className="it-rv-award__stats">
              <div className="it-rv-award__stat">
                <span className="it-rv-award__stat-ico it-rv-award__stat-ico--brand" aria-hidden>
                  <i className="fa-solid fa-mountain-sun" />
                </span>
                <span className="it-rv-award__stat-copy">
                  <strong>{REVIEWS_HERO_AWARD.reviewsCount} Reviews</strong>
                  <Link href="/reviews">{REVIEWS_HERO_AWARD.reviewsLinkLabel}</Link>
                </span>
              </div>
              <div className="it-rv-award__stat">
                <span className="it-rv-award__stat-ico it-rv-award__stat-ico--google" aria-hidden>
                  <svg viewBox="0 0 24 24" width="22" height="22" role="img" aria-label="Google">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                </span>
                <span className="it-rv-award__stat-copy">
                  <strong>
                    <a
                      href={googleReviewsVerifyUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="it-rv-award__google-link"
                    >
                      {REVIEWS_HERO_AWARD.googleRating}{' '}
                      <i className="fa-solid fa-star" aria-hidden /> Rated
                    </a>
                  </strong>
                  <a
                    href={googleReviewsVerifyUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="it-rv-award__verify-link"
                  >
                    Verify on Google
                  </a>
                  <span>By {REVIEWS_HERO_AWARD.googleTravellers} Travellers</span>
                </span>
              </div>
            </div>
          </aside>

          <div className="it-rv-hero-carousel">
            <button
              type="button"
              className="it-rv-hero-carousel__nav it-rv-hero-carousel__nav--prev"
              aria-label="Previous review"
            >
              <i className="fa-solid fa-chevron-left" aria-hidden />
            </button>
            <ReviewsHeroSwiper />
            <button
              type="button"
              className="it-rv-hero-carousel__nav it-rv-hero-carousel__nav--next"
              aria-label="Next review"
            >
              <i className="fa-solid fa-chevron-right" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function GoogleLogoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function GoogleReviewCard({ review }: { review: GoogleReview }) {
  return (
    <article className="it-rv-google__card">
      <header className="it-rv-google__card-head">
        <span className="it-rv-google__avatar">
          <Image src={review.avatar} alt="" fill sizes="44px" />
        </span>
        <span className="it-rv-google__meta">
          <strong>{review.name}</strong>
          <span>{review.reviewedAt}</span>
        </span>
        <span className="it-rv-google__badge">
          <GoogleLogoIcon />
          Google
        </span>
      </header>
      <div className="it-rv-google__stars" aria-label={`${review.rating} out of 5`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <i
            key={i}
            className={i < review.rating ? 'fa-solid fa-star' : 'fa-regular fa-star'}
            aria-hidden
          />
        ))}
      </div>
      <p className="it-rv-google__text">&ldquo;{review.text}&rdquo;</p>
    </article>
  );
}

function ReviewsTrustStrip() {
  return (
    <div className="it-rv-trust" aria-label="Review trust indicators">
      {REVIEWS_TRUST_STRIP.map((item) => (
        <span key={item.label} className="it-rv-trust__item">
          <i className={`fa-solid ${item.icon}`} aria-hidden />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function GoogleReviewsSection() {
  return (
    <section className="it-reviews__section it-reviews__section--google" aria-labelledby="it-rv-google-title">
      <div className="it-reviews__wrap">
        <header className="it-reviews__section-head">
          <p className="it-reviews__kicker">{GOOGLE_REVIEWS_SECTION.kicker}</p>
          <h2 id="it-rv-google-title">{GOOGLE_REVIEWS_SECTION.title}</h2>
          <p>{GOOGLE_REVIEWS_SECTION.intro}</p>
        </header>

        <div className="it-rv-google__layout">
          <aside className="it-rv-google__summary">
            <div className="it-rv-google__summary-top">
              <span className="it-rv-google__summary-logo" aria-hidden>
                <GoogleLogoIcon />
              </span>
              <div>
                <p className="it-rv-google__summary-label">Google rating</p>
                <p className="it-rv-google__summary-score">
                  {GOOGLE_REVIEWS_SECTION.rating}
                  <i className="fa-solid fa-star" aria-hidden />
                </p>
                <p className="it-rv-google__summary-count">
                  Based on {GOOGLE_REVIEWS_SECTION.count} Google reviews
                </p>
              </div>
            </div>

            <ul className="it-rv-google__bars" aria-label="Rating breakdown">
              {GOOGLE_REVIEWS_SECTION.ratingBreakdown.map((row) => (
                <li key={row.stars}>
                  <span>{row.stars}</span>
                  <i className="fa-solid fa-star" aria-hidden />
                  <span className="it-rv-google__bar-track">
                    <span className="it-rv-google__bar-fill" style={{ width: `${row.percent}%` }} />
                  </span>
                  <span>{row.percent}%</span>
                </li>
              ))}
            </ul>

            <div className="it-rv-google__actions">
              <a
                href={googleReviewsVerifyUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="it-rv-google__btn it-rv-google__btn--primary"
              >
                <GoogleLogoIcon />
                {GOOGLE_REVIEWS_SECTION.verifyLabel}
                <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden />
              </a>
              <p className="it-rv-google__hint">{GOOGLE_REVIEWS_SECTION.verifyHint}</p>
              <a
                href={googleWriteReviewUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="it-rv-google__btn it-rv-google__btn--ghost"
              >
                {GOOGLE_REVIEWS_SECTION.writeLabel}
              </a>
              <p className="it-rv-google__hint">{GOOGLE_REVIEWS_SECTION.writeHint}</p>
            </div>
          </aside>

          <div className="it-rv-google__grid">
            {GOOGLE_REVIEWS.map((review) => (
              <GoogleReviewCard key={review.id} review={review} />
            ))}
          </div>
        </div>

        <div className="it-rv-verify">
          <h3 className="it-rv-verify__title">How we verify reviews</h3>
          <div className="it-rv-verify__grid">
            {REVIEWS_VERIFICATION_STEPS.map((step) => (
              <article key={step.step} className="it-rv-verify__step">
                <span className="it-rv-verify__num">{step.step}</span>
                <h4>{step.title}</h4>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function formatRating(rating: number) {
  return `${rating.toFixed(1)}/5`;
}

function ReviewStars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <span className="it-rv__stars" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => {
        let iconClass = 'fa-regular fa-star';
        if (i < full) iconClass = 'fa-solid fa-star';
        else if (half && i === full) iconClass = 'fa-solid fa-star-half-stroke';
        return <i key={i} className={iconClass} aria-hidden />;
      })}
      <span className="it-rv__stars-num">{formatRating(rating)}</span>
    </span>
  );
}

function ReviewText({ review }: { review: VerifiedReview }) {
  const [open, setOpen] = useState(false);
  const needsTruncate = review.text.length > TRUNCATE_LEN;
  const display = open || !needsTruncate ? review.text : `${review.text.slice(0, TRUNCATE_LEN).trim()}…`;

  return (
    <>
      <p className="it-rv__text">{display}</p>
      {needsTruncate ? (
        <button type="button" className="it-rv__read-more" onClick={() => setOpen((v) => !v)}>
          {open ? 'Read less' : 'Read More'}
        </button>
      ) : null}
    </>
  );
}

function PhotoStrip({ photos }: { photos: string[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? photos : photos.slice(0, 3);
  const extra = photos.length - 3;

  if (!photos.length) return null;

  return (
    <div className="it-rv__photos">
      {visible.map((src, index) => (
        <span key={`${src}-${index}`} className="it-rv__photo">
          <Image src={src} alt="" fill sizes="120px" />
        </span>
      ))}
      {!showAll && extra > 0 ? (
        <button type="button" className="it-rv__photo-more" onClick={() => setShowAll(true)}>
          ({extra}+) View All
        </button>
      ) : null}
    </div>
  );
}

function PopularReviewCard({ review }: { review: VerifiedReview }) {
  return (
    <article className="it-rv-popular__card">
      <header className="it-rv-popular__head">
        <div>
          <h3 className="it-rv__name">{review.name}</h3>
          <p className="it-rv__date">Reviewed: {review.reviewedAt}</p>
        </div>
        <ReviewStars rating={review.rating} />
      </header>
      <p className="it-rv__booked">
        Booked:{' '}
        {review.bookedHref ? (
          <Link href={review.bookedHref}>{review.booked}</Link>
        ) : (
          review.booked
        )}
      </p>
      <ReviewText review={review} />
      <PhotoStrip photos={review.photos} />
    </article>
  );
}

function RecentReviewCard({ review }: { review: VerifiedReview }) {
  return (
    <article className="it-rv-recent__card">
      <header className="it-rv-recent__head">
        <div>
          <h3 className="it-rv__name">{review.name}</h3>
          <p className="it-rv__date">Reviewed: {review.reviewedAt}</p>
        </div>
        <ReviewStars rating={review.rating} />
      </header>
      <p className="it-rv__booked">
        Booked:{' '}
        {review.bookedHref ? (
          <Link href={review.bookedHref}>{review.booked}</Link>
        ) : (
          review.booked
        )}
      </p>
      <ReviewText review={review} />
      {review.photos.length ? <PhotoStrip photos={review.photos} /> : null}
    </article>
  );
}

export default function ReviewsPageView() {
  const [popularCount, setPopularCount] = useState(POPULAR_PAGE);
  const [recentCount, setRecentCount] = useState(RECENT_PAGE);
  const [category, setCategory] = useState<ReviewCategory | 'all'>('all');

  const visiblePopular = POPULAR_REVIEWS.slice(0, popularCount);
  const filteredRecent = useMemo(
    () =>
      category === 'all'
        ? RECENT_REVIEWS
        : RECENT_REVIEWS.filter((r) => r.category === category),
    [category],
  );
  const visibleRecent = filteredRecent.slice(0, recentCount);

  return (
    <div className="it-reviews">
      <ReviewsHeroFold />

      <div className="it-reviews__wrap">
        <ReviewsTrustStrip />
      </div>

      <GoogleReviewsSection />

      <ExperienceReviewsSection />

      {/* Popular Reviews */}
      <section className="it-reviews__section" aria-labelledby="it-rv-popular-title">
        <div className="it-reviews__wrap">
          <header className="it-reviews__section-head">
            <h2 id="it-rv-popular-title">Popular Reviews</h2>
            <p>Photos, ratings, and experiences shared by verified Indian Treks travellers</p>
          </header>
          <div className="it-rv-popular__grid">
            {visiblePopular.map((review) => (
              <PopularReviewCard key={review.id} review={review} />
            ))}
          </div>
          {popularCount < POPULAR_REVIEWS.length ? (
            <div className="it-reviews__load">
              <button
                type="button"
                className="it-reviews__load-btn"
                onClick={() => setPopularCount((n) => n + POPULAR_PAGE)}
              >
                Load more reviews
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {/* Recent Reviews */}
      <section className="it-reviews__section it-reviews__section--wash" aria-labelledby="it-rv-recent-title">
        <div className="it-reviews__wrap">
          <header className="it-reviews__section-head">
            <h2 id="it-rv-recent-title">Recent Reviews</h2>
            <p>Reviews from verified travellers who booked their trips with us</p>
          </header>

          <div className="it-rv-tabs" role="tablist" aria-label="Filter reviews">
            {REVIEW_CATEGORY_TABS.map((tab) => {
              const selected = category === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  className={`it-rv-tabs__btn${selected ? ' is-active' : ''}`}
                  onClick={() => {
                    setCategory(tab.id);
                    setRecentCount(RECENT_PAGE);
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="it-rv-recent__grid">
            {visibleRecent.map((review) => (
              <RecentReviewCard key={review.id} review={review} />
            ))}
          </div>

          {visibleRecent.length === 0 ? (
            <p className="it-rv-recent__empty">No reviews in this category yet.</p>
          ) : null}

          {recentCount < filteredRecent.length ? (
            <div className="it-reviews__load">
              <button
                type="button"
                className="it-reviews__load-btn"
                onClick={() => setRecentCount((n) => n + RECENT_PAGE)}
              >
                Load more reviews
                <span className="it-reviews__load-count">({REVIEWS_PAGE_HERO.totalCountLabel})</span>
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {/* Praise from every corner */}
      <section className="it-reviews__section" aria-labelledby="it-rv-praise-title">
        <div className="it-reviews__wrap">
          <header className="it-reviews__section-head it-reviews__section-head--center">
            <h2 id="it-rv-praise-title">Praise from every corner</h2>
            <p>Customer testimonials from all around!</p>
          </header>
          <div className="it-rv-praise__track">
            {PRAISE_TESTIMONIALS.map((item) => (
              <blockquote key={item.id} className="it-rv-praise__card">
                <p>&ldquo;{item.quote}&rdquo;</p>
                <footer>
                  <strong>{item.name}</strong>
                  <span>{item.role}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Tourism Board Alliances */}
      <section className="it-reviews__section it-reviews__section--compact" aria-labelledby="it-rv-alliance-title">
        <div className="it-reviews__wrap">
          <h2 id="it-rv-alliance-title" className="it-reviews__band-title">
            Tourism Board Alliances
          </h2>
          <div className="it-rv-logos">
            {TOURISM_ALLIANCES.map((item) => (
              <span key={item.id} className="it-rv-logos__item">
                {item.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Our Partners */}
      <section className="it-reviews__section it-reviews__section--compact" aria-labelledby="it-rv-partners-title">
        <div className="it-reviews__wrap">
          <h2 id="it-rv-partners-title" className="it-reviews__band-title">
            Our Partners
          </h2>
          <div className="it-rv-logos it-rv-logos--partners">
            {REVIEW_PARTNERS.map((item) => (
              <span key={item.id} className="it-rv-logos__item">
                {item.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Buzzworthy Stories */}
      <section className="it-reviews__section it-reviews__section--wash" aria-labelledby="it-rv-buzz-title">
        <div className="it-reviews__wrap">
          <header className="it-reviews__section-head">
            <h2 id="it-rv-buzz-title">Buzzworthy Stories</h2>
            <p>Read what media has to talk about us!</p>
          </header>
          <div className="it-rv-buzz__grid">
            {BUZZWORTHY_STORIES.map((story) => (
              <Link key={story.id} href={story.href} className="it-rv-buzz__card">
                <span className="it-rv-buzz__outlet">{story.outlet}</span>
                <strong>{story.title}</strong>
                <span className="it-rv-buzz__date">{story.date}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose */}
      <section className="it-reviews__section" aria-labelledby="it-rv-why-title">
        <div className="it-reviews__wrap">
          <header className="it-reviews__section-head it-reviews__section-head--center">
            <h2 id="it-rv-why-title">Why Choose Indian Treks</h2>
          </header>
          <div className="it-rv-why__grid">
            {WHY_CHOOSE_REVIEWS.map((item) => (
              <article key={item.title} className="it-rv-why__card">
                <span className="it-rv-why__ico" aria-hidden>
                  <i className={`fa-solid ${item.icon}`} />
                </span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
