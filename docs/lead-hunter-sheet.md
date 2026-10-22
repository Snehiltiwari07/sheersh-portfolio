# Lead hunter and Sheet integration

Updated 2026-10-23. Source: scripts/lead-hunter.js and .github/workflows/lead-hunter.yml.

## Execution

The workflow triggers on main pushes, manual dispatch and cron 0 9 * * * (09:00 UTC, 14:30 India time). Scheduling is best effort. It uses Node.js 22 and repository secrets GROQ_API_KEY, RESEND_API_KEY, APIFY_TOKEN and LEAD_STORE_WEBHOOK_URL. The workflow supplies its configured digest address as RECIPIENT_EMAIL.

Sources: Reddit r/forhire, RemoteOK, Hacker News jobs RSS, We Work Remotely programming RSS, optional Apify LinkedIn scraping and Remotive. Availability/permissions/provider failures affect results. Groq evaluates technical fit; relevant leads scoring at least 75 qualify. The consolidated Resend digest includes mailto proposal links; the recipient sends any outreach manually.

Running the worker can call external APIs, send real email and append rows. npm run test:hunter is fixture-based and does not run operational collection.

## Sheet mirror

LEAD_STORE_WEBHOOK_URL is optional. Selected leads map to the [shared eleven-column row](GOOGLE-SHEET-SETUP.md). Source labels include the board and Remotive; unknown sources use a Hunter fallback. Company/contact are included when available; missing fields remain empty. The ID cell is currently empty. There is no promised durable cross-run deduplication database.

The producer follows redirects and treats ok:false as failure. Mirror errors are logged without intentionally blocking the digest flow; inspect both rather than assuming email and Sheet succeed together. Apps Script authentication is in the configured URL, not the form endpoint's Bearer-token variable.

Keep this mapping aligned with api/lead.js and Code.gs. Run hunter, sheet and lead fixture tests after changes; fixtures do not prove live accounts or listing suitability.
