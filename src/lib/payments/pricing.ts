import { treks, type PricingTier } from '@/lib/data';
import { getGearById, type GearCartLine } from '@/lib/gear-rental';
import { addOns } from '@/lib/trek-detail-content';
import { rupeesToPaise } from '@/lib/payments/razorpay';
import type { BookingPayment } from '@/lib/operations/types';

export type CheckoutParticipant = {
  name: string;
  age?: string;
  gender?: string;
  phone?: string;
};

export type CheckoutPricingInput = {
  trekId: string;
  packageName: string;
  persons: number;
  paymentMode: BookingPayment;
  addonIds?: string[];
  pickupFeePerPerson?: number;
  gearLines?: Array<{ gearId: string; qty: number }>;
};

export type TrustedPricingResult = {
  trekTitle: string;
  packageName: PricingTier['name'];
  unitPriceRupees: number;
  depositPerPersonRupees: number;
  tripTotalRupees: number;
  gearTotalRupees: number;
  payableRupees: number;
  payablePaise: number;
  totalPaise: number;
  snapshot: Record<string, unknown>;
};

function resolveTier(pricing: PricingTier[], packageName: string): PricingTier {
  const exact = pricing.find((p) => p.name === packageName);
  if (exact) return exact;
  const sorted = [...pricing].sort((a, b) => a.price - b.price);
  if (!sorted.length) throw new Error('Trek has no pricing tiers');
  return sorted[0]!;
}

/**
 * Server-trusted payable amount. Never use client-supplied prices.
 */
export function calculateTrustedPayable(input: CheckoutPricingInput): TrustedPricingResult {
  const trek = treks.find((t) => t.id === input.trekId);
  if (!trek) throw new Error('Trek not found');

  const persons = Math.max(1, Math.min(20, Math.floor(input.persons) || 1));
  const tier = resolveTier(trek.pricing, input.packageName);
  const pickupFee = Math.max(0, Math.floor(input.pickupFeePerPerson || 0));

  const selectedAddonIds = (input.addonIds || []).map((id) => id.trim()).filter(Boolean);
  const selectedAddons = addOns.filter((a) => selectedAddonIds.includes(a.id));
  const addOnPerPerson = selectedAddons.reduce((sum, a) => sum + a.price, 0);

  const gearLinesTrusted: GearCartLine[] = [];
  let gearTotalRupees = 0;
  for (const line of input.gearLines || []) {
    const gear = getGearById(line.gearId);
    if (!gear) continue;
    const qty = Math.max(0, Math.min(10, Math.floor(line.qty) || 0));
    if (qty <= 0) continue;
    gearTotalRupees += gear.price * qty;
    gearLinesTrusted.push({
      trekId: trek.id,
      gearId: gear.id,
      qty,
      size: '',
    });
  }

  const unitPriceRupees = tier.price + pickupFee;
  const tripTotalRupees = unitPriceRupees * persons + addOnPerPerson * persons;
  const totalRupees = tripTotalRupees + gearTotalRupees;

  let payableRupees: number;
  if (input.paymentMode === 'full') {
    payableRupees = totalRupees;
  } else if (input.paymentMode === 'half') {
    payableRupees = Math.ceil(tripTotalRupees / 2) + gearTotalRupees;
  } else {
    payableRupees = tier.deposit * persons + gearTotalRupees;
  }

  if (payableRupees < 1) throw new Error('Payable amount must be at least ₹1');

  const payablePaise = rupeesToPaise(payableRupees);
  const totalPaise = rupeesToPaise(totalRupees);

  return {
    trekTitle: trek.title,
    packageName: tier.name,
    unitPriceRupees: tier.price,
    depositPerPersonRupees: tier.deposit,
    tripTotalRupees,
    gearTotalRupees,
    payableRupees,
    payablePaise,
    totalPaise,
    snapshot: {
      trekId: trek.id,
      packageName: tier.name,
      persons,
      paymentMode: input.paymentMode,
      unitPriceRupees: tier.price,
      depositPerPersonRupees: tier.deposit,
      pickupFeePerPerson: pickupFee,
      addOns: selectedAddons.map((a) => ({ id: a.id, name: a.name, price: a.price })),
      gear: gearLinesTrusted.map((g) => ({
        gearId: g.gearId,
        qty: g.qty,
        unitPrice: getGearById(g.gearId)?.price ?? 0,
      })),
      tripTotalRupees,
      gearTotalRupees,
      totalRupees,
      payableRupees,
      payablePaise,
      totalPaise,
      currency: 'INR',
      calculatedAt: new Date().toISOString(),
    },
  };
}
