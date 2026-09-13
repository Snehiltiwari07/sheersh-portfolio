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

| Proof | Exact figure | Source |
|---|---|---|
| Query speed | 200M+ records: **15 minutes → 6 seconds** | caseStudies.js `sql-200m` |
| CPU cost | **92% less CPU** | caseStudies.js `sql-200m` |
| Booking integration | Amex + Resy VIP dining, **real-time** | caseStudies.js `amex-resy` |
| Time saved | **15+ hrs/week** (Google Sheets pipeline) | caseStudies.js `sheets-sync` |
| Reliability | downtime **−20%**, bug backlog **−40%** | caseStudies.js `reliability` |
| Track record | **18+ contracts · 4.85★** | profile.js `profile.stats` |

Every figure above is already on the live site. The PDF does not invent new claims — it lifts the
strongest verified numbers to the top and pairs each with a one-line outcome in business language.

---

## 3. Mini case-study block (repeat ×4)

Each block, in order:

- **Headline** — the outcome, not the tech (e.g. "A 15-minute report becomes a 6-second search").
- **Client** — one line from `clientContext` (the US life-sciences client stays anonymised).
- **Problem** — one sentence from `problem`.
- **Result** — the `outcome` metric, bolded.
- **Quote** — the `testimonial` inline (name + role), immediately after the result.

---

## 4. Content & compliance rules

- **CloudLIMS must NOT appear** anywhere in the PDF. The flagship case is anonymised as
  "a US life-sciences lab-informatics platform". Amex and Resy may be named.
- **Testimonials sit inline** next to their outcome — never in a wall at the bottom.
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
