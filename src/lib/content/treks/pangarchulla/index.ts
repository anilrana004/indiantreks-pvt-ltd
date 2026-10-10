import type { Trek } from '@/lib/data';
import type { TrekExtendedContent, TrekRichSection } from '@/lib/content/treks/types';
import { buildDefaultTrekExtended } from '@/lib/content/treks/default-extended-content';
import { PANGARCHULLA_FITNESS_SECTION } from '@/lib/content/treks/pangarchulla/fitness-content';
import { PANGARCHULLA_OVERVIEW } from '@/lib/content/treks/pangarchulla/overview-content';
import { PANGARCHULLA_PACKING_SECTION } from '@/lib/content/treks/pangarchulla/packing-content';
import { PANGARCHULLA_SAFETY_SECTION } from '@/lib/content/treks/pangarchulla/safety-content';
import { PANGARCHULLA_STATS } from '@/lib/content/treks/pangarchulla/stats-content';

const PANGARCHULLA_SECTIONS: Record<string, TrekRichSection> = {
  fitness: PANGARCHULLA_FITNESS_SECTION,
  safety: PANGARCHULLA_SAFETY_SECTION,
};

/** Pangarchulla Peak extended content — overview, stats, fitness, safety & packing. */
export function buildPangarchullaExtended(trek: Trek): TrekExtendedContent {
  const base = buildDefaultTrekExtended(trek);

  return {
    ...base,
    stats: PANGARCHULLA_STATS,
    overviewExtra: PANGARCHULLA_OVERVIEW,
    packingSection: PANGARCHULLA_PACKING_SECTION,
    sections: base.sections.map((section) => PANGARCHULLA_SECTIONS[section.id] ?? section),
  };
}
