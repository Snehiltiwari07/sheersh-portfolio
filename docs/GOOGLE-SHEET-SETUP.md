# Google Sheets lead storage

Updated 2026-10-23. Website enquiries and hunter listings can share one Apps Script web app. Source of truth: integrations/google-sheets/Code.gs. Changes must also be copied/deployed to the Google editor project.

## Setup

1. Create/select the destination spreadsheet, open its bound Apps Script project and paste Code.gs.
2. Set Script properties as needed: SHEET_NAME overrides Leads; SPREADSHEET_ID is needed for standalone scripts; LEAD_WEBHOOK_TOKEN optionally protects ingestion with an unpredictable value.
3. Run checkSetup in the editor to check the destination and grant required spreadsheet permissions.
4. Deploy as a web app executing under the spreadsheet owner's account, with access that allows requests from the producer servers. Keep the spreadsheet itself private. Account policy may require an approved alternative store.
5. Copy the /exec URL. With authentication append ?token= and the URL-encoded token. Treat that URL as a secret.
6. Set LEAD_STORE_WEBHOOK_URL in the Vercel environment and GitHub Actions repository secret.
7. Check the deployment with explicit test data. Local npm run test:sheet uses stubs and does not touch Google.

Apps Script cannot read the producer's Authorization header. Use the query token, not LEAD_STORE_WEBHOOK_TOKEN as a Bearer header. Rotating the token requires updating the script property and both producers. Updating a deployment version does not rotate it or revoke the URL; disable obsolete deployments when necessary.

## Eleven-column row

Send {"row":[11 values]}; preserve order and use empty strings for missing cells.

| # | Header | Form | Hunter |
| --- | --- | --- | --- |
| 1 | Received | ISO timestamp | ISO timestamp |
| 2 | Source | Form (website) | Hunter (board) |
| 3 | Name / Title | Visitor name | Listing title |
| 4 | Company | Optional company | Parsed company |
| 5 | Email | Visitor email | Extracted contact email |
| 6 | Project / Type | Display label | Empty |
| 7 | Budget | Display label | Empty |
| 8 | Score | Empty | Relevance score |
| 9 | Message / Pitch | Visitor message | Generated pitch |
| 10 | Link | sourcePage | Listing URL |
| 11 | ID | Lead UUID | Empty |

Code.gs creates/formats the header, serializes writes with a lock and neutralizes formula-like cells. It validates row width/cell lengths. Empty rows are no-op probes; the script does not infer mappings or run a model.

## Delivery and troubleshooting

Apps Script redirects to script.googleusercontent.com. Producers follow that redirect and inspect JSON: HTTP 200 with ok:false is failure. A raw 302 does not prove persistence. Check permissions, deployed version, token, destination properties and producer logs for missing rows.

The form attempts storage/email in parallel: one successful path yields success, both failing yields 502. Logs do not back up the full message. Hunter mirroring failures are logged independently of digest flow; email does not prove a Sheet write.

Keep token-bearing URLs private. Use npm run test:lead, npm run test:sheet and npm run test:hunter for local contract checks. External credentials/delivery still require a configured live check.
