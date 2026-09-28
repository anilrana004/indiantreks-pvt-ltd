/**
 * Convert local public raster images (png/jpg/jpeg) to WebP and remove originals.
 * Usage: node scripts/compress-images-webp.mjs
 */
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const require = createRequire(path.join(root, 'node_modules/next/package.json'));
const sharp = require('sharp');

const publicDir = path.join(root, 'public');
const exts = new Set(['.png', '.jpg', '.jpeg']);
const results = [];

async function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full);
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (!exts.has(ext)) continue;

    const out = full.replace(/\.(png|jpe?g)$/i, '.webp');
    const input = fs.readFileSync(full);
    const meta = await sharp(input).metadata();
    const quality = meta.hasAlpha ? 85 : 80;
    await sharp(input).webp({ quality, effort: 6 }).toFile(out);

    const before = fs.statSync(full).size;
    const after = fs.statSync(out).size;
    results.push({
      src: path.relative(root, full),
      out: path.relative(root, out),
      beforeKb: +(before / 1024).toFixed(1),
      afterKb: +(after / 1024).toFixed(1),
      savedPct: +(((before - after) / before) * 100).toFixed(1),
    });
    fs.unlinkSync(full);
  }
}

await walk(publicDir);
console.log(JSON.stringify(results, null, 2));
console.log(`\nConverted ${results.length} image(s).`);
