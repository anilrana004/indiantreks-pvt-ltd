import { CHOPTA_TUNGNATH_GALLERY } from '../src/lib/content/treks/chopta-tungnath/gallery-content';
import { DAYARA_BUGYAL_GALLERY } from '../src/lib/content/treks/dayara-bugyal/gallery-content';
import { BRAHMATAL_GALLERY } from '../src/lib/content/treks/brahmatal/gallery-content';
import { KUARI_PASS_GALLERY } from '../src/lib/content/treks/kuari-pass/gallery-content';
import { NAG_TIBBA_GALLERY } from '../src/lib/content/treks/nag-tibba/gallery-content';
import { PANGARCHULLA_GALLERY } from '../src/lib/content/treks/pangarchulla/gallery-content';
import { getTrekById } from '../src/lib/data';
import { photos } from '../src/lib/media';
import { trekPhoto } from '../src/lib/safe-image';

const galleries: Record<string, readonly string[]> = {
  chopta: CHOPTA_TUNGNATH_GALLERY,
  dayara: DAYARA_BUGYAL_GALLERY,
  brahmatal: BRAHMATAL_GALLERY,
  kuari: KUARI_PASS_GALLERY,
  nag: NAG_TIBBA_GALLERY,
  pang: PANGARCHULLA_GALLERY,
};

let errors = 0;

for (const [name, gallery] of Object.entries(galleries)) {
  const bad = gallery.filter((u) => !u.includes('f_auto') || !u.includes('cloudinary'));
  console.log(`[gallery] ${name}: ${gallery.length} urls, bad=${bad.length}`);
  if (!gallery.length || bad.length) errors += 1;
}

const trekIds = [
  'chopta-tungnath',
  'dayara-bugyal',
  'brahmatal',
  'kuari-pass',
  'nag-tibba',
  'pangarchulla',
] as const;

for (const id of trekIds) {
  const trek = getTrekById(id);
  const images = trek?.images ?? [];
  const allCld = images.length > 0 && images.every((u) => u.includes('res.cloudinary.com'));
  const safe = trekPhoto(id);
  const ok = Boolean(trek && allCld && trek.cardImage && safe?.includes('cloudinary'));
  console.log(
    `[trek] ${id}: images=${images.length} allCld=${allCld} card=${Boolean(trek?.cardImage)} safe=${Boolean(safe)}`,
  );
  if (!ok) errors += 1;
}

if (!photos.chopta.includes('f_auto') || !photos.dayara.includes('f_auto')) {
  console.log('[media] hero f_auto missing');
  errors += 1;
} else {
  console.log('[media] chopta/dayara heroes ok');
}

async function checkUrls(): Promise<number> {
  const allUrls = Object.values(galleries).flat();
  let okCount = 0;
  let failCount = 0;
  const fails: string[] = [];

  for (const url of allUrls) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok) {
        okCount += 1;
      } else {
        failCount += 1;
        fails.push(`${res.status} ${url}`);
      }
    } catch (err) {
      failCount += 1;
      fails.push(`${String(err)} ${url}`);
    }
  }

  console.log(`[http] ok=${okCount} fail=${failCount} total=${allUrls.length}`);
  for (const line of fails.slice(0, 12)) console.log(`  ${line}`);
  return failCount;
}

void (async () => {
  const failCount = await checkUrls();
  if (failCount) errors += 1;

  if (errors) {
    console.error(`SMOKE_FAIL errors=${errors}`);
    process.exit(1);
  }

  console.log('SMOKE_OK');
})();
