/**
 * scripts/build-og-image.mjs — the 1200x630 social card (T-014, gate FAIL #10).
 *
 *   node scripts/build-og-image.mjs
 *
 * Writes public/og-image.png — the file `og:image` / `twitter:image` point at.
 *
 * Rules this script follows:
 *   · Every word on the card comes from src/data/positioning.js. No new copy is
 *     invented here (the whole point of #7 was ONE statement, not a seventh).
 *   · Every colour is parsed out of src/styles/tokens.css, the token layer, so
 *     the card cannot drift from the site palette.
 *   · The photograph is the pipeline's own master (assets-src/), not a new
 *     asset: the card is a crop of the headshot already shipping.
 *
 * Note on location: the file lands in public/, NOT public/img/ — public/img is
 * owned by scripts/build-images.mjs, which deletes anything not in its manifest.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { TITLE_TAG, TAGLINE, PROOF_LINE } from '../src/data/positioning.js';
import { SITE_URL } from '../src/data/site.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TOKENS_CSS = path.join(ROOT, 'src', 'styles', 'tokens.css');
const HEADSHOT_MASTER = path.join(ROOT, 'assets-src', 'profile-headshot.png');
const OUT = path.join(ROOT, 'public', 'og-image.png');

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

// ── the token layer, read back (no second palette to drift) ───────────────────
const css = fs.readFileSync(TOKENS_CSS, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** 'rgb(r g b)' for a channel-triplet token, e.g. tokenRgb('--c-ink-900'). */
function tokenRgb(name) {
  const match = css.match(new RegExp(`${name}\\s*:\\s*([\\d.]+)\\s+([\\d.]+)\\s+([\\d.]+)\\s*;`));
  if (!match) throw new Error(`token ${name} not found in src/styles/tokens.css`);
  return `rgb(${match[1]} ${match[2]} ${match[3]})`;
}

/** Raw channels, for the alpha-bearing gradient stops. */
function tokenChannels(name) {
  const match = css.match(new RegExp(`${name}\\s*:\\s*([\\d.]+)\\s+([\\d.]+)\\s+([\\d.]+)\\s*;`));
  if (!match) throw new Error(`token ${name} not found in src/styles/tokens.css`);
  return `${match[1]} ${match[2]} ${match[3]}`;
}

const INK_900 = tokenRgb('--c-ink-900');
const INK_800 = tokenRgb('--c-ink-800');
const INK_300 = tokenRgb('--c-ink-300');
const INK_400 = tokenRgb('--c-ink-400');
const INK_50 = tokenRgb('--c-ink-50');
const VIOLET_400 = tokenRgb('--c-violet-400');
const VIOLET_500_CH = tokenChannels('--c-violet-500');
const VIOLET_600_CH = tokenChannels('--c-violet-600');
const CYAN_300 = tokenRgb('--c-cyan-300');
const CYAN_400_CH = tokenChannels('--c-cyan-400');
const ORANGE_500_CH = tokenChannels('--c-orange-500');

const FONT =
  "Inter, 'Segoe UI Variable Display', 'Segoe UI', Helvetica, Arial, sans-serif";
const FONT_MONO = "'JetBrains Mono', 'Cascadia Mono', Consolas, monospace";

const xmlEscape = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ── layout (px on the 1200x630 canvas) ────────────────────────────────────────
const PAD = 72;
const PHOTO = { left: 792, top: 96, width: 336, height: 438, radius: 28 };
const TEXT_RIGHT = PHOTO.left - 44;

const background = `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">
  <defs>
    <radialGradient id="glowViolet" cx="22%" cy="18%" r="62%">
      <stop offset="0" stop-color="rgb(${VIOLET_600_CH})" stop-opacity="0.55"/>
      <stop offset="1" stop-color="rgb(${VIOLET_600_CH})" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowCyan" cx="86%" cy="88%" r="58%">
      <stop offset="0" stop-color="rgb(${CYAN_400_CH})" stop-opacity="0.30"/>
      <stop offset="1" stop-color="rgb(${CYAN_400_CH})" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowOrange" cx="58%" cy="104%" r="46%">
      <stop offset="0" stop-color="rgb(${ORANGE_500_CH})" stop-opacity="0.22"/>
      <stop offset="1" stop-color="rgb(${ORANGE_500_CH})" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${VIOLET_400}" stop-opacity="0.9"/>
      <stop offset="0.55" stop-color="${CYAN_300}" stop-opacity="0.75"/>
      <stop offset="1" stop-color="rgb(${ORANGE_500_CH})" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="${INK_900}"/>
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#glowViolet)"/>
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#glowCyan)"/>
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#glowOrange)"/>
  <rect x="0.5" y="0.5" width="${OG_WIDTH - 1}" height="${OG_HEIGHT - 1}" fill="none" stroke="${VIOLET_500_CH}"
        stroke-opacity="0.45" stroke-width="1"/>

  <!-- brand mark (same three-stroke glyph as the navbar logo) -->
  <g transform="translate(${PAD} 64)">
    <path d="M9 10L0 19L9 28" fill="none" stroke="${VIOLET_400}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M31 10L40 19L31 28" fill="none" stroke="${CYAN_300}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M25 4L15 34" fill="none" stroke="${VIOLET_400}" stroke-width="2.6" stroke-linecap="round"/>
  </g>
  <text x="${PAD + 54}" y="92" font-family="${FONT_MONO}" font-size="20" font-weight="700"
        letter-spacing="4" fill="${CYAN_300}">SHEERSH.DEV</text>

  <!-- role: one statement, verbatim from src/data/positioning.js.
       textLength pins it to the text column: the card is rendered by librsvg
       with whatever face fontconfig resolves, so the natural advance width is
       not knowable at build time and an unbounded string collided with the
       photograph on the first render. -->
  <text x="${PAD}" y="248" font-family="${FONT}" font-size="26" font-weight="600"
        fill="${INK_300}" textLength="${TEXT_RIGHT - PAD}" lengthAdjust="spacingAndGlyphs">${xmlEscape(TAGLINE)}</text>

  <text x="${PAD}" y="318" font-family="${FONT}" font-size="62" font-weight="800"
        letter-spacing="-1.5" fill="${INK_50}">Sheersh Tiwari</text>

  <rect x="${PAD}" y="352" width="150" height="4" rx="2" fill="url(#rule)"/>

  <!-- proof line: the measurable claim, verbatim -->
  <text x="${PAD}" y="424" font-family="${FONT}" font-size="27" font-weight="600"
        fill="${CYAN_300}" textLength="${TEXT_RIGHT - PAD}" lengthAdjust="spacingAndGlyphs">${xmlEscape(PROOF_LINE)}</text>

  <text x="${PAD}" y="${OG_HEIGHT - 58}" font-family="${FONT_MONO}" font-size="19"
        fill="${INK_400}">${xmlEscape(SITE_URL.replace(/^https?:\/\//, ''))}</text>
</svg>`;

const frame = `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">
  <rect x="${PHOTO.left}" y="${PHOTO.top}" width="${PHOTO.width}" height="${PHOTO.height}"
        rx="${PHOTO.radius}" fill="none" stroke="rgb(${VIOLET_500_CH})" stroke-opacity="0.7" stroke-width="2"/>
  <rect x="${PHOTO.left + 10}" y="${PHOTO.top + PHOTO.height + 18}" width="${PHOTO.width - 20}" height="3"
        rx="1.5" fill="url(#rule)"/>
</svg>`;

const roundMask = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${PHOTO.width}" height="${PHOTO.height}">
     <rect width="${PHOTO.width}" height="${PHOTO.height}" rx="${PHOTO.radius}" fill="#fff"/>
   </svg>`
);

if (!fs.existsSync(HEADSHOT_MASTER)) {
  throw new Error(`missing master: ${path.relative(ROOT, HEADSHOT_MASTER)}`);
}

const photo = await sharp(HEADSHOT_MASTER)
  .resize(PHOTO.width, PHOTO.height, { fit: 'cover', position: 'top' })
  .composite([{ input: roundMask, blend: 'dest-in' }])
  .png()
  .toBuffer();

const card = await sharp(Buffer.from(background))
  .composite([
    { input: photo, left: PHOTO.left, top: PHOTO.top },
    { input: Buffer.from(frame), left: 0, top: 0 },
  ])
  .png({ compressionLevel: 9, effort: 7 })
  .toBuffer();

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, card);

const meta = await sharp(card).metadata();
const size = fs.statSync(OUT).size;
console.log(`og-image.png  ${meta.width}x${meta.height}  ${(size / 1024).toFixed(1)} KB  -> ${path.relative(ROOT, OUT)}`);
console.log(`  role : ${TAGLINE}`);
console.log(`  proof: ${PROOF_LINE}`);
console.log(`  title: ${TITLE_TAG}`);

if (meta.width !== OG_WIDTH || meta.height !== OG_HEIGHT) {
  console.error(`FAIL: expected ${OG_WIDTH}x${OG_HEIGHT}`);
  process.exit(1);
}
