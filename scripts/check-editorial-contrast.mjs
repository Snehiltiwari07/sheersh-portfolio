import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const css = readFileSync('src/styles/tokens.css', 'utf8');
const parse = block => Object.fromEntries([...block.matchAll(/(--[\w-]+):\s*(#[\da-f]{6})\b/gi)].map(match => [match[1], match[2]]));
const base = parse(css.match(/:root\s*\{([\s\S]*?)\}/)[1]);
const dark = { ...base, ...parse(css.match(/:root\[data-theme='dark'\]\s*\{([\s\S]*?)\}/)[1]) };
const luminance = hex => {
  const channels = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
};
const pairs = [
  ['Body', '--ink', '--paper'], ['Supporting text', '--ink-soft', '--paper'],
  ['Panel text', '--ink', '--paper-white'], ['Panel secondary', '--ink-soft', '--paper-white'],
  ['Links', '--accent-ink', '--paper'], ['Hero', '--hero-foreground', '--hero-surface'],
  ['Hero secondary', '--hero-secondary', '--hero-surface'], ['Hero emphasis', '--hero-emphasis', '--hero-surface'],
  ['Buttons', '--cta-text', '--cta-bg'], ['Reviews', '--hero-text', '--hero-blue'],
  ['AI scene', '--scene-text', '--scene-bg'], ['AI scene secondary', '--scene-muted', '--scene-bg'],
  ['WhatsApp', '--whatsapp-text', '--whatsapp-bg'],
];
for (const [theme, tokens] of [['light', base], ['dark', dark]]) for (const [label, foreground, background] of pairs) {
  const a = luminance(tokens[foreground]), b = luminance(tokens[background]);
  const ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
  assert.ok(ratio >= 4.5, `${theme} ${label}: ${ratio.toFixed(2)}:1 is below 4.5:1`);
  console.log(`PASS ${theme}: ${label} ${ratio.toFixed(2)}:1`);
}
console.log('All 26 editorial text/background pairs meet WCAG AA contrast.');
