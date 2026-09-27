/**
 * Homepage Himalayan treks carousel + desktop hero — season-driven.
 *
 * Flip `HOME_HIMALAYAN_DEFAULT_SEASON` when the storefront focus changes
 * (e.g. Winter → Spring). That single switch updates:
 * - home Himalayan trek carousel default tab
 * - desktop hero slides (`getHeroDeskSlides` in home-hero.ts)
 *
 * Trek order in each list is display order for the carousel.
 */

export const HOME_HIMALAYAN_SEASONS = ['Winter', 'Spring', 'Summer', 'Autumn'] as const;

export type HomeHimalayanSeason = (typeof HOME_HIMALAYAN_SEASONS)[number];

/** Active homepage focus — change this when the season campaign rolls. */
export const HOME_HIMALAYAN_DEFAULT_SEASON: HomeHimalayanSeason = 'Winter';

export const HOME_HIMALAYAN_SECTION = {
  kicker: 'SEASONAL HIMALAYAN TREKS',
  viewAllLabel: 'View All Himalayan Treks',
  viewAllHref: '/treks',
} as const;

export const HOME_HIMALAYAN_SEASON_COPY: Record<
  HomeHimalayanSeason,
  { title: string; months: string }
> = {
  Winter: { title: 'Winter Treks', months: 'Dec – Mar' },
  Spring: { title: 'Spring Treks', months: 'Mar – May' },
  Summer: { title: 'Summer Treks', months: 'Jun – Sep' },
  Autumn: { title: 'Autumn Treks', months: 'Sep – Nov' },
};

/**
 * Curated trek IDs per season (must exist in `treks` catalog).
 * Winter list mirrors Indian Treks’ signature snow routes.
 */
export const HOME_HIMALAYAN_SEASON_TREK_IDS: Record<HomeHimalayanSeason, readonly string[]> = {
  Winter: [
    'kedarkantha',
    'brahmatal',
    'kuari-pass',
    'dayara-bugyal',
    'chopta-tungnath',
    'nag-tibba',
    'pangarchulla',
  ],
  Spring: [
    'har-ki-dun',
    'kuari-pass',
    'phulara-ridge',
    'chopta-tungnath',
    'dayara-bugyal',
    'nag-tibba',
    'deoban',
    'surya-top',
    'mcleodganj-trek',
  ],
  Summer: [
    'valley-of-flowers',
    'hampta-pass',
    'kashmir-great-lakes',
    'tarsar-marsar',
    'rupin-pass',
    'bali-pass',
    'buran-ghati',
    'bhrigu-lake',
    'beas-kund',
    'gaumukh-tapovan',
  ],
  Autumn: [
    'roopkund',
    'ali-bedni-bugyal',
    'gulabi-kantha',
    'har-ki-dun',
    'phulara-ridge',
    'ranthan-kharak',
    'yulla-kanda',
    'kheerganga',
  ],
};
