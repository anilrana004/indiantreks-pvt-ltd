'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ArrowRight, Shield } from 'lucide-react';
import type { Trek } from '@/lib/data';
import { trekDetailPath } from '@/lib/data';
import {
  bookingSharingLabel,
  bookingSharingOptions,
  defaultBookingPkg,
} from '@/lib/booking-sharing';

export default function BookingSection({ trek }: { trek: Trek }) {
  const router = useRouter();
  const sharingOptions = useMemo(() => bookingSharingOptions(trek.pricing), [trek.pricing]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    persons: '1',
    date: '',
    pkg: defaultBookingPkg(trek.pricing),
    payment: 'deposit',
    notes: '',
  });

  const pkgKey = sharingOptions.some((o) => o.key === form.pkg)
    ? form.pkg
    : defaultBookingPkg(trek.pricing);
  const pkgLabel = bookingSharingLabel(trek.pricing, pkgKey);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (step === 2) {
      if (!form.name.trim()) errs.name = 'Name is required';
      if (!form.email.trim()) errs.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email format';
      if (!form.phone.trim()) errs.phone = 'Phone is required';
    }
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (step < 3) {
      setStep((s) => s + 1);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams({
      pkg: pkgKey,
      persons: form.persons,
      men: form.persons,
      women: '0',
      payment: form.payment,
      returnTo: trekDetailPath(trek),
    });
    if (form.date) params.set('date', form.date);
    router.push(`/booking/${trek.id}?${params.toString()}`);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-center gap-2 mb-8">
        {['Trip Details', 'Contact Info', 'Confirm'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step > i+1 ? 'bg-[#16a34a] text-white' : step === i+1 ? 'bg-[#16a34a] text-white' : 'bg-gray-100 text-gray-400'}`}>
              {step > i+1 ? <Check className="w-4 h-4" /> : i+1}
            </div>
            <span className={`text-xs font-medium hidden sm:inline ${step === i+1 ? 'text-[#16a34a]' : 'text-gray-400'}`}>{s}</span>
            {i < 2 && <div className="w-8 lg:w-12 h-0.5 bg-gray-200" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:p-8">
        {step === 1 && (
          <div className="space-y-5">
            <h3 className="font-bold text-xl text-[#000000] mb-4">Select Your Package</h3>
            <div className={`grid gap-3 ${sharingOptions.length >= 3 ? 'grid-cols-3' : sharingOptions.length === 2 ? 'grid-cols-2' : 'grid-cols-1 max-w-sm'}`}>
              {sharingOptions.map(p => (
                <button key={p.key} type="button" onClick={() => setForm(f => ({...f, pkg: p.key}))}
                  className={`relative p-4 rounded-xl border-2 text-center transition-all ${pkgKey===p.key ? 'border-[#16a34a] bg-[#16a34a]/5' : 'border-gray-100 hover:border-gray-200'}`}>
                  {p.badge && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#16a34a] text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      {p.badge}
                    </span>
                  )}
                  <div className="font-bold text-sm text-[#000000] mt-1">{p.label}</div>
                  <div className="text-lg font-bold text-[#16a34a]">₹{p.price.toLocaleString()}</div>
                  <div className="text-xs text-gray-400 mt-1">Deposit ₹{p.deposit.toLocaleString()}</div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Travel Date</label>
                <input type="date" required value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Persons</label>
                <select value={form.persons} onChange={e => setForm(f => ({...f, persons: e.target.value}))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 outline-none transition-all">
                  {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} Person{n>1?'s':''}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
              <div className="flex gap-3">
                {[
                  { v: 'deposit', l: 'Advance Deposit', d: `Pay ₹${trek.pricing.find(p=>p.name===pkgKey)?.deposit.toLocaleString() || '0'} now` },
                  { v: 'full', l: 'Full Payment', d: 'Pay entire amount & save 5%' },
                  { v: 'half', l: '50% Now, 50% Later', d: 'Split payment option' },
                ].map(o => (
                  <button key={o.v} type="button" onClick={() => setForm(f => ({...f, payment: o.v}))}
                    className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${form.payment===o.v ? 'border-[#16a34a] bg-[#16a34a]/5' : 'border-gray-100 hover:border-gray-200'}`}>
                    <div className="font-semibold text-xs">{o.l}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{o.d}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h3 className="font-bold text-xl text-[#000000] mb-4">Your Contact Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="booking-name">Full Name</label>
                <input id="booking-name" type="text" required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'err-name' : undefined}
                  className={`w-full px-4 py-2.5 rounded-lg border outline-none transition-all focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 ${errors.name ? 'border-red-400' : 'border-gray-200'}`} placeholder="Your full name" />
                {errors.name && <p id="err-name" className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="booking-email">Email</label>
                <input id="booking-email" type="email" required value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'err-email' : undefined}
                  className={`w-full px-4 py-2.5 rounded-lg border outline-none transition-all focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 ${errors.email ? 'border-red-400' : 'border-gray-200'}`} placeholder="email@example.com" />
                {errors.email && <p id="err-email" className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="booking-phone">Phone Number</label>
                <input id="booking-phone" type="tel" required value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'err-phone' : undefined}
                  className={`w-full px-4 py-2.5 rounded-lg border outline-none transition-all focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 ${errors.phone ? 'border-red-400' : 'border-gray-200'}`} placeholder="+91 98765 43210" />
                {errors.phone && <p id="err-phone" className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="booking-notes">Special Requirements</label>
                <input id="booking-notes" type="text" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 outline-none transition-all focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" placeholder="Dietary needs, health conditions..." />
              </div>
            </div>

            <div className="bg-[#16a34a]/5 rounded-xl p-4 flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#16a34a] shrink-0 mt-0.5" />
              <div className="text-xs text-gray-600">Your information is secure. Continue to secure Razorpay checkout to complete payment.</div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h3 className="font-bold text-xl text-[#000000] mb-4">Confirm Your Booking</h3>
            <div className="bg-gray-50 rounded-xl p-6 space-y-3">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Package</span><span className="font-semibold">{trek.title}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Occupancy</span><span className="font-semibold">{pkgLabel}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Date</span><span className="font-semibold">{form.date}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Persons</span><span className="font-semibold">{form.persons}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Name</span><span className="font-semibold">{form.name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Phone</span><span className="font-semibold">{form.phone}</span></div>
              <hr className="border-gray-200" />
              {(() => {
                const pkg = trek.pricing.find(p => p.name === pkgKey);
                const total = pkg ? pkg.price * parseInt(form.persons) : 0;
                const deposit = pkg ? pkg.deposit * parseInt(form.persons) : 0;
                return (<>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Total Amount</span><span className="font-bold text-lg">₹ {total.toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">{form.payment === 'deposit' ? 'Advance Deposit' : form.payment === 'full' ? 'Full Payment' : '50% Payment'}</span><span className="font-semibold text-[#16a34a]">₹ {form.payment === 'deposit' ? deposit.toLocaleString() : form.payment === 'full' ? total.toLocaleString() : Math.ceil(total/2).toLocaleString()}</span></div>
                </>);
              })()}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-8">
          {step > 1 && <button type="button" onClick={() => setStep(s => s-1)} className="px-6 py-3 rounded-full border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:border-gray-300 transition-all">Back</button>}
          <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 font-semibold px-6 py-3 rounded-full transition-all text-sm bg-[#16a34a] hover:bg-[#15803d] text-white disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Opening checkout...' : step === 1 ? 'Continue to Contact' : step === 2 ? 'Review Booking' : 'Continue to Payment'} {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}
