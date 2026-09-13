# Sheersh Portfolio — Design System

**v5 "Engineered Speed" · T-005 · owner: frontend-engineer**

The concept is *"the site performs the way he makes systems perform"* — so the design system is
built the way the systems are: one source of truth, no duplicated values, every value named, and
nothing that runs when it does not have to.

Three files carry the whole thing:

| file | role |
|---|---|
| `src/styles/tokens.css` | **the values.** Colour, surface, type, spacing, radius, motion, blur, shadow, layout, z-layers. The only file in the repo allowed to contain a literal value. |
| `src/styles/system.css` | **how the values are used.** Primitives, decorative skin, the motion vocabulary, the accessibility layer, the reduced-motion switch. |
| `src/styles/tokens.js` | **the values, from JavaScript.** Canvas, inline SVG and JS-driven timing read back the same tokens at runtime — no second palette. |

Enforced by two gates, both exit non-zero on failure:

```bash
npm run check:tokens     # zero hardcoded hex/px/ms outside tokens.css
node scripts/check-contrast.mjs   # WCAG 2.2 AA contrast for every audited pair
```

---

## 1. Colour

Colour primitives are stored as **space-separated RGB channels**, never as hex, and mapped into
Tailwind as `rgb(var(--c-…-…) / <alpha-value>)`:

```css
--c-violet-500: 124 92 255;                        /* tokens.css */
violet: { 500: 'rgb(var(--c-violet-500) / <alpha-value>)' }   /* tailwind.config.js */
```

That form is not cosmetic. The config previously read `violet: '#7C5CFF'`, which **replaced
Tailwind's entire violet scale**; every `text-cyan-400`, `border-violet-500`, `bg-cyan-950/30`
in the components therefore produced no CSS at all. Measured before this pass:

```
$ grep -oE "\.(text|bg|border|from|via|to|shadow|ring)-(violet|cyan|pink)-[0-9]+" dist/assets/*.css | wc -l
0
```

Consequences that were visible on the page: the word *"Tiwari"* in the `h1` was invisible (its
gradient had lost two of three stops), the Hire CTA had no violet, the top-right icon buttons had
no colour, and both ambient glow orbs were transparent. `docs/evidence/T-005/` holds the
before/after screenshots. This pass **restores** that identity rather than changing it.

Brand anchors: violet `#7C5CFF` (500) with the `#A585F7` (400) family used for text; cyan
`#00E5FF` (400/500). Tailwind's default `slate`, `emerald`, `orange`, `amber` and `blue` scales are
untouched. Bare `text-violet` / `border-cyan/40` (no shade) still resolve, via the `DEFAULT` key,
to the same brand colour they used to.

### Semantic tokens

`--bg` `--surface` `--surface-solid` `--surface-deep` `--surface-tint` `--text` `--muted` `--line`
`--card-bg` `--glass-bg` `--nav-bg` `--accent` `--accent-text` `--focus-ring` `--card-hover-border`

`--surface-tint` is the *worst case* background text has to survive: a card with the ambient
violet/cyan glow composited over it. It exists so the contrast audit tests the real thing.

## 2. Type

`--font-display` (Space Grotesk) · `--font-body` (Inter) · `--font-mono` (JetBrains Mono) — the
identity fonts, unchanged.

The site had invented a micro-type scale inline (`text-[8px]` … `text-[11px]`, 74 occurrences).
It is now four named tokens: `text-nano` (8) · `text-tiny` (9) · `text-micro` (10) · `text-mini` (11).
The body scale (`text-xs`/`sm`/`base`) is deliberately **not** re-declared — re-declaring it would
silently resize every paragraph.

## 3. Spacing, radius, layout, elevation

`--space-1…16`, `--radius-xs…2xl` (+ `--radius-inner`, `--radius-panel`), `--hairline` (1px),
`--target-min` (24px, WCAG 2.2) / `--target-comfortable` (44px), `--shadow-hud`, `--shadow-live`,
`--blur-ambient-sm/md/lg`, `--z-nav/overlay/cursor/content`.

Component boxes that used to be raw numbers are named layout tokens (`--layout-glow-hero-w`,
`--layout-photo-h`, `--layout-panel-sm-w`, `--layout-toggle-knob`, …) mapped to Tailwind
`w-glow-hero`, `min-h-photo`, `left-knob` and friends.

Only **new** Tailwind keys were added — no existing `rounded-lg`, `min-h-0`, `text-sm` etc. changed
meaning, which is why this pass cannot move a pixel it did not intend to.

## 4. Motion

One vocabulary, four easings, six durations:

```
--dur-fast 120ms   hover / focus / chip feedback
--dur-base 220ms   element transitions (card, nav, drawer)
--dur-slow 320ms   theme switch, larger surfaces
--dur-reveal 520ms entrance choreography
--dur-shimmer 1000ms  the single decorative sweep
--dur-ambient 2600ms  the liveness pulse
--ease-spring cubic-bezier(0.16,1,0.3,1)   entrances
--ease-out    cubic-bezier(0.22,1,0.36,1)  exits / hovers
--ease-in-out cubic-bezier(0.4,0,0.2,1)    loops
```

Rules that follow from the concept:

- **Above the fold carries no entrance animation.** The hero previously wrapped its own LCP
  paragraph in `initial={{opacity: 0}}`; first paint literally waited for an animation library.
  It now paints with the CSS. *Every animation must be doing a job* — a fade on the LCP element
  does none.
- **`will-change` only while moving.** Two permanent `will-change: transform` on static orbs were
  forcing compositor layers for nothing.
- **No permanent rAF loop.** The trailing cursor used to request an animation frame every frame,
  forever, on an idle page. It now starts on the first pointer move and parks after 400 ms
  (`--cursor-park-ms`). An always-on rAF loop is the classic input-latency (INP) tax.
- **One animation library, off the critical path.** `framer-motion` was statically reachable from
  the initial chunk (see §7). It is now only reachable through the lazy below-the-fold chunks, and
  every one of them sits under a single `<MotionRoot>` carrying
  `<MotionConfig reducedMotion="user">`.
- Decorative layers are declared in one place — `src/styles/decorative.js` — with their motion
  class (`pointer` / `ambient` / `static`), so "what moves for no informational reason?" has one
  answer.

## 5. Reduced motion

`prefers-reduced-motion: reduce` is honoured on three levels, because any one alone has a hole:

1. **CSS layer** (`system.css`): motion tokens collapse to `--dur-none` (1ms), the global rule
   pins `animation-duration`/`transition-duration`/`iteration-count`, `scroll-behavior` becomes
   `auto`, and the reveal utilities are forced to their end state so nothing is left at
   `opacity: 0`.
2. **JS layer**: `prefersReducedMotion()` / `usePrefersReducedMotion()` (reactive). The pointer
   spotlight never attaches its listener, and the trailing cursor is not rendered at all.
3. **Library layer**: `MotionConfig reducedMotion="user"` covers every framer-motion animation.

Verified in the browser (raw output in `docs/evidence/T-005/REPORT.md` §4): with the media feature
emulated, `.cursor-spotlight` computes `display: none`, the ambient field never receives a
`--mouse-x` write, and the page still renders 12 sections / 38 images / 14,745 characters of text.

## 6. Accessibility (WCAG 2.2 AA)

- **Focus**: one `:focus-visible` ring (`--focus-ring`, cyan `#67E8F9`, 2px + 2px offset) defined
  once for every focusable element. A component-level `focus:outline-none` was removed — the ring
  now cannot be switched off by accident.
- **Bypass blocks**: `.skip-link` is the first tab stop ("Skip to main content" → `#main`).
- **Focus Not Obscured (2.4.11)**: `html { scroll-padding-top: var(--scroll-offset) }` (6rem) keeps
  the ~69px sticky nav clear of anything focused or anchor-scrolled. Measured: `#tech-stack` lands
  at top 96 with the nav bottom at 69.
- **Target Size (2.5.8)**: `.target-24` gives the carousel dots a 24×24 target while their visible
  bar stays 6px. The dots row wraps at 390px instead of overflowing. Keyboard walkthrough: 30 tab
  stops, **0** without a visible ring, **0** zero-size, **0** under 24px, and **0** of 84
  content elements obscured by the nav.
- **Heading order**: the photo-card caption was an `h3` directly after the `h1`; it is a `<p>` now.
- **Names**: icon-only controls carry `aria-label`s; the mobile menu toggle exposes
  `aria-expanded` / `aria-controls`; decorative SVGs and emoji are `aria-hidden`.
- **Images**: 38/38 have `alt` (owned by T-001, re-verified here).
- **Contrast**: `node scripts/check-contrast.mjs` audits every foreground/background pair in both
  themes. Two token changes came out of it — `--muted` 156 163 175 → **170 178 190** (the darker
  value measured 4.26:1 through the translucent card gradients) and accent-as-text moved from
  violet-500 to violet-400, then violet-300 inside the dimmed achievement cards (which carry
  `opacity-70`: 3.84:1 → 5.3:1). Lighthouse `color-contrast`: **26 failures → 0**.

**Known gap, stated rather than hidden:** the light theme is a secondary skin whose accent
utilities are still dark-theme-first, so only its theme-switched semantic text tokens are audited.
`docs/PRD.md`/pass 2 can make the accent utilities theme-aware if the light theme is ever promoted.

## 7. Performance notes that belong to the system

- `react/jsx-runtime` was landing in the *framer-motion* chunk, so the initial chunk imported
  framer-motion (114 KB) statically and waited on it before the first render. `manualChunks` now
  pins `react|react-dom|scheduler` to `react-vendor`; the initial chunk's only static import is
  `react-vendor`, and only that chunk is module-preloaded.
- Google Fonts no longer blocks the first paint (preload + `media="print"` swap, with a `<noscript>`
  fallback). CookieHub used to be a synchronous head script — ~1.3 s of blocked paint, and then
  ~1.3 s more before the app's module script could run. It is injected asynchronously on `load`;
  GA4 still only loads after consent.
- The below-the-fold sections (~90 % of the DOM, and 4.3 s of the 7.0 s main-thread work on the
  measured mobile run) mount after first paint + idle (`useAfterFirstPaint`). The nav, hero, CTA,
  drawer and chat stay immediate.
- `npm run check:tokens` covers `src/components`, `src/lib`, `src/data`, `src/context`,
  `src/styles`, `App.jsx`, `main.jsx`, `index.html` and every style file except `tokens.css`.
  Documented exceptions: `scripts/token-exceptions.json` (currently only `ChatEngine.jsx`, which
  another card owns and this card was told not to touch).

## 8. Adding to the system

1. Value missing? Add a token to `tokens.css` (primitives) or a semantic token beside it. Never a
   literal in a component.
2. Need it in Tailwind? Map it in `tailwind.config.js` under `extend` with a **new** key.
3. Need it in JS/canvas? `import { color, cssColor, token, seconds, usePrefersReducedMotion } from '../styles/tokens'`.
4. Run `npm run check:tokens && node scripts/check-contrast.mjs` before committing.
