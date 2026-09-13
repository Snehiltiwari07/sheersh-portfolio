# T-005 evidence — design tokens · motion system · WCAG 2.2 AA · Core Web Vitals

Repo `C:/VS_CODE/Portfolio/sheersh-portfolio` · base commit `44a3999` (T-001) ·
all numbers below were produced on a **production build** (`npm run build` → `npm run preview`,
`http://localhost:4191/`), Lighthouse 12.8.2, mobile form factor, simulated throttling.

---

## 1. Acceptance criteria — honest verdict

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | Lighthouse mobile **90+**, real report attached | **FAIL — 66** | `lighthouse-after.report.{json,html}` (§2) |
| 2 | LCP < 2.5 s · INP < 200 ms · CLS < 0.1 | **PARTIAL** — LCP 3.8 s ✗ · INP **not measurable here** · CLS 0.079 ✓ | §2, §5 |
| 3 | grep proves zero hardcoded hex/px/ms in components | **PASS (enforced, not just grepped)** | `npm run check:tokens` (§3) |
| 4 | `prefers-reduced-motion: reduce` disables decorative motion, content intact | **PASS** | §4, browser-emulated |
| 5 | Keyboard-only walkthrough succeeds, focus always visible | **PASS** | §5, 30 tab stops + 84 content elements |
| 6 | Visual identity unchanged, before/after screenshots | **PASS with a documented delta** | §6 — the accent system was dead and is now restored |

Everything the card asks for is in place **except the Lighthouse number**, which is a *structural*
miss, not an unfinished item — see §7 "where it stops".

## 2. Lighthouse mobile, before vs after (same machine, same command)

```
npx lighthouse@12.8.2 http://localhost:4191/ --output=json --output=html \
  --output-path=docs/evidence/T-005/lighthouse-<before|after> \
  --only-categories=performance,accessibility,best-practices \
  --chrome-flags="--headless=new --no-sandbox"
```

| metric | before (`44a3999`) | after | target |
|---|---|---|---|
| **performance** | 66 | **66** | ≥ 90 ✗ |
| **accessibility** | 91 | **100** | — ✓ |
| best-practices | 96 | 96 | — |
| FCP | 2.9 s | 3.4 s | — |
| LCP | 3.7 s | 3.8 s | < 2.5 s ✗ |
| TBT (lab proxy for INP) | 560 ms | 500 ms | — |
| CLS | 0.049 | 0.079 | < 0.1 ✓ |
| Speed Index | 5.8 s | 4.2 s | — |
| TTI | 3.8 s | 4.7 s | — |
| total byte weight | 273 KiB | 434 KiB | — |
| render-blocking | est. 1,280 ms | **0 ms** | ✓ |
| main-thread work | 5.0 s | 6.0 s | — |

**Variance, stated plainly.** Four mobile runs of the *same* final build scored 61, 63, 66, 66 with
FCP between 2.1 s and 3.4 s and LCP between 2.8 s and 4.2 s. This is a shared dev machine, so a
single run is not a measurement — the table above is the run committed as evidence, and the best
observed FCP/LCP (2.1 s / 2.8 s) came from the same build as the worst.

Accessibility failures: **color-contrast 26 items + heading-order 1 + target-size 10 → 0.**

## 3. Zero hardcoded values

`npm run check:tokens` (new, `scripts/check-tokens.mjs`) scans components, lib, data, context,
`App.jsx`, `main.jsx`, `index.html` and every style file except `tokens.css` for hex colours,
`rgb()/hsl()` literals, `px`/`ms` in inline style objects and `px`/`ms`/hex inside Tailwind
arbitrary values. It also fails if the JS token mirror drifts from `tokens.css`.

```
$ npm run check:tokens
check-tokens: scanned 35 files
  allowlisted  src/components/ChatEngine.jsx  [px]  [2px]  — Out of scope for T-005 by explicit card
  directive ('Do not touch ... src/components/ChatEngine.jsx'); the file carries another card's work.
  ... (16 allowlisted entries, all from that one file)
PASS — no hardcoded colour/px/ms outside the token layer (16 documented exception(s)).
```

Before this pass the same scan surfaces everything the old code carried: 74 arbitrary type sizes,
27 hex colours, 9 rgba radial gradients, 8 inline `style={{…px}}` objects, 2 permanent
`will-change-transform`, 2 canvas palettes. All converted; the one exception file is documented in
`scripts/token-exceptions.json` with its reason.

## 4. Reduced motion (browser-emulated, raw values)

```
== NORMAL ==
cursor layer display: block
spotlight display: block
hero p opacity: 1
animations running: 24

== REDUCED MOTION (Emulation.setEmulatedMedia prefers-reduced-motion=reduce) ==
media matches: True
cursor layer display: none
spotlight display: none
grid still visible: 0.14
content intact - h1: Sheersh Tiwari
content intact - sections: 12   imgs: 38
main text length: 14745
mouse-x token after pointer moves: (never set)     <-- the listener is never attached
no-alt imgs: 0
```

## 5. Keyboard + focus (WCAG 2.2)

```
FIRST TAB STOP: {"text":"Skip to main content","href":"#main","top":8,"w":226,"h":50,
                 "transform":"matrix(1,0,0,1,0,0)","outline":"2px rgb(103,232,249)"}

30 sequential tab stops:
  with no visible outline : 0
  zero-size targets       : 0
  targets under 24x24 px  : 0     (WCAG 2.2 SC 2.5.8)

FOCUS NOT OBSCURED (SC 2.4.11): checked 84 content links/buttons, obscured by the sticky nav: []
ANCHOR CLEARANCE: #tech-stack target top 96 vs nav bottom 69 (clear)
                  #reviews    target top 5779 relative, nav bottom 69 (clear)
MOBILE 390x844: horizontal overflow 0 px on the hero and on the reviews section
```

**INP:** Lighthouse does not measure it, and there is no Real-User-Monitoring data for a build that
has never been deployed. **INP is not measured and is not claimed.** The changes that target it are
the idle-parked cursor rAF loop, the pointer spotlight never starting under reduced motion, the
deferred below-the-fold mount and moving framer-motion off the initial chunk; the lab proxy is TBT
(500 ms on the committed run).

## 6. Visual identity — before / after

T-001's own `shot-after-*` captures are the *before* state here (they are the same commit this card
starts from); the *after* captures were taken with the same `browser_exec` CDP recipe.

| before | after |
|---|---|
| `before-T005-1440x900-hero.png` | `after-1440x900-hero.jpg` |
| `before-T005-390x844-hero.png` | `after-390x844-hero.jpg` |
| `before-T005-1440x900-lifestyle.png` | `after-1440x900-techstack.jpg`, `after-390x844-reviews.jpg` |
| — | `after-1440x900-skiplink.jpg` |

Identity is preserved: same dark theme, same violet/cyan identity, same Inter + JetBrains Mono, same
layout, same copy, theme toggle / availability badge / Hire CTA all intact.

**The delta is a restoration, not a restyle.** In the *before* screenshot the word **"Tiwari" in the
`h1` is invisible**, the Hire CTA has no violet, the top-right icon buttons have no colour and both
ambient glow orbs are transparent — because the token config had replaced Tailwind's `violet`,
`cyan` and `pink` scales with a bare hex, so those classes emitted zero CSS
(`grep … dist/assets/*.css | wc -l` → `0` before, present after). Fixing the token form is what
makes the approved identity visible again. Nothing else moves: no spacing, no layout, no type size,
no new effect was introduced.

Two deliberate motion deltas: the hero photo hover zoom is now `--dur-slow` (320 ms) instead of an
inline 500 ms, and the three dots/arrow buttons in the reviews carousel gained a 24×24 target
(their visible bar is unchanged).

## 7. Where it stops — the remaining performance gap

Deferred and unchanged, in the order they would pay off:

1. **Ambient effect load.** `styleLayout` is 4.3 s of the 7.0 s main-thread work on the mobile run,
   and the page is 12,593 px of DOM with ~7 simultaneous decorative effects (particle field,
   backdrop-filter glass on the nav and every `.glass` card, glow orbs, gradient text, orbit,
   hologram toggles). Under Lighthouse's 4× CPU throttle this is the whole FCP/LCP budget. The fix
   is the **restraint pass — T-004 (`t_d6850e2d`), which BOSS deferred to pass 2.** No effect was
   removed here, deliberately: this card is a craft pass on tokens/motion/a11y, and silently
   deleting decorative layers would be exactly the scope creep the pacing directive forbids.
2. **`backdrop-filter`** on the fixed nav (`backdrop-blur-xl/md`) and `.glass`: the most expensive
   property on the page, recomputed on scroll and layout. A restraint decision, not a token one.
3. **The `dicebear` avatar URLs** still loaded from `src/data/profile.js` (third-party requests on a
   page that otherwise has none) — out of scope for this card, owned by the data/content card.

## 8. Commands a reviewer can re-run

```bash
cd C:/VS_CODE/Portfolio/sheersh-portfolio
npm run build && npm run preview -- --port 4191 --strictPort
npm test                              # 57 + 36 + 77 assertions, exit 0
npm run check:tokens                  # PASS
node scripts/check-contrast.mjs       # PASS
node scripts/lh-report.mjs docs/evidence/T-005/lighthouse-after.report.json
```

## 9. Files

New: `src/styles/tokens.css`, `src/styles/system.css`, `src/styles/tokens.js`,
`src/styles/decorative.js`, `src/lib/useAfterFirstPaint.js`, `src/components/MotionRoot.jsx`,
`src/components/FloatingHireButton.jsx`, `docs/DESIGN-SYSTEM.md`, `scripts/check-tokens.mjs`,
`scripts/check-contrast.mjs`, `scripts/lh-report.mjs`, `scripts/token-exceptions.json`,
`docs/evidence/T-005/*`.

Changed: `src/index.css`, `tailwind.config.js`, `vite.config.js`, `index.html`, `package.json`
(one script), `src/App.jsx`, `src/lib/monogram.js` and 20 components (token rename +
motion/a11y edits).

Untouched, verified: `scripts/lead-hunter.js`, `.github/workflows/`, `src/data/*`,
`src/components/ChatEngine.jsx`.
