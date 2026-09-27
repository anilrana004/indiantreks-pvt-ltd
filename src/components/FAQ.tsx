'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  HOME_FAQ_CATEGORIES,
  HOME_FAQ_ITEMS,
  type HomeFaqCategory,
} from '@/lib/content/home-faq';
import './home/home-faq.css';

const FAQ_PREVIEW_COUNT = 4;

function FaqBadge() {
  return (
    <span className="it-home-faq__badge" aria-hidden>
      <span className="b1" />
      <span className="b2" />
      <span className="b3" />
      <span className="b-main">FAQ</span>
    </span>
  );
}

export default function FAQ() {
  const [category, setCategory] = useState<HomeFaqCategory>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const catsRef = useRef<HTMLDivElement>(null);

  const items = useMemo(() => {
    const base = category === 'all' ? HOME_FAQ_ITEMS : HOME_FAQ_ITEMS.filter((f) => f.category === category);
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q),
    );
  }, [category, query]);

  useEffect(() => {
    setShowAll(false);
    setOpenId(null);
  }, [category, query]);

  const needsToggle = items.length > FAQ_PREVIEW_COUNT;
  const visibleItems = showAll || !needsToggle ? items : items.slice(0, FAQ_PREVIEW_COUNT);

  const scrollCats = () => {
    const el = catsRef.current;
    if (!el) return;
    const step = Math.min(280, el.clientWidth * 0.55);
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
    el.scrollBy({ left: atEnd ? -el.scrollWidth : step, behavior: 'smooth' });
  };

  return (
    <section className="it-home-faq" aria-labelledby="home-faq-title">
      <div className="it-home-faq__inner">
        <div className="it-home-faq__head">
          <div className="it-home-faq__title-row">
            <h2 id="home-faq-title" className="it-home-faq__title">
              Have any <strong>Doubts</strong>
            </h2>
            <FaqBadge />
          </div>
          <button
            type="button"
            className="it-home-faq__scroll"
            onClick={scrollCats}
            aria-label="Scroll FAQ categories"
          >
            <i className="fa-solid fa-chevron-right" aria-hidden />
          </button>
        </div>

        <div
          ref={catsRef}
          className="it-home-faq__cats"
          role="tablist"
          aria-label="FAQ categories"
        >
          {HOME_FAQ_CATEGORIES.map((cat) => {
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={`it-home-faq__cat${active ? ' is-active' : ''}`}
                onClick={() => {
                  setCategory(cat.id);
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="it-home-faq__search">
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
            placeholder="Ask your queries...."
            aria-label="Search frequently asked questions"
            autoComplete="off"
          />
        </div>

        <div className="it-home-faq__list" role="list">
          {items.length === 0 ? (
            <div className="it-home-faq__empty">
              No questions matched.{' '}
              <Link href="/faqs">Browse all FAQs</Link> or try another keyword.
            </div>
          ) : (
            visibleItems.map((item) => {
              const open = openId === item.id;
              return (
                <div
                  key={item.id}
                  className={`it-home-faq__item${open ? ' is-open' : ''}`}
                  role="listitem"
                >
                  <button
                    type="button"
                    className="it-home-faq__q"
                    aria-expanded={open}
                    onClick={() => setOpenId(open ? null : item.id)}
                  >
                    <span className="it-home-faq__q-text">{item.q}</span>
                    <span className="it-home-faq__chev" aria-hidden>
                      <i className="fa-solid fa-chevron-down" />
                    </span>
                  </button>
                  {open && (
                    <div className="it-home-faq__a">
                      <p>{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {needsToggle && (
          <div className="it-home-faq__toggle-wrap">
            <button
              type="button"
              className="it-home-faq__read-more"
              aria-expanded={showAll}
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? 'Show less' : 'Read more'}
              <i
                className={`fa-solid ${showAll ? 'fa-chevron-up' : 'fa-chevron-down'}`}
                aria-hidden
              />
            </button>
          </div>
        )}

        <div className="it-home-faq__more">
          <Link href="/faqs">
            View all FAQs <i className="fa-solid fa-arrow-right" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
