#!/usr/bin/env node
/**
 * scripts/lh-report.mjs — summarise a Lighthouse JSON report.
 *
 * Usage: node scripts/lh-report.mjs docs/evidence/T-005/lighthouse-before.report.json [--fail-under 90]
 *
 * Prints: category scores, CWV metrics (LCP/INP proxy TBT/CLS), byte weight, the
 * failing accessibility audits with the offending DOM selectors, and (if the
 * report has them) the observed LCP / INP / CLS web-vitals values.
 * Exits 1 when a category score is below --fail-under (default 90).
 */
import { readFileSync } from 'node:fs';

const [, , file, ...rest] = process.argv;
if (!file) {
  console.error('usage: node scripts/lh-report.mjs <lighthouse-report.json> [--fail-under N]');
  process.exit(2);
}
const failUnderIdx = rest.indexOf('--fail-under');
const FAIL_UNDER = failUnderIdx > -1 ? Number(rest[failUnderIdx + 1]) : 90;

const r = JSON.parse(readFileSync(file, 'utf8'));
const pct = (n) => (n === null || n === undefined ? 'n/a' : Math.round(n * 100));

console.log(`Lighthouse ${r.lighthouseVersion} · ${r.finalDisplayedUrl} · formFactor=${r.configSettings?.formFactor} · throttling=${r.configSettings?.throttlingMethod}`);
console.log(`fetched ${r.fetchTime}\n`);

console.log('CATEGORY SCORES');
let worst = 100;
for (const [key, cat] of Object.entries(r.categories)) {
  const score = pct(cat.score);
  if (typeof score === 'number') worst = Math.min(worst, score);
  console.log(`  ${key.padEnd(16)} ${String(score).padStart(3)}`);
}

const want = [
  ['largest-contentful-paint', 'LCP'],
  ['first-contentful-paint', 'FCP'],
  ['total-blocking-time', 'TBT (INP proxy)'],
  ['cumulative-layout-shift', 'CLS'],
  ['speed-index', 'Speed Index'],
  ['interactive', 'TTI'],
  ['max-potential-fid', 'Max Potential FID'],
  ['server-response-time', 'TTFB'],
  ['total-byte-weight', 'Total byte weight'],
  ['unused-javascript', 'Unused JS'],
  ['mainthread-work-breakdown', 'Main-thread work'],
  ['bootup-time', 'JS bootup'],
  ['render-blocking-resources', 'Render blocking'],
  ['uses-responsive-images', 'Responsive images'],
];
console.log('\nMETRICS');
for (const [id, label] of want) {
  const a = (r.audits || {})[id];
  if (!a) continue;
  const val = a.displayValue ?? (a.numericValue !== undefined ? String(Math.round(a.numericValue * 100) / 100) : 'n/a');
  console.log(`  ${label.padEnd(20)} ${String(val).padEnd(14)} score=${a.score === null ? 'info' : a.score}`);
}

const lcpEl = r.audits?.['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node?.snippet;
if (lcpEl) console.log(`\nLCP element: ${lcpEl}`);

console.log('\nACCESSIBILITY FAILURES (weight > 0, score < 1)');
const a11y = r.categories?.accessibility;
let a11yFails = 0;
for (const ref of a11y?.auditRefs ?? []) {
  const a = r.audits[ref.id];
  if (!a || a.score === null || a.score >= 1 || !ref.weight) continue;
  a11yFails++;
  const items = a.details?.items ?? [];
  const sels = items.slice(0, 4).map((i) => i.node?.selector ?? i.node?.snippet ?? JSON.stringify(i).slice(0, 90));
  console.log(`  [${ref.weight}] ${ref.id} — ${a.title}`);
  console.log(`      ${a.displayValue ?? items.length + ' item(s)'}`);
  for (const s of sels) console.log(`      · ${s}`);
  const expl = items.find((i) => i.node?.explanation)?.node?.explanation;
  if (expl) console.log(`      cause: ${String(expl).slice(0, 200)}`);
}
if (!a11yFails) console.log('  none');

console.log('\nPERFORMANCE OPPORTUNITIES (score < 0.9)');
for (const ref of r.categories?.performance?.auditRefs ?? []) {
  const a = r.audits[ref.id];
  if (!a || a.score === null || a.score >= 0.9 || !ref.weight) continue;
  console.log(`  ${ref.id} — ${a.title}${a.displayValue ? ' — ' + a.displayValue : ''}`);
}

console.log(`\nworst category score: ${worst}`);
if (worst < FAIL_UNDER) {
  console.log(`FAIL: below --fail-under ${FAIL_UNDER}`);
  process.exit(1);
}
console.log(`PASS: every category >= ${FAIL_UNDER}`);
