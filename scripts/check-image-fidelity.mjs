/**
 * T-001 evidence — encoder fidelity check.
 *
 *   node scripts/check-image-fidelity.mjs
 *
 * For every emitted candidate, decode it and compare it against the master
 * downscaled to the SAME width with the same kernel. This isolates encoder
 * loss (resampling loss is identical on both sides), so the numbers below are
 * an honest measure of "what the re-encode cost".
 *
 * PSNR >= 35 dB on a photo is the usual "visually lossless" line; anything
 * under that fails the gate.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { PHOTOS, FORMATS } from '../src/data/image-manifest.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIN_PSNR_DB = 35;

function compare(a, b) {
  const n = Math.min(a.length, b.length);
  let se = 0;
  let maxAbs = 0;
  let over8 = 0;
  for (let i = 0; i < n; i++) {
    const d = Math.abs(a[i] - b[i]);
    se += d * d;
    if (d > maxAbs) maxAbs = d;
    if (d > 8) over8++;
  }
  const mse = se / n;
  return {
    psnr: mse === 0 ? Infinity : 10 * Math.log10((255 * 255) / mse),
    maxAbs,
    pctOver8: (over8 / n) * 100,
  };
}

const rows = [];
let failed = false;

for (const [key, photo] of Object.entries(PHOTOS)) {
  const master = path.join(ROOT, photo.master);
  for (const width of photo.widths) {
    const baseline = await sharp(master).removeAlpha().resize({ width, withoutEnlargement: true }).raw().toBuffer();
    for (const fmt of FORMATS) {
      const file = path.join(ROOT, 'public', 'img', `${path.basename(photo.base)}-${width}.${fmt}`);
      const decoded = await sharp(file).raw().toBuffer();
      const r = compare(decoded, baseline);
      const over = r.psnr < MIN_PSNR_DB;
      if (over) failed = true;
      rows.push({ photo: key, format: fmt, width, bytes: fs.statSync(file).size, psnrDb: Number(r.psnr.toFixed(2)), maxAbsDiff: r.maxAbs, pctPixelsOver8: Number(r.pctOver8.toFixed(3)) });
      console.log(
        `${key.padEnd(9)} ${fmt.padEnd(4)} ${String(width).padStart(4)}w  PSNR ${r.psnr.toFixed(2).padStart(6)} dB  max|d| ${String(r.maxAbs).padStart(3)}  pixels>8: ${r.pctOver8.toFixed(3)}%  ${over ? 'BELOW 35 dB GATE' : ''}`
      );
    }
  }
}

const report = { checkedAt: new Date().toISOString(), minPsnrDb: MIN_PSNR_DB, failed, findings: rows };
const out = path.join(ROOT, 'docs', 'evidence', 'T-001', 'fidelity-report.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(report, null, 1));

const worst = rows.reduce((a, b) => (b.psnrDb < a.psnrDb ? b : a));
console.log(`\nworst case: ${worst.photo} ${worst.format} ${worst.width}w @ ${worst.psnrDb} dB`);
console.log(failed ? `FAIL: at least one asset is below the ${MIN_PSNR_DB} dB gate` : `PASS: every asset is at or above the ${MIN_PSNR_DB} dB gate`);
process.exit(failed ? 1 : 0);
