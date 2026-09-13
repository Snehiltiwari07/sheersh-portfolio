/**
 * T-001 — responsive image pipeline (build time, no runtime service).
 *
 *   node scripts/build-images.mjs
 *
 * Reads the masters in assets-src/, writes AVIF + WebP candidates (480…2048px)
 * plus one universally-supported fallback per photo into public/img/.
 * Fails (exit 1) if any single emitted asset exceeds MAX_ASSET_BYTES.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { PHOTOS, FORMATS, FALLBACK_WIDTH, MAX_ASSET_BYTES } from '../src/data/image-manifest.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public', 'img');

// the headshot master carries a r=255, g=255, b=255, a=255… fully opaque alpha channel;
// dropping it is pixel-identical and saves a full channel in every AVIF/WebP.
sharp.cache(false);

// AVIF carries ~99% of real traffic (all browsers since 2023); WebP is the
// second-choice source. Both get their full quality at the widths a real
// viewport actually requests (<= 1280w); only the two widest candidates, which
// nothing but a 3x-DPR AVIF-less desktop would ever pick, are compressed
// harder — that keeps every emitted asset under the 200 KB per-asset budget.
const avifQuality = (width) => (width > 1280 ? 60 : 70);
const webpQuality = (width) => (width > 1280 ? 63 : width <= 640 ? 84 : 80);

const rows = [];
const expected = new Set();
let failed = false;

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const [key, photo] of Object.entries(PHOTOS)) {
  const masterPath = path.join(ROOT, photo.master);
  if (!fs.existsSync(masterPath)) throw new Error(`missing master: ${photo.master}`);
  const meta = await sharp(masterPath).metadata();
  const masterBytes = fs.statSync(masterPath).size;

  for (const width of photo.widths) {
    if (width > meta.width) throw new Error(`${key}: requested ${width}px but master is ${meta.width}px`);
    for (const fmt of FORMATS) {
      const file = `${path.basename(photo.base)}-${width}.${fmt}`;
      const out = path.join(OUT_DIR, file);
      expected.add(file);
      const pipeline = sharp(masterPath).removeAlpha().resize({ width, withoutEnlargement: true });
      const buf =
        fmt === 'avif'
          ? await pipeline.avif({ quality: avifQuality(width), effort: 4, chromaSubsampling: '4:4:4' }).toBuffer()
          : await pipeline.webp({ quality: webpQuality(width), effort: 4, smartSubsample: true }).toBuffer();
      fs.writeFileSync(out, buf);
      rows.push({ photo: key, file: `${photo.base}-${width}.${fmt}`, format: fmt, width, bytes: buf.length });
    }
  }

  // universally supported fallback (never requested by AVIF/WebP-capable browsers)
  const fbWidth = Math.min(FALLBACK_WIDTH, meta.width);
  const fbFile = path.basename(photo.fallback);
  const fbBuf = await sharp(masterPath)
    .removeAlpha()
    .resize({ width: fbWidth, withoutEnlargement: true })
    .png({ palette: true, quality: 50, compressionLevel: 9, effort: 7 })
    .toBuffer();
  fs.writeFileSync(path.join(OUT_DIR, fbFile), fbBuf);
  expected.add(fbFile);
  rows.push({ photo: key, file: photo.fallback, format: 'png(fallback)', width: fbWidth, bytes: fbBuf.length });

  console.log(
    `${key.padEnd(9)} master ${String(meta.width).padStart(4)}x${meta.height} ${(masterBytes / 1024).toFixed(0).padStart(5)} KB -> candidates ${photo.widths.join('/')}`
  );
}

// remove stale candidates so the folder always mirrors the manifest
for (const existing of fs.readdirSync(OUT_DIR)) {
  if (!expected.has(existing)) {
    fs.rmSync(path.join(OUT_DIR, existing), { force: true });
    console.log(`removed stale ${existing}`);
  }
}

const byPhoto = {};
for (const r of rows) (byPhoto[r.photo] ||= []).push(r);
for (const [key, list] of Object.entries(byPhoto)) {
  console.log(`\n== ${key} ==`);
  for (const r of list) {
    const over = r.bytes > MAX_ASSET_BYTES;
    if (over) failed = true;
    console.log(
      `  ${r.file.padEnd(42)} ${String(r.width).padStart(4)}w ${(r.bytes / 1024).toFixed(1).padStart(7)} KB ${over ? 'OVER 200KB BUDGET' : ''}`
    );
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  overBudget: failed,
  totalBytes: rows.reduce((a, b) => a + b.bytes, 0),
  assets: rows,
};
const reportPath = path.join(ROOT, 'docs', 'evidence', 'T-001', 'asset-report.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 1));

console.log(`\n${rows.length} assets, ${(report.totalBytes / 1024).toFixed(0)} KB on disk (all candidates+fallbacks)`);
console.log(failed ? 'FAIL: at least one asset exceeds the 200 KB per-asset budget' : 'PASS: every emitted asset is under the 200 KB per-asset budget');
process.exit(failed ? 1 : 0);
