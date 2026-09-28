'use client';

import { useState } from 'react';
import Image from 'next/image';
import { HOME_RECOGNITION_LOGOS, HOME_RECOGNITIONS_SECTION } from '@/lib/content/home-recognitions';

function RecognitionLogo({ name, img }: { name: string; img: string }) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      <span className="px-1 text-center text-[11px] font-semibold leading-tight text-slate-600 lg:text-xs">
        {name}
      </span>
    );
  }

  return (
    <Image
      src={img}
      alt={name}
      width={160}
      height={48}
      unoptimized={img.endsWith('.svg')}
      className="h-9 w-auto max-w-[9rem] object-contain opacity-95 transition-all duration-300 group-hover:scale-[1.03] group-hover:opacity-100 lg:h-11 lg:max-w-[10.5rem]"
      onError={() => setBroken(true)}
    />
  );
}

export default function Recognitions() {
  return (
    <section className="py-8 lg:py-16" aria-labelledby="home-recognitions-title">
      <div className="container mx-auto">
        <div className="mb-6 text-center lg:mb-8">
          <p className="mb-1 text-xs font-semibold tracking-widest text-[#16a34a] uppercase lg:text-sm">
            {HOME_RECOGNITIONS_SECTION.kicker}
          </p>
          <h2 id="home-recognitions-title" className="text-xl font-bold text-[#0f172a] lg:text-3xl">
            {HOME_RECOGNITIONS_SECTION.title}
          </h2>
          <p className="mx-auto mt-1 max-w-xl text-xs text-[var(--ih-text-secondary)] lg:text-sm">
            {HOME_RECOGNITIONS_SECTION.subtitle}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 lg:gap-5">
          {HOME_RECOGNITION_LOGOS.map((l) => (
            <div
              key={l.id}
              title={l.name}
              className="group flex min-h-[4.25rem] items-center justify-center rounded-xl border border-[var(--ih-border)] bg-[var(--ih-surface)] px-3 py-3 shadow-[var(--ih-shadow-soft)] transition-all hover:border-[rgba(22,163,74,0.18)] hover:shadow-[var(--ih-shadow-lift)] lg:min-h-[5rem] lg:px-5 lg:py-4"
            >
              <RecognitionLogo name={l.name} img={l.img} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
