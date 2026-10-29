'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import BrandLogo from '@/components/BrandLogo';
import { CONTACT, mailtoUrl, telUrl, whatsappUrl } from '@/lib/contact';
import { DESK_HEADER_H, DESK_MAIN_H, DESK_TOP_H, CHROME_HIDDEN_CLASS } from '@/lib/layout';
import { SUPPORT_HUB_LINKS, supportHubActive } from '@/lib/support-hub-nav';
import { useBodyScrollLock } from '@/lib/dom/use-body-scroll-lock';
import './support-hub.css';

/** Same utility strip as home — contact left, quick links right */
const TOP_STRIP_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'FAQ', href: '/faqs' },
  { label: 'Reviews', href: '/reviews' },
  { label: 'Payment Policy', href: '/payment-policy' },
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Blogs', href: '/blog' },
] as const;

/**
 * Help Centre hub header — desktop matches home dark-green chrome;
 * support section links stay the same.
 */
export default function SupportHubHeader() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const menuId = useId();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    document.body.classList.add('it-support-mode');
    return () => document.body.classList.remove('it-support-mode');
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useBodyScrollLock(menuOpen);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const syncHeight = () => {
      document.documentElement.style.setProperty(
        '--sh-header-height',
        `${el.offsetHeight}px`,
      );
    };

    syncHeight();
    const ro = new ResizeObserver(syncHeight);
    ro.observe(el);
    window.addEventListener('resize', syncHeight);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', syncHeight);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (menuOpen) {
      setHidden(false);
      return;
    }

    const HIDE_AFTER = 72;
    const DESKTOP_MQ = '(min-width: 980px)';
    let last = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      // Mobile chrome stays fixed — never mark it "hidden" or sticky FAQ cats slide under it.
      if (!window.matchMedia(DESKTOP_MQ).matches) {
        setHidden(false);
        last = Math.max(0, window.scrollY);
        return;
      }
      const current = Math.max(0, window.scrollY);
      const delta = current - last;
      if (current <= HIDE_AFTER) setHidden(false);
      else if (delta > 4) setHidden(true);
      else if (delta < -4) setHidden(false);
      last = current;
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, [menuOpen]);

  useEffect(() => {
    document.documentElement.classList.toggle(CHROME_HIDDEN_CLASS, hidden);
    return () => document.documentElement.classList.remove(CHROME_HIDDEN_CLASS);
  }, [hidden]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const helpWa = whatsappUrl('Hi Indian Treks! I need help with a booking.');
  const onHelpCentre = supportHubActive(pathname, '/help-centre');

  return (
    <header
      ref={headerRef}
      className={`it-support-hub${hidden ? ' is-hidden' : ''}`}
      aria-label="Help Centre"
      style={
        {
          '--sh-desk-top-h': `${DESK_TOP_H}px`,
          '--sh-desk-main-h': `${DESK_MAIN_H}px`,
          '--sh-desk-header-h': `${DESK_HEADER_H}px`,
        } as CSSProperties
      }
    >
      <div className="it-support-hub__top" aria-label="Utility links">
        <div className="it-support-hub__top-inner">
          <div className="it-support-hub__top-contact">
            <a
              href={helpWa}
              target="_blank"
              rel="noopener noreferrer"
              className="it-support-hub__top-wa"
              aria-label={`WhatsApp ${CONTACT.phoneDisplay}`}
            >
              <i className="fa-brands fa-whatsapp" aria-hidden />
              <span>+{CONTACT.phoneWa}</span>
            </a>
            <span className="it-support-hub__top-sep" aria-hidden>
              |
            </span>
            <a href={mailtoUrl()} className="it-support-hub__top-mail">
              <i className="fa-solid fa-envelope" aria-hidden />
              <span>{CONTACT.email}</span>
            </a>
          </div>

          <nav className="it-support-hub__top-nav" aria-label="Quick links">
            {TOP_STRIP_LINKS.map((item, i) => (
              <span key={item.href} className="it-support-hub__top-nav-item">
                {i > 0 ? (
                  <span className="it-support-hub__top-sep" aria-hidden>
                    |
                  </span>
                ) : null}
                <Link href={item.href}>{item.label}</Link>
              </span>
            ))}
          </nav>
        </div>
      </div>

      <div className="it-support-hub__bar">
        <div className="it-support-hub__inner">
          <div className="it-support-hub__brand-group">
            <Link
              href="/"
              className="it-support-hub__logo-link"
              onClick={closeMenu}
              aria-label="Indian Treks — back to home"
            >
              <BrandLogo className="it-support-hub__logo" />
            </Link>
            <Link
              href="/help-centre"
              className={`it-support-hub__brand-tag${onHelpCentre ? ' is-active' : ''}`}
              onClick={closeMenu}
              aria-current={onHelpCentre ? 'page' : undefined}
            >
              Help Centre
            </Link>
          </div>

          <nav className="it-support-hub__nav" aria-label="Support sections">
            {SUPPORT_HUB_LINKS.map((item) => {
              const active = supportHubActive(pathname, item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`it-support-hub__link${active ? ' is-active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                  title={item.navLabel ? item.label : undefined}
                >
                  {item.navLabel ? (
                    <>
                      <span className="it-support-hub__link-text it-support-hub__link-text--short">
                        {item.navLabel}
                      </span>
                      <span className="it-support-hub__link-text it-support-hub__link-text--full">
                        {item.label}
                      </span>
                    </>
                  ) : (
                    item.label
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="it-support-hub__actions">
            <Link href="/treks" className="it-support-hub__treks" title="Back to treks">
              Treks
            </Link>
            <a
              href={helpWa}
              className="it-support-hub__icon-btn it-support-hub__icon-btn--primary"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp us"
              title="WhatsApp us"
            >
              <i className="fa-brands fa-whatsapp" aria-hidden />
            </a>
            <a
              href={mailtoUrl('Booking help — Indian Treks')}
              className="it-support-hub__icon-btn it-support-hub__icon-btn--desk"
              aria-label="Email us"
              title="Email us"
            >
              <i className="fa-solid fa-envelope" aria-hidden />
            </a>
            <a
              href={telUrl()}
              className="it-support-hub__icon-btn"
              aria-label={`Call ${CONTACT.phoneDisplay}`}
              title={CONTACT.phoneDisplay}
            >
              <i className="fa-solid fa-phone" aria-hidden />
            </a>
            <button
              type="button"
              className="it-support-hub__menu-btn"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <i className={`fa-solid ${menuOpen ? 'fa-xmark' : 'fa-bars'}`} aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <div
        id={menuId}
        className={`it-support-hub__drawer${menuOpen ? ' is-open' : ''}`}
        hidden={!menuOpen}
      >
        <div className="it-support-hub__drawer-panel">
          <p className="it-support-hub__drawer-kicker">Need help with booking?</p>
          <p className="it-support-hub__drawer-lead">We are here to support you</p>

          <div className="it-support-hub__drawer-cta">
            <a
              className="it-support-hub__drawer-btn it-support-hub__drawer-btn--primary"
              href={helpWa}
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
            >
              <i className="fa-brands fa-whatsapp" aria-hidden />
              WhatsApp us
            </a>
            <a
              className="it-support-hub__drawer-btn"
              href={mailtoUrl('Booking help — Indian Treks')}
              onClick={closeMenu}
            >
              <i className="fa-solid fa-envelope" aria-hidden />
              Email
            </a>
            <a className="it-support-hub__drawer-btn" href={telUrl()} onClick={closeMenu}>
              <i className="fa-solid fa-phone" aria-hidden />
              {CONTACT.phoneDisplay}
            </a>
          </div>

          <nav className="it-support-hub__drawer-nav" aria-label="Support sections">
            {SUPPORT_HUB_LINKS.map((item) => {
              const active = supportHubActive(pathname, item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`it-support-hub__drawer-link${active ? ' is-active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                  onClick={closeMenu}
                >
                  <i className={`fa-solid ${item.icon}`} aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link href="/treks" className="it-support-hub__drawer-back" onClick={closeMenu}>
            <i className="fa-solid fa-arrow-left" aria-hidden />
            Back to treks
          </Link>
        </div>
      </div>

      {menuOpen ? (
        <button
          type="button"
          className="it-support-hub__backdrop"
          aria-label="Close menu"
          onClick={closeMenu}
        />
      ) : null}
    </header>
  );
}
