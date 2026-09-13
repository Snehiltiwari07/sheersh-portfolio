# T-008 — Hire form UI → `POST /api/lead` + GA4 `generate_lead` (evidence)

**Card**: `t_4e56191e` · **Worker**: `frontend-engineer` · **Date**: 2026-09-13 (IST)
**Status**: implementation complete, evidence below is from the **final build** (`npm run build`,
commit on `main` recorded in the card comment). **Nothing was pushed, deployed or published.**

## 0. What changed

| File | Change |
|---|---|
| `src/components/HireDrawer.jsx` | Estimator kept as-is; the `mailto:` hand-off replaced by a real form (6 fields + honeypot), submit states, server-error mapping, 429 countdown, focus management |
| `src/data/leadForm.js` | **new** — contract enum ids + labels, estimator table, every user-facing string (T-002/T-004 copy convention) |
| `src/lib/lead.js` | **new** — `submitLead()` (contract §6), `validateLead()` (UX sugar), GA4 `generate_lead` / `lead_form_error` wiring (contract §5) |
| `src/components/ChatEngine.jsx` | 2-line change: the `✉️ Direct Email` `mailto:` CTA now opens the drawer's form (`✉️ Enquiry Form`); the unused `emailLink` const removed. Nothing else in the chatbot touched |
| `src/App.jsx` | `<ChatEngine onOpenHireDrawer={…}>` — the prop ChatEngine already expected but was never given |
| `src/styles/tokens.css` | `--honeypot-offset` token so the trap can be hidden without a raw px (`check-tokens` gate) |
| `scripts/check-lead-form.mjs` | **new** gate `npm run check:leadform` — client enums/GA4 payload vs `api/lead.js` + contract §5.1 (8 checks) |
| `scripts/lead-form-e2e.mjs` | **new** — local `vercel dev` stand-in: serves `dist/` and mounts the real `api/lead.js` on `/api/lead` with a loopback store webhook, writing `e2e-traffic.json` |

Untouched, as required: `api/lead.js`, `scripts/lead-hunter.js`, `.github/workflows/`, `vercel.json`.
No new npm dependency. Bundle: `HireDrawer` chunk 17.67 kB (5.45 kB br) — lazy-loaded, not on the
critical path; the initial `index` chunk grew 50.86 kB (was 50.7 kB, +0.2 kB for the `App.jsx` prop).

## 1. How the evidence was produced (reproducible)

```bash
npm run build                     # exit 0
npm run test                      # 3 harnesses: lead endpoint / Apps Script sheet / hunter
npm run check:tokens              # PASS (16 documented pre-existing exceptions, all ChatEngine/T-005)
npm run check:leadform            # PASS — 8 checks
E2E_PORT=5173 LEAD_RATE_LIMIT_MAX=4 node scripts/lead-form-e2e.mjs   # serves dist/ + the REAL api/lead.js
# then a real Chromium: open http://localhost:5173, open the drawer, drive the form
```

`scripts/lead-form-e2e.mjs` is a **local** stand-in for `vercel dev` (no linked project/credentials
needed). It mounts `api/lead.js` unmodified, sets `LEAD_STORE_WEBHOOK_URL` to a **loopback** mock
that records the normalised 11-column row, and leaves `RESEND_API_KEY` unset. Every request/response
is appended to `docs/evidence/T-008/e2e-traffic.json` — that file is the raw record, not a summary.

## 2. Acceptance criteria → evidence

### AC1 — a real submission returns `200 {ok:true,id}` + the confirmation UI

Raw pair from the browser (verbatim, incl. the estimate block the estimator contributes):

```
POST /api/lead   Content-Type: application/json
{"name":"Priya Raman","email":"priya.raman@acmecorp.example","company":"Acme Corp",
 "projectType":"sql-performance","budgetBand":"5k-15k",
 "message":"Final run: our reporting query over 40M rows takes minutes on the primary database. Please advise on indexing.\n---\nEstimated on-site scope: Database & SQL Rescue\nDelivery: Standard Timeline\nEstimate shown: $400 - $900 USD / 2-5 business days",
 "honeypot":"","sourcePage":"/","referrer":""}

200  X-Request-Id: lead_7ffe13f4-c772-4eaf-ba29-f3b723012db2  Cache-Control: no-store
{"ok":true,"id":"lead_d7462eb4-8d4b-4bdf-bdb9-78ae79551ef4","requestId":"lead_7ffe13f4-c772-4eaf-ba29-f3b723012db2"}
```

Confirmation UI: `role="status"`, `data-request-id="lead_7ffe13f4…"`, **focused**
(`document.activeElement === confirmation`), text "Thanks — your enquiry is in. …".

The same request, independently recorded **server-side** in `e2e-traffic.json` (request 1: status
`200`, origin `http://localhost:5173`) — client and server records agree.

### AC2 — bad input renders field-level errors, no page reload

**(a) client validation** (empty form, submitted from the UI): `networkCallsAdded: 0` — no request
leaves. Summary `role="alert"`, focused, "4 fields need your attention" + the four messages; each
input carries `aria-invalid="true"` and a `aria-describedby` pointing at its `-error` node.

**(b) a real server `400`** — the client's shape check deliberately accepts `priya@acme..example`,
the server's `EMAIL_RE` does not, so this is a genuine server rejection through the real form:

```
400 {"ok":false,"requestId":"lead_6add8905-c99f-46c3-b7aa-0ac799555537",
     "errors":{"email":"Enter a valid email address."}}
```
Rendered: `#hire-email` red border, `aria-invalid="true"`, inline text "Enter a valid email
address." (the server's own string, verbatim), summary "1 field needs your attention", **form still
filled** (name/budget kept), submit re-enabled, no reload. No fabricated "something went wrong"
banner — a validation 400 produces only the field errors.

### AC3 — honeypot present, empty, invisible, out of tab order, never populated

From the live DOM:

```
name="honeypot"  value=""  tabIndex=-1  aria-hidden="true"  autoComplete="off"  insideLabel=false
style="position:absolute; left:var(--honeypot-offset); width:var(--hairline); height:var(--hairline); opacity:0; pointer-events:none"
computed: position absolute, left -9999px, 1x1px, opacity 0, display block   (not display:none)
```

Keyboard walk: after the last select, the next Tab lands on the form's submit button — the honeypot
is **skipped** (`isHoneypot: false`). Every request body sent `"honeypot":""` (see
`e2e-traffic.json` and the browser records) — it is never populated from state, per contract §6.

### AC4 — the `generate_lead` event is observed firing (raw payload, not "the code calls it")

The browser had real GA4 (`G-R767831ZBS`) loaded by the site's own `index.html` bootstrap, so the
event went out over the wire. Raw `POST` to Google (params verbatim, tid/ids elided for length):

```
https://www.google-analytics.com/g/collect?...&en=generate_lead&_ee=1
  &ep.form_id=hire_form
  &ep.lead_id=lead_d7462eb4-8d4b-4bdf-bdb9-78ae79551ef4
  &ep.project_type=sql-performance
  &ep.budget_band=5k-15k
  &ep.has_company=true
  &dp=%2F
```

and the `dataLayer` entry behind it:

```json
["event","generate_lead",{"form_id":"hire_form","lead_id":"lead_d7462eb4-8d4b-4bdf-bdb9-78ae79551ef4",
 "project_type":"sql-performance","budget_band":"5k-15k","has_company":true,"page_path":"/"}]
```

**No PII in either** — `name`, `email`, `company` and the message body are absent (contract §5.1);
`scripts/check-lead-form.mjs` fails the build if a PII key is ever added to that payload.
`generate_lead` fired **only** on `200`: the `400` and the `429` runs emitted `lead_form_error`
(`http_status`, `error_fields`) and no `generate_lead`.

### AC5 — keyboard-only completion

98 Tab presses from page load reach the "Estimate Project Cost" CTA → `Enter` opens the drawer and
focus moves inside it → typed brief/name/email/company with real key events → project type already
pre-filled from the estimator → native `<select>` chosen with `ArrowDown` → next Tab = the form's
submit button (honeypot skipped) → `Enter`:

```
200 {"ok":true,"id":"lead_495c761b-295e-4861-b70f-3956c7cf0147","requestId":"lead_ca2a1335-…"}
generate_lead fired · confirmation rendered and focused
```

No mouse event was dispatched in that run. (The CTA is the last of 98 tab stops; the chat panel owns
~30 of them — that ordering is pre-existing app structure, not something this card introduced.)

### AC6 — `npm run build` passes, perf budget not regressed

`npm run build` → exit 0. The drawer is lazy-loaded (`HireDrawer-*.js` 17.67 kB / 5.45 kB br); the
form adds no dependency and nothing to the initial chunk beyond the one-line `App.jsx` prop. The
Boss-rebased pass-1 bar is Lighthouse mobile performance ≥ 60 (LCP/CLS/TBT measured, not blocking);
the drawer's cost is below the fold and behind a click, so the initial-load score is untouched. The
gate itself (`npm run test` + `check:tokens`) is green — see §3.

## 3. Gates run on the final build

```
npm run build          exit 0
npm run check:tokens   PASS — no hardcoded colour/px/ms outside the token layer, no unresolved var() (16 documented pre-existing exceptions, all ChatEngine + T-005)
npm run check:leadform PASS — 8 checks (enums vs api/lead.js, estimator→projectType map, GA4 params vs contract §5.1, no PII, form_id on all 3 tracked events, endpoint/method, honeypot)
```

## 4. Other states verified (same run)

| Scenario | Result |
|---|---|
| `429` | `Retry-After: 499`; server's `errors.form` shown once, submit **disabled** with a live countdown ("Try again in 497s" → 493s after 4 s), no false success, mailto + WhatsApp still reachable — `docs/evidence/T-008/429-rate-limit-state.png` |
| Duplicate/city-noise | not exercised beyond the server's own harness (`npm run test:lead`) |
| Store write | 3 accepted submissions produced **3 eleven-column rows** in `e2e-traffic.json → storeRows`, with enum **labels** (`Database & SQL Performance Rescue`, `$5,000 – $15,000`, `Under $5,000`) and the lead id in column 11 — the shape Google Sheets receives |

## 5. Honest limitations (not certified)

1. **No live Google Sheet row exists.** No `LEAD_STORE_WEBHOOK_URL` credential is present locally and
   nothing is deployed (Boss: nothing gets published), so the store write is proven against a
   **loopback** webhook implementing the same contract — the endpoint's own harness
   (`npm run test:lead`, case 15/19) covers the Apps Script redirect + row mapping. A real Sheet row
   needs the env vars from `docs/DEPLOY-NOTES.md` §3 and a deployment, which is out of scope here.
2. **No real email** was sent (`RESEND_API_KEY` deliberately unset).
3. GA4 was exercised with the **real** `gtag` from `index.html` against `google-analytics.com` from a
   headless Chromium; GA4 DebugView itself was not opened (no console access), so the raw collect
   payload above is the evidence instead — the acceptance criterion allows either.
4. Rate limiting is per instance/in-memory (contract §4); the `429` above is real but local.
5. The estimator's "notes" field is now the required `message` (min 10 chars); its estimate summary is
   appended to the submitted message (dropped entirely if it would exceed the server's ceiling), so
   the quote the visitor saw still reaches the inbox/Sheet instead of vanishing with the `mailto:`.
