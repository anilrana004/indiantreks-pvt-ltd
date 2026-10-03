import Link from 'next/link';
import {
  Mountain,
  Shield,
  Headphones,
  MapPinned,
  Check,
  ChevronRight,
  MapPin,
  Mail,
  Phone,
  Send,
} from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import { CONTACT, SOCIAL_LINKS, telUrl, whatsappUrl, mailtoUrl } from '@/lib/contact';
import './footer.css';

const trustItems = [
  {
    icon: Mountain,
    title: 'Curated Himalayan Journeys',
    desc: 'Thoughtfully planned mountain experiences',
  },
  {
    icon: Shield,
    title: 'Safety-First Operations',
    desc: 'Responsible trekking with guided support',
  },
  {
    icon: Headphones,
    title: 'Personal Trek Assistance',
    desc: 'Support from your first enquiry to the trail',
  },
  {
    icon: MapPinned,
    title: 'Local Himalayan Expertise',
    desc: 'Experience the mountains with people who know them',
  },
];

const companyLinks = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'Help Centre', href: '/help-centre' },
  { label: 'FAQs', href: '/faqs' },
  { label: 'Safety', href: '/safety' },
  { label: 'Reviews', href: '/reviews' },
  { label: 'Blogs', href: '/blog' },
  { label: 'News & Media', href: '/blog/news' },
  { label: 'Affiliates', href: '/affiliates' },
];

const exploreLinks = [
  { label: 'Himalayan Treks', href: '/treks' },
  { label: 'Best Sellers', href: '/best-sellers' },
  { label: 'Weekend Trips', href: '/weekend-trips' },
  { label: 'Snow Treks', href: '/treks/kedarkantha' },
  { label: 'Sacred Yatras', href: '/yatra' },
  { label: 'Domestic Tours', href: '/domestic-tours' },
  { label: 'International Getaways', href: '/international-getaways' },
  { label: 'Gear Rental', href: '/gear-rental' },
  { label: 'Beginner-Friendly Treks', href: '/beginner-friendly-treks' },
  { label: 'Group Trips', href: '/group-trips' },
  { label: 'Backpacking Trips', href: '/backpacking' },
  { label: 'Biking Trips', href: '/biking' },
];

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
      />
    </svg>
  );
}

function SocialIcon({ id }: { id: (typeof SOCIAL_LINKS)[number]['id'] }) {
  if (id === 'instagram') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 01-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 017.8 2m-.2 2A3.6 3.6 0 004 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 003.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5M12 7a5 5 0 110 10 5 5 0 010-10m0 2a3 3 0 100 6 3 3 0 000-6z" />
      </svg>
    );
  }
  if (id === 'facebook') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
      </svg>
    );
  }
  if (id === 'youtube') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" />
      </svg>
    );
  }
  if (id === 'linkedin') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M6.94 5a2 2 0 11-4-.002 2 2 0 014 .002zM7 8.48H3V21h4V8.48zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91l.04-1.68z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.5 15.5h-3v-6h3v6zm0-7h-3V7h3v3.5z" />
    </svg>
  );
}

function FraudLight() {
  return <span className="rhf-fraud-light" aria-hidden />;
}

export default function Footer() {
  const waPrimary = whatsappUrl("Hi Indian Treks! I'm interested in a trek.");

  return (
    <footer className="rhf-footer pb-[62px] lg:pb-0">
      <div className="rhf-wrap">
        <div className="rhf-topline">
          <div className="rhf-topline-inner">
            {trustItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rhf-topline-item">
                  <div className="rhf-topline-icon">
                    <Icon className="h-[15px] w-[15px]" strokeWidth={2.2} />
                  </div>
                  <div className="rhf-topline-text">
                    <strong>{item.title}</strong>
                    <span>{item.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rhf-main">
          <div className="rhf-card rhf-brand-card">
            <div className="rhf-brand-top">
              <Link href="/" className="rhf-logo-box">
                <BrandLogo className="h-full w-full max-w-none object-contain object-left" />
              </Link>
            </div>
            <p className="rhf-brand-copy">
              Indian Treks creates thoughtfully designed treks, spiritual journeys, and mountain
              experiences for travelers who want comfort, clarity, and a memorable Himalayan
              connection.
            </p>
            <div className="rhf-mini-badges">
              <span>
                <Check strokeWidth={3} /> Premium Trips
              </span>
              <span>
                <Check strokeWidth={3} /> Trek Experts
              </span>
              <span>
                <Check strokeWidth={3} /> Fast Support
              </span>
            </div>
            <div className="rhf-btn-row">
              <a className="rhf-btn rhf-btn-primary" href={waPrimary} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon /> Plan Your Trek
              </a>
              <Link className="rhf-btn rhf-btn-light" href="/contact">
                <Send /> Contact Us
              </Link>
            </div>
          </div>

          <div className="rhf-card">
            <h4 className="rhf-title">Company</h4>
            <ul className="rhf-links">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>
                    <ChevronRight strokeWidth={2.5} /> {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="rhf-card">
            <h4 className="rhf-title">Explore</h4>
            <ul className="rhf-links">
              {exploreLinks.map((link) => (
                <li key={link.label}>
                  {link.href ? (
                    <Link href={link.href}>
                      <ChevronRight strokeWidth={2.5} /> {link.label}
                    </Link>
                  ) : (
                    <span className="rhf-link-text" aria-disabled="true">
                      <ChevronRight strokeWidth={2.5} /> {link.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="rhf-card">
            <h4 className="rhf-title">Get in Touch</h4>
            <div className="rhf-contact-list">
              {CONTACT.offices.map((office) => (
                <div key={office.id} className="rhf-contact-item">
                  <div className="rhf-contact-icon">
                    <MapPin strokeWidth={2.2} />
                  </div>
                  <div className="rhf-contact-content">
                    <strong>{office.label}</strong>
                    {office.line1}, {office.line2}
                  </div>
                </div>
              ))}

              <div className="rhf-contact-item">
                <div className="rhf-contact-icon">
                  <Phone strokeWidth={2.2} />
                </div>
                <div className="rhf-contact-content">
                  <strong>Booking</strong>
                  {CONTACT.phones.booking.map((phone) => (
                    <a key={phone.tel} href={telUrl(phone.tel)}>
                      {phone.display}
                    </a>
                  ))}
                </div>
              </div>

              <div className="rhf-contact-item">
                <div className="rhf-contact-icon">
                  <Phone strokeWidth={2.2} />
                </div>
                <div className="rhf-contact-content">
                  <strong>Support</strong>
                  <a href={telUrl(CONTACT.phones.support.tel)}>{CONTACT.phones.support.display}</a>
                </div>
              </div>

              <div className="rhf-contact-item">
                <div className="rhf-contact-icon">
                  <Mail strokeWidth={2.2} />
                </div>
                <div className="rhf-contact-content">
                  <strong>Email</strong>
                  <a href={mailtoUrl(undefined, undefined, CONTACT.emails.primary)}>
                    {CONTACT.emails.primary}
                  </a>
                  <a href={mailtoUrl(undefined, undefined, CONTACT.emails.vivek)}>
                    {CONTACT.emails.vivek}
                  </a>
                  <a href={mailtoUrl(undefined, undefined, CONTACT.emails.explore)}>
                    {CONTACT.emails.explore}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rhf-bottom">
          <div className="rhf-bottom-card">
            <h5 className="rhf-subtitle">Accepted Payments</h5>
            <div className="rhf-payment-box">
              <img
                src="https://roopkundheaven.in/wp-content/uploads/2026/04/payment.webp"
                alt="Accepted Payment Methods"
              />
            </div>
          </div>

          <div className="rhf-bottom-card">
            <h5 className="rhf-subtitle">Quick Links</h5>
            <p className="rhf-copy">
              <strong>© 2026 Indian Treks. Crafted for unforgettable mountain journeys.</strong>
            </p>
            <div className="rhf-policy-links">
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms &amp; Conditions</Link>
              <Link href="/payment-policy">Payment Policy</Link>
              <Link href="/cancellation-policy">Cancellation &amp; Refund</Link>
              <Link href="/help-centre">Help Centre</Link>
              <Link href="/faqs">FAQs</Link>
              <Link href="/beware-of-fraudulent-activities" className="rhf-fraud-link">
                <FraudLight />
                Beware of Fraudulent Activities
              </Link>
            </div>
          </div>

          <div className="rhf-bottom-card">
            <h5 className="rhf-subtitle">Connect With Us</h5>
            <div className="rhf-socials">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.id}
                  className={`rhf-${link.id === 'youtube' ? 'yt' : link.id === 'linkedin' ? 'li' : link.id === 'facebook' ? 'fb' : link.id === 'quora' ? 'quora' : 'ig'}`}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                >
                  <SocialIcon id={link.id} />
                </a>
              ))}
              <a
                className="rhf-wa"
                href={CONTACT.whatsapp.business.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
              >
                <WhatsAppIcon />
              </a>
            </div>
            <p className="rhf-social-note">Follow us for trek updates, stories, and new departures.</p>
          </div>
        </div>

        <div className="rhf-legal">
          Designed for modern explorers seeking elegant, dependable, and experience-led Himalayan
          travel.
        </div>
      </div>

      <div className="rhf-marquee" aria-hidden="true">
        <div className="rhf-marquee-track">
          {[0, 1].map((copy) => (
            <div key={copy} className="rhf-marquee-group">
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={`${copy}-${i}`} className="rhf-marquee-item">
                  IndianTreks
                  <span className="rhf-marquee-dot" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
