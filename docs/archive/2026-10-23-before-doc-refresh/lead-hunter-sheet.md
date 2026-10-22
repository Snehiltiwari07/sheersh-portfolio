> Historical document preserved before the 2026-10-23 refresh. Instructions and measurements may describe an earlier revision. See ../../README.md for current guidance.

# Lead hunter → Google Sheet (card T-010)

**Status**: implemented in `scripts/lead-hunter.js` (additive only) · **Test**: `npm run test:hunter`
**Owner**: `backend-architect` · **Reviewer**: `qa-reality-checker`
**Companion docs**: `docs/GOOGLE-SHEET-SETUP.md` (the 10-minute owner setup),
`docs/DEPLOY-NOTES.md` §7 (the webhook contract and the 302 decision)

BOSS's decision this card implements: *"land both of them in same place in the sheet only"* — the
website form and the autonomous lead hunter write rows into **the same Google Sheet**, same 11
columns, so there is one place to skim.

Hard constraint from BOSS: *"the autonomous lead hunter … should be intact as it is running in the
github cron job"*. Nothing in the pipeline (Apify → Groq → Resend digest), its schedule
(`0 9 * * *`), or its `workflow_dispatch` trigger was changed.

---

## 1. What changed — the exact diff

| File | Change |
|---|---|
| `scripts/lead-hunter.js` | **+1 line** reading `LEAD_STORE_WEBHOOK_URL` from `process.env`; **one new block** (`HUNTER_SOURCE_LABELS`, `sheetCell()`, `companyFromTitle()`, `toSheetRow()`, `pushLeadsToSheet()`); **one call** added after the digest is dispatched. No existing function, fetcher, prompt, threshold or log line was touched. |
| `.github/workflows/lead-hunter.yml` | **+1 line**: `LEAD_STORE_WEBHOOK_URL: ${{ secrets.LEAD_STORE_WEBHOOK_URL }}` in the existing `env:` block. See §5 — this one line is genuinely required, and it is the only delta in the workflow: the cron, the triggers, the runner, the other secrets and the `node scripts/lead-hunter.js` step are byte-identical. |
| `scripts/lead-hunter-sheet-test.mjs` | New harness (11 cases, `npm run test:hunter`). |
| `package.json` | `test:hunter` script + chained into `npm test`. |

The pipeline order is unchanged and the mirror runs **after** the digest:

```
fetch 6 feeds → dedupe → Groq relevance filter (score ≥ 75) → build+send digest email
                                                                        │
                                                                        ▼
                                            pushLeadsToSheet(qualifiedLeads)   ← new, isolated
```

Anything that would have been emailed is also pushed — the same `qualifiedLeads` array, so the sheet
and the digest can never disagree about which leads qualified.

## 2. The row — identical to the form's

Exactly 11 strings, same order as `toSheetRow()` in `api/lead.js` and the table in
`docs/GOOGLE-SHEET-SETUP.md §The row`. Absent values are `""`; never `null`, never `"null"`, never
`"undefined"`.

| # | Column | Hunter value |
|---|---|---|
| 1 | `Received` | ISO-8601 UTC timestamp, taken at push time |
| 2 | `Source` | the label map below |
| 3 | `Name / Title` | the listing title, verbatim |
| 4 | `Company` | parsed from the title (§3), else `""` |
| 5 | `Email` | `contactEmail` from the Groq evaluation, else `""` |
| 6 | `Project / Type` | `""` (form rows only) |
| 7 | `Budget` | `""` (form rows only) |
| 8 | `Score` | Groq relevance score, e.g. `"88"` |
| 9 | `Message / Pitch` | the 2-sentence Groq pitch |
| 10 | `Link` | the listing URL |
| 11 | `ID` | `""` (form rows only) |

Payload: `POST $LEAD_STORE_WEBHOOK_URL` with `{"row":[…11 strings…]}`, `Content-Type: application/json`.

### Source label map (`lead.source` → column 2)

| hunter `lead.source` | row `Source` |
|---|---|
| `Reddit (/r/forhire)` | `Hunter (Reddit)` |
| `RemoteOK` | `Hunter (RemoteOK)` |
| `Hacker News Jobs` | `Hunter (Hacker News)` |
| `We Work Remotely` | `Hunter (We Work Remotely)` |
| `LinkedIn (Contract)` | `Hunter (LinkedIn)` |
| **anything else** (today: `Remotive`) | `Hunter (<raw source>)` → `Hunter (Remotive)` |

The card listed five mappings; the script actually fetches **six** feeds — `fetchRemotiveLeads()` is
live in the same `Promise.all`. A sixth feed with no mapping would have meant Remotive leads reaching
the digest but silently never reaching the sheet, so unmapped sources fall back to
`Hunter (<raw source>)` instead of being dropped. Same label shape, no lead lost.

## 3. Company parsing — what it can and cannot do

`Company` is not a field on hunter leads. Three of the fetchers build the title as
`"<role> (<company>)"` (RemoteOK, LinkedIn, Remotive), so the trailing parenthetical is taken as the
company and the rest falls back to `""`:

| Title | `Company` |
|---|---|
| `Senior Node Engineer (Bluepeak)` | `Bluepeak` |
| `Contract React Developer (Helio Studio)` | `Helio Studio` |
| `[HIRING] React dashboard for a logistics startup (Northwind Freight)` | `Northwind Freight` |
| `Acme Systems is hiring a backend engineer` (free text, no parenthesis) | `""` |
| `Acme Systems is hiring a backend engineer (Remote)` | `""` — `(Remote)`/`(Hybrid)`/`(On-site)`/`(Full-time)`/`(Contract)`/`(YC …)` are treated as location/type/batch, not a company |
| `Orbit Labs: Full Stack Developer` (We Work Remotely's `Company: Role` shape) | `""` — **known gap**, see below |

**Known gap, stated rather than hidden:** We Work Remotely titles use the `Company: Role` shape, which
this parser does not handle, so WWR rows land with an empty `Company`. The company is still visible in
the `Name / Title` column, and the alternative (splitting on the first `:`) mis-parses legitimate
titles such as `React Developer: 6 month contract`, so it was deliberately not implemented. If BOSS
wants WWR companies in their own column, that is a one-line follow-up with a rule of its own.

## 4. The failure-isolation guarantee

Stated plainly: **the digest email cannot be affected by anything the sheet push does.**

1. `pushLeadsToSheet()` is called **after** `await sendDigestEmail(...)` has already dispatched the
   email — a slow, hung or dead webhook can delay only the tail of the job, never the email.
2. The call site is wrapped: `pushLeadsToSheet(...).catch(...)`, and the function wraps every request
   in its own `try/catch/finally`, so one lead's failure does not stop the next lead's push and no
   error can escape into `runPipeline()` (which would otherwise exit 1 and paint the cron red).
3. Every failure is logged as a `WARN` with the lead id, the HTTP status or the transport error
   (including the undici `cause`, e.g. `ECONNREFUSED`) — never silently swallowed, never claiming a
   row landed.
4. `LEAD_STORE_WEBHOOK_URL` unset → one `INFO` line, no request, hunter behaves exactly as it did
   before this card.

Proven by `npm run test:hunter` (11 cases / 77 assertions, prints raw rows and log lines):

| Case | What it proves |
|---|---|
| H1 | the 11 columns, their exact order, ISO timestamp, `""` for hunter-less columns, `POST` + `Content-Type` + `redirect: 'follow'`, and that the push happens **after** the digest call |
| H2 | the `Source` label for all six feeds, in order, with company parsing |
| H3 | `contactEmail: null` and the literal string `"undefined"` both become `""`; a blank pitch becomes `""` |
| H4 | only Groq-qualified leads are mirrored — the mirrored set equals the digest set (score 40 and `relevant:false` leads are skipped) |
| H5 | unset URL → zero requests, exactly one log line, digest still sent, exit clean |
| H6 | sheet answers **HTTP 500** → digest still sent, WARN logged, job still green |
| H7 | sheet answers **200 `{"ok":false,"error":"unauthorized…"}`** → treated as a failed write (never "mirrored"), token not leaked into the log |
| H8 | webhook **unreachable** — a real `POST` to a closed loopback port refusing the connection (`ECONNREFUSED`), no stub in the path → digest still sent **and** sent first |
| H9 | **malformed** URL (`not a url at all`) → real `fetch` rejects, digest still sent |
| H10 | first push throws (`socket hang up`), second lead still lands |
| H11 | invariant across every row produced in the whole suite: 11 cells, all strings, no `null`/`undefined` cells, platform named in `Source`, form-only columns empty |

## 5. The one workflow line — why it is genuinely required

`git diff` on `.github/workflows/lead-hunter.yml` is **one added line**, and it is not optional:

```yaml
          LEAD_STORE_WEBHOOK_URL: ${{ secrets.LEAD_STORE_WEBHOOK_URL }}
```

GitHub Actions does **not** put repository secrets into the job environment on its own — a secret
exists in `process.env` only if the workflow maps it. Creating the `LEAD_STORE_WEBHOOK_URL` secret
without this line would leave the hunter reading `undefined` and logging
`LEAD_STORE_WEBHOOK_URL not set …` *forever*, while looking perfectly healthy. That is the failure
mode this card exists to prevent, so the passthrough is in. Nothing else in the workflow changed —
the `schedule: cron '0 9 * * *'`, `workflow_dispatch`, `push`, the runner and the other three secrets
are untouched.

Creating the secret itself is BOSS's step (a secret value must never be committed, and no agent can
type it into GitHub):

## 6. What BOSS has to do (2 minutes, no coding)

The Sheet + Apps Script + URL already exist from T-009 — `docs/GOOGLE-SHEET-SETUP.md` Steps 1–6. If
that is already done, all that is left is the **GitHub** half:

1. GitHub ▸ repo ▸ **Settings ▸ Secrets and variables ▸ Actions ▸ New repository secret**
2. **Name**: `LEAD_STORE_WEBHOOK_URL`
3. **Secret**: the same `/exec` URL **with the token**, exactly as pasted into Vercel's environment
   variable — e.g. `https://script.google.com/macros/s/AKfycb…/exec?token=k7Qm2xR9vT4pL8dZ3nB6sY1wA5cE0fH2`
4. Save. Nothing else — the workflow already passes it through.

Until that secret exists the hunter runs exactly as before and the sheet holds form leads only; that
is a *skip*, not a fault, and it says so in the run log. If you also skipped Step 3 of the setup
guide, the URL is open to anyone who has it — see `docs/GOOGLE-SHEET-SETUP.md §3 — Treat the URL as a
secret` for rotation.

### Verifying it is live

After the secret is added, GitHub ▸ **Actions ▸ Automated AI Lead Hunter Pipeline ▸ Run workflow**
(that is the `workflow_dispatch` trigger, which is *not* affected by this change). In the run log,
each qualified lead should produce:

```
INFO  Lead mirrored to Google Sheet [remoteok_rok123]  {"source":"Hunter (RemoteOK)","status":200}
```

and rows should appear in the sheet with `Source` starting `Hunter (`. If instead you see
`WARN Sheet mirror failed [<id>] — digest unaffected {"error":"fetch failed","cause":"ECONNREFUSED"}`,
the URL points somewhere that is not answering; `{"reason":"unauthorized: missing or wrong token"}`
means the token is missing/mismatched, and `{"reason":"HTTP 302 redirect not followed"}` means the
runtime refused the redirect (see §7 below).

## 7. The 302 decision — matched, not re-invented

Google Apps Script web apps answer **`302`** to `script.googleusercontent.com` and only serve the real
body there. T-009 decided this in `api/lead.js persistToStore()` and documented it in
`docs/DEPLOY-NOTES.md §7.2`. **The hunter matches that decision exactly:**

1. `redirect: 'follow'` is set explicitly (not left to the runtime default) → the `302` is followed.
2. A `3xx` that still reaches us was **not** followed → logged as a failure, never as a write.
3. A `200` whose body is `{"ok":false,…}` (the only failure channel an Apps Script web app has, since
   it cannot set a status code) → logged as **rejected**, never as mirrored.
4. A `2xx` with a non-JSON body is a success, so a generic CRM/DB webhook is not misreported.

Both producers therefore classify failures identically — the two ends cannot diverge on what a
successful write looks like. The hunter's own test cases H6/H7 exercise 2 and 3; the followed-`302`
path is proven end-to-end for the same decision by `npm run test:lead` CASE 15 (mock Apps Script web
app on loopback), because both call sites use the same fetch options.

## 8. Verification status — honest version

**Proven here, by running it (`npm run test:hunter` → 77 assertions, 0 failed, exit 0):** everything
in the §4 table, plus the workflow's `process.env` wiring (the harness sets the env var exactly as the
workflow does and asserts the request that results).

**Not proven here, and not claimed:**

- **The real GitHub Actions cron was not run.** Nothing in this environment can trigger or observe the
  scheduled job. `scripts/lead-hunter.js` was executed locally, in a sandbox, with the network stubbed.
- **No real Google Sheet was contacted** — no Google credentials exist here, and Apps Script is not
  reachable from a test. H8 proves "an unreachable webhook cannot break the digest" against a **real
  refused TCP connection**; it does not prove Apps Script's real redirect behaves byte-for-byte like
  the documented one.
- **No real Resend delivery.** The digest call is asserted from recorded outbound payloads
  (`{from,to,subject,html}`), not from a received email.
- **No real feed data.** Reddit/RemoteOK/HN/WWR/Apify/Remotive/Groq answers are fixtures shaped like
  the real responses. The hunter's parsing of live feeds is unchanged by this card.
- **The secret is not created** — that is a console action in BOSS's account (§6), and no secret value
  appears anywhere in this repo or its history.
- The first genuinely live proof will be the first manual `workflow_dispatch` run after the secret is
  added, checked against a real row in the sheet.
