'use client';

import { useEffect, useState } from 'react';
import { cldUrl } from '@/lib/cloudinary';

/**
 * UI/UX from https://indiantreks.in/about-us/ — “Our Apprecition Letter”:
 * section heading, Doon University appreciation story + commendation bullets,
 * letter/certificate image gallery with lightbox.
 */

const LETTERS = [
  {
    src: cldUrl(
      'https://indiantreks.in/wp-content/uploads/2023/01/Appriciation-Letter-Indian-Treaks-1-1.jpg',
      { w: 1200, crop: 'fit', quality: 'auto' },
    ),
    alt: 'Appreciation letter from Doon University to Indian Treks',
  },
  {
    src: cldUrl(
      'https://indiantreks.in/wp-content/uploads/2023/01/1674876430957_certificate.jpg',
      { w: 1200, crop: 'fit', quality: 'auto' },
    ),
    alt: 'Certificate of appreciation for Indian Treks',
  },
  {
    src: cldUrl(
      'https://indiantreks.in/wp-content/uploads/2023/01/IMG-20230124-WA0010.jpg',
      { w: 1200, crop: 'fit', quality: 'auto' },
    ),
    alt: 'Official recognition letter for Indian Treks',
  },
] as const;

const COMMENDATIONS = [
  'Skillfully planning a well-organized trek schedule',
  'Ensuring the comfort, safety, and wellbeing of students during the trip',
  'Delivering first-rate food, lodging, and trekking instruction',
  'Providing an unforgettable and enriching outdoor experience',
] as const;

export default function AppreciationLetters() {
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null);
      if (e.key === 'ArrowRight') setActive((i) => (i === null ? 0 : (i + 1) % LETTERS.length));
      if (e.key === 'ArrowLeft')
        setActive((i) => (i === null ? 0 : (i - 1 + LETTERS.length) % LETTERS.length));
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [active]);

  return (
    <section className="it-apprec" aria-labelledby="it-apprec-title">
      <style>{`
        .it-apprec {
          --it-primary: #16a34a;
          --it-primary-mid: #4ade80;
          --it-border: rgba(22, 163, 74, 0.14);
          --it-soft: #f0fdf4;
          --it-text: #141414;
          --it-wrap: 1180px;
          padding: 58px 0 40px;
          position: relative;
          overflow: hidden;
        }

        .it-apprec * { box-sizing: border-box; }

        .it-apprec::before {
          content: "";
          position: absolute;
          left: -100px;
          top: -60px;
          width: 260px;
          height: 260px;
          background: radial-gradient(circle, rgba(74, 222, 128, 0.12), transparent 72%);
          pointer-events: none;
        }

        .it-apprec__wrap {
          width: min(var(--it-wrap), calc(100% - 34px));
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .it-apprec__head {
          text-align: center;
          max-width: 820px;
          margin: 0 auto 28px;
        }

        .it-apprec__kicker {
          display: inline-flex;
          padding: 8px 15px;
          border-radius: 999px;
          border: 1px solid var(--it-border);
          background: #fff;
          color: var(--it-primary);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          box-shadow: 0 10px 22px rgba(0, 0, 0, 0.04);
          margin-bottom: 12px;
        }

        .it-apprec__title {
          margin: 0 0 12px;
          font-family: var(--font-heading), ui-sans-serif, system-ui, sans-serif;
          font-size: clamp(1.75rem, 3.5vw, 2.15rem);
          line-height: 1.15;
          letter-spacing: -0.03em;
          font-weight: 900;
          color: var(--it-text);
        }

        .it-apprec__title span { color: var(--it-primary); }

        .it-apprec__lead {
          margin: 0;
          font-size: 14.5px;
          line-height: 1.7;
          color: #3f3f3f;
          font-weight: 500;
        }

        .it-apprec__body {
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 28px;
          align-items: start;
          margin-bottom: 28px;
        }

        .it-apprec__copy p {
          margin: 0 0 12px;
          font-size: 14px;
          line-height: 1.7;
          color: #3f3f3f;
        }

        .it-apprec__copy p:last-child { margin-bottom: 0; }

        .it-apprec__note {
          margin-top: 14px;
          padding: 14px 16px;
          border-radius: 16px;
          border: 1px solid var(--it-border);
          background: linear-gradient(180deg, #fff, var(--it-soft));
          position: relative;
        }

        .it-apprec__note::before {
          content: "";
          position: absolute;
          left: 0;
          top: 12px;
          bottom: 12px;
          width: 4px;
          border-radius: 999px;
          background: linear-gradient(180deg, var(--it-primary), var(--it-primary-mid));
        }

        .it-apprec__note strong {
          display: block;
          margin: 0 0 8px;
          padding-left: 10px;
          font-size: 13px;
          font-weight: 800;
          color: var(--it-text);
        }

        .it-apprec__note ul {
          margin: 0;
          padding: 0 0 0 26px;
          list-style: disc;
        }

        .it-apprec__note li {
          font-size: 13px;
          line-height: 1.55;
          color: #3f3f3f;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .it-apprec__gallery {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .it-apprec__card {
          position: relative;
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid var(--it-border);
          background: #fff;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.06);
          cursor: zoom-in;
          padding: 0;
          display: block;
          width: 100%;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }

        .it-apprec__card:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 36px rgba(22, 163, 74, 0.14);
        }

        .it-apprec__card img {
          width: 100%;
          height: 280px;
          object-fit: cover;
          object-position: top center;
          display: block;
          transition: transform 0.35s ease;
        }

        .it-apprec__card:hover img {
          transform: scale(1.03);
        }

        .it-apprec__card-label {
          position: absolute;
          left: 10px;
          right: 10px;
          bottom: 10px;
          z-index: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 10px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.62);
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          backdrop-filter: blur(6px);
        }

        .it-apprec__lightbox {
          position: fixed;
          inset: 0;
          z-index: 80;
          background: rgba(0, 0, 0, 0.88);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .it-apprec__lightbox img {
          max-width: min(920px, 100%);
          max-height: 88vh;
          object-fit: contain;
          border-radius: 12px;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
        }

        .it-apprec__close,
        .it-apprec__nav {
          position: absolute;
          border: 0;
          background: rgba(255, 255, 255, 0.12);
          color: #fff;
          width: 42px;
          height: 42px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 18px;
        }

        .it-apprec__close { top: 18px; right: 18px; }
        .it-apprec__nav--prev { left: 16px; top: 50%; transform: translateY(-50%); }
        .it-apprec__nav--next { right: 16px; top: 50%; transform: translateY(-50%); }

        @media (max-width: 980px) {
          .it-apprec__body { grid-template-columns: 1fr; gap: 18px; }
          .it-apprec__gallery {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            max-width: none;
            margin: 0;
            gap: 10px;
          }
          .it-apprec__card img { height: 180px; }
        }

        @media (max-width: 640px) {
          .it-apprec { padding: 32px 0 24px; }
          .it-apprec__wrap { width: min(var(--it-wrap), calc(100% - 24px)); }
          .it-apprec__title { font-size: 24px; line-height: 1.2; }
          .it-apprec__lead { font-size: 13px; line-height: 1.65; }
          .it-apprec__copy p { font-size: 13px; line-height: 1.65; }
          .it-apprec__list { font-size: 12.5px; padding-left: 18px; }
          .it-apprec__gallery {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }
          .it-apprec__card img { height: 140px; }
          .it-apprec__card figcaption { font-size: 10px; padding: 6px 8px; }
          .it-apprec__lightbox { padding: 12px; }
          .it-apprec__frame { padding: 12px; border-radius: 14px; }
          .it-apprec__close { top: 10px; right: 10px; }
          .it-apprec__nav--prev { left: 8px; }
          .it-apprec__nav--next { right: 8px; }
        }
      `}</style>

      <div className="it-apprec__wrap">
        <div className="it-apprec__head">
          <span className="it-apprec__kicker">Appreciation Letters</span>
          <h2 className="it-apprec__title" id="it-apprec-title">
            Our <span>Appreciation</span> Letter
          </h2>
          <p className="it-apprec__lead">
            Official letters of gratitude that reflect Indian Treks&apos; commitment to safe,
            well-designed, and enriching mountain journeys.
          </p>
        </div>

        <div className="it-apprec__body">
          <div className="it-apprec__copy">
            <p>
              Doon University has given Indiantreks, under the direction of Mr. Vivek Rana, top marks
              for planning outstanding trekking trips. The award demonstrates Indiantreks&apos;
              dedication to satisfying outdoor enthusiasts with safe, well designed, and enriching
              experiences. With Mr. Rana&apos;s instructions, each journey is carefully organized with
              participant safety and enjoyment as top priorities. His extensive local expertise and
              persistent dedication to professionalism have established Indiantreks as an established
              company in the adventure trip industry.
            </p>
            <p>
              This Doon University recommendation emphasizes how Indiantreks promotes outdoor
              recreation and encourages an adventurous spirit in its participants. It displays the
              company&apos;s commitment to giving every trekker an enjoyable and fulfilling experience.
            </p>
            <div className="it-apprec__note">
              <strong>
                Dr. Surendra Singh Suthar, Associate Professor and Faculty In-Charge (Student Tour),
                School of Environment &amp; Natural Resources, Doon University, emphasized the
                professionalism, commitment, and effectiveness of our team in an official letter of
                gratitude. In the letter, Indiantreks was commended for:
              </strong>
              <ul>
                {COMMENDATIONS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="it-apprec__gallery" role="list">
            {LETTERS.map((letter, i) => (
              <button
                key={letter.src}
                type="button"
                className="it-apprec__card"
                onClick={() => setActive(i)}
                aria-label={`View ${letter.alt}`}
              >
                <img src={letter.src} alt={letter.alt} />
                <span className="it-apprec__card-label">
                  <i className="fa-solid fa-expand" aria-hidden />
                  View letter
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {active !== null && (
        <div
          className="it-apprec__lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Appreciation letter preview"
          onClick={() => setActive(null)}
        >
          <button
            type="button"
            className="it-apprec__close"
            aria-label="Close"
            onClick={() => setActive(null)}
          >
            <i className="fa-solid fa-xmark" aria-hidden />
          </button>
          <button
            type="button"
            className="it-apprec__nav it-apprec__nav--prev"
            aria-label="Previous letter"
            onClick={(e) => {
              e.stopPropagation();
              setActive((i) => (i === null ? 0 : (i - 1 + LETTERS.length) % LETTERS.length));
            }}
          >
            <i className="fa-solid fa-chevron-left" aria-hidden />
          </button>
          <img
            src={LETTERS[active].src}
            alt={LETTERS[active].alt}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            className="it-apprec__nav it-apprec__nav--next"
            aria-label="Next letter"
            onClick={(e) => {
              e.stopPropagation();
              setActive((i) => (i === null ? 0 : (i + 1) % LETTERS.length));
            }}
          >
            <i className="fa-solid fa-chevron-right" aria-hidden />
          </button>
        </div>
      )}
    </section>
  );
}
