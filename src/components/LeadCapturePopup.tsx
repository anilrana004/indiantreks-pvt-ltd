'use client';

import {
  FormEvent,
  useCallback,
  useEffect,
  useId,
  useState,
  type ChangeEvent,
} from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { publicApiFetch, publicApiErrorMessage } from '@/lib/api/client';
import { photos } from '@/lib/media';
import { SITE_NAME } from '@/lib/site';
import './LeadCapturePopup.css';

const STORAGE_KEY = 'it-lead-popup-dismissed';
const OPEN_DELAY_MS = 1600;

const TRIP_CATEGORIES = [
  'Himalayan Trek',
  'Winter Trek',
  'Sacred Yatra',
  'Weekend Trip',
  'Customized Trip',
  'International Expedition',
  'Family / Group',
] as const;

const LOCATIONS = [
  'Uttarakhand',
  'Himachal Pradesh',
  'Nepal',
  'Ladakh / Kashmir',
  'Not sure yet',
] as const;

type FormState = {
  name: string;
  email: string;
  phone: string;
  category: string;
  location: string;
  updates: boolean;
};

const emptyForm: FormState = {
  name: '',
  email: '',
  phone: '',
  category: '',
  location: '',
  updates: true,
};

/**
 * Winter-sale lead popup — two-column on desktop, stacked card on phone.
 * Shows once per browser session after a short delay.
 */
export default function LeadCapturePopup() {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const dismiss = useCallback(() => {
    setOpen(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') return;
    } catch {
      /* private mode */
    }

    const timer = window.setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [mounted]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, dismiss]);

  const setField =
    (key: keyof FormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = key === 'updates' ? (e.target as HTMLInputElement).checked : e.target.value;
      setForm((prev) => ({ ...prev, [key]: value }));
      if (error) setError('');
    };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.category) {
      setError('Please fill name, email, phone, and trip category.');
      return;
    }
    setSending(true);
    setError('');
    try {
      const res = await publicApiFetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          message: [
            'Source: Homepage lead popup',
            `Category: ${form.category}`,
            `Location: ${form.location || 'Not specified'}`,
            `Updates opt-in: ${form.updates ? 'Yes' : 'No'}`,
            '',
            'Please help me plan my next trip.',
          ].join('\n'),
        }),
      });
      if (!res.ok) throw new Error(await publicApiErrorMessage(res));
      setSent(true);
      setForm(emptyForm);
      window.setTimeout(() => dismiss(), 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div className="it-lead-popup" role="presentation" onClick={dismiss}>
      <div
        className="it-lead-popup__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="it-lead-popup__close" aria-label="Close" onClick={dismiss}>
          <i className="fa-solid fa-xmark" aria-hidden />
        </button>

        <aside className="it-lead-popup__promo">
          <Image
            src={photos.kedarkantha}
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 420px, 100vw"
            className="it-lead-popup__promo-img"
          />
          <div className="it-lead-popup__promo-shade" />
          <div className="it-lead-popup__promo-body">
            <span className="it-lead-popup__badge">Early Bird Offer</span>
            <p className="it-lead-popup__eyebrow">The biggest</p>
            <h2 className="it-lead-popup__sale">Winter Sale</h2>
            <p className="it-lead-popup__live">is live now</p>
            <div className="it-lead-popup__deal">
              <span>Discounts up to</span>
              <strong>₹5,500*</strong>
            </div>
            <p className="it-lead-popup__brand">{SITE_NAME}</p>
          </div>
        </aside>

        <div className="it-lead-popup__form-wrap">
          {sent ? (
            <div className="it-lead-popup__success" role="status">
              <i className="fa-solid fa-circle-check" aria-hidden />
              <h3>Thanks — we got your request!</h3>
              <p>Our trip experts will reach out shortly on call or WhatsApp.</p>
            </div>
          ) : (
            <form className="it-lead-popup__form" onSubmit={handleSubmit} noValidate>
              <h3 id={titleId}>Plan Your Next Trip</h3>
              <p className="it-lead-popup__sub">
                Tell us what you&apos;re dreaming of — we&apos;ll craft the right itinerary.
              </p>

              <label className="it-lead-popup__field">
                <span className="sr-only">Full Name</span>
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  placeholder="Full Name *"
                  required
                  value={form.name}
                  onChange={setField('name')}
                />
              </label>

              <div className="it-lead-popup__row">
                <label className="it-lead-popup__field">
                  <span className="sr-only">Email</span>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="Email *"
                    required
                    value={form.email}
                    onChange={setField('email')}
                  />
                </label>
                <label className="it-lead-popup__field it-lead-popup__phone">
                  <span className="sr-only">Phone</span>
                  <span className="it-lead-popup__cc" aria-hidden>
                    +91
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    autoComplete="tel-national"
                    inputMode="numeric"
                    placeholder="Phone *"
                    required
                    value={form.phone}
                    onChange={setField('phone')}
                  />
                </label>
              </div>

              <label className="it-lead-popup__field it-lead-popup__select-wrap">
                <span className="it-lead-popup__float">What kind of trip do you prefer? *</span>
                <select
                  name="category"
                  required
                  value={form.category}
                  onChange={setField('category')}
                >
                  <option value="">Select a category</option>
                  {TRIP_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="it-lead-popup__field it-lead-popup__select-wrap">
                <span className="it-lead-popup__float">Where do you want to go?</span>
                <select name="location" value={form.location} onChange={setField('location')}>
                  <option value="">Select a location</option>
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </label>

              <label className="it-lead-popup__check">
                <input type="checkbox" checked={form.updates} onChange={setField('updates')} />
                <span>
                  Keep me updated with offers, trips, and travel inspiration via email, SMS, and
                  WhatsApp
                </span>
              </label>

              {error ? (
                <p className="it-lead-popup__error" role="alert">
                  {error}
                </p>
              ) : null}

              <button type="submit" className="it-lead-popup__submit" disabled={sending}>
                {sending ? 'Sending…' : 'Plan My Trip'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
