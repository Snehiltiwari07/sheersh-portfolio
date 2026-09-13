# Case-Study PDF Brief (1-page, downloadable)

**Owner**: product-manager · **Consumes**: `src/data/caseStudies.js`
**Purpose**: a single-page PDF a buyer can download and forward to their committee. The research
is unambiguous — a downloadable case-study PDF lifted proposal reply rate to **24.2% vs 9.6%**
(GigRadar pipeline data). This brief is the outline + the proof points it must carry; actual PDF
generation is P1 (PRD §5 item 13).

---

## 1. Page structure (top to bottom, one page)

1. **Header band** — name, tagline (`positioning.tagline`), and the one-line value prop:
   "I make slow systems fast."
2. **Proof strip** — the four hard numbers at a glance (see §2), 2×2 grid.
3. **Four mini case studies** — one condensed block each (see §3).
4. **Trust footer** — 18+ contracts · 4.85★ rating · available for remote / US-overlap ·
   contact + resume link.

No stack jargon in the primary reading path. It is a sales document for a committee, not a
technical appendix.

---

## 2. Proof points it MUST carry (the numbers a buyer will cite)

| Proof | Figure or flagged gap | Source |
|---|---|---|
| Query speed | 200M+ records: **15 minutes → 6 seconds** | caseStudies.js `sql-200m` |
| CPU cost | **92% less CPU** | caseStudies.js `sql-200m` |
| Booking integration | **Metric pending client confirmation** — no figure yet (real-time booking, no hard number) | caseStudies.js `amex-resy` (`outcomeMetricPending: true`) |
| Time saved | **15+ hrs/week** (Google Sheets pipeline) | caseStudies.js `sheets-sync` |
| Reliability | downtime **−20%**, bug backlog **−40%** | caseStudies.js `reliability` |
| Track record | **18+ contracts · 4.85★** | profile.js `profile.stats` |

Every figure above except the flagged gap is already on the live site. The PDF does not invent new
claims — it lifts the strongest verified numbers to the top and pairs each with a one-line outcome
in business language. `amex-resy` carries `outcomeMetricPending: true` (no client-confirmed figure
yet): it is rendered as "real-time booking" only, and never filled with a fabricated or derived
number, until BOSS/client supplies the metric.

---

## 3. Mini case-study block (repeat ×4)

Each block, in order:

- **Headline** — the outcome, not the tech (e.g. "A 15-minute report becomes a 6-second search").
- **Client** — one line from `clientContext` (the US life-sciences client stays anonymised).
- **Problem** — one sentence from `problem`.
- **Result** — the `outcome` metric, bolded. If `outcomeMetricPending: true`, render the gap
  honestly ("Metric pending client confirmation") or omit the block — never supply a number.
- **Quote** — the `testimonial` inline (name + role), immediately after the result. If
  `testimonialPending: true`, render the gap honestly ("Quote pending client confirmation") or
  omit the block — never substitute a placeholder, a generic quote, or a derived quote.

**Pending-field rule (never fabricate):** when `outcomeMetricPending` or `testimonialPending` is
set on a case, that field has no value yet and must be rendered as an honest gap (or the whole
block omitted). A pending flag is a real absence, not a blank to fill — never invent a number,
borrow a quote from another engagement, or derive a figure from context.

---

## 4. Content & compliance rules

- **CloudLIMS must NOT appear** anywhere in the PDF. The flagship case is anonymised as
  "a US life-sciences lab-informatics platform". Amex and Resy may be named.
- **Testimonials sit inline** next to their outcome — never in a wall at the bottom.
- **Never invent a metric or quote for a pending case.** `amex-resy` currently has no confirmed
  metric or testimonial (flagged `pending` in `caseStudies.js`); render the flags as-is and block
  GA until BOSS/client supplies them.
- **One page only.** If a case study can't fit in three lines, it is cut, not shrunk to unreadable.
- **Brand match**: dark theme, violet `#a855f7` accent, Inter + JetBrains Mono (existing identity,
  not a rebrand).
- **Footer CTA**: "Available for remote / US-overlap" + email + WhatsApp + resume link. The PDF is
  the leave-behind a buyer forwards to the committee — make the next step one tap away.

---

## 5. Delivery note

Generate as a real `.pdf` served from `/Sheersh_Tiwari_Case_Studies.pdf` (or similar) with a
download link adjacent to the case-study section and the Hire CTA. Track downloads as a GA4 event
(the 24.2% vs 9.6% lift is only measurable if the download is tracked).

- **Pre-generation verification**: re-read `src/data/caseStudies.js` immediately before generating
  the PDF. BOSS may supply the Amex/Resy figure and quote at any time; if the pending flags have
  flipped, re-check §2/§3 against the source so this brief never ships stale.
