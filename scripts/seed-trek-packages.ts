import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { syncAllTrekPackagesFromCatalog, countTrekPackages } from '../src/lib/catalog/packages';

/**
 * Seed/upsert trek_packages from the code catalog.
 *   npx tsx scripts/seed-trek-packages.ts
 *   npx tsx scripts/seed-trek-packages.ts --overwrite
 */
async function main() {
  const overwrite = process.argv.includes('--overwrite');
  const synced = await syncAllTrekPackagesFromCatalog({ overwritePrices: overwrite });
  const total = await countTrekPackages();
  console.log(
    JSON.stringify({
      ok: true,
      synced,
      total,
      overwrite,
    }),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
