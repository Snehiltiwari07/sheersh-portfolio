# Deployment and environment

Updated 2026-10-23. Local changes are not automatically deployed. Account ownership, provider credentials and live delivery require separate checks.

## Build and hosting

Use Node.js 22, npm ci, npm run build, and publish dist. On Vercel retain api/ and vercel.json so functions deploy with static pages. cleanUrls is enabled and trailingSlash is false. Do not restore a blanket index.html rewrite: missing URLs must return the noindex 404.

The full build emits homepage HTML, three service pages, two case studies, 404.html, robots.txt and sitemap.xml. Compressed HTML sidecars are refreshed after prerendering. dist and node_modules are generated/ignored.

## Environment variables

| Variable | Consumer | Meaning |
| --- | --- | --- |
| GROQ_API_KEY | Jiya and hunter | Server/Actions Groq credential |
| GROQ_MODEL | Jiya | Optional; default llama-3.3-70b-versatile |
| CHAT_ALLOWED_ORIGINS | Jiya | Additional exact origins, comma-separated |
| RESEND_API_KEY | Lead API and hunter | Email credential |
| LEAD_NOTIFY_EMAIL | Lead API | Notification recipient |
| LEAD_FROM_EMAIL | Lead API | Sender permitted by Resend account/domain |
| LEAD_STORE_WEBHOOK_URL | Lead API and hunter | Optional shared Sheet/CRM ingestion URL |
| LEAD_STORE_WEBHOOK_TOKEN | Lead API | Optional Bearer header for generic stores, not Apps Script |
| LEAD_ALLOWED_ORIGINS | Lead API | Additional exact origins |
| LEAD_RATE_LIMIT_MAX | Lead API | Default 5 submissions per IP/window |
| LEAD_RATE_LIMIT_WINDOW_MS | Lead API | Default 600000 ms |
| GOOGLE_SITE_VERIFICATION | HTML build | Optional Google HTML-tag content value |
| APIFY_TOKEN | Hunter | Optional LinkedIn scraper token |
| RECIPIENT_EMAIL | Hunter | Digest recipient; workflow supplies its configured address |
| CHROME_PATH | Performance harness | Optional Chromium executable path |

Vite's local chat loader reads only GROQ_API_KEY/GROQ_MODEL from .env.local. Other server variables need the relevant server process environment. GOOGLE_SITE_VERIFICATION is read from the build process/deployment environment; .env.local alone is not wired into its loader. Never prefix provider secrets with VITE_: those can enter browser bundles.

## API delivery

The enquiry endpoint needs at least one working delivery path: accepted email through Resend or a successful store webhook. Both missing/failing yields 502. Logs contain diagnostic metadata, not a complete backup of the enquiry. Use a sender allowed by the Resend account; the sample onboarding sender does not guarantee unrestricted delivery.

Jiya requires GROQ_API_KEY. Missing configuration yields 503; provider failure yields 502. Vite serves only the local chat adapter; static preview runs neither function. Rate limits and lead deduplication use per-instance memory, not a shared database.

## Google Sheets

Follow [the setup guide](GOOGLE-SHEET-SETUP.md). Producers use one normalized eleven-column row, follow the content-host redirect and reject ok:false JSON even with HTTP 200. Apps Script authentication uses the token in the configured URL, not a Bearer header.

Rotate the LEAD_WEBHOOK_TOKEN script property and update both producer URLs to rotate the secret. A new deployment version does not itself rotate that token or invalidate the existing URL. Disable obsolete deployments when they must stop accepting requests.

## Release checks

1. Run build, fixture tests and token/form/SEO/search checks from DEVELOPMENT.md.
2. Open all six canonical routes directly; check aliases and a genuinely missing URL's 404/noindex.
3. Inspect both themes, desktop/phone hero scroll, year selector and reduced motion.
4. Confirm LinkedIn, WhatsApp, résumé and service/case links.
5. Check function configuration. Use explicit test data for any real delivery test and inspect both paths; fixtures do not prove external credentials work.
6. Confirm the public domain, robots.txt and sitemap.xml, then complete Search Console ownership/submission as described in SEO-AEO-PLAN.md.

A local build does not establish deployment, live message delivery, Google ownership or sitemap submission.
