# Sheersh Tiwari — Portfolio

Personal portfolio + lead-capture site. React 18 · Vite 5 · Tailwind · deployed on Vercel.

---

## Quick start

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # → dist/
npm run preview        # serve the production build on :4173
```

## Checks you can run

| Command | What it proves |
|---|---|
| `npm test` | all three harnesses (lead endpoint 57, hunter 77, form 9 assertions) |
| `npm run test:lead` | `/api/lead` validation, honeypot, rate limit, origin allowlist |
| `npm run test:hunter` | hunter → sheet mapping (11 columns), digest isolation |
| `npm run check:tokens` | zero hardcoded hex/px and zero dangling `var()` in CSS |
| `node scripts/check-contrast.mjs` | WCAG AA contrast |
| `node scripts/measure-perf.mjs` | build → measure → **enforced** performance budget |
| `node scripts/check-image-fidelity.mjs` | optimised images still match the originals |
| `node scripts/check-seo.mjs` | OG/Twitter/canonical/JSON-LD present |

---

## What changed in this pass

Measured, not claimed:

| Metric | Before | After |
|---|---|---|
| Page transfer | 8,468 KB | **~440 KB** (first-party **178 KB**) |
| Hero photograph | 5,944 KB | **11 KB** |
| Load time | 4,345 ms | **~700–900 ms** |
| Lighthouse mobile | 45 | **73** |
| Images with `alt` + `width`/`height` + lazy | 6 / 11 | **38 / 38** |
| `prefers-reduced-motion` | not respected | **16 → 0 animations** |
| Keyboard access | — | 90 stops, **0** missing focus rings |
| Lead capture | `mailto:` only | **working form → 11-column sheet rows + GA4** |
| Client name (CloudLIMS) | named | **de-identified** |

**Also added:** design tokens + documented design system, a social/OG share layer, one unified
positioning statement (was six), an enforced perf budget, and a full lead pipeline.

---

## Architecture

```
src/
  components/     UI (ResponsivePhoto.jsx is the image component — use it for new images)
  data/           ALL user-facing copy lives here (profile, caseStudies, positioning)
  styles/         tokens.css · system.css · decorative.js
  lib/            store, nutrition-style helpers
api/lead.js       POST /api/lead — validation, honeypot, rate limit, Resend, sheet webhook
integrations/google-sheets/Code.gs   Apps Script that appends lead rows
scripts/          build-images · measure-perf · lead-hunter · the check harnesses
docs/             PRD, design system, perf budget, API contract, deploy notes, setup guides
```

**Rule:** no user-facing string is hardcoded in a component — it comes from `src/data/*`.

---

## Deployment

Vercel auto-deploys from `main`. **Two environment variables must exist or lead capture is degraded:**

| Where | Name | Value |
|---|---|---|
| **Vercel** → Settings → Environment Variables | `LEAD_STORE_WEBHOOK_URL` | the Apps Script `/exec` URL (`?token=…` if you set one) |
| **GitHub** → Settings → Secrets and variables → Actions | `LEAD_STORE_WEBHOOK_URL` | the *same* URL (the hunter runs on GitHub's machines) |
| **Vercel** | `RESEND_API_KEY` | for lead notification emails |

> **After adding any env var you must redeploy** — Vercel only applies them to new deployments.

Setup walkthrough: `docs/GOOGLE-SHEET-SETUP.md`

### ⛔ Never put a secret in a `VITE_*` variable
Anything prefixed `VITE_` is **inlined into the public JavaScript bundle** at build time. This was
proven, not theorised: building with `VITE_GROQ_API_KEY` set put the literal key into
`dist/assets/ChatEngine-*.js`. Server-side secrets belong in Vercel env vars read by `api/*` only.

---

## Lead flow

```
visitor fills the form
        │
        ▼
POST /api/lead ──► Resend  → email notification (reply-to = the lead)
        │
        └────────► Apps Script webhook ──► Google Sheet (11-column row)

daily 09:00 (GitHub Actions cron) ──► lead-hunter ──► Apify/Reddit/job boards
                                          │                │
                                          ▼                ▼
                                    Groq relevance    Resend digest
                                          │                │
                                          └──► the SAME Google Sheet ("Hunter (…)")
```

The hunter's digest is **hard-isolated** from the sheet — it sends first, and the sheet push has its
own error handling, so a sheet failure can never stop the email.

---

## Known gaps (parked, not forgotten)

- **Case-study section + "Lab" tab** — content is written (`src/data/caseStudies.js`), UI not built.
  Ship **3 of 4** cases; the Amex/Resy case has no metric or client quote, so it is held back rather
  than rendered with a gap. **No figure or quote may ever be invented.**
- **Lighthouse mobile 73**, target 90. The measured causes: the fixed nav's `backdrop-filter`, always-on
  ambient animation, and total page length (12,593 px). All three are visual trade-offs.
- **LCP ~3.4 s** on slow-4G (target 2.5 s).
- **Desktop total transfer** can exceed 500 KB because of third-party tags (CookieHub + GA4) — first-party
  is 178 KB. `docs/PERF-BUDGET.md` §4.6 documents why that row is flaky by construction.
- **Focus obstruction:** the fixed bottom bars cover ~90 px; add `scroll-margin-bottom: 7rem` to
  tab-stops so nothing lands under them.
- **"Ask Jiya" runs the keyword engine, not an LLM.** No API key ships, so the LLM path never fires.
  If you want it live, it must be called **server-side** — never via `VITE_*`.

---

## Repo hygiene

`dist/`, `docs/evidence/`, `docs/screenshots/` and probe scripts are **gitignored** — regenerable
output, not source. `assets-src/` holds the original photographs (source for `scripts/build-images.mjs`)
and *is* tracked so the pipeline stays reproducible.

**Nothing is pushed automatically.** Deploys are yours to trigger.
