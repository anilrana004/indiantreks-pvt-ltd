'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { BlogTocItem } from '@/components/BlogMarkdown';
import { useBlogScrollRoot } from '@/components/blog/blog-scroll-context';
import { useBodyScrollLock } from '@/lib/dom/use-body-scroll-lock';

const SCROLL_OFFSET = 88;

function scrollToSection(id: string, scrollRoot: HTMLElement | null) {
  const el = document.getElementById(id);
  if (!el) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (scrollRoot) {
    const top =
      el.getBoundingClientRect().top -
      scrollRoot.getBoundingClientRect().top +
      scrollRoot.scrollTop -
      SCROLL_OFFSET;
    scrollRoot.scrollTo({
      top: Math.max(0, top),
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  } else {
    const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
    window.scrollTo({
      top: Math.max(0, top),
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  }

  if (!scrollRoot) {
    window.history.replaceState(null, '', `#${id}`);
  }
}

function useBlogArticleToc(items: BlogTocItem[]) {
  const scrollRootRef = useBlogScrollRoot();
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);
  const isUserScrolling = useRef(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (items.length === 0) return;

    const root = scrollRootRef?.current ?? null;
    let frame = 0;

    const update = () => {
      frame = 0;
      if (isUserScrolling.current) return;

      const scrollTop = root ? root.scrollTop : window.scrollY;
      const rootTop = root ? root.getBoundingClientRect().top : 0;
      const checkpoint = scrollTop + SCROLL_OFFSET + 24;
      let current = items[0].id;

      for (const item of items) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        const elTop = root
          ? el.getBoundingClientRect().top - rootTop + root.scrollTop
          : el.getBoundingClientRect().top + window.scrollY;
        if (elTop <= checkpoint) {
          current = item.id;
        }
      }

      setActiveId((prev) => (prev === current ? prev : current));
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    const target: HTMLElement | Window = root ?? window;
    target.addEventListener('scroll', onScroll as EventListener, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      target.removeEventListener('scroll', onScroll as EventListener);
      window.removeEventListener('resize', onScroll);
    };
  }, [items, scrollRootRef]);

  const handleSectionClick = useCallback((id: string, onNavigate?: () => void) => {
    isUserScrolling.current = true;
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);

    setActiveId(id);
    scrollToSection(id, scrollRootRef?.current ?? null);
    onNavigate?.();

    scrollTimeout.current = setTimeout(() => {
      isUserScrolling.current = false;
    }, 800);
  }, [scrollRootRef]);

  useEffect(() => {
    return () => {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, []);

  useEffect(() => {
    setActiveId(items[0]?.id ?? null);
  }, [items]);

  const activeItem = items.find((item) => item.id === activeId) ?? items[0];

  return { activeId, activeItem, handleSectionClick, listScrollRef };
}

function TocList({
  items,
  activeId,
  onSelect,
}: {
  items: BlogTocItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <ol className="it-blog__toc-list">
      {items.map((item) => (
        <li
          key={item.id}
          className={`it-blog__toc-item it-blog__toc-item--l${item.level}${activeId === item.id ? ' is-active' : ''}`}
        >
          <a
            href={`#${item.id}`}
            onClick={(event) => {
              event.preventDefault();
              onSelect(item.id);
            }}
            aria-current={activeId === item.id ? 'location' : undefined}
          >
            {item.title}
          </a>
        </li>
      ))}
    </ol>
  );
}

type Props = {
  items: BlogTocItem[];
  variant?: 'sidebar' | 'mobile';
  defaultOpen?: boolean;
};

export default function BlogArticleToc({ items, variant = 'sidebar', defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { activeId, activeItem, handleSectionClick, listScrollRef } = useBlogArticleToc(items);

  useEffect(() => {
    if (variant !== 'sidebar' || !activeId || !listScrollRef.current) return;
    const activeLink = listScrollRef.current.querySelector<HTMLAnchorElement>(
      `a[href="#${activeId}"]`,
    );
    activeLink?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeId, variant, listScrollRef]);

  useBodyScrollLock(variant === 'mobile' && sheetOpen);

  useEffect(() => {
    if (variant !== 'mobile' || !sheetOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSheetOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [variant, sheetOpen]);

  if (items.length === 0) return null;

  if (variant === 'mobile') {
    return (
      <div className="it-blog__toc-mobile" data-open={sheetOpen ? 'true' : 'false'}>
        <button
          type="button"
          className="it-blog__toc-fab"
          aria-expanded={sheetOpen}
          aria-controls="blog-toc-mobile-sheet"
          onClick={() => setSheetOpen(true)}
        >
          <i className="fa-solid fa-list-ul" aria-hidden />
          <span className="it-blog__toc-fab-text">
            <span className="it-blog__toc-fab-kicker">Jump to section</span>
            <span className="it-blog__toc-fab-title">{activeItem?.title ?? 'Sections'}</span>
          </span>
        </button>

        <div
          className={`it-blog__toc-sheet-backdrop${sheetOpen ? ' is-open' : ''}`}
          onClick={() => setSheetOpen(false)}
          aria-hidden={!sheetOpen}
        />

        <div
          id="blog-toc-mobile-sheet"
          className={`it-blog__toc-sheet${sheetOpen ? ' is-open' : ''}`}
          role="dialog"
          aria-modal={sheetOpen}
          aria-label="Jump to section"
          aria-hidden={!sheetOpen}
        >
          <div className="it-blog__toc-sheet-handle" aria-hidden />
          <div className="it-blog__toc-sheet-head">
            <div>
              <p className="it-blog__toc-sheet-kicker">On this page</p>
              <h2 className="it-blog__toc-sheet-title">Jump to section</h2>
            </div>
            <button
              type="button"
              className="it-blog__toc-sheet-close"
              aria-label="Close section menu"
              onClick={() => setSheetOpen(false)}
            >
              <i className="fa-solid fa-xmark" aria-hidden />
            </button>
          </div>
          <div className="it-blog__toc-sheet-scroll">
            <TocList
              items={items}
              activeId={activeId}
              onSelect={(id) => handleSectionClick(id, () => setSheetOpen(false))}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <nav className="it-blog__toc it-blog__toc--sidebar" aria-label="Table of contents">
      <button
        type="button"
        className="it-blog__toc-toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <i className="fa-solid fa-list-ul" aria-hidden />
        On this page
        <i className={`fa-solid fa-chevron-${open ? 'up' : 'down'}`} aria-hidden />
      </button>

      <div className={`it-blog__toc-panel${open ? ' is-open' : ''}`}>
        <div className="it-blog__toc-sticky">
          <p className="it-blog__toc-label">Jump to section</p>
          <div className="it-blog__toc-scroll" ref={listScrollRef}>
            <TocList
              items={items}
              activeId={activeId}
              onSelect={(id) => {
                handleSectionClick(id, () => setOpen(false));
              }}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
