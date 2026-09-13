#!/usr/bin/env node
/**
 * scripts/check-contrast.mjs — WCAG 2.2 AA contrast audit for the token palette.
 *
 * Reads the tokens straight out of src/styles/tokens.css, resolves the
 * `rgb(var(--c-…))` references, and checks every foreground/background pair the
 * site actually uses, in both themes.
 *
 * Limitation, stated honestly: this audits FLAT token pairs. Where the real page
 * stacks a translucent tint over a gradient (cards, glass panels), Lighthouse's
 * color-contrast audit on the rendered page is the arbiter — that is why the
 * pairs below carry a margin and why the Lighthouse report is attached as
 * evidence (docs/evidence/T-005/).
 *
 * Usage: node scripts/check-contrast.mjs
 * Exit 1 if any pair is below its WCAG 2.2 AA minimum.
 */
import { readFileSync } from 'node:fs';

const CSS = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');

/* ---------------------------------------------------------------- *
 * parse the token blocks
 * ---------------------------------------------------------------- */
const block = (selector) => {
  const start = CSS.indexOf(selector);
  if (start === -1) return {};
  const open = CSS.indexOf('{', start);
  const close = CSS.indexOf('\n}', open);
  const body = CSS.slice(open + 1, close);
  const out = {};
  for (const m of body.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
};

const DARK = block(':root,\n[data-theme=\'dark\']');
const LIGHT = { ...DARK, ...block("[data-theme='light']") };

/* ---------------------------------------------------------------- *
 * colour maths
 * ---------------------------------------------------------------- */
const parseHex = (hex) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};

const channelsToRgb = (channels) => channels.split(/\s+/).filter(Boolean).map(Number).slice(0, 3);

/** Resolve a token to [r,g,b,a] using the theme's own definitions. */
const resolve = (name, theme) => {
  const raw = theme[name] ?? DARK[name];
  if (!raw) throw new Error(`unknown token ${name}`);
  const rgbVar = raw.match(/^rgba?\(\s*var\((--[a-z0-9-]+)\)\s*(?:\/\s*([\d.]+))?\s*\)$/);
  if (rgbVar) {
    const [, ref, alpha] = rgbVar;
    return [...channelsToRgb(theme[ref] ?? DARK[ref]), alpha ? Number(alpha) : 1];
  }
  const plainRgb = raw.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[,/]\s*([\d.]+))?\s*\)$/);
  if (plainRgb) return [1, 2, 3].map((i) => Number(plainRgb[i])).concat([plainRgb[4] ? Number(plainRgb[4]) : 1]);
  // a raw channel triplet, the form every colour primitive is stored in
  if (/^[\d.\s]+$/.test(raw)) return channelsToRgb(raw).concat([1]);
  if (raw.startsWith('#')) return [...parseHex(raw), 1];
  throw new Error(`cannot resolve ${name} = ${raw}`);
};

const relativeLuminance = ([r, g, b]) => {
  const f = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

/** Composite a possibly-translucent foreground over an opaque background. */
const flatten = (fg, bg) => {
  const a = fg[3] ?? 1;
  if (a >= 1) return fg.slice(0, 3);
  return [0, 1, 2].map((i) => Math.round(fg[i] * a + bg[i] * (1 - a)));
};

const contrast = (fg, bg) => {
  const bgRgb = bg.slice(0, 3);
  const fgRgb = flatten(fg, bgRgb);
  const [l1, l2] = [relativeLuminance(fgRgb), relativeLuminance(bgRgb)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
};

/* ---------------------------------------------------------------- *
 * the pairs the site actually renders
 * ---------------------------------------------------------------- */
const BACKGROUNDS = [
  ['background', '--bg'],
  ['raised surface', '--surface-solid'],
  ['deep surface', '--surface-deep'],
  ['tinted card (worst case)', '--surface-tint'],
];

/**
 * `themes` — the light theme is a secondary skin whose accent utilities are
 * still dark-theme-first, so only the theme-switched semantic text tokens are
 * audited there. The gap is recorded in docs/DESIGN-SYSTEM.md §6 rather than
 * hidden by an audit that would pass on a palette nobody looks at.
 */
const FOREGROUNDS = [
  ['body text', '--text', 4.5, 'both'],
  ['muted text', '--muted', 4.5, 'both'],
  ['accent text', '--accent-text', 4.5, 'both'],
  ['violet-400 (accent scale)', '--c-violet-400', 4.5, 'dark'],
  ['violet-300 (accent scale)', '--c-violet-300', 4.5, 'dark'],
  ['cyan-400 (accent scale)', '--c-cyan-400', 4.5, 'dark'],
  ['emerald-400 (live indicator)', '--c-emerald-400', 3.0, 'dark'],
  ['amber-400 (label)', '--c-amber-400', 4.5, 'dark'],
];

let failures = 0;
for (const [themeName, theme] of [['dark', DARK], ['light', LIGHT]]) {
  console.log(`\n${themeName.toUpperCase()} THEME`);
  console.log('  foreground'.padEnd(48) + BACKGROUNDS.map((b) => b[0].padStart(22)).join(''));
  for (const [label, token, min, scope] of FOREGROUNDS) {
    if (scope !== 'both' && scope !== themeName) continue;
    const fg = resolve(token, theme);
    const cells = BACKGROUNDS.map(([, bgToken]) => {
      const bg = resolve(bgToken, theme);
      const ratio = contrast(fg, bg);
      const ok = ratio >= min;
      if (!ok) failures++;
      return `${ratio.toFixed(2)}:1 ${ok ? 'AA' : 'FAIL'}`.padStart(22);
    });
    console.log(`  ${label}`.padEnd(48) + cells.join(''));
  }
}

if (failures) {
  console.error(`\nFAIL — ${failures} pair(s) below AA.`);
  process.exit(1);
}
console.log('\nPASS — every audited pair meets WCAG 2.2 AA (4.5:1 text, 3:1 non-text).');
