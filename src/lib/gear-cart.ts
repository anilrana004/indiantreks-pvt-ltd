/**
 * Checkout-safe gear cart helpers.
 * Keep this free of `@/lib/blog` / rental marketing modules so booking JS stays slim.
 */

export type GearCartLine = {
  gearId: string;
  trekId: string;
  qty: number;
  size?: string;
};

/** Minimal price/name index — mirrors rental catalog ids used at checkout. */
const GEAR_INDEX: Record<string, { name: string; price: number }> = {
  'trek-shoes': { name: 'Trekking Shoes', price: 800 },
  'down-jacket': { name: 'Down Jacket', price: 500 },
  'rain-jacket': { name: 'Rain Jacket', price: 400 },
  rucksack: { name: '55L Backpack', price: 700 },
  daybag: { name: '30L Daypack', price: 300 },
  'jumbo-bag': { name: 'Jumbo Duffel', price: 2500 },
  'trek-poles': { name: 'Trekking Poles (Pair)', price: 200 },
  headlamp: { name: 'Headlamp', price: 200 },
  'trek-pants': { name: 'Trek Pants', price: 400 },
  poncho: { name: 'Poncho', price: 250 },
  'water-bottle': { name: '1L Water Bottle', price: 150 },
  gaiters: { name: 'Gaiters', price: 200 },
  sunglasses: { name: 'Polarized Sunglasses', price: 180 },
  thermos: { name: 'Thermos Flask', price: 150 },
};

const STORAGE_KEY = 'it-gear-rental-cart';
const CART_EVENT = 'it-gear-cart';

export function getGearById(id: string) {
  const hit = GEAR_INDEX[id];
  return hit ? { id, ...hit } : undefined;
}

function emitCart() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(CART_EVENT));
}

export function readGearCart(): GearCartLine[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GearCartLine[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (line) =>
        line &&
        typeof line.gearId === 'string' &&
        typeof line.trekId === 'string' &&
        Number.isFinite(line.qty) &&
        line.qty >= 1,
    );
  } catch {
    return [];
  }
}

export function writeGearCart(lines: GearCartLine[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  emitCart();
}

export function cartForTrek(trekId: string, lines = readGearCart()) {
  return lines.filter((line) => line.trekId === trekId);
}

export function cartSubtotal(lines: GearCartLine[]) {
  return lines.reduce((sum, line) => {
    const item = getGearById(line.gearId);
    return sum + (item ? item.price * line.qty : 0);
  }, 0);
}

export function parseGearQuery(raw: string | null | undefined, trekId: string): GearCartLine[] {
  if (!raw) return [];
  const lines: GearCartLine[] = [];
  for (const chunk of raw.split(',')) {
    const [gearId, size, qtyRaw] = chunk.split('~');
    const qty = Number(qtyRaw);
    if (!gearId || !getGearById(gearId) || !Number.isFinite(qty) || qty < 1) continue;
    const line: GearCartLine = {
      gearId,
      trekId,
      qty: Math.min(8, Math.floor(qty)),
    };
    if (size) line.size = size;
    lines.push(line);
  }
  return lines;
}

export function subscribeGearCart(onChange: () => void) {
  if (typeof window === 'undefined') return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onChange();
  };
  window.addEventListener(CART_EVENT, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(CART_EVENT, onChange);
    window.removeEventListener('storage', onStorage);
  };
}

export function formatGearLines(lines: GearCartLine[]) {
  return lines
    .map((line) => {
      const item = getGearById(line.gearId);
      if (!item) return '';
      const size = line.size ? ` ${line.size}` : '';
      const qty = line.qty > 1 ? ` ×${line.qty}` : '';
      return `${item.name}${size}${qty}`;
    })
    .filter(Boolean)
    .join(', ');
}
