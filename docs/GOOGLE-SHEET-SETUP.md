# Store leads in a Google Sheet — setup (≈10 minutes, no coding)

**What this gives you:** every enquiry from the website form **and** every lead the autonomous
lead hunter finds land as rows in the same Google Sheet, within about a second. You open the sheet
and skim who enquired.

```
form on the website                lead hunter (GitHub Actions cron, 09:00 daily)
        │                                        │
        ▼                                        ▼
POST /api/lead (Vercel)  ──────┐        ┌────── scripts/lead-hunter.js
        │                      │        │        (daily cron, GitHub Actions)
        ├─► Resend → email     │        │
        │                      ▼        ▼
        │            LEAD_STORE_WEBHOOK_URL  (same URL in both places)
        │                      │
        │                      ▼
        │        Apps Script Web App → appends one row
        ▼                      │
   email to you  ◄─────────────┘   Google Sheet "Sheersh Portfolio — Leads"
```

**Nothing here can break the site or the hunter.** The sheet is an *extra* durable copy. If this
setup is missing or broken, the form still records the lead and still emails it to you (you get a
`502` only when **both** the sheet and the email fail), and the hunter still sends its digest email.

---

## The row — 11 columns, both sources

One header row, same columns for both producers. Form leads leave the hunter-only columns empty;
hunter leads leave the form-only columns empty. **Empty means an empty cell — never `null`.**

| # | Column | Form lead | Hunter lead |
|---|---|---|---|
| 1 | `Received` | ISO timestamp | ISO timestamp |
| 2 | `Source` | `Form (website)` | `Hunter (Reddit)` / `Hunter (LinkedIn)` / `Hunter (RemoteOK)` / `Hunter (Hacker News)` / `Hunter (We Work Remotely)` |
| 3 | `Name / Title` | visitor name | listing title |
| 4 | `Company` | company (or empty) | parsed from the listing title, else empty |
| 5 | `Email` | lead email | `contactEmail` from the Groq eval, else empty |
| 6 | `Project / Type` | label, e.g. `Database & SQL Performance Rescue` | empty |
| 7 | `Budget` | label, e.g. `$5,000 – $15,000` | empty |
| 8 | `Score` | empty | Groq relevance score 0–100 |
| 9 | `Message / Pitch` | visitor message | the 2-sentence Groq pitch |
| 10 | `Link` | `sourcePage` | the listing URL |
| 11 | `ID` | `lead_<uuid>` | empty |

**Files involved**

| File | What it is |
|---|---|
| `integrations/google-sheets/Code.gs` | the Apps Script you paste into Google (kept in the repo so it is version-controlled) |
| `api/lead.js` | the form endpoint — maps a lead to the row above and POSTs it; **no change needed for this setup** |
| `scripts/lead-hunter.js` | the hunter — reads the same URL and writes `Source = Hunter (…)` rows; implementation + evidence: `docs/lead-hunter-sheet.md` |

---

## Step 1 — Create the sheet (30 s)

1. Go to <https://sheets.new> (creates a blank Google Sheet).
2. Name it **“Sheersh Portfolio — Leads”** (top-left title box).
3. Rename the tab at the bottom-left from `Sheet1` to **`Leads`** (double-click the tab).
   *The script creates a `Leads` tab if it is missing; doing it now keeps things tidy.*
4. Leave the sheet empty. **Do not add a header row** — the script writes it for you.

## Step 2 — Open the script editor and paste the code (1 min)

1. In the sheet: **Extensions ▸ Apps Script**. A code editor opens.
2. Delete everything in the editor (`function myFunction() { }`).
3. Open `integrations/google-sheets/Code.gs` from the repo, copy **the whole file**, paste it in.
4. Press **Ctrl+S**. Name the project **“Lead → Sheet”** when asked.

> The script is deliberately dumb: it appends the row a producer sends and creates the header. It
> does not know what a lead is. All mapping happens in `api/lead.js` / `lead-hunter.js`, where it is
> version-controlled and testable — so there is nothing to debug inside Google's editor.

## Step 3 — Add a secret token (2 min, recommended)

Without a token, anyone who ever sees the deployment URL can add junk rows. With a token, they cannot.

1. Get a random string — Git Bash: `openssl rand -hex 24`, or just mash the keyboard for ~40
   characters (e.g. `k7Qm2xR9vT4pL8dZ3nB6sY1wA5cE0fH2`).
2. In the Apps Script editor: **⚙ Project Settings** ▸ **Script properties** ▸ **Add script property**:
   - Property: `LEAD_WEBHOOK_TOKEN`
   - Value: that random string
3. **Save** (Ctrl+S). You need this string twice more — Steps 6 and 7.

> Skip this step if you prefer zero friction. The deployment URL is random and unguessable, so an
> open endpoint is a low risk — just not zero.

## Step 4 — Prove it works *before* touching anything else (1 min)

1. In the editor pick **`checkSetup`** in the function dropdown and press **Run**.
2. First run asks for authorisation: **Review permissions ▸ your account ▸ Advanced ▸ Go to “Lead →
   Sheet” (unsafe) ▸ Allow**. *(“Unsafe” = Google has not reviewed this script. It is your own code,
   pasted from this repo, and it only touches the sheet you just created.)*
3. **View ▸ Logs** should print:
   ```
   OK — sheet reachable: "Leads" (Sheersh Portfolio — Leads)
   header row: Received | Source | Name / Title | Company | Email | Project / Type | Budget | Score | Message / Pitch | Link | ID
   data rows: 0
   token required: true
   ```
   The sheet now shows the formatted, frozen header row. If you see `FAILED — …`, fix that first.

## Step 5 — Deploy as a Web App (2 min)

1. **Deploy ▸ New deployment**.
2. ⚙ gear next to “Select type” ▸ **Web app**.
3. Fill in:
   - **Description**: `lead → sheet v1`
   - **Execute as**: **Me** ← required, otherwise the script cannot write to your sheet
   - **Who has access**: **Anyone** ← required, neither Vercel nor GitHub logs into your Google account
4. **Deploy** ▸ (authorise again if asked).
5. Copy the **Web app URL** — it looks like:
   ```
   https://script.google.com/macros/s/AKfycb...../exec
   ```
   ⚠️ Use the **`/exec`** URL. The `/dev` URL in the editor only works while you are logged in.

## Step 6 — Test the URL from your own machine (1 min)

Paste the URL into a browser tab: you should see a JSON health check naming all 11 columns and telling
you whether a token is required.

Then append **`?demo=1`** (with a token: `?demo=1&token=YOUR_TOKEN`) and reload — a row labelled
**“DEMO ROW — delete me”** appears in the sheet. Delete it afterwards. That row is the integration
working; everything after this is plumbing.

To test a real-shaped payload exactly as the producers send it (Git Bash; quotes matter):

```bash
curl -s -X POST 'https://script.google.com/macros/s/AKfycb...../exec?token=YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"row":["2026-09-13T16:10:25.000Z","Form (website)","Sheet Check","Self","YOUR_ADDRESS@example.com","Architecture Audit / Consulting","Not sure yet — advise me","","Rows 1-3 are correct.","https://sheershtiwari.vercel.app/#hire","lead_manual_test"]}'
```

**Success** → `{"ok":true,"appended":true,"row":3,"source":"Form (website)"}` and a new row.
**Failure** → `{"ok":false,"error":"…"}`. A missing/wrong token says
`unauthorized: missing or wrong token`; a wrong-width row says
`"row" must have exactly 11 values — got 10`. Neither writes anything.

---

## Three places the URL goes

The **same URL** (with the token) is needed in three places. Miss one and that producer silently
keeps working *without* a sheet row — a lead is never lost, but it never reaches the sheet.

| # | Where | What it covers |
|---|---|---|
| 1 | **Vercel** ▸ Project ▸ Settings ▸ Environment Variables → `LEAD_STORE_WEBHOOK_URL` | the website form |
| 2 | **GitHub** ▸ repo ▸ Settings ▸ Secrets and variables ▸ Actions → `LEAD_STORE_WEBHOOK_URL` | the lead hunter (cron) |
| 3 | your own `curl` in Step 6 | manual testing |

### 1 — Vercel (the form)

1. Vercel ▸ your project ▸ **Settings ▸ Environment Variables ▸ Add New**:
   - **Key**: `LEAD_STORE_WEBHOOK_URL`
   - **Value**: the `/exec` URL with the token appended, e.g.
     `https://script.google.com/macros/s/AKfycb...../exec?token=k7Qm2xR9vT4pL8dZ3nB6sY1wA5cE0fH2`
     *(The token must be in the URL — Apps Script web apps cannot read the `Authorization` header
     `api/lead.js` also sends, so only the query parameter works.)*
   - **Environments**: tick **Production** *and* **Preview**.
2. **Do not** set `LEAD_STORE_WEBHOOK_TOKEN` on Vercel for this — it only produces a header Apps
   Script ignores. Leave it empty.
3. **Deployments ▸ Redeploy** the latest deployment. **Environment variables only apply to new
   deployments** — without this the site keeps running with the old (empty) value.

### 2 — GitHub Actions (the hunter)

1. GitHub ▸ the repo ▸ **Settings ▸ Secrets and variables ▸ Actions ▸ New repository secret**:
   - **Name**: `LEAD_STORE_WEBHOOK_URL`
   - **Secret**: the same `/exec` URL + `?token=…`
2. That is all you do here. `scripts/lead-hunter.js` reads the secret through the workflow's `env:`
   block (one line, added by card T-010 — `docs/lead-hunter-sheet.md §5`) and posts every qualified
   lead as a row with `Source = Hunter (…)`, after it emails the digest. If the sheet push fails for
   any reason the digest still sends; the failure is logged, never hidden.
3. If you skip this step the hunter keeps working exactly as before — it logs
   `LEAD_STORE_WEBHOOK_URL not set — Google Sheet mirror skipped` once per run and the sheet holds
   form leads only. That is a skip, not a fault.

### 3 — Treat the URL as a secret

It contains the token, and **anyone who has it can append rows**. Never paste it into a chat, an
issue, a commit, or a screenshot. If it leaks: Apps Script ▸ **Deploy ▸ Manage deployments ▸ ✏️ ▸
Version: `New version` ▸ Deploy** — that mints a new URL, so the leaked one dies, then update the
Vercel variable (and the GitHub secret) and redeploy.

---

## Verify the whole chain (1 min)

```bash
curl -s -X POST https://sheershtiwari.vercel.app/api/lead \
  -H 'Content-Type: application/json' \
  -d '{"name":"Sheet Check","email":"YOUR_ADDRESS@example.com","company":"Self","projectType":"consulting","budgetBand":"not-sure","message":"Post-setup smoke test of the lead-to-Sheet wiring. Please ignore.","honeypot":""}'
```

**Success — all three:**
1. `{"ok":true,"id":"lead_…","requestId":"lead_…"}`
2. a new row in **Leads** within a second or two: ISO timestamp · `Form (website)` · Sheet Check ·
   Self · your address · `Architecture Audit / Consulting` · `Not sure yet — advise me` ·
   *(empty Score)* · the message · source page · `lead_…`
3. the notification email in `er.sheershtiwari@gmail.com`

**Failure:**

| What you see | What it means | Fix |
|---|---|---|
| HTTP `502` from the form | *both* paths failed — nothing recorded | Vercel ▸ **Logs**, read `lead.store.failed` + `lead.delivery.failed` |
| Log `lead.store.failed … "unauthorized: missing or wrong token"` | URL in Vercel has no `?token=` or the value differs from the script property | re-copy the URL, check the token, redeploy |
| Log `lead.store.failed … "HTTP 404"` | deployment deleted, or the value points at `/dev` | new deployment, use the `/exec` URL, redeploy |
| Log `lead.store.failed … "HTTP 302 redirect not followed"` | the runtime did not follow Apps Script's redirect | report it — see `docs/DEPLOY-NOTES.md` §7 |
| Log `lead.store.failed … "store reported failure: …"` | Apps Script answered `200` but refused the write (usually the token) | the message text is the Apps Script error |
| Log `lead.store.failed … "HTTP 500"` | something broke inside the script (row width, lock, sheet access) | Apps Script ▸ **Executions** for the stack trace |
| Lead arrives by email, no sheet row | the sheet half is misconfigured | the email proves the lead was not lost; fix at leisure |
| `Errors` / no execution logged | Apps Script never ran | the URL is wrong, or the deployment is not “Anyone” |

---

## Verification status (honest version)

**Verified in this repo — reproduce with `npm test` (three harnesses: 57 + 36 + 77 assertions, all exit 0):**

Real code output, but against *mocks*, and labelled as such:

| Harness | What it drives | What it proves |
|---|---|---|
| `npm run test:lead` (CASE 15–19) | `api/lead.js` + a real `node:http` mock Apps Script web app on `127.0.0.1`, reproducing `POST /exec → 302 → GET /content → 200` | the 11-column mapping (order, labels, `""` for absent values, ISO timestamp); that the `302` **is** followed; that an unfollowed `302` is **not** counted as a write (→ `502`); that a `200` whose body says `{"ok":false}` **is** counted as a failed write; that a failed sheet write still emails the lead |
| `npm run test:sheet` (S1–S11) | `integrations/google-sheets/Code.gs`, loaded in a Node VM with the Apps Script services stubbed | header created once with the 11 canonical columns and frozen; row appended in order; a 10-value row refused without writing anything; `null`/`undefined`/`"undefined"` cells cleaned to `""`; formula injection (`= + - @`) neutralised; token enforcement; `?demo=1`; `checkSetup()` output |
| `npm run test:hunter` (H1–H11) | `scripts/lead-hunter.js`, run in a Node VM with the feeds/Groq/Resend stubbed and the Google endpoint under test | the hunter's 11-column row, the `Hunter (…)` label per feed, absent values as `""`, only Groq-qualified leads mirrored, and that the **digest still sends** when the push fails (HTTP 500 / `{"ok":false}` / thrown error / a real refused TCP connection / a malformed URL) — details: `docs/lead-hunter-sheet.md §4` |

**Not verified here, and I am not claiming it:** **no real Google Sheet was touched** — no Google
credentials exist in this environment, so that can only be done by you in Steps 1–8. Nothing in this
repo proves a row lands in a real sheet, that Apps Script's real redirect behaves exactly as the mock
does, or that the GitHub Actions cron run has been exercised (no scheduled job was triggered from
here). The first real proof is Step 6's `?demo=1` row, then the `curl` above.
