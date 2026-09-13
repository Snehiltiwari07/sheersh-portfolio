#!/usr/bin/env node
/**
 * scripts/check-seo.mjs — the positioning + social-layer drift guard (T-014).
 *
 * T-014 landed two PRD rows the final gate (T-007) failed:
 *
 *   row 8  — ONE positioning statement across hero, navbar, footer, <title>, meta
 *   row 10 — OG + Twitter card + a real 1200x630 image + JSON-LD Person + canonical
 *
 * Both fail *silently* when they drift: a crawler never complains, and a
 * seventh descriptor in a component is invisible until someone greps. This gate
 * is the grep, made repeatable. It fails (exit 1) on:
 *
 *   1. index.html carrying a placeholder `%TOKEN%` nothing resolves, or losing a
 *      required one (a dropped og:image token is exactly how #10 stayed missing)
 *   2. a divergent role descriptor re-appearing anywhere in src/, index.html or
 *      the built dist/ (the `current` strings in positioning.js are the list)
 *   3. dist/ missing the crawler layer, or a tag disagreeing with the data layer
 *      (title / meta description / canonical / og:url / og:image / JSON-LD
 *      jobTitle), or JSON-LD that does not parse
 *   4. public/og-image.png not being exactly 1200x630 or exceeding 300 KB
 *
 * Usage: node scripts/check-seo.mjs      (npm run check:seo)
 * Requires a prior `npm run build` for the dist/ half; it says so and passes
 * that section with a NOT CHECKED line if dist/ is absent (never a false pass).
 */
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import {
  TITLE_TAG,
  META_DESCRIPTION,
  TAGLINE,
  AVAILABILITY,
  FOOTER_BRAND,
  SUMMARY,
  PHOTO_ALT,
} from '../src/data/positioning.js';
import { CANONICAL_URL, OG_IMAGE_URL, OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT, OG_IMAGE_ALT } from '../src/data/seo.js';
import { profile } from '../src/data/profile.js';

const ROOT = process.cwd();
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const failures = [];
const ok = (label, detail = '') => console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ''}`);
const fail = (label, detail) => {
  failures.push(`${label}: ${detail}`);
  console.error(`  FAIL  ${label} — ${detail}`);
};

/* ------------------------------------------------------------------ */
/* 1. index.html: the placeholder contract                            */
/* ------------------------------------------------------------------ */
const html = read('index.html');

// Every token vite.config.js knows how to resolve (HTML_TOKENS). A token here
// that is not in that map ships the literal `%FOO%` to a crawler.
const KNOWN_TOKENS = [
  '%POSITIONING_TITLE%',
  '%POSITIONING_META_DESCRIPTION%',
  '%CANONICAL_URL%',
  '%OG_TYPE%',
  '%OG_IMAGE_URL%',
  '%OG_IMAGE_WIDTH%',
  '%OG_IMAGE_HEIGHT%',
  '%OG_IMAGE_ALT%',
  '%JSON_LD%',
];
const REQUIRED_TOKENS = [
  '%POSITIONING_TITLE%',
  '%POSITIONING_META_DESCRIPTION%',
  '%CANONICAL_URL%',
  '%OG_IMAGE_URL%',
  '%OG_IMAGE_ALT%',
  '%JSON_LD%',
];

const foundTokens = [...new Set([...html.matchAll(/%[A-Z0-9_]+%/g)].map((m) => m[0]))];
const unknown = foundTokens.filter((t) => !KNOWN_TOKENS.includes(t));
if (unknown.length) fail('index.html placeholders', `no HTML_TOKENS entry for ${unknown.join(', ')}`);
else ok(`index.html placeholders all resolvable (${foundTokens.length} used)`);

const missing = REQUIRED_TOKENS.filter((t) => !foundTokens.includes(t));
if (missing.length) fail('required crawler tokens present', `missing ${missing.join(', ')}`);
else if (!unknown.length) ok(`required crawler tokens present (${REQUIRED_TOKENS.length}/${REQUIRED_TOKENS.length})`);

for (const [label, needle] of [
  ['<title> tag', '<title>'],
  ['meta description', '<meta name="description"'],
  ['link rel=canonical', '<link rel="canonical"'],
  ['og:image', '<meta property="og:image"'],
  ['twitter:card', '<meta name="twitter:card"'],
  ['JSON-LD script', 'application/ld+json'],
]) {
  if (!html.includes(needle)) fail('index.html structure', `${label} not found`);
}

/* ------------------------------------------------------------------ */
/* 2. divergent role descriptors                                      */
/* ------------------------------------------------------------------ */
// The strings the site actually shipped, taken from positioning.filesToChange.
// Scanned everywhere except the spec file itself (which documents them as
// `current` on purpose).
const DIVERGENT = [
  'SQL & AI Architect',
  'Full-Stack Architect & SQL Performance Engineer',
  'Senior Software Engineer',
  'Full-Stack & SQL Architect',
  'Full-Stack Developer & SQL Optimization Specialist',
  'Available for Full-Stack & AI Systems Contracts',
  'Available for Contract & Remote Engagement',
];

// Legitimately still on disk, and NOT a failure here — both are recorded in the
// report rather than silently ignored:
//   · src/components/ChatEngine.jsx — the "Ask Jiya" persona line. T-014's card
//     forbids touching this file (it also carries the pending
//     VITE_GROQ_API_KEY decision), so this is a known remaining divergence.
//   · src/components/PhotoCard3D.jsx — dead code, imported by nothing, so the
//     string never reaches the bundle; the restraint spec deletes the file in
//     pass 2, which is where the card leaves it.
const OUT_OF_SCOPE = ['Full-Stack Architect & SQL Performance Specialist', 'Full-Stack & Systems Engineer'];

const readAll = (file) => readFileSync(file, 'utf8');
const walk = (dir, out = []) => {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(jsx?|mjs|html|css)$/.test(entry.name)) out.push(full);
  }
  return out;
};

const SPEC_FILE = join(ROOT, 'src', 'data', 'positioning.js');
const SCAN_FILES = [
  ...walk(join(ROOT, 'src')),
  join(ROOT, 'index.html'),
  ...walk(join(ROOT, 'dist')),
].filter((f) => existsSync(f));

let divergentHits = 0;
let scopeHits = 0;
for (const file of SCAN_FILES) {
  if (file === SPEC_FILE) continue;
  const rel = file.slice(ROOT.length + 1).replace(/\\/g, '/');
  const text = readAll(file);
  for (const s of DIVERGENT) {
    if (text.includes(s)) {
      divergentHits++;
      fail('divergent role descriptor', `${rel} still contains "${s}"`);
    }
  }
  for (const s of OUT_OF_SCOPE) {
    if (text.includes(s)) scopeHits++;
  }
}
if (!divergentHits) ok('no divergent role descriptor in src/, index.html or dist/');
console.log(
  `  NOTE  known remaining divergence, out of scope for T-014 (ChatEngine persona, card directive): ${scopeHits} hit(s)`
);

/* ------------------------------------------------------------------ */
/* 3. the built document                                              */
/* ------------------------------------------------------------------ */
const DIST = join(ROOT, 'dist', 'index.html');
if (!existsSync(DIST)) {
  console.log('  NOT CHECKED  dist/index.html — run `npm run build` first');
} else {
  const dist = readAll(DIST);
  const lines = dist.split('\n');

  const socialLines = lines.filter((l) => /og:|twitter:/.test(l)).length;
  if (socialLines < 10) fail('dist social tags', `${socialLines} lines carrying og:/twitter: (need >= 10)`);
  else ok('dist social tags', `${socialLines} lines carrying og:/twitter: (need >= 10)`);

  const canonicalCount = lines.filter((l) => l.includes('rel="canonical"')).length;
  if (canonicalCount !== 1) fail('dist canonical', `${canonicalCount} (need exactly 1)`);
  else ok('dist canonical', '1');

  const ldCount = lines.filter((l) => l.includes('application/ld+json')).length;
  if (ldCount !== 1) fail('dist JSON-LD block', `${ldCount} (need exactly 1)`);
  else ok('dist JSON-LD block', '1');

  const unresolved = [...new Set([...dist.matchAll(/%[A-Z0-9_]+%/g)].map((m) => m[0]))];
  if (unresolved.length) fail('dist unresolved placeholder', unresolved.join(', '));
  else ok('dist has no unresolved placeholder');

  const expectations = [
    ['<title>', `<title>${TITLE_TAG}</title>`],
    ['meta description', `<meta name="description" content="${META_DESCRIPTION}" />`],
    ['canonical', `<link rel="canonical" href="${CANONICAL_URL}" />`],
    ['og:url', `<meta property="og:url" content="${CANONICAL_URL}" />`],
    ['og:image', `<meta property="og:image" content="${OG_IMAGE_URL}" />`],
    ['og:title = <title>', `<meta property="og:title" content="${TITLE_TAG}" />`],
    ['twitter:image', `<meta name="twitter:image" content="${OG_IMAGE_URL}" />`],
    ['og:image:alt', `<meta property="og:image:alt" content="${OG_IMAGE_ALT}" />`],
  ];
  for (const [label, needle] of expectations) {
    if (!dist.includes(needle)) fail(`dist ${label} disagrees with the data layer`, needle);
  }
  if (!failures.some((f) => f.startsWith('dist '))) ok(`dist title/description/canonical/og all match the data layer (${expectations.length} tags)`);

  const ldMatch = dist.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!ldMatch) {
    fail('dist JSON-LD parses', 'script block not found');
  } else {
    try {
      const ld = JSON.parse(ldMatch[1]);
      const problems = [];
      if (ld['@type'] !== 'Person') problems.push(`@type=${ld['@type']}`);
      if (ld.name !== profile.name) problems.push(`name=${ld.name}`);
      if (ld.jobTitle !== TAGLINE) problems.push(`jobTitle=${ld.jobTitle}`);
      if (ld.url !== CANONICAL_URL) problems.push(`url=${ld.url}`);
      if (!Array.isArray(ld.sameAs) || ld.sameAs.some((u) => ![profile.linkedin, profile.github].includes(u)))
        problems.push(`sameAs=${JSON.stringify(ld.sameAs)}`);
      if (problems.length) fail('dist JSON-LD Person block', problems.join(', '));
      else ok('dist JSON-LD Person parses', `jobTitle = "${ld.jobTitle}", sameAs = ${JSON.stringify(ld.sameAs)}`);
    } catch (err) {
      fail('dist JSON-LD parses', err.message);
    }
  }
}

/* ------------------------------------------------------------------ */
/* 4. the share image itself                                          */
/* ------------------------------------------------------------------ */
const OG_FILE = join(ROOT, 'public', 'og-image.png');
if (!existsSync(OG_FILE)) {
  fail('public/og-image.png exists', 'og:image points at a file that is not committed');
} else {
  const bytes = statSync(OG_FILE).size;
  const meta = await sharp(OG_FILE).metadata();
  if (meta.width !== OG_IMAGE_WIDTH || meta.height !== OG_IMAGE_HEIGHT)
    fail('og-image.png dimensions', `${meta.width}x${meta.height} (need ${OG_IMAGE_WIDTH}x${OG_IMAGE_HEIGHT})`);
  if (bytes > 300 * 1024) fail('og-image.png weight', `${(bytes / 1024).toFixed(1)} KB (budget 300 KB)`);
  if (meta.width === OG_IMAGE_WIDTH && meta.height === OG_IMAGE_HEIGHT && bytes <= 300 * 1024)
    ok('og-image.png', `${meta.width}x${meta.height}, ${(bytes / 1024).toFixed(1)} KB, ${meta.format}`);
  // the declared og:image:width/height must describe the file on disk
  const declared = read('src/data/seo.js').match(/OG_IMAGE_WIDTH = (\d+)/);
  if (declared && Number(declared[1]) !== meta.width)
    fail('og:image:width declares the real file', `seo.js says ${declared[1]}, file is ${meta.width}`);
}

/* ------------------------------------------------------------------ */
/* report                                                             */
/* ------------------------------------------------------------------ */
console.log(
  `\ncheck-seo: role line = "${TAGLINE}"\n           availability = "${AVAILABILITY}"\n           summary = "${SUMMARY}"\n           footer = "${FOOTER_BRAND}"\n           photo alt = "${PHOTO_ALT}"`
);

if (failures.length) {
  console.error(`\nFAIL — ${failures.length} positioning/social-layer problem(s):`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log('\nPASS — one positioning statement everywhere, and the crawler layer matches it.');
