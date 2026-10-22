> Historical document preserved before the 2026-10-23 refresh. Instructions and measurements may describe an earlier revision. See ../../README.md for current guidance.

# Deploy notes — `/api/lead`

**Scope**: what must exist for the lead endpoint to work in production.
**I did not deploy anything** — deployment/DevOps is out of scope for this project (PRD §10). These
are the requirements for whoever does. Vercel's auto-deploy from `main` stays as-is.

---

## 1. Files this change adds / touches

| Path | Change |
|---|---|
| `api/lead.js` | **new** — the endpoint (Vercel zero-config picks up `api/*.js` as a function) |
| `vercel.json` | one line — SPA fallback rewrite `/(.*)` → `/((?!api/).*)` so `/api/*` can never be swallowed by the catch-all |
| `.env.example` | **new** — placeholder names only, no real values |
| `docs/api-lead-contract.md` | **new** — frontend contract |
| `scripts/lead-endpoint-test.mjs` | **new** — local test harness (`npm run test:lead`) |
| `integrations/google-sheets/Code.gs` | **new** — the Apps Script web app that appends the shared Sheet row; committed so the Google-side code is version-controlled |
| `docs/GOOGLE-SHEET-SETUP.md` | **new** — 10-minute owner setup guide + the 11-column row contract |
| `scripts/apps-script-sheet-test.mjs` | **new** — runs `Code.gs` offline against stubbed Apps Script services (`npm run test:sheet`) |
| `scripts/lead-hunter.js`, `.github/workflows/lead-hunter.yml` | **untouched, deliberately** |

No new npm dependency. The function imports nothing outside the Node standard library, so the
frontend bundle is unaffected and the cold start stays minimal.

---

## 2. Environment variables

Set these in **Vercel → Project → Settings → Environment Variables** (Production and Preview).
Never in `config.yaml`, never in the repo, never in a committed file. `.gitignore` already blocks
`.env`, `.env.*` and `.env.local`, with `!.env.example` as the only exception — verified, see §6.

### Required — the endpoint returns `502` without them

| Variable | Example | Why |
|---|---|---|
| `RESEND_API_KEY` | `re_...` | the existing Resend account; same key `scripts/lead-hunter.js` uses |
| `LEAD_NOTIFY_EMAIL` | `er.sheershtiwari@gmail.com` | inbox that receives the lead. Falls back to `RECIPIENT_EMAIL`, then that default |

### Required only if the sender domain is not verified

| Variable | Default | Note |
|---|---|---|
| `LEAD_FROM_EMAIL` | `Sheersh Portfolio <onboarding@resend.dev>` | Resend rejects any `from` other than `onboarding@resend.dev` until a domain is verified. **If `LEAD_FROM_EMAIL` names an unverified domain, every notification fails with `Resend HTTP 403` and the endpoint returns `502` to the visitor.** Rule: change this only *after* the domain shows Verified in Resend. |

### Optional

| Variable | Default | Effect |
|---|---|---|
| `LEAD_STORE_WEBHOOK_URL` | unset | POSTs `{"row":[…11 values…]}` to an external durable store (Google Apps Script → Sheet, CRM, DB adapter). Written in parallel with the email; either path alone is enough for `200`. **Same variable name and same URL as the lead hunter (GitHub Actions secret)** — see §7 |
| `LEAD_STORE_WEBHOOK_TOKEN` | unset | sent as `Authorization: Bearer …` on the store request. **Ignored by a Google Apps Script store** (web apps expose no request headers) — for Apps Script put `?token=…` in `LEAD_STORE_WEBHOOK_URL` instead. See §7 |
| `LEAD_ALLOWED_ORIGINS` | unset | extra comma-separated browser origins allowed to POST — needed for preview deploys (`https://sheershtiwari-git-*.vercel.app`), because preview hostnames are not in the built-in allowlist and would otherwise get `403` |
| `LEAD_RATE_LIMIT_MAX` | `5` | submissions allowed per IP per window |
| `LEAD_RATE_LIMIT_WINDOW_MS` | `600000` | window length (10 minutes) |

`GROQ_API_KEY` / `APIFY_TOKEN` are **not** needed by this endpoint — they belong to the untouched
`lead-hunter` pipeline.

---

## 3. Verify after deploying (no credentials needed)

```bash
# 1. Route exists and is not swallowed by the SPA fallback (must NOT return HTML)
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' -X POST https://sheershtiwari.vercel.app/api/lead \
  -H 'Content-Type: application/json' -d '{}'
# expect: 400 application/json; charset=utf-8

# 2. Validation is real
curl -s -X POST https://sheershtiwari.vercel.app/api/lead \
  -H 'Content-Type: application/json' \
  -d '{"name":"A","email":"nope","projectType":"","budgetBand":"","message":"x","honeypot":""}'
# expect: {"ok":false,...,"errors":{"name":...,"email":...,"projectType":...,"budgetBand":...,"message":...}}

# 3. Wrong method
curl -s -o /dev/null -w '%{http_code}\n' https://sheershtiwari.vercel.app/api/lead   # expect 405

# 4. Real end-to-end (uses your own address; a real email should arrive)
curl -s -X POST https://sheershtiwari.vercel.app/api/lead \
  -H 'Content-Type: application/json' \
  -d '{"name":"Deploy Check","email":"YOUR_ADDRESS@example.com","company":"Self","projectType":"consulting","budgetBand":"not-sure","message":"Post-deploy smoke test of the lead endpoint. Please ignore.","honeypot":""}'
# expect: {"ok":true,"id":"lead_...","requestId":"lead_..."} + the email in the inbox
```

`200` + email received = wired correctly. `502` = see §4.

---

## 4. Failure modes and what they mean

| Symptom | Cause | Fix |
|---|---|---|
| `502` + log `lead.delivery.failed` with `"email":"RESEND_API_KEY not configured"` | env var missing on that environment (check Preview separately from Production) | set it, redeploy (env changes need a new deployment) |
| `502` + log `"email":"Resend HTTP 403 ..."` | `LEAD_FROM_EMAIL` uses an unverified domain, or the key is revoked | verify the domain in Resend, or revert `LEAD_FROM_EMAIL` to `onboarding@resend.dev` |
| `403` from a preview URL | preview hostname not in the origin allowlist | add it to `LEAD_ALLOWED_ORIGINS` |
| `/api/lead` returns the HTML shell (200 `text/html`) | the `vercel.json` catch-all rewrite was reverted to `/(.*)` | restore the source to `/((?!api/).*)` |
| `429` for a normal user | 5 submissions in 10 min from one IP (shared office NAT can do this) | raise `LEAD_RATE_LIMIT_MAX`, or implement the Redis-backed counter in §5 |
| `200` + email arrives but **no sheet row** | the sheet half failed while the email path saved the lead — the lead is **not** lost | Vercel ▸ Logs ▸ `WARN lead.store.failed`; its `store` field names the cause, mapped to fixes in `docs/GOOGLE-SHEET-SETUP.md` |
| `200` but no email and no store write | impossible by construction — `200` requires one durable path to succeed | if you observe this, it is a bug: capture the `lead_...` id from the response and report it |

Server-side evidence lives in **Vercel → Logs**, filter by `message:lead.received` /
`lead.captured` / `lead.rejected.*`. `200` responses for honeypot submissions are logged as
`lead.rejected.honeypot`, which is how you tell a bot apart from a real lead that also got a `200`.

---

## 5. Known limitations (stated, not hidden)

1. **Rate limiting is per function instance.** The counter is in-memory, so a cold start or a second
   concurrent instance resets the window. Real global limiting needs shared state: provision Upstash
   Redis / Vercel KV and replace `checkRateLimit()` with a REST `INCR`+`EXPIRE` call — no contract
   change, no new dependency (both expose a plain HTTP API).
2. **No database.** Storage was never decided (PRD §13 item 7). Today's durable record is the Resend
   inbox plus, if configured, `LEAD_STORE_WEBHOOK_URL`. The chosen store is a **Google Sheet** via an
   Apps Script web app (§7); adding Vercel Postgres/KV later still touches only `persistToStore()`
   in `api/lead.js`.
3. **No CAPTCHA — by design.** It costs conversion far more than it blocks bots. Honeypot + rate
   limit + origin allowlist is the trade-off the card asked for.
4. **Not verified against real Resend, real Vercel or a real Google Sheet.** Two harnesses
   (`npm test`) exercise `api/lead.js` and `Code.gs` locally against a stubbed `fetch`, a loopback
   mock Apps Script web app and stubbed Apps Script services: they prove validation, honeypot, rate
   limit, status codes, the 11-column row mapping, the `302` handling and the appender's behaviour,
   but they do **not** prove a real email lands in the inbox or a real row lands in a sheet. That
   requires the env vars in §2 and the steps in `docs/GOOGLE-SHEET-SETUP.md` — a deployment step,
   out of scope here. Say so rather than implying it has been proven end-to-end.

---

## 6. Secrets verification (run these after any change to this area)

```bash
# .gitignore still blocks secrets, and .env.example is the only allowed exception
git check-ignore -v .env .env.local        # both must print a match; .env.example must NOT match

# nothing key-shaped is tracked, and no .env file was ever committed
git ls-files | grep -iE '\.env'                      # expect only .env.example
git grep -nE 're_[A-Za-z0-9]{16,}|sk-[A-Za-z0-9]{20,}|gsk_[A-Za-z0-9]{20,}' -- . || echo 'clean'

# and the full history, not just the working tree
git log -p --all | grep -nE 're_[A-Za-z0-9]{16,}|sk-[A-Za-z0-9]{20,}|gsk_[A-Za-z0-9]{20,}' || echo 'history clean'
```

Env vars are read server-side only (`process.env` inside `api/lead.js`). No key is ever prefixed
`VITE_*`, which is what would inline it into the public bundle — the frontend never sees any of the
variables in §2.

---

## 7. The Google Sheets store — contract, redirect decision, guarantees

Setup guide for the owner: **`docs/GOOGLE-SHEET-SETUP.md`** (10 minutes, no coding).
Source of the appender (version-controlled on purpose): `integrations/google-sheets/Code.gs`.

### 7.1 The webhook carries a normalised row, not a lead

```json
POST <LEAD_STORE_WEBHOOK_URL>
{ "row": ["2026-09-13T16:10:25.000Z", "Form (website)", "Priya Raman", "Acme Corp",
          "priya@acmecorp.example", "Database & SQL Performance Rescue",
          "$5,000 – $15,000", "", "We have a 40M-row report that takes minutes.",
          "https://sheershtiwari.vercel.app/#hire", "lead_3f0f2a4e"] }
```

Exactly **11 strings**, always in that order — the same columns the hunter writes (it uses
`Source: "Hunter (<board>)"` and fills `Score`/`Link` instead of the form's enum labels). Absent
values are `""`; never `null`, never `"null"`. Column order is a contract, documented once in
`docs/GOOGLE-SHEET-SETUP.md §The row` and mirrored in `toSheetRow()` in `api/lead.js`.

Mapping lives in the **producer**, not in Apps Script. Rationale: logic inside Google's editor is
untestable and invisible to review; a dump appender that receives a finished row is neither, and
`npm run test:sheet` can assert its behaviour offline. The appender's only validation is row width —
it rejects a wrong-width row instead of silently shifting every column.

### 7.2 Decision: the 302 is FOLLOWED, and never accepted as success

An Apps Script web app answers **`302`** to `script.googleusercontent.com` and serves the real body
only there (the redirect re-issues our `POST` as a `GET`). Decision, implemented in
`persistToStore()`:

1. **Follow it** — `redirect: 'follow'` is set explicitly rather than relying on the runtime default.
   Proven against a real HTTP redirect by `npm run test:lead` CASE 15 (mock web app on loopback).
2. **A `3xx` that reaches us is a failure, never a success** — some runtimes refuse to follow and
   hand the `302` back. That returns `ok:false` with `HTTP 302 redirect not followed (Location host:
   …)`, so a `200` can never be faked (CASE 16). Only the Location **host** is logged — never the
   full URL, which can carry a token.
3. **Body verdict wins over status** — an Apps Script web app *cannot set a status code*: even a hard
   failure comes back as `200`. So the body `{"ok":false,"error":"…"}` is treated as a failed write
   (CASE 17). A `2xx` with a non-JSON body still counts as success, so a generic CRM webhook that
   answers `200 OK` as text is not misreported.
4. Nothing here weakens the `502`-when-nothing-durable guarantee: the store simply reports honestly,
   and `200 {ok:true}` still requires **one** durable path.

A half-failure is never silent: if the store fails while the email succeeds the request is `200` **and**
`WARN lead.store.failed` is logged (CASE 18). Look for it in Vercel ▸ Logs.

### 7.3 Why the token travels in the URL for Apps Script

Apps Script web apps expose no request headers at all, so the `Authorization: Bearer …` that
`LEAD_STORE_WEBHOOK_TOKEN` produces is invisible to `Code.gs`. The script therefore checks
`?token=<value>` against the `LEAD_WEBHOOK_TOKEN` script property. Consequence: the URL itself is a
secret (never logged, never committed) and must be rotated through **Manage deployments ▸ New
version** if it leaks.

### 7.4 What is *not* proven

No real Google Sheet was contacted — no Google credentials exist in this environment. Proven:
payload shape, redirect handling, failure classification, and the appender's behaviour against
stubbed Apps Script services. **Both producers are now wired**: the form (`api/lead.js`) and the lead
hunter (`scripts/lead-hunter.js`, card T-010 — `docs/lead-hunter-sheet.md`), which posts the same row
after it sends its digest and logs `Sheet mirror failed …` rather than ever disturbing the email.
Not proven: a real row in a real sheet, real Apps Script authorisation, and any live GitHub Actions
cron run. The owner's Step 6 `?demo=1` row is the first real proof. Say so rather than implying
otherwise.
