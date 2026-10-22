# Architecture

Updated 2026-10-23.

## Rendering and routes

src/main.jsx mounts React during development and hydrates existing root HTML in production. src/entry-server.jsx renders the same ThemeProvider and App with an explicit path at build time. App selects Portfolio for /, SearchContentPage for known content URLs, and NotFoundPage otherwise. Content navigation uses normal anchors; homepage hash links are sections, not separate indexable pages.

Canonical public paths:

- /
- /services/ai-workflow-automation
- /services/custom-software
- /services/database-optimization
- /work/kaamcrew
- /work/sql-performance

npm run build creates the social card, runs Vite, then scripts/prerender.mjs. The prerenderer renders the actual React tree, applies route metadata, writes flat HTML plus 404.html, regenerates gzip/Brotli HTML, and writes the sitemap and robots file into dist. The six sitemap URLs come from the same route data used by rendering. The 404 is excluded and marked noindex.

scripts/search-routing.mjs handles clean URLs, discovery files and missing pages in dev/preview. vercel.json enables clean URLs without a blanket SPA rewrite. Vercel functions deploy from api/; uploading dist alone cannot run them.

## Content ownership

| Source | Responsibility |
| --- | --- |
| src/data/profile.js | Contact links, reviews, achievements, stats, broad career history and technical groups |
| src/data/portfolio.js | Homepage brand, services, कामCREW, process, explorations and Jiya knowledge |
| src/data/projects.js | Original eight-project catalogue, metrics and code examples |
| src/data/engineeringJourney.js | 2018–2026 editorial timeline and exploration labels |
| src/data/searchPages.js | Service/case content, FAQs, related links and route lookup |
| src/data/positioning.js | Shared metadata/profile wording and historical retired-copy audit |
| src/data/seo.js | Canonicals, social metadata and page-appropriate schema |
| src/data/site.js | Production origin |
| src/data/image-manifest.js | Photo candidates and master references |
| src/data/leadForm.js | Form option IDs and labels |

Some homepage copy is component text. Changing positioning.js alone does not rewrite every visible heading; keep claims aligned across the content sources.

## Runtime features

usePageMotion owns the main scroll listener, cached geometry and animation frame. Its portfolio:scroll event carries timeline/particle progress; CSS variables carry section state. See the [motion contract](restraint-spec.md).

ThemeContext reads the palette set by the early head script after hydration, then persists toggles. Initial server/client markup must agree. HireDrawer loads lazily after an enquiry CTA is used. WhatsApp and LinkedIn use profile destinations. ChatEngine calls /api/chat without exposing a provider key.

/api/lead validates a brief and attempts store/email delivery in parallel; at least one must succeed. /api/chat validates conversations and calls Groq. Both rate limits use per-instance memory, not a distributed service.

The separate GitHub Actions hunter evaluates listings, emails a digest and optionally mirrors selected leads to the shared Sheet. Page visits and npm test do not run the operational pipeline. See [deployment](DEPLOY-NOTES.md) and the API contracts for configuration.
