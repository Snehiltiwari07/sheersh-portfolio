# Sheersh Tiwari — Portfolio

The personal website of **Sheersh Tiwari**, a full-stack engineer and database-performance
specialist based in Indore, India.

It does two jobs at once:

1. **It is the sales pitch.** A prospective client (usually a CTO, VP of Engineering, or founder)
   lands here, decides within seconds whether he is credible, and either leaves or gets in touch.
2. **It is the proof.** The site itself is built the way he builds client systems — fast, accessible,
   measured, and honest about its trade-offs. The performance of this page *is* an argument for
   hiring him.

Everything below explains how it is put together and why.

---

## 1. The 30-second tour

When you open the site, this is the order a visitor meets it:

| Section | What it does |
|---|---|
| **Hero** | Name, one-line positioning, availability badge, and a real photograph |
| **Projects** | Six featured systems with outcome-focused cards |
| **Track record** | The headline numbers (23+ projects, 19+ clients, 200M+ records optimised) |
| **Services** | What he actually does, in client language |
| **Achievements** | Named integrations — Amex/Resy VIP booking, Google Sheets pipeline, the 200M-record speedup |
| **Architecture** | An interactive diagram of a production system he has built |
| **Tech stack** | Five categories, with a career timeline from 2018 to today |
| **Skill matrix** | An orbit of technologies — click a node for the real project impact |
| **Local LLM** | A demo that runs a language model in the browser, on your own machine |
| **Playground** | A small playable game (a deploy joke) |
| **Beyond the code** | Photography, motorcycling, the human side |
| **Reviews** | Real client testimonials |

Floating over all of it: a **Hire drawer** (a real enquiry form — see §7) and a **chat concierge**
that answers common questions.

---

## 2. Tech stack

### The core

| Technology | Version | Why it is here |
|---|---|---|
| **React 18** | `^18.3.1` | Component model for a heavily interactive page |
| **Vite 5** | `^5.3.4` | Dev server and bundler — fast builds, code splitting, and it lets the build be configured in one readable file |
| **Tailwind CSS 3** | `^3.4.6` | Utility-first styling; pairs with a token layer (§5) so no raw values end up in components |
| **Framer Motion** | `^11.3.0` | The animation library. Deliberately kept **out of the first paint** so it never blocks the hero |

### Supporting

| Technology | Why |
|---|---|
| **PostCSS + Autoprefixer** | Vendor-prefixes the CSS Tailwind emits |
| **vite-plugin-compression** | Pre-writes Brotli (`.br`) and Gzip (`.gz`) versions of every asset at build time, so the CDN can serve compressed bytes without working them out on each request |

### Measurement & analytics

| Technology | Why |
|---|---|
| **Vercel Analytics** + **Speed Insights** | Real-user page views and field performance (what actual visitors experience, not a lab score) |
| **react-ga4** | Conversion events — the form fires `generate_lead`, so enquiries can be traced to pages |
| **Lighthouse** (dev) | The lab performance score, run by the perf harness (§9) |
| **sharp** (dev) | Native image processing — converts the photographs to AVIF/WebP at six widths |

### Deliberately *not* used

- **No Next.js.** This is a single long page with no server-rendered routes and no data fetching at
  request time. Vite + a static build is simpler, and simpler is faster here.
- **No WebGL / Three.js.** The effects are CSS 3D and canvas. A WebGL scene would cost far more
  weight and battery than the visual difference justifies.
- **No database.** Leads land in a Google Sheet (§7) — the smallest thing that fully solves the problem.

---

## 3. Architecture

### It is a static site with one serverless function

```
        Browser
           │
           ├── static HTML / CSS / JS  ──────►  Vercel CDN (edge, cached forever)
           │
           └── POST /api/lead  ──────────────►  Vercel serverless function (api/lead.js)
                                                   │
                                                   ├──► Resend   (email notification)
                                                   └──► Sheets   (the Webhook URL)
```

Everything a visitor *sees* is static and served from the edge — there is no server rendering, no
database query, and no cold start on the critical path. The one function exists only because the
enquiry form must talk to third parties without exposing a key.

### How the page loads (this is the important part)

Loading order is decided deliberately in `src/App.jsx`:

**Loaded immediately (must be instant):**
`SecurityGuard`, `CustomCursor`, `InteractiveField`, `Navbar`, `Hero`, `FloatingHireButton`

**Code-split and loaded lazily (everything below the fold):**
`Projects`, `ProjectStats`, `ServicesValueProp`, `Achievements`, `ArchitectureDiagram`, `TechStack`,
`SkillOrbit`, `LocalLLMRunner`, `Playground`, `BeyondTheCode`, `Reviews`, `Footer`, `ChatEngine`,
`HireDrawer`, `MotionRoot`

Each lazy section is wrapped in `<Suspense>`, so a placeholder shows while it arrives. The below-the-fold
sections are roughly **90% of the page's DOM** — splitting them is what keeps the first screen quick.

An additional hook, `useAfterFirstPaint`, defers mounting those sections until after the browser has
painted the hero, so the initial render is never blocked by work the visitor has not scrolled to yet.

### How the bundles are split

In `vite.config.js`, `manualChunks` pins packages to named files:

- `react-vendor` — React, React DOM, **and `scheduler`/`jsx-runtime`**
- `framer-motion` — separately, so the animation library is only reachable through lazy chunks

The runtime is pinned to `react-vendor` on purpose: previously it fell into the framer-motion chunk,
which meant the very first chunk statically imported a 122 KB animation library and waited for it
before rendering anything. That single fix is why Framer Motion no longer blocks first paint.

### Other build decisions

- `esbuild.drop: ['console', 'debugger']` — all console output is stripped from production. Useful to
  know: **you cannot debug the live site from DevTools console logs.**
- `cssCodeSplit: true` — CSS is split alongside JS
- `target: 'esnext'` — modern output, since the audience is on current browsers

---

## 4. Project structure

```
sheersh-portfolio/
├── index.html                  the document shell — carries %TOKENS% (see below)
├── vite.config.js              build config + the HTML token resolver
├── vercel.json                 SPA fallback, with /api/ excluded so the function is reachable
│
├── src/
│   ├── App.jsx                 the page: what loads eagerly, what loads lazily
│   ├── main.jsx                React entry point, theme bootstrap
│   │
│   ├── components/             25 UI components (see §6)
│   ├── context/                ThemeContext — dark/light
│   ├── data/                   ★ ALL user-facing copy and content
│   ├── lib/                    small helpers (lead client, monogram, first-paint hook)
│   └── styles/                 design tokens + system styles
│
├── api/
│   └── lead.js                 POST /api/lead — the only server-side code
│
├── integrations/
│   └── google-sheets/Code.gs   Apps Script that appends lead rows to the Sheet
│
├── scripts/                    build + verification tooling (see §9)
├── docs/                       PRD, design system, perf budget, contracts, setup guides
├── public/                     static assets served as-is
├── assets-src/                 the ORIGINAL photographs (source for the image pipeline)
└── dist/                       build output (gitignored)
```

### The interesting part: `index.html` carries tokens, not values

You will notice `index.html` contains things like `%POSITIONING_TITLE%` rather than the real title.
This is deliberate.

The repository once shipped **six different descriptions of what Sheersh does** — the page title, the
meta description, the navbar, the hero, the footer, and the profile data all disagreed. Retyping the
title into the Open Graph tags would have created a *seventh*.

So the crawler-facing metadata is written **once** in `src/data/positioning.js` and `src/data/seo.js`,
and `vite.config.js` substitutes it into the HTML at the single point where both the dev server and the
production build produce the document. What you check in dev is byte-for-byte what ships.

**If a token is left unresolved, the build FAILS** rather than shipping `%SOMETHING%` to a search
crawler. That failure mode — a silent placeholder — is exactly how the missing social card stayed
invisible for so long.

---

## 5. The data layer — all copy lives here

**Every user-facing string comes from `src/data/`.** No component hardcodes marketing copy. This is what
makes the site translatable later, and it is what stops the positioning drifting apart again.

| File | Contains |
|---|---|
| `profile.js` | Name, contact details, summary, stats, client reviews, tech categories, achievements, career roadmap, skill nodes |
| `positioning.js` | **The single source of truth for how he describes himself** — headline, tagline, meta description, page title, availability line, plus a `filesToChange` list recording exactly which files were unified |
| `caseStudies.js` | Client case studies (content complete; the UI is a future pass — see §11) |
| `seo.js` | Canonical URL, Open Graph values, and the JSON-LD structured data |
| `site.js` | Site-wide config (links, nav items) |
| `leadForm.js` | The form's field definitions, project types, and budget bands |
| `image-manifest.js` | Generated — maps each photograph to its responsive variants |

### The design system

`src/styles/tokens.css` defines every colour, spacing value, radius, type size, and animation
duration as a **named CSS custom property**. Components reference tokens, never raw hex or pixel
values — and `npm run check:tokens` fails the build if a stray value appears.

- `tokens.css` — the values
- `system.css` — base and utility styles built from those values
- `decorative.js` — the reduced-motion switch for decorative animation
- `docs/DESIGN-SYSTEM.md` — the human-readable documentation of all of it

---

## 6. Components

| Component | What it is |
|---|---|
| `Hero.jsx` | First screen — name, positioning, availability, photograph |
| `Navbar.jsx` | Fixed top navigation |
| `Projects.jsx` | Featured systems showcase |
| `ProjectStats.jsx` | The headline numbers |
| `ServicesValueProp.jsx` | What he does, for a non-technical reader |
| `Achievements.jsx` | Named integrations and awards |
| `ArchitectureDiagram.jsx` | Interactive production-system diagram |
| `TechStack.jsx` | Technologies by category + career timeline |
| `SkillOrbit.jsx` | Clickable 3D orbit of skills |
| `LocalLLMRunner.jsx` | Runs a language model in the browser |
| `Playground.jsx` | A small playable game |
| `BeyondTheCode.jsx` | Personal interests |
| `Reviews.jsx` | Client testimonials |
| `Footer.jsx` | Footer, contact links |
| **`ResponsivePhoto.jsx`** | **Use this for any new image** — handles the `<picture>` element, `srcset`, format fallback, `alt`, sizing, and lazy loading |
| `ThemeAdaptiveImage.jsx` | Image that swaps variant between light and dark theme |
| `ThemeToggle.jsx` + `context/ThemeContext.jsx` | Dark/light switch |
| `HireDrawer.jsx` | The enquiry form drawer (**the conversion path**) |
| `FloatingHireButton.jsx` | The persistent "Hire" button |
| `ChatEngine.jsx` | The "Ask Jiya" concierge |
| `MotionRoot.jsx` | Wraps lazy sections; disables animation when the OS asks for reduced motion |
| `InteractiveField.jsx` | Background particle canvas |
| `CustomCursor.jsx` | Custom cursor with an idle-parking animation loop |
| `SecurityGuard.jsx` | Basic client-side tamper deterrence |
| `PhotoCard3D.jsx` | 3D tilt photo card *(currently unused — retained)* |

---

## 7. The lead pipeline

There are two ways leads arrive, and **both land in the same Google Sheet.**

### A. The website form (visitor-initiated)

```
visitor fills the Hire drawer
        │
        ▼
POST /api/lead ─── validates everything server-side
        │           rejects bots silently (honeypot)
        │           rate-limits per IP (5 per 10 min)
        │           allows only known origins
        │
        ├──► Resend  → email to Sheersh, reply-to set to the lead
        └──► Apps Script webhook → new row in the Google Sheet
```

It returns a reference id (`lead_…`) for every submission, so a support conversation can be traced back
to the logs. If **both** the email and the sheet fail, the visitor sees a 502 with a direct email
address — it never claims success when nothing was recorded.

The contract is documented in `docs/api-lead-contract.md`.

### B. The lead hunter (machine-initiated, automatic)

A GitHub Actions workflow runs **daily at 09:00**:

```
lead-hunter.js
    ├── scrapes Reddit r/forhire, RemoteOK, Hacker News Jobs, We Work Remotely, LinkedIn (Apify)
    ├── scores each listing for relevance with Groq
    ├── emails a digest via Resend
    └── pushes the same leads to the Google Sheet as "Hunter (…)" rows
```

The digest email is **hard-isolated** from the sheet: it is sent first, and the sheet push carries its
own error handling. **A sheet failure can never stop the digest.**

### The sheet

One table, one header, eleven columns, both sources. The `Source` column tells them apart
(`Form (website)` vs `Hunter (Reddit)` etc.). Setup is in `docs/GOOGLE-SHEET-SETUP.md`.

---

## 8. Build & run

```bash
npm install
npm run dev              # development server → http://localhost:5173
npm run build            # production build → dist/   (runs the OG image step first)
npm run preview          # serve the production build → http://localhost:4173
```

Individual steps, if you want them:

| Command | What it does |
|---|---|
| `npm run build:images` | Rebuilds all responsive image variants from `assets-src/` |
| `npm run build:og` | Regenerates the 1200×630 social share card |

---

## 9. Testing & verification

This project has an unusual number of checks, and that is deliberate — **every claim in this README is
something you can re-run yourself.** A build passing has never been treated as evidence that anything
works.

| Command | What it verifies |
|---|---|
| `npm test` | All three suites: lead endpoint (57), Apps Script (36), hunter (77) = **170 assertions** |
| `npm run test:lead` | `/api/lead` — validation, typed errors, honeypot, rate limit, origin allowlist, failure paths |
| `npm run test:sheet` | The Apps Script row mapping |
| `npm run test:hunter` | The hunter's 11-column mapping and digest isolation |
| `npm run check:tokens` | No hardcoded hex/px and no dangling `var()` anywhere in the CSS |
| `npm run check:seo` | Title, meta, canonical, OG/Twitter tags, JSON-LD all present |
| `npm run check:leadform` | The form markup, the honeypot, and the accessibility attributes |
| `node scripts/check-contrast.mjs` | Every text/background pair meets WCAG AA |
| `node scripts/check-image-fidelity.mjs` | Optimised images still visually match the originals |
| `npm run measure-perf` | Builds, serves, measures, and **fails on a breached performance budget** |

### `measure-perf` is a gate, not a report

It drives headless Chrome over CDP with a **cold cache and an isolated browser context per viewport**,
injects the performance probe *before* the page loads (so LCP and CLS are genuinely captured), runs
Lighthouse, and exits non-zero if any budget line is breached.

Two honest notes about it:
- **Read the per-row table, not the exit code.** Two rows are inherently flaky — desktop total transfer
  (third-party tags vary) and the INP lab proxy. They are documented in `docs/PERF-BUDGET.md` §4.6.
- **INP cannot be measured reliably in a lab.** Field data is the truth for that metric; the harness
  says so rather than reporting a confident-looking number.

---

## 10. Deployment

Vercel builds from `main`. `vercel.json` holds the SPA rewrite, with `/api/` excluded so the serverless
function is never swallowed by the catch-all.

### Environment variables

| Where | Name | Purpose |
|---|---|---|
| **Vercel** | `LEAD_STORE_WEBHOOK_URL` | The Apps Script `/exec` URL — lets the form write to the sheet |
| **Vercel** | `RESEND_API_KEY` | Sends the lead notification email |
| **GitHub → Actions secrets** | `LEAD_STORE_WEBHOOK_URL` | The *same* URL — the hunter runs on GitHub's machines, not Vercel's |
| **GitHub → Actions secrets** | `GROQ_API_KEY`, `RESEND_API_KEY`, `APIFY_TOKEN` | The hunter's scraping, scoring, and digest |

> **After adding or changing any Vercel variable you must redeploy.** Vercel only applies environment
> variables to *new* deployments — this is the single most common reason "it doesn't work".

Without `LEAD_STORE_WEBHOOK_URL`, the site still works: submissions email Sheersh and no sheet row is
written. The sheet is an extra durable copy, not a dependency.

### ⛔ The one security rule

**Never put a secret in a `VITE_*` variable.**

Anything prefixed `VITE_` is **inlined into the public JavaScript bundle at build time**. This was
proven here, not assumed — building with `VITE_GROQ_API_KEY` set put the literal key into
`dist/assets/ChatEngine-*.js`, where anyone can read it.

Server-side secrets belong in environment variables that only `api/*` reads.

---

## 11. Performance & accessibility

Measured, not estimated:

| Metric | Before | Now |
|---|---|---|
| Page transfer | 8,468 KB | **~440 KB** (first-party **178 KB**) |
| Largest image | 5,944 KB | **11 KB** |
| Load time | 4,345 ms | **~700–900 ms** |
| Lighthouse mobile | 45 | **73** |
| Images with `alt` + dimensions + lazy | 6 of 11 | **38 of 38** |
| Animation under reduced-motion | not respected | **16 → 0** |
| Keyboard | — | 90 stops, **0** without a visible focus ring |

The images are the whole story: two photographs at 2048×2048 were 97% of the page weight. They are now
served as AVIF with WebP and original fallbacks at six widths (480–2048), so a phone downloads roughly
11 KB instead of 5.9 MB. `ResponsivePhoto.jsx` is the component that does this — use it for any new image.

### Known gaps

- **Lighthouse mobile is 73**, against a target of 90. The measured causes, in order of impact: the
  fixed navigation's `backdrop-filter` (recomputed on every scroll frame), always-on ambient animation,
  and total page length (12,593 px). All three are visual trade-offs rather than bugs.
- **LCP is ~3.4 s** on simulated slow-4G, against a 2.5 s target.
- **Desktop total transfer can exceed 500 KB** purely because of third-party tags (CookieHub consent +
  GA4). First-party is 178 KB.
- **Focus obstruction:** the fixed bottom bars cover roughly 90 px. Adding `scroll-margin-bottom: 7rem`
  to tab-stops would stop elements landing underneath them.
- **Case-study section not built.** The content is written and approved
  (`src/data/caseStudies.js`) but the UI is a separate pass. Plan: ship **three** case studies and hold
  the fourth — the Amex/Resy engagement has no metric and no client quote, and the rule is that **no
  figure and no quote is ever invented.**
- **"Ask Jiya" runs keyword matching, not an LLM.** No key ships, so the LLM path never fires. Making it
  live requires calling the model server-side — never through `VITE_*`.

---

## 12. Repo conventions

- **No hardcoded user-facing copy.** It lives in `src/data/`.
- **No hardcoded colour/spacing.** It lives in `src/styles/tokens.css` (`npm run check:tokens` enforces it).
- **No invented numbers.** Every metric on the site is real, and gaps are held back rather than filled.
- **Nothing is pushed automatically.** Deploys are deliberate.

### Gitignored by design

`dist/`, `docs/evidence/`, `docs/screenshots/` and one-off probe scripts are regenerable output, not
source — they are excluded so the repository stays small and readable.

`assets-src/` **is** tracked: those are the original photographs and the image pipeline needs them to
regenerate variants.

---

## 13. Documentation index

| Document | Covers |
|---|---|
| `docs/PRD.md` | The product requirements and the reasoning behind the current build |
| `docs/DESIGN-SYSTEM.md` | Every design token and when to use it |
| `docs/PERF-BUDGET.md` | The enforced performance budgets and how to measure them |
| `docs/api-lead-contract.md` | The full `/api/lead` request/response contract |
| `docs/DEPLOY-NOTES.md` | Deployment steps, env vars, and post-deploy smoke tests |
| `docs/GOOGLE-SHEET-SETUP.md` | Step-by-step Google Sheet + Apps Script setup |
| `docs/lead-hunter-sheet.md` | How the hunter writes to the sheet, and its failure isolation |
| `docs/restraint-spec.md` | Which visual effects were kept, trimmed, or moved |
| `docs/case-study-pdf-brief.md` | Outline for the downloadable case-study PDF |
