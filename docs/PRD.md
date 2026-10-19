# Product Requirements Document
**Product**: Sheersh Portfolio v5 — "Engineered Speed" Edition
**Version**: 5.0-draft
**Date**: 13 September 2026
**Status**: ⏸️ AWAITING APPROVAL
**Repo**: the `sheersh-portfolio` folder of this workspace · live: https://sheershtiwari.vercel.app
**Supersedes**: v4 "Conversion Edition"

> **Change from v4:** priority moves from conversion plumbing to **UI excellence + enterprise-grade
> craft**. Client name **CloudLIMS removed** — anonymised throughout (§2.6). Conversion work is
> retained but demoted below the craft work.

---

## 1. Executive Summary

The goal is the best UI in the market, at enterprise grade. Research on what actually wins in 2026
(§4) says that is **not** "more effects". Awwwards winners and enterprise buyers agree on the same
four things: **restraint, technical craft, accessibility, and speed.**

The portfolio today has many competing effects and fails the measurable craft criteria:

| Criterion | 2026 market standard | This site today |
|---|---|---|
| Lighthouse mobile (Awwwards criterion) | **90+** | ~fails — 8.4 MB page, 4.3 s load |
| LCP (Core Web Vital) | **< 2.5 s** | unmeasured, weight makes it unlikely |
| INP (Core Web Vital) | **< 200 ms** | unmeasured; heavy always-on motion at risk |
| CLS (Core Web Vital) | **< 0.1** | **at risk — 0 of 11 `<img>` have `width`/`height`** |
| `prefers-reduced-motion` | required (Awwwards + WCAG) | **not respected anywhere (0 matches)** |
| WCAG level | 2.2 AA | 5 of 11 images have **no `alt`** |
| Image loading | lazy below fold | **0 of 11 use `loading="lazy"`** |
| Distinct visual concepts | one | ~7 competing (particles, cursor, 3D tilt, hologram, glitch, orbit, game) |

**Therefore: the performance and accessibility work is not a separate chore — it *is* the UI
excellence work.** That is the central finding of this revision.

---

## 2. Problem Statement — measured

### 2.1 The page weighs 8.4 MB, 97% of it two photographs

```
transfer : 8,468 KB        load : 4,345 ms        resources : 51

profile-headshot.png   5,944 KB   (natural 2048×2048, rendered ~400 px wide)
profile-lifestyle.png  2,249 KB   (natural 2048×2048)
```

JS/CSS is already correctly built (131 KB / 50 KB, Brotli, `immutable`). The regression is asset
handling only. Responsive AVIF/WebP at 2× display size cuts page weight ~95% with **zero visual change**.

### 2.2 The Core Web Vitals gaps that enterprise buyers can measure

- **CLS:** 0 of 11 `<img>` declare `width`/`height` → layout shift on load. Enterprise threshold is CLS < 0.1.
- **Lazy loading:** 0 of 11 use `loading="lazy"` → the 2.2 MB lifestyle photo loads eagerly.
- **Alt text:** 5 of 11 images have no `alt` → WCAG 2.2 AA failure.
- **`prefers-reduced-motion`:** zero occurrences → an Awwwards usability criterion *and* a WCAG failure.

### 2.3 Motion is not choreographed — it is accumulated

The site carries approximately seven independently invented effects: particle field, custom cursor,
3D tilt photo card, hologram toggle, glitch toggle, skill orbit, and a playable Flappy Bird game.

> *"Restraint reads as confidence. A jury rewards one perfect idea over five competing ones."*
> — award-winning-portfolio practice guide

> *"Winners commit to one strong visual concept rather than mixing effects."* — Awwwards 2026 SOTD analysis

> *"Purposeful animation can guide attention and aid comprehension, while gratuitous animation
> distracts and annoys. Same tool, opposite outcomes, decided entirely by whether the motion is
> doing a job."* — Nielsen Norman Group

### 2.4 Effects actively cost money in this category

> *"74% of B2B buyers say a site that 'feels slow to respond' reduces their confidence in the
> **product itself**, not just the website. They conflate interface responsiveness with product
> quality."*

> *"Sites where INP is below 200 ms convert demo requests at **2.3× the rate** of visually identical
> sites with INP above 500 ms."* — analysis of 500 B2B sites + 1,000 buyer survey

> *"81% of procurement decision-makers had removed a vendor from a shortlist because the website
> 'did not look like a company we could trust at our contract level.'"* Trigger signals: slow
> interaction (71%), generic stock imagery (67%), inconsistent typography (58%), broken mobile (54%).

Always-on particle/glitch/hologram motion is a direct INP risk, and this is a database-performance
specialist — a slow site is a self-contradicting sales asset.

### 2.5 Four different positioning statements

| Location | Says |
|---|---|
| `src/data/profile.js` | Full-Stack Developer & SQL Optimization Specialist |
| Hero | SENIOR SOFTWARE ENGINEER • FULL-STACK & AI SPECIALIST |
| Navbar logo | SQL & AI Architect |
| meta description | Full-Stack Architect & SQL Performance Engineer |

> *"Enterprise buyers evaluate vendors in under 10 seconds. If your site doesn't answer 'who is this
> for, what do they do, and why should I believe them' immediately, the session ends."*

### 2.6 Proof architecture — and a naming correction

**CloudLIMS must not be named.** Per BOSS instruction, that client is anonymised as
*"a US life-sciences lab-informatics platform"*. Applied to both the achievements copy and the
career roadmap. (Amex / Resy: naming **approved by BOSS 2026-09-14** — §13.4.)

The site has strong verifiable numbers that are currently buried in one-line cards:

- 200M+ records: **15 min → 6 sec**, 92% CPU reduction
- Amex & Resy VIP booking integration
- Google Sheets live pipeline: **15+ hrs/week saved**
- Platform downtime **−20%**, bug backlog **−40%**

> 3 case studies with outcomes will out-convert 20 project thumbnails. A downloadable case-study PDF
> lifted proposal reply rate to **24.2% vs 9.6%** (GigRadar pipeline data).

### 2.7 The flagship AI feature does not run in production

`ChatEngine.jsx` calls Groq from the browser via `import.meta.env.VITE_GROQ_API_KEY`. I scanned all
three deployed bundles: **no key present** → visitors get the keyword-matching fallback while the
hero advertises "Ask Jiya Concierge".

> **Security (verified):** no key is leaked today. But `VITE_*` variables are inlined into the public
> bundle at build time — the moment that variable is set on Vercel the key becomes world-readable and
> abusable at BOSS's expense. The fix must be a server-side proxy.

---

## 3. Target Users

**Primary — enterprise buyer / CTO / VP Engineering.** Evaluating in under 10 seconds, often on
mobile, with a committee behind them. Their real question is *"can I defend this decision if
something goes wrong?"* They read site quality as a proxy for engineering quality. A 4.3 s load and
a janky animation communicate "their systems are probably like this too."

**Secondary — recruiter** screening full-time roles: stack match, seniority, downloadable resume.

**Tertiary — peer/designer** who may refer him. Judges craft, notices motion quality and restraint.

---

## 4. Competitive Position & Evidence

### 4.1 What wins UI awards in 2026 (Awwwards SOTD analysis)

1. **Restraint** — one strong visual concept, not mixed effects
2. **Scroll-driven narrative** — most SOTD winners are scrollytelling
3. **Technical craft** — *"Lighthouse mobile 90+ visible in winners"*
4. **Accessibility** — *"winners now respect `prefers-reduced-motion`"*
5. **Custom shaders / distinctive effects** — one, done exceptionally well

Also: jury scores **frame-rate stability under interaction load**, **progressive enhancement** for
devices without GPU acceleration, and **graceful mobile degradation**.

*"Concept before code. Every winner started with one sentence, not a Figma file."*
*"What can I cut? Restraint reads as confidence."*

### 4.2 What makes an enterprise site credible

- **Stanford Web Credibility Project** (3 yrs, 4,500+ users): third-party support and specific
  sourcing are the **primary** drivers of credibility — *not* design polish.
- Performance thresholds: LCP < 2.5 s, INP < 200 ms, CLS < 0.1, PageSpeed 90+.
- 1 s of extra load ≈ up to **20% conversion loss** (Google).
- WCAG 2.2 AA at minimum; enterprise procurement increasingly mandates it.
- Schema markup + answer-first copy for AI-search citation (increasingly a 2026 differentiator).
- Design system standard moved from "style guide" (2024) to **"component-based design system with
  documentation"** (2026).

### 4.3 The proposed concept — one sentence

> **"The site performs the way he makes systems perform."**

A portfolio that is **instantly fast, ruthlessly efficient, and beautifully restrained** — because
that is precisely the service being sold. Performance becomes the sales argument, not a technical
detail. Every millisecond saved is a proof point.

This concept is defensible and differentiated: the overwhelming majority of developer portfolios are
slow. Being the fastest portfolio a CTO has opened this week *is* the pitch.

**Unique Value Proposition:**
> **"I make slow enterprise databases fast. 200M records: 15 minutes → 6 seconds, 92% less CPU, no downtime."**

---

## 5. Core Features (v5 scope)

### P0 — Craft foundation (this is the UI work)

| # | Feature | Description | Assigned To |
|---|---|---|---|
| 1 | **Weight rescue** | Responsive AVIF/WebP for both photos (640/1024/1600, 2×), `width`/`height`/`loading="lazy"`/`fetchpriority` on all 11 images. Target **<500 KB total transfer**, visual parity verified pixel-side-by-side. | `frontend-engineer` |
| 2 | **Concept + restraint pass** | Commit to one idea; retire or relocate competing effects. Resolve the Flappy game + LLM demo question (§13). | `product-manager` → `frontend-engineer` |
| 3 | **Design system + tokens** | Consolidate colour/space/type/motion into documented tokens; zero hardcoded values in components. 2026 enterprise standard. | `frontend-engineer` |
| 4 | **Motion system** | One choreographed motion language (scroll-driven narrative, spring-eased, purposeful). **`prefers-reduced-motion` respected everywhere.** | `frontend-engineer` |
| 5 | **Core Web Vitals pass** | LCP < 2.5 s, INP < 200 ms, CLS < 0.1, Lighthouse mobile 90+. Measured, not asserted. | `frontend-engineer` + `qa-reality-checker` |
| 6 | **WCAG 2.2 AA** | Alt text on all images, focus-visible states, Target Size ≥24×24, keyboard operability, contrast audit. | `frontend-engineer` |

### P0 — Enterprise proof & conversion

| # | Feature | Description | Assigned To |
|---|---|---|---|
| 7 | **Case study system** | 4 case studies: client context → problem in business language → what was built → **outcome metric** → testimonial inline → what he'd do differently. Data-driven. | `product-manager` → `frontend-engineer` |
| 8 | **Unified positioning** | One headline + tagline + meta description across hero, navbar, `<title>`, meta. | `product-manager` |
| 9 | **Proof architecture** | Strongest evidence moved **above the fold** and adjacent to CTAs (Stanford: proof before claim). | `frontend-engineer` |
| 10 | **Social share layer** | OG + Twitter card + generated 1200×630 image + JSON-LD `Person`/`ProfessionalService` + canonical. | `frontend-engineer` |
| 11 | **Lead capture** | Real form (persist + notify) replacing `mailto:`; GA4 conversion event end-to-end. | `backend-architect` |
| 12 | **Revive the AI concierge** | Move Groq behind a server-side proxy — **no key ever client-side**; graceful fallback retained. | `backend-architect` |

### P1

| # | Feature | Assigned To |
|---|---|---|
| 13 | Downloadable 1-page case-study PDF (24.2% vs 9.6% evidence) | `product-manager` |
| 14 | Perf budget + repeatable measurement script enforced at the QA gate | `qa-reality-checker` |
| 15 | Loom / screen-recorded walkthrough (dev buyers prefer inspectable proof) | BOSS records |
| 16 | Replace stock-photo fallbacks with a branded fallback (a stock face appearing as his headshot is a credibility risk) | `frontend-engineer` |

---

## 6. User Flow

**Primary (enterprise buyer):**
1. Lands from LinkedIn/proposal → **branded share card** (new)
2. Page is **visually complete in under a second**; nothing shifts (new)
3. Hero answers *who + what result* before the fold; availability badge confirms bookable
4. **Proof appears early** — strongest outcome metric and a named testimonial adjacent to the CTA (new)
5. Reads a **case study in business language** → outcome → testimonial in the same breath
6. Trust threshold reached → **submits the real form** → confirmation → lead captured + GA4 event
7. Optional: case-study PDF download, or a Loom walkthrough

**Secondary (recruiter):** hero → resume → LinkedIn, one click, instantly.

**Failure paths:** proxy down → concierge degrades to keyword matching, never blank.
Reduced-motion → all decorative motion disabled, content fully intact. No-GPU → graceful static fallback.

---

## 7. UI Style Guide

**Preserve the existing identity — the dark premium theme, violet `#a855f7` accent, Inter +
JetBrains Mono are already strong and are NOT being rebranded.**

**New standards to reach:**

- **One concept**: *the site performs like the systems he optimizes*
- **Tokens**: colour, spacing, radius, type scale, easing/duration — all named, none hardcoded
- **Type discipline**: one consistent scale, predictable weights (inconsistent typography = 58% trust-killer)
- **Motion**: purposeful, 60 fps, `prefers-reduced-motion` honoured, no always-on decoration in the critical path
- **Perf budget**: < 500 KB transfer; every new dependency must justify its weight
- **Accessibility**: WCAG 2.2 AA; visible focus states; keyboard-complete
- **Imagery**: real photography only; no stock faces anywhere, including fallbacks

---

## 8. Technical Architecture

**Unchanged:** React 18 · Vite 5 · Tailwind 3 · Framer Motion · Vercel · GA4 via CookieHub ·
Vercel Analytics + Speed Insights. `React.lazy` code-splitting is already correct — extend it.

**New:**
- `src/data/caseStudies.js` — content as data (i18n-ready, no hardcoded strings in components)
- `src/styles/tokens.*` — documented design tokens
- Build-time responsive image pipeline (AVIF + WebP + PNG fallback)
- `/api/chat` — serverless proxy holding `GROQ_API_KEY` server-side only
- `/api/lead` — validate → persist → notify via the existing Resend account
- `scripts/measure-perf.mjs` — repeatable CWV/weight measurement for the QA gate

**Explicitly untouched:** `scripts/lead-hunter.js` and `.github/workflows/lead-hunter.yml` — a
working daily lead pipeline. Out of scope, must not regress.

**Build estimate:** ~5–7 focused days across the team for P0 (craft-heavy, more than v4's 3–4).

---

## 9. Success Metrics (KPIs)

| Metric | Now | v5 target |
|---|---|---|
| Page transfer weight | 8,468 KB | **< 500 KB** |
| Load time | 4,345 ms | **< 1,000 ms** |
| LCP (mobile) | unmeasured | **< 2.5 s** |
| INP | unmeasured | **< 200 ms** |
| CLS | at risk (0/11 sized) | **< 0.1** |
| Lighthouse mobile | unmeasured | **90+** (Awwwards criterion) |
| `prefers-reduced-motion` honoured | 0 | **100% of motion** |
| Images with alt | 6/11 | **11/11** |
| WCAG level | below AA | **2.2 AA** |
| Competing visual effects | ~7 | **1 concept** |
| Case studies | 0 | **4** |
| Positioning statements | 4 | **1** |
| Named-client exposure | CloudLIMS public | **anonymised** |

---

## 10. Out of Scope (v5)

- ❌ Rebrand / new visual identity — the identity is good
- ❌ Deployment / CI/CD / hosting (BOSS: DevOps out of scope). Vercel auto-deploy stays as-is
- ❌ The lead-hunter pipeline
- ❌ Blog / CMS / admin dashboard
- ❌ Full i18n build-out (structure made ready only)
- ❌ Resume PDF content changes
- ❌ WebGL/Three.js rewrite — Framer Motion + CSS 3D is the right cost/benefit here

---

## 11. Risks & Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Retiring effects loses the "wow" | **High** | Reframe: the wow becomes speed + one signature interaction. BOSS decides what to cut (§13) |
| Client identities exposed in case studies | **High** | CloudLIMS anonymised; per-case naming confirmed with BOSS |
| Image conversion changes the look | Medium | Side-by-side visual diff at 2×; QA blocks on regression |
| Client-side key exposure when the concierge is fixed | **High** | Server-side proxy only; QA re-runs the bundle scan for `gsk_` |
| Motion reduction flattens the site | Medium | Motion stays; it becomes choreographed rather than ambient |
| Perf work gets deprioritised as "boring" | **High** | It is P0 and a QA gate — the site cannot ship without CWV passing |
| Breaking the working lead-hunter Action | Medium | Zero files touched in that path |

---

## 12. Reality Check — verdict

| Test | Result |
|---|---|
| Makes money? | ✅ Storefront of an active practice (18+ contracts, 4.85★) |
| Real measurable defects? | ✅ Yes — all measured today, listed in §1 |
| Fix bounded? | ✅ No rewrite; identity preserved |
| Right to win? | ✅ The DB-performance specialism has a hard number; most dev portfolios are slow |
| Will effort change the outcome? | ✅ Yes — INP <200 ms is a **2.3×** conversion factor; load is a credibility signal |
| Market crowded? | ⚠️ Generalist dev market yes; the specialist position is defensible |

### 💰 REAL BUSINESS ASSET — proceed, as a craft-led build.

**Honest caveat:** "best UI in the market" is achievable here, but the evidence is clear that it is
won by **restraint, speed, and accessibility** — not by adding more 3D. The site already has more
effects than the current award winners. The work is therefore **subtractive as much as additive**,
and the fastest visible win is compressing two photographs.

---

## 13. Open Decisions (need BOSS before build)

1. **"Sellable to enterprise grade" — which meaning?**
   (a) enterprise-grade quality so *enterprise clients* hire him, or
   (b) the site itself becomes a *product he sells* (template/agency offering)?
   These are different projects. **Recommendation: clarify before build.**
2. **The concept** — approve *"the site performs the way he makes systems perform"*?
3. **Restraint: what gets cut?** The Flappy game and the in-browser LLM demo are the two strongest
   candidates to retire or move behind a "Lab" tab. Awards evidence favours cutting.
   **Recommendation: relocate to a single "Lab" affordance** — keeps the engineering flex, removes
   the distraction.
4. **Client naming for case studies — ✅ DECIDED 2026-09-14 (BOSS).** Name clients freely; one
   exception only: **CloudLIMS stays anonymised** as *"a US life-sciences lab-informatics
   platform"* (§2.6). Amex and Resy are therefore named as the build already names them
   (`profile.js` → `keyAchievements`, plus the career roadmap) — no further permission needed.
   Supersedes the open question raised in §2.6.
5. **The 10 reviews** — three share the surname "Reddy" and several read as AI-written. **Which are
   real and verifiable?** Unverifiable testimonials are a liability a client can check.
6. **Groq key** — is it set on Vercel? The concierge is dead in prod; the fix needs it server-side.
7. **Lead destination** — inbox (Resend is wired), Google Sheet, or database?

---

**Prepared by**: Jiya — CEO & Chief Orchestrator, Sheersh AI Agency
**Awaiting approval from**: BOSS
