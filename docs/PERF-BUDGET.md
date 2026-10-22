# Performance budgets and measurement

Updated 2026-10-23. Historical reports measure earlier revisions, not current scores.

## Script gates

scripts/measure-perf.mjs currently encodes:

| Metric | Threshold |
| --- | --- |
| Transfer | 500 KiB |
| Load | 1000 ms |
| LCP | 2500 ms |
| Synthetic interaction proxy | 200 ms |
| CLS | 0.1 |
| Lighthouse mobile | 60 enforced; 90 aspirational second-pass target |

Mobile profile: 390 × 844, DPR 2, Slow 4G, 4× CPU slowdown. Desktop: 1440 × 900 without throttling. The interaction proxy is not field INP. These thresholds describe the harness, not a current pass claim.

## Measure the current build

~~~powershell
npm run build
npm run measure-perf -- --no-build --label current
~~~

Use --no-build because the harness's built-in build calls Vite directly and omits React prerendering. Other options include --url, --out, --port and --skip-lighthouse. CHROME_PATH selects an installed Chromium binary. Default output is docs/evidence/T-006/perf-report.json; use --out to preserve older reports. Review legacy selectors/probes after markup changes before relying on interaction timings.

## Constraints

Keep the hero photo prioritised and correctly sized, lower images lazy, and responsive candidates generated from masters. The image manifest controls per-asset limits; social-card checks validate size/dimensions separately.

Use the shared scroll clock, cached geometry, fewer canvas points/30fps cap on phones, offscreen/hidden-tab suspension and static reduced motion. HireDrawer is lazy loaded. Compressed HTML is refreshed after prerendering.

Field Core Web Vitals require a configured real-user source such as Speed Insights. Old Lighthouse JSON, layout emulation and screenshots do not establish present phone frame rate or deployed performance.
