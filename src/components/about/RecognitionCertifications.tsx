/**
 * Content from https://indiantreks.in/about-us/ — Recognition & Association Letters.
 * Layout kept from existing about cert section.
 */

import { cldUrl } from '@/lib/cloudinary';

const CERTS = [
  {
    name: 'Uttarakhand Tourism Development Board',
    img: cldUrl('https://indiantreks.in/wp-content/uploads/2023/01/UK-Turism-1.jpg', {
      w: 800,
      crop: 'fit',
      quality: 'auto',
    }),
  },
  {
    name: 'MSME / Udyam',
    img: cldUrl('https://indiantreks.in/wp-content/uploads/2023/01/Udhyam-1.jpg', {
      w: 800,
      crop: 'fit',
      quality: 'auto',
    }),
  },
  {
    name: 'Tourism Association',
    img: cldUrl('https://indiantreks.in/wp-content/uploads/2023/01/Turism-2nd-1.jpg', {
      w: 800,
      crop: 'fit',
      quality: 'auto',
    }),
  },
  {
    name: 'ATOAI',
    img: cldUrl('https://roopkundheaven.in/wp-content/uploads/2026/07/cert-4.jpg', {
      w: 800,
      crop: 'fit',
      quality: 'auto',
    }),
  },
] as const;

const REGISTRATIONS = [
  'Registration Certificate No. for the Uttarakhand Tourism Development Board: UTTR/DEHRADUN/13-2021/004674',
  'Registration Certificate No. Y00068508AM25 issued by the Directorate General of Foreign Trade and the Ministry of Commerce and Industry, Government of India',
  'Registration Certificate No. UDYAM-UK-05-0029681, Ministry of Micro, Small, and Medium-Sized Enterprises, Government of India',
  "The Organization's Management System with ISO Verified Certificate No. 9001:2015",
] as const;

export default function RecognitionCertifications() {
  return (
    <section className="it-certs" aria-labelledby="it-certs-title">
      <style>{`
        .it-certs {
          --it-primary: #16a34a;
          --it-primary-mid: #4ade80;
          --it-text: #161616;
          --it-border: rgba(22, 163, 74, 0.14);
          --it-soft: #f0fdf4;
          padding: 58px 0 40px;
          position: relative;
          overflow: hidden;
        }
        .it-certs * { box-sizing: border-box; }
        .it-certs::after {
          content: "";
          position: absolute;
          right: -120px;
          bottom: -100px;
          width: 320px;
          height: 320px;
          background: radial-gradient(circle, rgba(22, 163, 74, 0.08), transparent 72%);
          pointer-events: none;
        }
        .it-certs::before {
          content: "";
          position: absolute;
          left: -120px;
          top: -80px;
          width: 280px;
          height: 280px;
          background: radial-gradient(circle, rgba(74, 222, 128, 0.1), transparent 72%);
          pointer-events: none;
        }
        .it-certs__wrap {
          width: min(1180px, calc(100% - 34px));
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }
        .it-certs__head { text-align: center; margin-bottom: 22px; }
        .it-certs__kicker {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 15px;
          border-radius: 999px;
          border: 1px solid var(--it-border);
          background: #fff;
          color: var(--it-primary);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          box-shadow: 0 10px 22px rgba(0, 0, 0, 0.04);
          margin-bottom: 12px;
        }
        .it-certs__title {
          margin: 0 0 12px;
          font-family: var(--font-heading), ui-sans-serif, system-ui, sans-serif;
          font-size: 34px;
          line-height: 1.08;
          letter-spacing: -0.8px;
          font-weight: 900;
          color: var(--it-text);
        }
        .it-certs__title span { color: var(--it-primary); }
        .it-certs__lead {
          margin: 0 auto;
          max-width: 760px;
          font-size: 14px;
          line-height: 1.7;
          color: #3f3f3f;
        }
        .it-certs__grid {
          display: flex;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-top: 22px;
        }
        .it-certs__card {
          width: 250px;
          background: linear-gradient(180deg, #fff, var(--it-soft));
          border: 1px solid var(--it-border);
          border-radius: 24px;
          min-height: 170px;
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.05);
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .it-certs__card::before {
          content: "";
          position: absolute;
          inset: auto 0 0 0;
          height: 4px;
          background: linear-gradient(90deg, var(--it-primary), var(--it-primary-mid) 58%, #86efac);
        }
        .it-certs__card:hover {
          transform: translateY(-6px);
          box-shadow: 0 22px 44px rgba(22, 163, 74, 0.12);
          border-color: rgba(22, 163, 74, 0.28);
        }
        .it-certs__card img {
          width: 100%;
          max-width: 150px;
          max-height: 110px;
          object-fit: contain;
          display: block;
          transition: transform 0.35s ease;
        }
        .it-certs__card:hover img { transform: scale(1.04); }
        .it-certs__regs {
          margin: 28px auto 0;
          max-width: 900px;
          padding: 18px 20px;
          border-radius: 18px;
          border: 1px solid var(--it-border);
          background: #fff;
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.04);
        }
        .it-certs__regs h3 {
          margin: 0 0 10px;
          font-size: 15px;
          font-weight: 800;
          color: var(--it-text);
        }
        .it-certs__regs ul {
          margin: 0;
          padding-left: 18px;
        }
        .it-certs__regs li {
          font-size: 13px;
          line-height: 1.6;
          color: #3f3f3f;
          margin-bottom: 6px;
        }
        @media (max-width: 767px) {
          .it-certs { padding: 28px 0 20px; }
          .it-certs__wrap { width: min(100% - 24px, 1180px); }
          .it-certs__title { font-size: 22px; line-height: 1.25; }
          .it-certs__lead { font-size: 13px; line-height: 1.65; }
          .it-certs__grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          .it-certs__card {
            width: 100%;
            min-height: 110px;
            border-radius: 14px;
            padding: 12px;
          }
          .it-certs__card img { max-width: 110px; max-height: 64px; }
          .it-certs__regs {
            padding: 14px 14px;
            border-radius: 14px;
          }
          .it-certs__regs h3 { font-size: 14px; }
          .it-certs__regs li { font-size: 12px; margin-bottom: 4px; }
        }
      `}</style>

      <div className="it-certs__wrap">
        <div className="it-certs__head">
          <span className="it-certs__kicker">Our Recognition &amp; Association Letter</span>
          <h2 className="it-certs__title" id="it-certs-title">
            Authorized Adventure Tour Operator by the{' '}
            <span>Ministry of Tourism</span>
          </h2>
          <p className="it-certs__lead">
            At Indiantreks, we uphold the highest safety and compliance standards, ensuring every trek
            is legally secure and well-regulated. From permits to ethical trekking practices, we take
            care of the details so you can focus on the adventure.
          </p>
        </div>

        <div className="it-certs__grid">
          {CERTS.map((c) => (
            <div key={c.name} className="it-certs__card">
              <img src={c.img} alt={c.name} />
            </div>
          ))}
        </div>

        <div className="it-certs__regs">
          <h3>Official Registrations</h3>
          <ul>
            {REGISTRATIONS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
