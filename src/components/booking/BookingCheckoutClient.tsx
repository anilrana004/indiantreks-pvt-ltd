'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { ArrowRight, Shield, Check, ChevronRight, Star, Clock, Users, Phone, Calendar, CreditCard, Lock, Percent, Gift, Loader, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { trekDetailPath, type PricingTier, type Trek } from '@/lib/data';
import {
  bookingSharingLabel,
  bookingSharingOptions,
  defaultBookingPkg,
} from '@/lib/booking-sharing';
import {
  cartForTrek,
  cartSubtotal,
  formatGearLines,
  getGearById,
  parseGearQuery,
  readGearCart,
  subscribeGearCart,
  writeGearCart,
} from '@/lib/gear-rental';
import { whatsappUrl, CONTACT, telUrl } from '@/lib/contact';
import { addOns } from '@/lib/trek-detail-content';
import type { PublicUser } from '@/lib/user-auth/types';
import {
  ensureRazorpayReady,
  openRazorpayCheckout,
  preloadRazorpayCheckout,
  type RazorpayCheckoutOrder,
} from '@/lib/payments/checkout-client';
import type { BookingPayment } from '@/lib/operations/types';
import { safeReturnPath } from '@/lib/security/urls';

type BookingParticipant = {
  id: string;
  name: string;
  age: string;
  gender: string;
  phone: string;
};

function newParticipant(): BookingParticipant {
  return {
    id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: '',
    age: '',
    gender: '',
    phone: '',
  };
}

function formatUserPhone(user: PublicUser): string {
  if (!user.phone) return '';
  const code = user.phoneCountryCode?.trim() || '+91';
  const digits = user.phone.trim();
  if (digits.startsWith('+')) return digits;
  return `${code} ${digits}`.trim();
}

type BookingDraft = {
  form: {
    name: string;
    email: string;
    phone: string;
    city: string;
    persons: string;
    men: string;
    women: string;
    date: string;
    pkg: string;
    pickup: string;
    payment: string;
    notes: string;
  };
  participants: BookingParticipant[];
  step: number;
};

function draftKey(trekId: string) {
  return `it-booking-draft:${trekId}`;
}

function saveBookingDraft(trekId: string, draft: BookingDraft) {
  try {
    sessionStorage.setItem(draftKey(trekId), JSON.stringify(draft));
  } catch {
    /* ignore */
  }
}

function readBookingDraft(trekId: string): BookingDraft | null {
  try {
    const raw = sessionStorage.getItem(draftKey(trekId));
    if (!raw) return null;
    return JSON.parse(raw) as BookingDraft;
  } catch {
    return null;
  }
}

function clearBookingDraft(trekId: string) {
  try {
    sessionStorage.removeItem(draftKey(trekId));
  } catch {
    /* ignore */
  }
}

function BookingContent({ trek }: { trek: Trek }) {
  const sp = useSearchParams();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    persons: sp.get('persons') || '1',
    men: sp.get('men') || sp.get('persons') || '1',
    women: sp.get('women') || '0',
    date: sp.get('date') || '',
    pkg: sp.get('pkg') || '',
    pickup: sp.get('pickup') || '',
    payment: 'deposit',
    notes: '',
  });
  const [participants, setParticipants] = useState<BookingParticipant[]>([]);
  const [signedInUser, setSignedInUser] = useState<PublicUser | null>(null);
  /** UX only — real security is enforced by booking/payment APIs. */
  const [authStatus, setAuthStatus] = useState<'checking' | 'guest' | 'signed_in'>('checking');
  const [openingLogin, setOpeningLogin] = useState(false);
  const loginRedirectStarted = useRef(false);
  const [profileFilled, setProfileFilled] = useState(false);
  const [gearTick, setGearTick] = useState(0);
  const [livePricing, setLivePricing] = useState<PricingTier[] | null>(null);

  useEffect(() => {
    if (!trek) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/treks/${encodeURIComponent(trek.id)}/packages`, {
          credentials: 'same-origin',
        });
        if (!res.ok) return;
        const data = (await res.json()) as { packages?: PricingTier[] };
        if (!cancelled && Array.isArray(data.packages) && data.packages.length > 0) {
          setLivePricing(data.packages);
        }
      } catch {
        /* keep catalog display */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [trek]);

  const gearQuery = sp.get('gear');
  const returnTo = safeReturnPath(sp.get('returnTo'), '');
  // Empty string fallback means "no returnTo" for back link — coerce to null.
  const returnToHref = returnTo || null;

  useEffect(() => {
    if (!trek) return;
    const fromUrl = parseGearQuery(gearQuery, trek.id);
    if (fromUrl.length) {
      const others = readGearCart().filter((line) => line.trekId !== trek.id);
      writeGearCart([...others, ...fromUrl]);
    }
    const refresh = () => setGearTick((n) => n + 1);
    refresh();
    return subscribeGearCart(refresh);
  }, [trek, gearQuery]);

  useEffect(() => {
    if (!trek) return;
    const draft = readBookingDraft(trek.id);
    if (!draft) return;
    setForm((f) => ({ ...f, ...draft.form }));
    if (Array.isArray(draft.participants) && draft.participants.length) {
      setParticipants(draft.participants);
    }
    if (draft.step >= 1 && draft.step <= 3) setStep(draft.step);
  }, [trek]);

  useEffect(() => {
    let cancelled = false;

    // 1) Instant JWT peek (no DB) — unlocks Pay Now / Login CTA in milliseconds.
    void (async () => {
      try {
        const peek = await fetch('/api/user/auth/session', {
          credentials: 'include',
          cache: 'default',
        });
        if (cancelled) return;
        if (!peek.ok) {
          setAuthStatus('guest');
          setSignedInUser(null);
          return;
        }
        setAuthStatus('signed_in');
      } catch {
        if (!cancelled) {
          setAuthStatus('guest');
          setSignedInUser(null);
        }
      }
    })();

    // 2) Full profile hydrate in the background (DB) — never blocks Pay Now.
    void (async () => {
      try {
        const res = await fetch('/api/user/auth/me', { credentials: 'include', cache: 'no-store' });
        if (cancelled) return;
        if (!res.ok) {
          setSignedInUser(null);
          setAuthStatus('guest');
          return;
        }
        const body = (await res.json()) as { user: PublicUser };
        const user = body.user;
        if (!user || cancelled) {
          setAuthStatus('guest');
          return;
        }
        setSignedInUser(user);
        setAuthStatus('signed_in');
        setForm((f) => ({
          ...f,
          name: f.name.trim() || user.name || [user.firstName, user.lastName].filter(Boolean).join(' '),
          email: f.email.trim() || user.email || '',
          phone: f.phone.trim() || formatUserPhone(user),
        }));
        setProfileFilled(true);
      } catch {
        /* peek already set authStatus; leave as-is */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Prefetch login for guests. Load Razorpay SDK only when user reaches Confirm (payment step).
  useEffect(() => {
    if (authStatus === 'guest') {
      try {
        router.prefetch('/login');
      } catch {
        /* ignore */
      }
    }
  }, [authStatus, router]);

  useEffect(() => {
    if (step === 3 && authStatus === 'signed_in') {
      preloadRazorpayCheckout();
    }
  }, [step, authStatus]);

  const gearLines = useMemo(
    () => cartForTrek(trek.id),
    [trek.id, gearTick],
  );
  const gearTotal = cartSubtotal(gearLines);

  const pricingTiers = livePricing ?? trek.pricing ?? [];
  const sharingOptions = useMemo(
    () => (pricingTiers.length ? bookingSharingOptions(pricingTiers) : []),
    [pricingTiers],
  );
  const pkgKey = useMemo(() => {
    if (sharingOptions.some((o) => o.key === form.pkg)) return form.pkg;
    return defaultBookingPkg(pricingTiers.length ? pricingTiers : trek.pricing);
  }, [trek.pricing, sharingOptions, form.pkg, pricingTiers]);
  const pkgLabel = bookingSharingLabel(pricingTiers.length ? pricingTiers : trek.pricing, pkgKey);

  const redirectToLogin = () => {
    if (loginRedirectStarted.current) return;
    loginRedirectStarted.current = true;
    setOpeningLogin(true);
    saveBookingDraft(trek.id, { form, participants, step: 3 });
    const from = `${window.location.pathname}${window.location.search || ''}`;
    // Hard navigation is faster than soft router.push for auth handoff.
    window.location.assign(`/login?from=${encodeURIComponent(from)}`);
  };

  const backHref = returnToHref || trekDetailPath(trek);
  const selectedPkg =
    pricingTiers.find((p) => p.name === pkgKey) ||
    pricingTiers[0] ||
    trek.pricing.find((p) => p.name === pkgKey) ||
    trek.pricing[0];
  const personCount = Math.max(1, parseInt(form.persons, 10) || 1);
  const pickupFee = Math.max(0, parseInt(sp.get('pickupFee') || '0', 10) || 0);
  const selectedAddonIds = (sp.get('addons') || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  const selectedAddons = addOns.filter((addon) => selectedAddonIds.includes(addon.id));
  const addOnPerPerson = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
  const unitPrice = selectedPkg.price + pickupFee;
  const tripTotal = unitPrice * personCount + addOnPerPerson * personCount;
  const urlTotal = parseInt(sp.get('total') || '0', 10);
  const total = urlTotal > 0 ? urlTotal : tripTotal + gearTotal;
  const depositAmt = selectedPkg.deposit * personCount;
  const payableNow = form.payment === 'deposit' ? depositAmt : form.payment === 'full' ? total : Math.ceil(tripTotal / 2) + gearTotal;
  const expectedOthers = Math.max(0, personCount - 1);
  const namedParticipants = participants.filter((p) => p.name.trim());

  const steps = [
    { num: 1, label: 'Package & Date', icon: Calendar },
    { num: 2, label: 'Your Details', icon: Users },
    { num: 3, label: 'Confirm', icon: Check },
  ];

  const updateParticipant = (id: string, patch: Partial<BookingParticipant>) => {
    setParticipants((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const addParticipant = () => {
    setParticipants((list) => [...list, newParticipant()]);
  };

  const removeParticipant = (id: string) => {
    setParticipants((list) => list.filter((p) => p.id !== id));
  };

  const launchCheckout = async (
    bookingId: string,
    checkoutToken: string,
    order: RazorpayCheckoutOrder,
  ) => {
    clearBookingDraft(trek.id);
    try {
      sessionStorage.setItem(`it-checkout:${bookingId}`, checkoutToken);
    } catch {
      /* ignore */
    }

    await ensureRazorpayReady();
    await openRazorpayCheckout(order, {
      onSuccess: async (response) => {
        try {
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              bookingId,
              checkoutToken,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const verifyBody = await verifyRes.json();
          if (!verifyRes.ok) {
            throw new Error(verifyBody.error || 'Payment verification failed');
          }
          router.push(
            `/booking/success?bookingId=${encodeURIComponent(bookingId)}`,
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Verification failed';
          router.push(
            `/booking/payment-failed?bookingId=${encodeURIComponent(bookingId)}&reason=${encodeURIComponent(message)}`,
          );
        } finally {
          setPaying(false);
        }
      },
      onDismiss: () => {
        setPaying(false);
        setPayError('Payment window closed. You can try again when ready.');
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep((s) => s + 1);
      return;
    }
    if (paying || openingLogin) return;
    setPayError('');

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.date) {
      setPayError('Please complete your contact details and travel date.');
      setStep(2);
      return;
    }

    // Guest → login immediately (no waiting on /me hydrate).
    if (authStatus === 'guest') {
      redirectToLogin();
      return;
    }

    // Still peeking — one ultra-light check, then login or pay.
    if (authStatus === 'checking') {
      try {
        const peek = await fetch('/api/user/auth/session', {
          credentials: 'include',
          cache: 'default',
        });
        if (!peek.ok) {
          setAuthStatus('guest');
          redirectToLogin();
          return;
        }
        setAuthStatus('signed_in');
      } catch {
        setAuthStatus('guest');
        redirectToLogin();
        return;
      }
    }

    setPaying(true);

    try {
      // Click-only: create booking + order while Razorpay SDK finishes loading (preloaded on step 3).
      const [, payRes] = await Promise.all([
        ensureRazorpayReady(),
        fetch('/api/bookings/pay', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': `pay:${trek.id}:${form.date}:${personCount}:${form.payment}:${pkgKey}:${form.email}`,
          },
          credentials: 'include',
          body: JSON.stringify({
            trekId: trek.id,
            packageName: pkgKey,
            persons: personCount,
            paymentMode: form.payment as BookingPayment,
            addonIds: selectedAddonIds,
            pickupFeePerPerson: pickupFee,
            gearLines: gearLines.map((g) => ({ gearId: g.gearId, qty: g.qty })),
            name: form.name,
            email: form.email,
            phone: form.phone,
            city: form.city,
            date: form.date,
            batchId: sp.get('batchId') || undefined,
            notes: form.notes,
            pickup: form.pickup,
            participants: namedParticipants.map(({ name, age, gender, phone }) => ({
              name,
              age,
              gender,
              phone,
            })),
          }),
        }),
      ]);
      const payBody = await payRes.json();
      if (payRes.status === 401 || payBody.code === 'AUTH_REQUIRED') {
        setPayError('Please log in to continue with your booking.');
        redirectToLogin();
        setPaying(false);
        return;
      }
      if (!payRes.ok) {
        throw new Error(payBody.error || 'Unable to start payment');
      }

      const { bookingId, checkoutToken, ...order } = payBody as {
        bookingId: string;
        checkoutToken: string;
      } & RazorpayCheckoutOrder;

      await launchCheckout(bookingId, checkoutToken, order);
    } catch (err) {
      setPaying(false);
      setPayError(err instanceof Error ? err.message : 'Payment could not be started');
    }
  };

  return (
    <div className="pt-20 lg:pt-24 pb-12 lg:pb-20 bg-gray-50 min-h-screen">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-6 lg:mb-8">
          <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#16a34a] transition-colors mb-4">
            <ChevronRight className="w-4 h-4 rotate-180" /> Back to {trek.title}
          </Link>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl lg:text-3xl font-bold text-[#000000]">Complete Your Booking</h1>
          <p className="text-gray-500 text-sm mt-1">{trek.title} &middot; {trek.duration} &middot; {trek.location}</p>
          {(form.pickup || selectedAddons.length > 0 || gearLines.length > 0) && (
            <div className="mt-4 rounded-2xl border border-[#16a34a]/15 bg-[#16a34a]/5 p-4 text-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-[#15803d] mb-2">Your trek selections</p>
              <ul className="space-y-1.5 text-gray-700">
                <li><span className="text-gray-500">Occupancy:</span> <strong>{pkgLabel}</strong></li>
                {form.pickup ? <li><span className="text-gray-500">Pickup:</span> <strong>{form.pickup}{pickupFee ? ` (+₹${pickupFee.toLocaleString()}/person)` : ''}</strong></li> : null}
                <li><span className="text-gray-500">Travellers:</span> <strong>{personCount} (Men {form.men}, Women {form.women})</strong></li>
                {form.date ? <li><span className="text-gray-500">Date:</span> <strong>{form.date}</strong></li> : null}
                {selectedAddons.map((addon) => (
                  <li key={addon.id}><span className="text-gray-500">{addon.name}:</span> <strong>+₹{(addon.price * personCount).toLocaleString()}</strong></li>
                ))}
                {gearLines.length > 0 ? <li><span className="text-gray-500">Rental gear:</span> <strong>{formatGearLines(gearLines)}</strong></li> : null}
              </ul>
              <div className="mt-3 flex justify-between border-t border-[#16a34a]/10 pt-3 font-semibold">
                <span>Estimated total</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-1 lg:gap-3 mb-8 lg:mb-10">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-1 lg:gap-3">
              <div className={`flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 rounded-full transition-all ${step >= s.num ? 'bg-[#16a34a] text-white shadow-sm shadow-[#16a34a]/30' : 'bg-white text-gray-400 border border-gray-200'}`}>
                <div className={`w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center text-xs lg:text-sm font-bold ${step > s.num ? 'bg-white text-[#16a34a]' : ''}`}>
                  {step > s.num ? <Check className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> : s.num}
                </div>
                <span className={`text-xs lg:text-sm font-semibold hidden sm:inline ${step >= s.num ? 'text-white' : 'text-gray-500'}`}>{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className={`w-6 lg:w-10 h-0.5 ${step > s.num ? 'bg-[#16a34a]' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-5">
            {step === 1 && (
              <>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:p-7">
                  <h2 className="font-bold text-lg text-[#000000] mb-5">Select Package</h2>
                  <div className={`grid gap-3 ${sharingOptions.length >= 3 ? 'grid-cols-1 sm:grid-cols-3' : sharingOptions.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 max-w-sm'}`}>
                    {sharingOptions.map(p => (
                      <button key={p.key} type="button" onClick={() => setForm(f => ({ ...f, pkg: p.key }))}
                        className={`relative p-4 rounded-xl border-2 text-center transition-all ${pkgKey === p.key ? 'border-[#16a34a] bg-[#16a34a]/5 shadow-sm' : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
                        {p.badge && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#16a34a] text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap">{p.badge}</span>}
                        <div className="mt-1">
                          <div className="font-bold text-sm text-[#000000]">{p.label}</div>
                          <div className="text-xl lg:text-2xl font-bold text-[#16a34a] mt-1">₹{p.price.toLocaleString()}</div>
                          <div className="text-xs text-gray-400">per person</div>
                          {p.originalPrice && <div className="text-xs text-gray-400 line-through mt-1">₹{p.originalPrice.toLocaleString()}</div>}
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="text-xs font-semibold text-[#16a34a]">Deposit ₹{p.deposit.toLocaleString()}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:p-7">
                  <h2 className="font-bold text-lg text-[#000000] mb-5">Trip Details</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Travel Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 outline-none transition-all text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Number of Persons</label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select value={form.persons} onChange={e => setForm(f => ({ ...f, persons: e.target.value }))}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 outline-none transition-all text-sm appearance-none bg-white">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n} Person{n > 1 ? 's' : ''}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:p-7">
                  <h2 className="font-bold text-lg text-[#000000] mb-5">Payment Mode</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { v: 'deposit', l: 'Advance Deposit', d: `Pay ₹${depositAmt.toLocaleString()} now`, sub: 'Secure your spot' },
                      { v: 'half', l: '50% Now, 50% Later', d: `Pay ₹${Math.ceil(tripTotal / 2).toLocaleString()} now`, sub: 'Split payment' },
                      { v: 'full', l: 'Full Payment', d: `Pay ₹${total.toLocaleString()} now`, sub: 'Best value' },
                    ].map(o => (
                      <button key={o.v} type="button" onClick={() => setForm(f => ({ ...f, payment: o.v }))}
                        className={`p-4 rounded-xl border-2 text-center transition-all ${form.payment === o.v ? 'border-[#16a34a] bg-[#16a34a]/5 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}>
                        <div className="text-xs font-semibold text-gray-700">{o.l}</div>
                        <div className="text-sm font-bold text-[#000000] mt-1">{o.d}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{o.sub}</div>
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                    <Lock className="w-3.5 h-3.5 text-[#16a34a]" /> Secure payment via Razorpay. Card details never touch our servers.
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:p-7">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                    <h2 className="font-bold text-lg text-[#000000]">Your Contact Details</h2>
                    {signedInUser && profileFilled ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#16a34a]/10 px-3 py-1 text-[11px] font-semibold text-[#15803d]">
                        <Check className="w-3 h-3" />
                        Filled from your account
                      </span>
                    ) : null}
                  </div>
                  {signedInUser ? (
                    <p className="mb-4 text-xs text-gray-500">
                      Signed in as <span className="font-semibold text-gray-700">{signedInUser.email}</span>. You&apos;re the lead traveller — add anyone else joining below.
                    </p>
                  ) : null}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-400">*</span></label>
                      <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 outline-none transition-all text-sm" placeholder="Your full name" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-red-400">*</span></label>
                      <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 outline-none transition-all text-sm" placeholder="email@example.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number <span className="text-red-400">*</span></label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="tel" required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 outline-none transition-all text-sm" placeholder="+91 98765 43210" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                      <input type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 outline-none transition-all text-sm" placeholder="Your city" />
                    </div>
                  </div>
                  <div className="mt-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Special Requests <span className="text-gray-400">(optional)</span></label>
                    <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 outline-none transition-all text-sm resize-none" placeholder="Dietary needs, health conditions, room preferences..." />
                  </div>
                  <div className="mt-5 bg-[#16a34a]/5 rounded-xl p-4 flex items-start gap-3">
                    <Shield className="w-5 h-5 text-[#16a34a] shrink-0 mt-0.5" />
                    <div className="text-xs text-gray-600 leading-relaxed">Your information is secure. After you pay on Razorpay, our backend verifies the payment before confirming your booking. No card details are stored on our servers.</div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:p-7">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                    <div>
                      <h2 className="font-bold text-lg text-[#000000]">Other Participants</h2>
                      <p className="text-xs text-gray-500 mt-1">
                        {expectedOthers > 0
                          ? `Add details for the other ${expectedOthers} traveller${expectedOthers > 1 ? 's' : ''} joining with you.`
                          : 'Travelling solo? You can skip this — or add someone if plans change.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addParticipant}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#16a34a]/30 bg-[#16a34a]/5 px-4 py-2 text-sm font-semibold text-[#15803d] hover:bg-[#16a34a]/10 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add participant
                    </button>
                  </div>

                  {participants.length === 0 ? (
                    <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
                      <Users className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                      <p className="text-sm text-gray-500">No other participants yet</p>
                      <button
                        type="button"
                        onClick={addParticipant}
                        className="mt-3 text-sm font-semibold text-[#16a34a] hover:text-[#15803d]"
                      >
                        + Add a co-traveller
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {participants.map((p, index) => (
                        <div key={p.id} className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                              Participant {index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeParticipant(p.id)}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                              aria-label={`Remove participant ${index + 1}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Remove
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-xs font-medium text-gray-600 mb-1">Full name</label>
                              <input
                                type="text"
                                value={p.name}
                                onChange={(e) => updateParticipant(p.id, { name: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 outline-none transition-all text-sm"
                                placeholder="Co-traveller full name"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Age</label>
                              <input
                                type="number"
                                min={1}
                                max={120}
                                value={p.age}
                                onChange={(e) => updateParticipant(p.id, { age: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 outline-none transition-all text-sm"
                                placeholder="Age"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Gender</label>
                              <select
                                value={p.gender}
                                onChange={(e) => updateParticipant(p.id, { gender: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 outline-none transition-all text-sm"
                              >
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-xs font-medium text-gray-600 mb-1">Phone <span className="text-gray-400">(optional)</span></label>
                              <input
                                type="tel"
                                value={p.phone}
                                onChange={(e) => updateParticipant(p.id, { phone: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 outline-none transition-all text-sm"
                                placeholder="+91 …"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      {expectedOthers > 0 && participants.length < expectedOthers ? (
                        <p className="text-xs text-[#15803d]">
                          {expectedOthers - participants.length} more participant{expectedOthers - participants.length > 1 ? 's' : ''} suggested for your group size.
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:p-7">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-[#16a34a]/10 rounded-full flex items-center justify-center mx-auto mb-3"><Check className="w-7 h-7 text-[#16a34a]" /></div>
                  <h2 className="font-bold text-xl text-[#000000]">Review & Confirm</h2>
                  <p className="text-gray-500 text-sm mt-1">Please verify all details before submitting</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0"><img src={trek.images[0]} alt="" className="w-full h-full object-cover" /></div>
                    <div><h4 className="font-semibold text-sm text-[#000000]">{trek.title}</h4><p className="text-xs text-gray-500">{trek.duration} &middot; {trek.difficulty}</p></div>
                  </div>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Package</span><span className="font-semibold">{pkgLabel} - ₹{selectedPkg.price.toLocaleString()}/person</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Travel Date</span><span className="font-semibold">{form.date}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Persons</span><span className="font-semibold">{personCount} (Men {form.men}, Women {form.women})</span></div>
                    {form.pickup ? <div className="flex justify-between"><span className="text-gray-500">Pickup</span><span className="font-semibold">{form.pickup}{pickupFee ? ` (+₹${pickupFee.toLocaleString()}/person)` : ''}</span></div> : null}
                    {selectedAddons.map((addon) => (
                      <div key={addon.id} className="flex justify-between gap-3">
                        <span className="text-gray-500">{addon.name}</span>
                        <span className="font-semibold">+₹{(addon.price * personCount).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-semibold">{form.name || 'Not provided'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="font-semibold">{form.phone || 'Not provided'}</span></div>
                    {form.city.trim() ? <div className="flex justify-between"><span className="text-gray-500">City</span><span className="font-semibold">{form.city}</span></div> : null}
                    {namedParticipants.length > 0 ? (
                      <div className="pt-1">
                        <div className="text-gray-500 mb-1.5">Other participants</div>
                        <ul className="space-y-1 text-right">
                          {namedParticipants.map((p) => (
                            <li key={p.id} className="font-semibold">
                              {p.name}
                              {p.age.trim() ? ` · ${p.age}` : ''}
                              {p.gender.trim() ? ` · ${p.gender}` : ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div className="flex justify-between"><span className="text-gray-500">Payment Mode</span><span className="font-semibold">{form.payment === 'deposit' ? 'Advance Deposit' : form.payment === 'full' ? 'Full Payment' : '50% Now'}</span></div>
                    {form.notes && <div className="flex justify-between"><span className="text-gray-500">Notes</span><span className="font-semibold text-right max-w-[60%]">{form.notes}</span></div>}
                    {gearLines.length > 0 && (
                      <div className="flex justify-between gap-3">
                        <span className="text-gray-500">Rental gear</span>
                        <span className="font-semibold text-right max-w-[60%]">{formatGearLines(gearLines)}</span>
                      </div>
                    )}
                  </div>
                  <hr className="border-gray-200" />
                  <div className="flex justify-between items-center"><span className="text-gray-600 font-medium">Total Amount</span><span className="font-bold text-xl text-[#000000]">₹{total.toLocaleString()}</span></div>
                  <div className="flex justify-between items-center"><span className="text-gray-500 text-sm">Payable Now</span><span className="font-bold text-lg text-[#16a34a]">₹{payableNow.toLocaleString()}</span></div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {payError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {payError}
                </div>
              ) : null}
              <div className="flex gap-3">
              {step > 1 && (
                <button type="button" onClick={() => setStep(s => s - 1)} disabled={paying}
                  className="px-6 py-3 rounded-full border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:border-gray-300 hover:bg-white transition-all disabled:opacity-60">
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={paying || openingLogin}
                className={`flex-1 flex items-center justify-center gap-2 font-semibold px-6 py-3 rounded-full transition-all text-sm shadow-sm disabled:opacity-70 bg-[#16a34a] hover:bg-[#15803d] text-white shadow-[#16a34a]/25`}
              >
                {paying ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" /> Opening Razorpay…
                  </>
                ) : step === 3 && openingLogin ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" /> Opening login…
                  </>
                ) : (
                  <>
                    {step === 1
                      ? 'Continue to Details'
                      : step === 2
                        ? 'Review Booking'
                        : authStatus === 'guest'
                          ? 'Login to Continue'
                          : `Continue to Payment · ₹${payableNow.toLocaleString()}`}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="relative h-36 overflow-hidden">
                  <img src={trek.images[0]} alt={trek.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="font-bold text-sm text-white drop-shadow-sm">{trek.title}</h3>
                    <div className="flex items-center gap-2 text-[10px] text-white/80 mt-0.5">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />{trek.rating} ({trek.reviewCount})
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Clock className="w-4 h-4 text-[#16a34a]" /><span>{trek.duration}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Users className="w-4 h-4 text-[#16a34a]" /><span>{trek.groupSize}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <MapPin className="w-4 h-4 text-[#16a34a]" /><span className="truncate">{trek.location}</span>
                  </div>
                  <hr className="border-gray-100" />
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Trip ({personCount} × ₹{unitPrice.toLocaleString()})</span>
                    <span className="font-semibold">₹{(unitPrice * personCount).toLocaleString()}</span>
                  </div>
                  {pickupFee > 0 ? (
                    <div className="flex justify-between items-center text-xs text-gray-600">
                      <span>Includes pickup surcharge</span>
                      <span>+₹{(pickupFee * personCount).toLocaleString()}</span>
                    </div>
                  ) : null}
                  {selectedAddons.map((addon) => (
                    <div key={addon.id} className="flex justify-between items-center text-xs text-gray-600">
                      <span>{addon.name}</span>
                      <span>+₹{(addon.price * personCount).toLocaleString()}</span>
                    </div>
                  ))}
                  {gearLines.length > 0 ? (
                    <div className="space-y-1.5">
                      {gearLines.map((line) => {
                        const item = getGearById(line.gearId);
                        if (!item) return null;
                        return (
                          <div key={line.gearId} className="flex justify-between items-center text-xs text-gray-600">
                            <span>{item.name}{line.size ? ` · ${line.size}` : ''}{line.qty > 1 ? ` ×${line.qty}` : ''}</span>
                            <span>₹{(item.price * line.qty).toLocaleString()}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Package</span>
                    <span className="text-[#16a34a] font-medium text-xs">{pkgLabel}</span>
                  </div>
                  <hr className="border-gray-100" />
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total</span>
                    <span className="font-bold text-lg text-[#000000]">₹{total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs text-gray-500">Payable Now</span>
                    <span className="font-bold text-[#16a34a]">₹{payableNow.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#000000] rounded-2xl p-5 text-white text-sm space-y-3">
                <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-[#16a34a]" /><span className="font-semibold text-xs">Secure Booking</span></div>
                <p className="text-gray-300 text-xs leading-relaxed">Pay securely with Razorpay (UPI, cards, netbanking, wallets, EMI where available). Your booking is confirmed only after our server verifies the payment.</p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <CreditCard className="w-3.5 h-3.5" /> EMI options available
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Percent className="w-3.5 h-3.5" /> Group discounts available
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Gift className="w-3.5 h-3.5" /> Gift cards accepted
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h4 className="font-semibold text-xs text-gray-400 uppercase tracking-wider mb-3">Need Help?</h4>
                <a href={telUrl()} className="flex items-center gap-3 text-sm text-[#000000] hover:text-[#16a34a] transition-colors mb-2">
                  <Phone className="w-4 h-4 text-[#16a34a]" /> {CONTACT.phoneDisplay}
                </a>
                <a href={whatsappUrl('Hi Indian Treks! I need help with my booking.')} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-[#000000] hover:text-[#16a34a] transition-colors mb-3">
                  <i className="fa-brands fa-whatsapp text-[#25D366]" aria-hidden /> WhatsApp {CONTACT.phoneDisplay}
                </a>
                <Link href="/contact" className="text-xs text-[#16a34a] font-medium hover:text-[#15803d] transition-colors">Contact Support &rarr;</Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BookingCheckoutClient({ trek }: { trek: Trek }) {
  return (
    <Suspense fallback={
      <div className="pt-28 min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#16a34a]" />
      </div>
    }>
      <BookingContent trek={trek} />
    </Suspense>
  );
}

const MapPin = ({ className, children, ...props }: { className?: string; children?: React.ReactNode }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
);
