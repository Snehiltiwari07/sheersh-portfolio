# API contract — `POST /api/lead`

**Status**: implemented `api/lead.js` (Vercel serverless function, Node runtime, zero dependencies)
**Owner**: `backend-architect` · **Consumer**: `frontend-engineer` (Hire form)
**Last verified**: 2026-09-13 — `node scripts/lead-endpoint-test.mjs` → 39/39 assertions pass

This document is the single source of truth for the lead form. If the frontend needs to ask a
question that is not answered here, this document is broken — fix it here first.

---

## 1. Endpoint

| | |
|---|---|
| Method | `POST` (only — `GET`/`PUT`/`DELETE` → `405`) |
| Path | `/api/lead` |
| Content-Type | `application/json; charset=utf-8` (required) |
| Auth | none (public endpoint, origin-allowlisted + rate limited) |
| Max body | 16 KB (`Content-Length` above that → `413`) |
| Timeout budget | 8 s Resend + 6 s store webhook, run in parallel → < 10 s worst case |
| Cache | `Cache-Control: no-store` on every response |

Same-origin only. `Origin` header must be one of:
`https://sheershtiwari.vercel.app`, `https://sheershtiwari.com`, `https://www.sheershtiwari.com`,
`http://localhost:5173`, `http://localhost:4173`, `http://127.0.0.1:5173`
(extend with the `LEAD_ALLOWED_ORIGINS` env var for preview deploys — comma-separated).
A request with no `Origin` header at all is allowed (curl, server-side callers).
Any other `Origin` → `403`.

---

## 2. Request body

```json
{
  "name": "Priya Raman",
  "email": "priya.raman@acmecorp.example",
  "company": "Acme Corp",
  "projectType": "sql-performance",
  "budgetBand": "5k-15k",
  "message": "We have a reporting query on 40M rows that takes minutes.",
  "honeypot": ""
}
```

| Field | Type | Required | Rules (enforced server-side) |
|---|---|---|---|
| `name` | string | **yes** | trimmed, internal whitespace collapsed, 2–120 chars |
| `email` | string | **yes** | trimmed, lower-cased, valid email shape, ≤254 chars |
| `company` | string | no | trimmed, ≤160 chars; empty string is accepted and stored as `""` |
| `projectType` | string enum | **yes** | one of the 8 ids below |
| `budgetBand` | string enum | **yes** | one of the 5 ids below |
| `message` | string | **yes** | trimmed, 10–2000 chars |
| `honeypot` | string | **yes** (send `""`) | must be empty; any non-empty value is treated as a bot |
| `sourcePage` | string | no | ≤300 chars, stored for attribution |
| `referrer` | string | no | ≤300 chars, stored for attribution |

Unknown extra fields are ignored (never echoed back, never stored).

### `projectType` — allowed ids (exact strings)

| id | Label to show in the UI |
|---|---|
| `sql-performance` | Database & SQL Performance Rescue |
| `api-backend` | Backend / API Engineering |
| `react-frontend` | React Frontend & Dashboard |
| `full-stack` | Full-Stack Application (end-to-end) |
| `ai-integration` | AI / LLM Integration |
| `integration` | Third-Party API Integration |
| `consulting` | Architecture Audit / Consulting |
| `other` | Something else |

### `budgetBand` — allowed ids (exact strings)

| id | Label to show in the UI |
|---|---|
| `under-5k` | Under $5,000 |
| `5k-15k` | $5,000 – $15,000 |
| `15k-50k` | $15,000 – $50,000 |
| `50k-plus` | $50,000+ |
| `not-sure` | Not sure yet — advise me |

> Mirror these lists in the frontend as a `<select>`; never let the user free-type an enum value.
> Server-side validation is authoritative — the client copy exists only so the user does not have to
> round-trip to discover a typo.

---

## 3. Responses

Every response is JSON and every response carries the header `X-Request-Id: lead_<uuid>` plus the
same value in the body as `requestId` — log this on the client so a support conversation can be
traced to server logs.

### 3.1 Success — `200`

```json
{ "ok": true, "id": "lead_3f0f2a4e-...", "requestId": "lead_..." }
```

`id` is the persisted lead id. Show it in the confirmation? No — show a human confirmation, keep
`id` for the GA4 payload and client logs.

### 3.2 Validation failure — `400`

```json
{
  "ok": false,
  "requestId": "lead_...",
  "errors": {
    "name": "Name must be at least 2 characters.",
    "email": "Enter a valid email address.",
    "projectType": "Project type is required.",
    "budgetBand": "Budget band is required.",
    "message": "Tell me a little more — at least 10 characters."
  }
}
```

`errors` keys are exactly the request field names, and **only failing fields are present**. Error
strings are user-safe English and may be shown verbatim next to the field, or mapped to your own
copy — they are stable enough to display, not stable enough to branch on (branch on the key, never
the message text).

Form-level problems (unparseable body, empty body) come back on a single key:

```json
{ "ok": false, "requestId": "lead_...", "errors": { "form": "Request body is not valid JSON." } }
```

Render `errors.form` in one summary banner above the submit button.

### 3.3 Full status table

| Status | Body | Cause | What the UI must do |
|---|---|---|---|
| `200` | `{ok:true, id, requestId}` | lead recorded | show success, fire GA4 `generate_lead` |
| `400` | `{ok:false, requestId, errors:{<field>}}` | validation failed / malformed body | inline errors, keep the form filled, re-enable submit |
| `403` | `{ok:false, requestId, errors:{form}}` | origin not allowlisted | treat as a hard failure; show `errors.form` |
| `405` | `{ok:false, requestId, errors:{form}}` + `Allow: POST` | wrong method | programming bug — never user-visible |
| `413` | `{ok:false, requestId, errors:{form}}` | body > 16 KB | "Your message is too long — please trim it." |
| `429` | `{ok:false, requestId, errors:{form}}` + `Retry-After: <seconds>` | >5 submissions / 10 min / IP | show `errors.form`, disable submit for `Retry-After` seconds |
| `500` | `{ok:false, requestId, errors:{form}}` | unexpected exception | show `errors.form` + keep the `mailto:` fallback visible |
| `502` | `{ok:false, requestId, errors:{form}}` | **nothing was recorded** (store *and* email both failed) | do **not** claim success; surface `errors.form` (it names the direct email address) |

`errors.form` text is always safe to display. The `mailto:` escape hatch must stay reachable from
the failure state — never trap a genuine buyer behind a broken form.

### 3.4 A note on the honeypot response

A submission with a non-empty `honeypot` gets **`200 {ok:true}` with a decoy id** and is then
**silently dropped**: nothing is stored, no email is sent. This is deliberate — a bot that receives
an error retries with a different shape. Do not attempt to distinguish a decoy id from a real one on
the client, and do not remove the `200` behaviour.

### 3.5 Double-submit behaviour

Two *identical* submissions (same `email` + same `message`) within 60 seconds return the **same
`id`** and send only one notification. Still disable the submit button while the request is in
flight — this is a server safety net, not a substitute for correct UX.

---

## 4. Rate limiting

- **5 submissions per 10 minutes per client IP**, counted on every request that reaches the handler.
- Counted before validation, so invalid spam counts too. IP is read from `X-Forwarded-For` (Vercel
  sets this; the first entry is the client).
- Exceeded → `429` + `Retry-After` in seconds + `errors.form` naming the wait in minutes.
- **Honest limitation:** the counter lives in the function instance's memory. On a cold start or a
  second concurrent instance the window resets, so the effective global limit is "≥ 5/10 min".
  Upgrade path (no code change needed to *this* contract): back it with Upstash Redis / Vercel KV —
  see `docs/DEPLOY-NOTES.md` §5. Configurable via `LEAD_RATE_LIMIT_MAX` /
  `LEAD_RATE_LIMIT_WINDOW_MS`.
- The frontend must still handle `429` gracefully; it can happen during a legitimate retry spree.

---

## 5. GA4 conversion contract (funnel is measured end-to-end here)

The site loads GA4 (`G-R767831ZBS`) through `gtag` in `index.html` after CookieHub consent, and
`window.gtag` exists globally. Use it directly; do not add a new analytics dependency.

### 5.1 Fired on `200 {ok:true}` — required, this is the conversion event

```js
window.gtag?.('event', 'generate_lead', {
  form_id: 'hire_form',
  lead_id: res.id,               // from the API response
  project_type: payload.projectType,
  budget_band: payload.budgetBand,
  has_company: Boolean(payload.company),
  page_path: window.location.pathname
});
```

- Event name: **`generate_lead`** — a GA4 *recommended* event, so it maps to the standard
  conversion reporting without custom definitions.
- Mark `generate_lead` as a **Key Event / conversion** in the GA4 admin UI (that is a console
  action, not code).
- **Never** send `name`, `email`, `company` or the message body to GA4. PII in analytics is a GDPR/DPA
  violation and Google will drop the property for it. `lead_id` is an opaque uuid — that is the only
  identifier that may leave the client.

### 5.2 Fired on any failure — optional but recommended diagnostics

```js
window.gtag?.('event', 'lead_form_error', {
  form_id: 'hire_form',
  http_status: res.status,
  error_fields: Object.keys(res.errors || {}).join(',')
});
```

Bots on the honeypot path also get a `200`, so they are indistinguishable in GA4 — acceptable, that
is a tiny volume. If it ever matters, the server logs carry
`lead.rejected.honeypot` with an ip hash.

### 5.3 Where the funnel becomes measurable

`hire_form_view` (optional, fire when the drawer opens) → `generate_lead` on success. Everything
before this card was `mailto:` with zero events, so `generate_lead` is the first real conversion
signal for the site.

---

## 6. Reference client implementation

```js
export async function submitLead(payload) {
  const res = await fetch('/api/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      company: payload.company || '',
      projectType: payload.projectType,
      budgetBand: payload.budgetBand,
      message: payload.message,
      honeypot: '',                       // always empty from real users
      sourcePage: window.location.pathname,
      referrer: document.referrer || ''
    })
  });

  const data = await res.json().catch(() => ({ ok: false, errors: { form: 'Unexpected server response. Please email er.sheershtiwari@gmail.com.' } }));

  if (res.ok && data.ok) {
    window.gtag?.('event', 'generate_lead', {
      form_id: 'hire_form',
      lead_id: data.id,
      project_type: payload.projectType,
      budget_band: payload.budgetBand,
      has_company: Boolean(payload.company),
      page_path: window.location.pathname
    });
    return { ok: true, id: data.id };
  }

  window.gtag?.('event', 'lead_form_error', {
    form_id: 'hire_form',
    http_status: res.status,
    error_fields: Object.keys(data.errors || {}).join(',')
  });

  if (res.status === 429 && res.headers.get('Retry-After')) {
    // surface the wait and keep the submit button disabled for that long
  }
  return { ok: false, status: res.status, errors: data.errors || {} };
}
```

### 6.1 The honeypot input (the frontend half of the spam defence)

```jsx
<input
  type="text"
  name="honeypot"
  tabIndex={-1}
  autoComplete="off"
  aria-hidden="true"
  value=""
  onChange={() => {}}
  style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
/>
```

Rules: name it `honeypot`, never populate it from state, keep it out of the tab order and out of the
accessibility tree, and do not hide it with `display:none` only (some bots skip hidden inputs, which
is fine — the ones that fill it are the ones we catch). It must be **outside** any label the user
reads.

---

## 7. What is tested (evidence trail)

`npm run test:lead` — `api/lead.js`, 19 cases, 57 assertions, all passing (exit 0):

| Case | Proves |
|---|---|
| 1 | happy path → `200 {ok:true,id}` + one Resend call + one store call, correct payloads — the store payload is now the normalised 11-column row, not the raw lead |
| 2 | field-level typed errors for name/email/projectType/budgetBand/message |
| 3 | non-string types rejected (`must be a string`), zero outbound calls |
| 4 | unknown enum values rejected with the allowed list in the message |
| 5 | 2001-char message rejected |
| 6 | honeypot → `200` decoy + **zero** outbound calls |
| 7 | 6th submission from one IP → `429` + `Retry-After`, no outbound call |
| 8 | duplicate double-click → same `id`, one notification |
| 9–12 | `405` GET, malformed JSON, `403` bad origin, `413` oversize body |
| 13 | both delivery paths down → `502`, never a false `ok:true` |
| 14 | store webhook 500 + Resend 200 → `200` (degraded but recorded) |
| 15 | Google Apps Script `302` → `script.googleusercontent.com` **is followed**, against a real loopback mock web app; with Resend unset the `200` can only mean the row was accepted |
| 16 | an **unfollowed** `302` is not accepted as a write → `502`; the logged detail carries the Location host, never the token or the full URL |
| 17 | a `200` whose body says `{"ok":false}` counts as a **failed** write → `502` (the only failure channel an Apps Script web app has) |
| 18 | sheet write fails + email succeeds → `200` and a loud `WARN lead.store.failed` (never a silent half-failure) |
| 19 | the row mapping itself: 11 values, contractual column order, enum **labels** not ids, `""` for absent values, ISO-8601 timestamp |

`npm run test:sheet` — `integrations/google-sheets/Code.gs`, 11 cases, 36 assertions, run outside
Google against stubbed Apps Script services (S1 header creation + freeze + format, S2 no duplicate
header, S3/S4 wrong-width and raw-lead refusal, S5 `null`/`undefined` → `""`, S6 formula-injection
neutralisation, S7/S8 token enforcement, S9 empty-row no-op, S10 `?demo=1`, S11 `checkSetup`).

Neither harness touches a real Google Sheet — see `docs/DEPLOY-NOTES.md` §7.4.

---

## 8. Persistence — exactly what "recorded" means today

On success the lead is written to, in order of durability:

1. **A structured log line** (`lead.received`, `lead.captured`) — always written, survives a
   downstream failure.
2. **The external store** via `LEAD_STORE_WEBHOOK_URL` — one **normalised 11-column row**,
   `{"row":[…]}` (the shared shape the lead hunter writes too; schema in
   `docs/GOOGLE-SHEET-SETUP.md §The row`, implementation in `toSheetRow()`). Written when that env
   var is set. Not required for the endpoint to work.
3. **The notification email to `LEAD_NOTIFY_EMAIL` via Resend** — the durable human-readable record.
   Same account and request shape already used by `scripts/lead-hunter.js`; `reply_to` is set to the
   lead's address so a reply goes straight back to the buyer.

`ok:true` is returned **only when at least one durable path succeeded**. There is no database yet:
storage was never decided (PRD §13 item 7 — inbox vs Sheet vs DB) and deployment/infra is out of
scope for this project. When BOSS picks a DB, only `persistToStore()` in `api/lead.js` changes —
the HTTP contract in this document does not move. This is stated plainly rather than dressed up as
"persisted" — the current durable store is Resend + the Sheet webhook.
