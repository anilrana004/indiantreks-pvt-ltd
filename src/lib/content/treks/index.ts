import type { TrekExtendedContent } from '@/lib/content/treks/types';
import { getTrekById } from '@/lib/data';
import { buildDefaultTrekExtended } from '@/lib/content/treks/default-extended-content';
import { buildBrahmatalExtended } from '@/lib/content/treks/brahmatal';
import { buildChoptaTungnathExtended } from '@/lib/content/treks/chopta-tungnath';
import { buildHarKiDunExtended } from '@/lib/content/treks/har-ki-dun';
import { buildKuariPassExtended } from '@/lib/content/treks/kuari-pass';
import { buildNagTibbaExtended } from '@/lib/content/treks/nag-tibba';
import { buildPangarchullaExtended } from '@/lib/content/treks/pangarchulla';
import { kedarkanthaExtended } from '@/lib/content/treks/kedarkantha';

/**
 * Trek extended content registry.
 *
 * Flow (same idea as help-centre / policy pages):
 *   content/treks/<trek-id>/<section>-content.ts  →  trek folder index.ts  →  this registry  →  page
 *
 * To add a trek: create `content/treks/<trek-id>/`, split sections into `*-content.ts` files,
 * assemble in `<trek-id>/index.ts`, then register below.
 */
const TREK_EXTENDED_CONTENT: Record<string, TrekExtendedContent> = {
  kedarkantha: kedarkanthaExtended,
};

const TREK_CONTENT_OVERRIDES: Record<string, Partial<TrekExtendedContent>> = {};

/** Resolve full trek detail content (overview, sections, packing, policies, etc.). */
export function getTrekContent(trekId: string): TrekExtendedContent | undefined {
  const custom = TREK_EXTENDED_CONTENT[trekId];
  if (custom) return custom;

  const trek = getTrekById(trekId);
  if (!trek) return undefined;

  if (trekId === 'chopta-tungnath') {
    return buildChoptaTungnathExtended(trek);
  }

  if (trekId === 'kuari-pass') {
    return buildKuariPassExtended(trek);
  }

  if (trekId === 'pangarchulla') {
    return buildPangarchullaExtended(trek);
  }

  if (trekId === 'har-ki-dun') {
    return buildHarKiDunExtended(trek);
  }

  if (trekId === 'brahmatal') {
    return buildBrahmatalExtended(trek);
  }

  if (trekId === 'nag-tibba') {
    return buildNagTibbaExtended(trek);
  }

  const base = buildDefaultTrekExtended(trek);
  const overrides = TREK_CONTENT_OVERRIDES[trekId];
  if (!overrides) return base;

  return { ...base, ...overrides };
}

export { kedarkanthaExtended } from '@/lib/content/treks/kedarkantha';
