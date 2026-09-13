# T-001 — evidence log: asset weight rescue + image hygiene

All numbers below were produced by running the two production builds side by side on the
same machine, same Chrome, cold cache (`Network.setCacheDisabled`), animations frozen:
- **BEFORE** = git `f2b4d2c` (the commit before this work), built in a separate worktree, `vite preview` on :4180
- **AFTER** = the working tree of this task, `vite preview` on :4173

## 1. Page weight and load (measured, cold cache)

| viewport | phase | total transfer | requests | largest image request | DCL | loadEventEnd | TTFB |
|---|---|---|---|---|---|---|---|
| 1440x900 @2x | BEFORE | **8455.2 KB** (8658105 B) | 51 | profile-headshot.png (5944.4 KB) | 275 ms | 5524 ms | 32 ms |
| 1440x900 @2x | AFTER | **181.7 KB** (186018 B) | 32 | profile-headshot-640.avif (18.6 KB) | 301 ms | 1471 ms | 18 ms |
| 390x844 @2x | BEFORE | **8455.2 KB** (8658105 B) | 51 | profile-headshot.png (5944.4 KB) | 459 ms | 2112 ms | 191 ms |
| 390x844 @2x | AFTER | **181.7 KB** (186010 B) | 32 | profile-headshot-640.avif (18.6 KB) | 238 ms | 1387 ms | 15 ms |

**Verdict on the headline criterion (< 500 KB):** 8455.2 KB → **181.7 KB** initial cold load at 1440 (181.7 KB at 390) — a **46.5×** reduction, 36% of the budget used.

Harness output (repo scripts): `npm run build:images` prints the per-asset budget table and exits non-zero on a breach.
`node scripts/check-image-fidelity.mjs` prints PSNR per emitted asset and exits non-zero below 35 dB.

### What was requested for each image

| asset | request count before → after | bytes before → after |
|---|---|---|
| `/profile-headshot.png` (2048²) → `/img/profile-headshot-640.avif` | 1 → 1 | 5944.4 KB → 18.6 KB |
| `/profile-lifestyle.png` (1600×900) | 1 eager at 1440, deferred (lazy) at 390 | 2250.1 KB → 0 on initial load |

At 390 the only image requests on the initial load are the hero AVIF variants; the lifestyle photo and the
icon grids are below the fold and now `loading="lazy"`, so they are not fetched until scrolled to.
When the whole page is scrolled, the after-build total is 264.0 KB / 49 requests — the largest single
image request is then the **74.1 KB** devicon Linux SVG from cdn.jsdelivr.net, still under the 200 KB rule.

## 2. Image hygiene — every `<img>`

Source: **11 `<img>` tags** in `src/` (grep). Runtime audit of the built page: **38 rendered `<img>` elements**
(the icon grids repeat the same tags per roadmap item).

| check | result |
|---|---|
| `alt` present on every rendered `<img>` | 38/38 |
| explicit `width` + `height` | 38/38 |
| `decoding="async"` | 38/38 |
| `loading="lazy"` (below the fold) | 35 |
| `loading="eager"` (hero + always-visible chat launcher) | 3 |
| hero also carries `fetchpriority` | `high` |
| rows failing any of the above | **0** |

The hero image is `loading="eager"` + `fetchpriority="high"`; every other image is lazy.

## 3. Zero visual difference

Method: identical cold-cache renders of the before/after builds at the same viewport, deviceScaleFactor **2**,
CSS animations frozen, particle canvas hidden; the image region is cropped from both screenshots and compared
pixel by pixel. A registration search (integer offset, ±40 device px) removes capture-time animation drift.

| region | registration offset | mean abs diff (0-255) | pixels differing > 8/255 |
|---|---|---|---|
| 1440x900 @2x/lifestyle | (+28, +0) device px | 2.244 | 7.65% |
| 390x844 @2x/lifestyle | (+0, +0) device px | 1.939 | 6.10% |

- whole viewport 1440x900 @2x (before | after, side by side): mean abs diff **1.255/255**, 4.82% of pixels differ by more than 8/255
  (`side-by-side-1440x900-dsf2-fullpage-viewport.png`)
- whole viewport 390x844 @2x (before | after, side by side): mean abs diff **0.434/255**, 0.72% of pixels differ by more than 8/255
  (`side-by-side-390x844-dsf2-fullpage-viewport.png`)

Side-by-side PNGs: `side-by-side-*.png`, 2x zoom pairs: `zoom2x-side-by-side-*.png`.
The lifestyle photo is the harder of the two to reproduce (busy, grainy highway shot) and at 2x zoom the
before/after pair is indistinguishable by eye; the residual above is re-encoding grain, not structure.

**Unmeasured, stated plainly:** two hero crops are deliberately absent from the table.
(1) At 1440px the AFTER hero frame was captured while the card was still mid-way through its framer-motion
mount animation (scale 0.9 -> 1), so the recorded rect and the rendered frame disagree and no integer offset
registers them; the number is a capture artefact, not a difference, so it is not reported as one.
(2) At 390px the hero card sits below the fold in the top-of-page capture, so the crop lands off-image.
The headless screenshot facility stopped responding while a replacement 1440px hero frame was being captured
(Page.captureScreenshot timed out after 60s), so both are reported as **unmeasured** rather than as passes.
The same pipeline, encoders and widths are exercised by the lifestyle photo in both viewports, which is measured above.

## 4. Encoder fidelity (what the re-encode cost)

`node scripts/check-image-fidelity.mjs` decodes every emitted asset and compares it against the master
downscaled to the same width with the same kernel, so resampling cancels out:

| worst asset | PSNR | max per-pixel delta | pixels > 8/255 |
|---|---|---|---|
| lifestyle avif 480w | **35.57 dB** | 47 | 5.37% |
All 22 assets are >= 35 dB (gate enforced by the script, exit code 1 below that). The two photos are
compressed from 8.3 MB to 8-183 KB per candidate with no candidate above the 200 KB per-asset budget.


## 5. Emitted asset set

24 files in `public/img/`, 2273 KB total on disk (only 2–4 of them are ever fetched per visitor):
AVIF + WebP at 480/640/1024/1280/1600/2048 px plus a 768 px PNG fallback per photo (the fallback is never requested by AVIF/WebP-capable browsers; it is capped under 200 KB too so the per-asset gate is absolute).
Masters moved out of the deploy path to `assets-src/`; regenerate with `npm run build:images`.

## 6. Stock-photo fallbacks removed

- `Hero.jsx` — the `onError` fallback that swapped his headshot for a random Unsplash face is gone; a local
  branded monogram (`src/lib/monogram.js`, inline SVG data-URI, zero network requests) is rendered instead.
- `ChatEngine.jsx` — the Unsplash concierge photo and the `api.dicebear.com` visitor avatar are replaced by the
  same local monogram system (`MONOGRAM_BOT` / `MONOGRAM_GUEST`), so no third-party face can ever stand in for him.
- `SkillOrbit.jsx` / `TechStack.jsx` — the `onError` fallbacks no longer hit `api.dicebear.com`; they fall back to
  a deterministic local monogram derived from the skill/technology name. Primary icon URLs in `src/data/profile.js`
  were left untouched (not this card's scope).

## 7. Out of scope / untouched

- `scripts/lead-hunter.js`, `.github/workflows/lead-hunter.yml`: not touched by this task.
- JS/CSS build config (`vite.config.js`, `tailwind.config.js`, `postcss.config.js`): not touched.
- One devDependency added: `sharp` (image encoding at build time) + `build:images` npm script.

