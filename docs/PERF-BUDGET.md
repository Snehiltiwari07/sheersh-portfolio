# Performance budget & measurement harness

**Owner**: T-006 (`qa-reality-checker`) · **Enforced by**: `scripts/measure-perf.mjs`
**Source of the targets**: `docs/PRD.md` §1 (targets table) and §9 (perf budget).
**Rule**: a performance claim that this harness cannot measure is not a claim — it is a TODO.
Nothing in this document was estimated. Where a number could not be measured, it says so.

---

## 1. How to run it

```bash
cd <repo>

node scripts/measure-perf.mjs                     # GATE: build → preview → measure → PASS/FAIL
node scripts/measure-perf.mjs --no-build          # reuse the existing dist/ (no rebuild)
node scripts/measure-perf.mjs --url https://sheershtiwari.vercel.app/ --label baseline-live \
     --out docs/evidence/T-006/perf-baseline-live.json      # measure a deployed site (baseline mode)
node scripts/measure-perf.mjs --skip-lighthouse   # faster loop while iterating
```

* **Exit code 0** = every enforced budget met. **Non-zero** = at least one breach (a failed budget is
  listed on the last line of the output), the harness itself failed, or a preview server was left behind.
* No manual judgement is involved: the harness starts and stops its own `vite preview` server, its own
  headless Chrome, and verifies the preview port is free again before exiting.
* Artifacts of every run: the JSON report (`--out`, default `docs/evidence/T-006/perf-report.json`) and the
  Lighthouse reports (`docs/evidence/T-006/lighthouse-<label>.html` / `.json`, so a baseline run and a
  current run never overwrite each other).
* Requires Chrome (auto-detected; override with `CHROME_PATH`) and `npm install` (the harness needs the
  `lighthouse` devDependency). It runs on Windows + Node 24 and needs no network apart from the
  third-party tags the page itself loads.

## 2. The enforced budgets

| # | Metric | Budget | Enforced? |
|---|---|---|---|
| 1 | Total page transfer (all resources, cold cache) | **< 500 KB** | yes |
| 2 | First-party transfer | **< 500 KB** | yes (reported next to the total) |
| 3 | Load — `loadEventEnd`, local preview, unthrottled desktop | **< 1,000 ms** | yes |
| 4 | LCP (mobile) | **< 2.5 s** | yes |
| 5 | INP | **< 200 ms** | yes **when** measurable — proxy only, see §4 |
| 6 | CLS | **< 0.1** | yes (both viewports) |
| 7 | Lighthouse mobile performance | **>= 60** (pass-1 gate, BOSS decision 2026-09-13) · pass-2 target **>= 90** per PRD §9 | yes, at 60 |

Baseline to beat (live site, 25 Aug build): **8,468 KB transfer, 4,345 ms load, 51 resources.**

## 3. How each metric is measured (method, so it can be argued with)

Two page-load passes, **one per viewport**, each in a **fresh isolated browser context** (no cookies, no
cache — `Target.createBrowserContext` + `Network.clearBrowserCache` + `setCacheDisabled`):

| Pass | Viewport | Throttling | What it decides |
|---|---|---|---|
| `mobile` | 390x844 @2x, mobile UA | real Slow-4G (150 ms RTT, 1.6 Mbit/s down, 750 kbit/s up) + **4x CPU throttle** | LCP, CLS, INP proxy |
| `desktop` | 1440x900 @1x | none (lab) | load, transfer, CLS |

* **Transfer bytes** — Chrome DevTools Protocol `Network.loadingFinished.encodedDataLength` summed per
  URL, i.e. real bytes over the wire including response headers, for every request the page makes
  (first- and third-party). Reported split by origin, plus the 10 heaviest assets with their
  `content-encoding`, so a regression can be attributed to a file.
* **Load** — `performance.getEntriesByType('navigation')[0].loadEventEnd` of the desktop pass. The
  harness also reports when the last *first-party* resource finished, because the `load` event waits for
  third-party tags (gtag, CookieHub) that we do not control. See §5.
* **LCP / CLS** — `PerformanceObserver` injected with `Page.addScriptToEvaluateOnNewDocument` *before*
  navigation (`largest-contentful-paint`, `layout-shift`), read ~1.5 s after `loadEventFired`. LCP is the
  last reported LCP entry; the LCP element is recorded. CLS excludes shifts with recent input, as the
  metric requires.
* **INP (proxy)** — `PerformanceObserver('event', {durationThreshold: 0})`. The harness dispatches a
  fixed interaction set through Chrome's **real input pipeline** (`Input.dispatchMouseEvent` /
  `dispatchKeyEvent`): the first in-page nav link, the theme toggle, the first two buttons inside
  `#root`, and one `Tab` keypress. INP's per-interaction metric *is* the longest event duration in that
  interaction, so the worst duration measured this way is the lab analogue of INP. React/third-party
  hover and pointer work triggered on page load is included in the entry set, which is why the number is
  higher than a click-only measurement.
* **Lighthouse** — the `lighthouse` npm module, default **mobile** preset with simulated throttling,
  `onlyCategories: ['performance']`, single run, headless Chrome. Raw report kept as evidence.

## 4. What this harness does NOT measure — read this before quoting a number

1. **INP is not field INP.** A lab tab with scripted input is not a population of real users. There is no
   RUM/`web-vitals` beacon in this project, so there is no field INP to report. The row is a proxy, is
   labelled as one, and the harness prints this limitation on every run.
2. **Lighthouse is a simulated-throttling lab score.** Single run, machine-dependent; it is not CrUX
   field data and it moves a few points between runs on a busy machine.
3. **CLS is read ~1.5 s after `loadEventFired`.** Shifts caused by a later interaction are not counted.
4. **A `--url` (remote) run measures the *deployed* build**, not the working tree. It is only as current
   as the last deployment.
5. **The preview server is not Vercel.** `vite preview` here negotiates **gzip**; Vercel serves
   **brotli**. Brotli is ~8-12 % smaller than gzip on the JS bundles, so a local preview number is a
   slightly pessimistic estimate of production transfer — not an optimistic one.
6. **Third-party resources gated behind the CookieHub consent banner are measured as a first-time
   visitor sees them** (a fresh context has no consent cookie). Resources that only load after consent
   are not in the number.
7. **Weight/CWV only.** Image fidelity is a separate gate (`scripts/check-image-fidelity.mjs`), and
   accessibility/contrast/anonymisation are T-007's checks, not this harness's. T-005 also produced a
   Lighthouse report of its own (`docs/evidence/T-005/lighthouse-before.report.json`, summarised by
   `scripts/lh-report.mjs`) for its token/a11y baseline — that is a different artifact from this
   harness's `lighthouse-<label>.json`, which is performance-only and comes from a run of *this* gate.
8. **The harness cannot prove a fix is real.** It can only prove the artifact currently on disk does or
   does not meet the budget. A green run is evidence about one commit.
9. **The CWV probe is self-checked, and a broken probe can never look like a pass.** The harness compiles
   the injected probe before it starts (`new Function(PROBE)`) and verifies after each pass that
   `window.__perfProbe` actually exists. If it does not, LCP/CLS/INP are reported as **NOT MEASURED**
   (never 0), a `CWV probe installed (harness integrity)` row fails the gate, and the run says so loudly.
   This was not theoretical: the first draft of the probe had a syntax error and the rows silently went
   blank — which is exactly the failure mode this check now blocks.
10. **Two rows are flaky by construction and are labelled as such** (§7):
    * *Total transfer* includes third-party scripts. Whether `gtag.js` (172 KB) and the CookieHub payload
      load depends on the consent path, so this row moved 420 KB ↔ 580 KB across identical runs.
    * *INP proxy* is a **worst-case single event** over a handful of scripted interactions, so one outlier
      entry moves it from ~100 ms to ~1.1 s. It is reported as a maximum on purpose (INP is a maximum),
      and the per-interaction breakdown is printed next to it so the outlier is visible rather than hidden.
    Neither row may be quoted as a precise number; both are enforced, per the budget table.

## 5. Open question for the gate: "Load < 1,000 ms" and third-party tags

The `load` event on this page waits for **googletagmanager.com/gtag/js** (~172 KB, measured — it is a
large script and Google serves it weakly compressed) and **cdn.cookiehub.eu**. In the desktop pass
`loadEventEnd` sits at 2,060-2,770 ms, of which the last **first-party** resource accounts for
1,278-2,097 ms and the last third-party response for 2,023-3,285 ms — so *both* halves are over the
1,000 ms budget as the machine is configured, and the third-party half is the one this repository cannot
fix by editing `src/`. Two honest ways forward, for BOSS to choose:

* keep the budget and **defer** gtag/CookieHub off the critical path (or drop the consent banner), or
* restate budget #3 as a **first-party** budget (last first-party resource), and keep the full
  `loadEventEnd` as an informational number.

The harness reports both numbers on every run, so either decision is checkable.

## 6. Baseline — the live site *before* the pass-1 changes

```bash
node scripts/measure-perf.mjs --url https://sheershtiwari.vercel.app/ --label baseline-live \
     --out docs/evidence/T-006/perf-baseline-live.json
```

**When**: see `generatedAt` in `docs/evidence/T-006/perf-baseline-live.json`.
**What was deployed**: the 25 Aug build (`f2b4d2c`, asset `index-BpzHZWyk.js`) — production is *behind*
`main`, so this is genuinely the "before" artifact, not a local build.
**Known baseline to reproduce**: 8,468 KB transfer, 4,345 ms load, 51 resources.

### Result — run of the **final** harness revision (`perf-baseline-live.json`)

```
=== PERF BUDGET GATE — FAIL (baseline-live) ===
target: https://sheershtiwari.vercel.app/

  METRIC                                        MEASURED                                BUDGET              RESULT
  ------------------------------------------------------------------------------------------------------------------------
  Total page transfer (all resources, cold cache) 389 KB (mobile) / 8743 KB (desktop)   < 500 KB            FAIL
  First-party transfer                          160 KB (mobile) / 8358 KB (desktop)     < 500 KB            FAIL
  Load (loadEventEnd, local preview, unthrottled) 17834 ms (desktop)                     < 1000 ms           FAIL
  LCP (mobile, slow-4G + 4x CPU)                4812 ms                                 < 2500 ms           FAIL
  CLS                                           0 (mobile) / 0.0089 (desktop)           < 0.1               PASS
  INP (proxy: scripted interactions, lab)       3248 ms                                 < 200 ms            FAIL
  CWV probe installed (harness integrity)       yes, both passes                        required            PASS
  Lighthouse mobile performance                 45                                      >= 90               FAIL
```

Heaviest assets of the deployed (25 Aug) build, desktop pass — this is the 8.4 MB in one line:

```
      6090286  identity  -   /profile-headshot.png
      2305252  identity  -   /profile-lifestyle.png
       175877  zstd      yes https://www.googletagmanager.com/gtag/js?id=G-R767831ZBS
        76004  br        yes https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg
        44822  br        -   /assets/react-vendor-COtO7mEU.js
        42040  zstd      yes https://cdn.cookiehub.eu/c2/c71950bb.js
        31974  identity  yes https://fonts.gstatic.com/s/jetbrainsmono/v24/...woff2
```

**Reproduction check** — the known baseline is 8,468 KB / 4,345 ms / 51 resources:

| Known baseline | Measured by this harness (two runs) | Verdict |
|---|---|---|
| 8,468 KB transfer | **8743 KB** (desktop, cold cache) both runs | reproduced (+3.2 %: third-party/gtag variance) |
| 4,345 ms load | 3,073 ms and **17,834 ms** | same order of magnitude, network-bound; both far above budget. The 8.2 MB of first-party images is what the load event is waiting for |
| 51 resources | 52-53 distinct URLs | reproduced |

**The important nuance this harness uncovered**: at 390 px the *old* build transferred only **389-398 KB**, not
8.4 MB. The two multi-megabyte PNGs are requested at the desktop breakpoint only. So the "8.4 MB" crisis was a
desktop story, and a mobile-only check would never have caught it — both viewports are measured for that reason.

Variance between the two baseline runs: transfer identical at 8743 KB desktop / 389-398 KB mobile; `load` ranged
3.07 s → 17.8 s purely with how fast 8.2 MB of uncompressed PNG arrives; Lighthouse 45-50. The transfer figures
are the reproducible ones; the timing figures on the live host depend on the network path to Vercel.

## 7. Current status of the local built artifact

Run: `node scripts/measure-perf.mjs` (full run = build + preview + measure + gate).
Output is committed with the card; the numbers below come from the run recorded in
`docs/evidence/T-006/perf-report.json`.

```
=== PERF BUDGET GATE — FAIL (local-main) ===
target: http://127.0.0.1:4188/
tree:   measured from a DIRTY working tree (37 uncommitted path(s)) — these numbers describe this tree, not commit 44a3999

  METRIC                                        MEASURED                                BUDGET              RESULT
  ------------------------------------------------------------------------------------------------------------------------
  Total page transfer (all resources, cold cache) 324 KB (mobile) / 580 KB (desktop)   < 500 KB            FAIL
  First-party transfer                          173 KB (mobile) / 165 KB (desktop)     < 500 KB            PASS
  Load (loadEventEnd, local preview, unthrottled) 2506 ms (desktop)                     < 1000 ms           FAIL
  LCP (mobile, slow-4G + 4x CPU)                4052 ms                                 < 2500 ms           FAIL
  CLS                                           0.0166 (mobile) / 0.0107 (desktop)     < 0.1               PASS
  INP (proxy: scripted interactions, lab)       80 ms                                   < 200 ms            PASS
  CWV probe installed (harness integrity)       yes, both passes                        required            PASS
  Lighthouse mobile performance                 64                                      >= 90               FAIL
```

**Read this run correctly.** The measured target is the *working tree* (commit `44a3999` plus 37 uncommitted
paths, which include T-005's in-progress design-token/motion work) — the harness prints and records that, because
a build from a dirty tree is not the same artifact as a committed one. Re-run the gate when the tree is clean:

| Row | Why it is what it is |
|---|---|
| First-party transfer **PASS** (173 KB mobile / 165 KB desktop) | down from 8.2 MB of images; matches T-001's independent 166 KB measurement |
| Total transfer **FAIL** on desktop (415 KB of the 580 KB is third-party: gtag 172 KB, CookieHub 53 KB + 11 KB, devicon SVG 76 KB, Google Fonts 80 KB) | **flaky row** — see §4.6; the first-party row is the stable one |
| Load **FAIL** (2506 ms) | first-party resources finished at 1278 ms, the last third-party at 3068 ms. Even first-party alone is above 1,000 ms on this machine |
| LCP **FAIL** (4052 ms) | LCP element is real content (`<p>` inside `#root`, the positioning paragraph). Lighthouse's simulated throttling measured 2301 ms on the same build — both methods are above the 2.5 s budget in some runs, so LCP is genuinely out |
| CLS **PASS** (0.0166 / 0.0107) | T-001's `width`/`height` work holds |
| INP proxy **PASS** (80 ms) | see §4.6 — this row is outlier-sensitive |
| Lighthouse **FAIL** (64) | TBT 1382 ms; the heaviest main-thread work is React hydration + framer-motion |

### Run-to-run variance, same tree, 6 gate runs (so nobody quotes one run as if it were a constant)

| Metric | Observed range | Stable enough to gate? |
|---|---|---|
| First-party transfer | 163-173 KB desktop, 166-173 KB mobile | yes (within 6 %) |
| Total transfer | 420-580 KB desktop (third-party-dependent), 273-324 KB mobile | no — flaky, see §4.6 |
| Load (desktop, unthrottled) | 2,060-2,770 ms | yes, always far above the 1,000 ms budget |
| LCP (mobile, real slow-4G + 4x CPU) | 3,472-4,052 ms | yes, always above budget |
| Lighthouse mobile score | 64-74 | directionally yes, never near 90 |
| Lighthouse LCP (simulated throttling) | 2,301-2,820 ms | noisier than the direct measurement |
| CLS | 0.002-0.0404 mobile, 0.0089-0.0107 desktop | yes, always far below 0.1 |
| INP proxy | 80-1144 ms (5 runs; typically ~100 ms) | no — it is a single worst-case event, so one outlier dominates it |

**Verdict for this build**: the artifact currently on disk does **not** meet the CWV budget. Two of the eight rows
fail for reasons the repository controls (LCP, Lighthouse/TBT); one row (total transfer) fails on third-party
payloads; the load row fails on both. This is the honest state of the tree this gate was run against and it is the
number the next pass has to move — the harness is not a report card for T-006, it is the instrument T-007 uses.

## 8. Known harness limitations / TODO

* Lighthouse is re-run from scratch by the harness; a single run per gate invocation is deliberate (the
  pacing directive for this pass), so the score has normal lab variance, not a confidence interval. The
  observed range on one unchanged tree was 64-74; a budget of ">= 90" is not decided by that noise.
* **The report records whether the tree was dirty** (`treeDirty`, `dirtyFiles`, `treeNote`). A run on a
  dirty tree measures an artifact nobody has committed — do not compare it to a committed build. T-007
  should run the gate once the tree is clean.
* The harness assumes the page under test is reachable over plain HTTP on `127.0.0.1` in local mode and
  that Chrome can run headless on the machine. If the port is occupied it refuses to start rather than
  measuring the wrong target.
* `--port` (default 4188) is used for the preview server; the DevTools port is `--port + 100`. The
  preview binds `127.0.0.1` explicitly (Vite's default `localhost` binds `::1` on Windows, which would
  make the readiness check lie).
* Teardown is verified, not assumed: after the run the harness kills its preview server, closes Chrome
  over CDP, then re-binds the preview port to prove nothing was left behind (a stray server forces exit
  code 1). Both acceptance runs reported `port 4188 is free` with zero `chrome.exe` left running.
* Not yet done, and deliberately out of scope for this card: CI wiring (the gate is a script, not yet a
  GitHub Action), a multi-run median mode, and any form of real-user monitoring (there is no RUM beacon
  in this project, so field INP/field LCP remain unmeasurable here).
