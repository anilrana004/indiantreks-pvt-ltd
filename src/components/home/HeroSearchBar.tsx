'use client';

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Search,
  MapPin,
  Calendar,
  Users,
  ChevronDown,
  Minus,
  Plus,
} from 'lucide-react';
import { STOREFRONT_BLUR_DATA_URL } from '@/lib/cloudinary';
import { treks, trekDetailPath, type Trek } from '@/lib/data';

type DestOption = {
  id: string;
  title: string;
  sub: string;
  type: Trek['type'];
  region: Trek['region'];
  image: string;
};

const DEST_OPTIONS: DestOption[] = treks.map((t) => ({
  id: t.id,
  title: t.title,
  sub: t.subtitle || t.state,
  type: t.type,
  region: t.region,
  image: t.cardImage || t.images[0],
}));

const REGION_ALIASES: Record<string, Trek['region']> = {
  uttarakhand: 'uttarakhand',
  uk: 'uttarakhand',
  himachal: 'himachal',
  hp: 'himachal',
  nepal: 'nepal',
  kashmir: 'kashmir',
};

const MAX_TRAVELERS = 20;
const MIN_TRAVELERS = 1;

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplayDate(iso: string) {
  if (!iso) return '';
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function scoreMatch(option: DestOption, q: string) {
  const title = option.title.toLowerCase();
  const sub = option.sub.toLowerCase();
  const region = option.region.toLowerCase();
  if (title === q) return 100;
  if (title.startsWith(q)) return 90;
  if (title.includes(q)) return 70;
  if (sub.includes(q)) return 50;
  if (region.includes(q)) return 40;
  return 0;
}

function filterDestinations(query: string, limit = 8): DestOption[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return DEST_OPTIONS.slice(0, limit);
  }
  return DEST_OPTIONS.map((o) => ({ o, score: scoreMatch(o, q) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.o.title.localeCompare(b.o.title))
    .slice(0, limit)
    .map((x) => x.o);
}

function buildHref(path: string, extra: Record<string, string | undefined>) {
  const [base, existing = ''] = path.split('?');
  const params = new URLSearchParams(existing);
  for (const [key, value] of Object.entries(extra)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

function resolveSearchHref(dest: string, selected: DestOption | null, date: string, travelers: number) {
  const extras: Record<string, string | undefined> = {
    date: date || undefined,
    guests: travelers > 1 ? String(travelers) : undefined,
  };

  if (selected) {
    const trek = treks.find((t) => t.id === selected.id);
    return buildHref(trek ? trekDetailPath(trek) : `/treks/${selected.id}`, extras);
  }

  const q = dest.trim().toLowerCase();
  if (!q) return buildHref('/treks', extras);

  const region = REGION_ALIASES[q];
  if (region) return buildHref('/treks', { ...extras, region });

  const matches = filterDestinations(q, 5);
  if (matches.length === 1 || (matches.length > 1 && scoreMatch(matches[0], q) >= 90)) {
    const trek = treks.find((t) => t.id === matches[0].id);
    return buildHref(trek ? trekDetailPath(trek) : `/treks/${matches[0].id}`, extras);
  }

  return buildHref('/treks', { ...extras, q: dest.trim() });
}

export default function HeroSearchBar() {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLFormElement>(null);
  const destInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const [dest, setDest] = useState('');
  const [selected, setSelected] = useState<DestOption | null>(null);
  const [date, setDate] = useState('');
  const [travelers, setTravelers] = useState(2);
  const [destOpen, setDestOpen] = useState(false);
  const [paxOpen, setPaxOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const suggestions = useMemo(() => filterDestinations(dest, 8), [dest]);
  const minDate = useMemo(() => todayISO(), []);

  const closePanels = useCallback(() => {
    setDestOpen(false);
    setPaxOpen(false);
    setActiveIdx(-1);
  }, []);

  useEffect(() => {
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) closePanels();
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') closePanels();
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [closePanels]);

  const pickDestination = useCallback((option: DestOption) => {
    setSelected(option);
    setDest(option.title);
    setDestOpen(false);
    setActiveIdx(-1);
    dateInputRef.current?.focus();
  }, []);

  const onDestChange = (value: string) => {
    setDest(value);
    setSelected((prev) => (prev && prev.title === value ? prev : null));
    setDestOpen(true);
    setPaxOpen(false);
    setActiveIdx(-1);
  };

  const onDestKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setDestOpen(true);
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter' && destOpen && activeIdx >= 0 && suggestions[activeIdx]) {
      e.preventDefault();
      pickDestination(suggestions[activeIdx]);
      return;
    }
    if (e.key === 'Escape') {
      setDestOpen(false);
      setActiveIdx(-1);
    }
  };

  const setTravelerCount = (n: number) => {
    setTravelers(Math.min(MAX_TRAVELERS, Math.max(MIN_TRAVELERS, n)));
  };

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    closePanels();
    const href = resolveSearchHref(dest, selected, date, travelers);
    router.push(href);
  };

  return (
    <form
      ref={rootRef}
      onSubmit={submit}
      className="rounded-2xl bg-white p-3 shadow-2xl shadow-black/20"
      role="search"
      aria-label="Find a trek or yatra"
    >
      <div className="flex flex-row gap-2">
        {/* Destination */}
        <div className="relative min-w-0 flex-1">
          <div
            className={`flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-3 transition-shadow ${destOpen ? 'ring-2 ring-[#16a34a]/35' : ''}`}
          >
            <MapPin className="h-4 w-4 shrink-0 text-[#16a34a]" aria-hidden />
            <input
              ref={destInputRef}
              type="text"
              role="combobox"
              aria-expanded={destOpen}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={activeIdx >= 0 ? `${listId}-opt-${activeIdx}` : undefined}
              autoComplete="off"
              placeholder="Where do you want to go?"
              value={dest}
              onChange={(e) => onDestChange(e.target.value)}
              onFocus={() => {
                setDestOpen(true);
                setPaxOpen(false);
              }}
              onKeyDown={onDestKeyDown}
              className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
            />
            <button
              type="button"
              tabIndex={-1}
              aria-label="Show destinations"
              onClick={() => {
                setDestOpen((o) => !o);
                setPaxOpen(false);
                destInputRef.current?.focus();
              }}
              className="shrink-0 text-gray-400 hover:text-gray-600"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${destOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>

          {destOpen && (
            <ul
              id={listId}
              role="listbox"
              className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-72 overflow-y-auto rounded-xl border border-gray-100 bg-white py-1.5 shadow-xl shadow-black/15"
            >
              {suggestions.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-gray-400">
                  No matches for &ldquo;{dest.trim()}&rdquo;
                </li>
              ) : (
                suggestions.map((opt, i) => (
                  <li key={opt.id} role="presentation">
                    <button
                      type="button"
                      id={`${listId}-opt-${i}`}
                      role="option"
                      aria-selected={i === activeIdx}
                      onMouseEnter={() => setActiveIdx(i)}
                      onClick={() => pickDestination(opt)}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                        i === activeIdx ? 'bg-[#16a34a]/10' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className="relative h-11 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        <Image
                          src={opt.image}
                          alt=""
                          fill
                          sizes="56px"
                          placeholder="blur"
                          blurDataURL={STOREFRONT_BLUR_DATA_URL}
                          className="object-cover"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-gray-900">
                          {opt.title}
                        </span>
                        <span className="block truncate text-xs text-gray-400">{opt.sub}</span>
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          opt.type === 'yatra'
                            ? 'bg-[#166534] text-white'
                            : 'bg-[#dcfce7] text-[#166534]'
                        }`}
                      >
                        {opt.type === 'yatra' ? 'Yatra' : 'Trek'}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>

        {/* Date */}
        <div className="relative min-w-0 flex-1">
          <label
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-gray-50 px-3 py-3 transition-shadow focus-within:ring-2 focus-within:ring-[#16a34a]/35"
          >
            <Calendar className="h-4 w-4 shrink-0 text-[#16a34a]" aria-hidden />
            <span className="relative min-w-0 flex-1">
              <span
                className={`pointer-events-none block truncate text-sm ${
                  date ? 'text-gray-800' : 'text-gray-400'
                }`}
              >
                {date ? formatDisplayDate(date) : 'When - Select Date'}
              </span>
              <input
                ref={dateInputRef}
                type="date"
                aria-label="Travel date"
                min={minDate}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onFocus={() => {
                  setDestOpen(false);
                  setPaxOpen(false);
                }}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </span>
          </label>
        </div>

        {/* Travelers */}
        <div className="relative w-44 shrink-0">
          <button
            type="button"
            aria-expanded={paxOpen}
            aria-haspopup="dialog"
            onClick={() => {
              setPaxOpen((o) => !o);
              setDestOpen(false);
            }}
            className={`flex w-full items-center gap-2 rounded-xl bg-gray-50 px-3 py-3 text-left transition-shadow ${
              paxOpen ? 'ring-2 ring-[#16a34a]/35' : ''
            }`}
          >
            <Users className="h-4 w-4 shrink-0 text-[#16a34a]" aria-hidden />
            <span className="min-w-0 flex-1 truncate text-sm text-gray-800">
              {travelers} {travelers === 1 ? 'Traveler' : 'Travelers'}
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${paxOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {paxOpen && (
            <div
              role="dialog"
              aria-label="Number of travelers"
              className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 rounded-xl border border-gray-100 bg-white p-3 shadow-xl shadow-black/15"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Travelers</div>
                  <div className="text-xs text-gray-400">Ages 12+</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Decrease travelers"
                    disabled={travelers <= MIN_TRAVELERS}
                    onClick={() => setTravelerCount(travelers - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition-colors hover:border-[#16a34a] hover:text-[#16a34a] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold tabular-nums text-gray-900">
                    {travelers}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase travelers"
                    disabled={travelers >= MAX_TRAVELERS}
                    onClick={() => setTravelerCount(travelers + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition-colors hover:border-[#16a34a] hover:text-[#16a34a] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPaxOpen(false)}
                className="mt-3 w-full rounded-lg bg-[#16a34a] py-2 text-sm font-semibold text-white transition-colors hover:bg-[#15803d]"
              >
                Done
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#16a34a] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#16a34a]/30 transition-all hover:bg-[#15803d] active:scale-[0.98]"
        >
          <Search className="h-4 w-4" />
          Search
        </button>
      </div>
    </form>
  );
}
