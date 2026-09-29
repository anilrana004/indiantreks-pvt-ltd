import type { Trek } from '@/lib/data';
import {
  KEDARKANTHA_BATCH_CAPACITY,
  KEDARKANTHA_FIXED_DEPARTURES,
} from '@/lib/content/treks/kedarkantha/fixed-departures-content';

export type BatchStatus = 'available' | 'filling-fast' | 'almost-full' | 'sold-out';

export interface TrekBatch {
  id: string;
  startDate: string;
  endDate: string;
  label: string;
  monthLabel: string;
  weekday: string;
  seatsLeft: number;
  capacity: number;
  status: BatchStatus;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** How far ahead seasonal fixed calendars may roll. */
const FIXED_HORIZON_MONTHS = 18;
/** Max years a past seasonal row may shift forward. */
const FIXED_ROLL_YEARS_MAX = 4;

/** Published fixed calendars — when present, replace generated placeholders. */
const FIXED_DEPARTURE_SCHEDULES: Record<
  string,
  {
    capacity: number;
    departures: ReadonlyArray<{
      start: string;
      end: string;
      status: BatchStatus;
      seatsLeft: number;
    }>;
  }
> = {
  kedarkantha: {
    capacity: KEDARKANTHA_BATCH_CAPACITY,
    departures: KEDARKANTHA_FIXED_DEPARTURES,
  },
};

/** Stable 0..n-1 hash from trek id (keeps status consistent per trek). */
function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Seat counts are NOT authoritative inventory until DB capacity/holds ship.
 * Generated batches expose capacity for layout only — UI must not claim "N seats left".
 */
export const INVENTORY_IS_AUTHORITATIVE = false;

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toISO(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(d: Date, days: number) {
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
  return next;
}

function addMonths(d: Date, months: number) {
  return new Date(d.getFullYear(), d.getMonth() + months, d.getDate());
}

/** Parse YYYY-MM-DD as a local calendar date (avoids UTC off-by-one). */
export function parseISODate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function formatRange(start: Date, end: Date) {
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return `${pad(start.getDate())} - ${pad(end.getDate())} ${MONTHS_SHORT[start.getMonth()]} ${start.getFullYear()}`;
  }
  return `${pad(start.getDate())} ${MONTHS_SHORT[start.getMonth()]} - ${pad(end.getDate())} ${MONTHS_SHORT[end.getMonth()]} ${end.getFullYear()}`;
}

function statusFromSeats(seatsLeft: number, capacity: number): BatchStatus {
  if (seatsLeft <= 0) return 'sold-out';
  const ratio = seatsLeft / capacity;
  if (ratio <= 0.2) return 'almost-full';
  if (ratio <= 0.45) return 'filling-fast';
  return 'available';
}

export function todayStart(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** True when the departure start day is today or later (local calendar). */
export function isUpcomingDepartureDate(iso: string, now = new Date()) {
  return parseISODate(iso) >= todayStart(now);
}

/** Drop past starts so months/dates that are over never reach the UI. */
export function filterUpcomingBatches(batches: TrekBatch[], now = new Date()): TrekBatch[] {
  const today = todayStart(now);
  return batches
    .filter((batch) => parseISODate(batch.startDate) >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

function toTrekBatch(
  trekId: string,
  start: Date,
  end: Date,
  seatsLeft: number,
  capacity: number,
  status: BatchStatus,
): TrekBatch {
  return {
    id: `${trekId}-${toISO(start)}`,
    startDate: toISO(start),
    endDate: toISO(end),
    label: formatRange(start, end),
    monthLabel: `${MONTHS[start.getMonth()]} ${start.getFullYear()}`,
    weekday: WEEKDAYS[start.getDay()],
    seatsLeft,
    capacity,
    status,
  };
}

/**
 * Roll a seasonal row forward by a whole number of years (keeps day/month).
 */
function shiftYears(start: Date, end: Date, years: number): { start: Date; end: Date } {
  const durationDays = Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / 86_400_000),
  );
  const nextStart = new Date(start.getFullYear() + years, start.getMonth(), start.getDate());
  return { start: nextStart, end: addDays(nextStart, durationDays) };
}

/** Upcoming published batches for a trek, or null when no fixed calendar exists. */
function getFixedDepartureBatches(trek: Trek, now = new Date()): TrekBatch[] | null {
  const schedule = FIXED_DEPARTURE_SCHEDULES[trek.id];
  if (!schedule) return null;

  const today = todayStart(now);
  const horizon = addMonths(today, FIXED_HORIZON_MONTHS);

  const buildForShift = (years: number): TrekBatch[] => {
    const byStart = new Map<string, TrekBatch>();
    for (const row of schedule.departures) {
      const baseStart = parseISODate(row.start);
      const baseEnd = parseISODate(row.end);
      const { start, end } = years === 0 ? { start: baseStart, end: baseEnd } : shiftYears(baseStart, baseEnd, years);
      if (start < today || start > horizon) continue;
      const batch = toTrekBatch(
        trek.id,
        start,
        end,
        Math.min(row.seatsLeft, schedule.capacity),
        schedule.capacity,
        row.status,
      );
      if (!byStart.has(batch.startDate)) byStart.set(batch.startDate, batch);
    }
    return [...byStart.values()].sort((a, b) => a.startDate.localeCompare(b.startDate));
  };

  // Prefer the current published season while any date is still upcoming.
  // Only when the whole season is over do we roll forward a year (so Nov returns next year).
  for (let years = 0; years <= FIXED_ROLL_YEARS_MAX; years++) {
    const batches = buildForShift(years);
    if (batches.length > 0) return batches;
  }

  return [];
}

/**
 * Builds upcoming monthly departure batches for any trek / yatra / international trip.
 * Start days rotate by trek so listings feel distinct but stay deterministic.
 */
export function getMonthlyBatches(trek: Trek, count = 5, now = new Date()): TrekBatch[] {
  const fixed = getFixedDepartureBatches(trek, now);
  if (fixed) return filterUpcomingBatches(fixed, now).slice(0, count);

  const tripDays = Math.max(trek.days || 1, 1);
  const seed = hashId(trek.id);
  const startDayOptions = [5, 8, 12, 15, 18, 22];
  const capacity = 20 + (seed % 5) * 2; // 20-28

  const today = todayStart(now);
  const batches: TrekBatch[] = [];
  let monthOffset = 0;

  while (batches.length < count && monthOffset < 18) {
    const startDay = startDayOptions[(seed + batches.length) % startDayOptions.length];
    const start = new Date(today.getFullYear(), today.getMonth() + monthOffset, startDay);
    monthOffset += 1;

    // Skip dates that already passed in the current month
    if (start < today) continue;

    const end = addDays(start, tripDays - 1);
    const seatsLeft = Math.max(0, capacity - ((seed + batches.length * 7) % (capacity + 1)));
    const status = statusFromSeats(seatsLeft, capacity);

    batches.push(toTrekBatch(trek.id, start, end, seatsLeft, capacity, status));
  }

  return filterUpcomingBatches(batches, now);
}

/**
 * Builds several departures per month for the detail-page date picker, so each
 * month exposes a real choice of dates rather than a single batch.
 * Treks with a published fixed calendar return the full upcoming schedule
 * (past days/months removed; seasonal rows roll into the next year).
 */
export function getDepartureBatches(
  trek: Trek,
  months = 4,
  perMonth = 3,
  now = new Date(),
): TrekBatch[] {
  const fixed = getFixedDepartureBatches(trek, now);
  if (fixed) return filterUpcomingBatches(fixed, now);

  const tripDays = Math.max(trek.days || 1, 1);
  const seed = hashId(trek.id);
  const startDayOptions = [3, 6, 9, 12, 15, 18, 21, 24, 27];
  const capacity = 20 + (seed % 5) * 2;

  const today = todayStart(now);
  const batches: TrekBatch[] = [];

  for (let monthOffset = 0; monthOffset < months + 2 && batches.length < months * perMonth; monthOffset++) {
    let addedThisMonth = 0;

    for (let slot = 0; slot < perMonth * 2 && addedThisMonth < perMonth; slot++) {
      const startDay = startDayOptions[(seed + monthOffset * perMonth + slot) % startDayOptions.length];
      const start = new Date(today.getFullYear(), today.getMonth() + monthOffset, startDay);
      if (start < today) continue;
      if (batches.some((b) => b.startDate === toISO(start))) continue;

      const end = addDays(start, tripDays - 1);
      const seatsLeft = Math.max(0, capacity - ((seed + batches.length * 7) % (capacity + 1)));

      batches.push(
        toTrekBatch(trek.id, start, end, seatsLeft, capacity, statusFromSeats(seatsLeft, capacity)),
      );
      addedThisMonth++;
    }
  }

  return filterUpcomingBatches(batches, now);
}

export const batchStatusMeta: Record<BatchStatus, { label: string; className: string }> = {
  available: { label: 'Available', className: 'bg-emerald-50 text-emerald-700' },
  'filling-fast': { label: 'Filling Fast', className: 'bg-amber-50 text-amber-700' },
  'almost-full': { label: 'Almost Full', className: 'bg-orange-50 text-orange-700' },
  'sold-out': { label: 'Sold Out', className: 'bg-gray-100 text-gray-500' },
};
