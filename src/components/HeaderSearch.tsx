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
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import {
  headerSearchFallbackHref,
  searchHeaderContent,
  type HeaderSearchHit,
} from '@/lib/header-search';

type Props = {
  className?: string;
  /** When a result is chosen or form submitted */
  onNavigate?: () => void;
};

export default function HeaderSearch({ className = '', onNavigate }: Props) {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const results = useMemo(() => searchHeaderContent(query, 14), [query]);
  const showPanel = open && query.trim().length > 0;

  const close = useCallback(() => {
    setOpen(false);
    setActiveIdx(-1);
  }, []);

  useEffect(() => {
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [close]);

  const go = useCallback(
    (href: string) => {
      close();
      setQuery('');
      onNavigate?.();
      router.push(href);
    },
    [close, onNavigate, router],
  );

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (activeIdx >= 0 && results[activeIdx]) {
      go(results[activeIdx].href);
      return;
    }
    if (results[0]) {
      go(results[0].href);
      return;
    }
    go(headerSearchFallbackHref(query));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIdx((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
      return;
    }
    if (e.key === 'Escape') {
      close();
      inputRef.current?.blur();
    }
  };

  return (
    <form
      ref={rootRef}
      role="search"
      className={`relative ${className}`}
      onSubmit={submit}
    >
      <div className="flex h-8 max-w-[min(100%,200px)] items-center rounded-full border border-white/20 bg-white pl-2.5 pr-0.5 shadow-sm xl:max-w-[220px] min-[1760px]:max-w-[280px]">
        <input
          ref={inputRef}
          type="search"
          name="q"
          autoComplete="off"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIdx >= 0 ? `${listId}-opt-${activeIdx}` : undefined
          }
          aria-label="Search treks and routes"
          placeholder="Search treks, route"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIdx(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent px-1.5 text-[11px] text-gray-800 outline-none placeholder:text-gray-400 xl:w-[96px] xl:flex-none min-[1760px]:w-[148px] min-[1760px]:text-[12px]"
        />
        <button
          type="submit"
          aria-label="Search"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#dcfce7] text-[#166534] transition-colors hover:bg-[#bbf7d0] xl:h-7 xl:w-auto xl:gap-1 xl:bg-[#16a34a] xl:px-3 xl:text-[11px] xl:font-bold xl:text-white xl:hover:bg-[#15803d]"
        >
          <Search className="h-3.5 w-3.5" aria-hidden />
          <span className="hidden xl:inline">Search</span>
        </button>
      </div>

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          aria-label={`Search results for ${query.trim()}`}
          className="absolute right-0 top-[calc(100%+8px)] z-[120] w-[min(92vw,340px)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl shadow-black/15"
        >
          <div className="border-b border-gray-100 px-3.5 py-2.5 text-[12px] text-gray-500">
            Search results for <span className="font-medium text-gray-700">{query.trim()}</span>
          </div>
          <ul className="max-h-[min(50vh,320px)] overflow-y-auto py-1">
            {results.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-gray-400">
                No matches — press Search to browse all treks
              </li>
            ) : (
              results.map((hit: HeaderSearchHit, i) => (
                <li key={hit.id} role="presentation">
                  <Link
                    id={`${listId}-opt-${i}`}
                    role="option"
                    aria-selected={i === activeIdx}
                    href={hit.href}
                    onMouseEnter={() => setActiveIdx(i)}
                    onClick={() => {
                      close();
                      setQuery('');
                      onNavigate?.();
                    }}
                    className={`flex w-full items-start gap-2.5 border-b border-gray-100 px-3.5 py-2.5 text-left last:border-b-0 transition-colors ${
                      i === activeIdx ? 'bg-gray-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <Search
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400"
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-gray-800">
                        {hit.title}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-gray-400">
                        {hit.category}
                      </span>
                    </span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </form>
  );
}
