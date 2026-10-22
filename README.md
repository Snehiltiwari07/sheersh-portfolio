# Sheersh Tiwari — portfolio

Personal portfolio and service enquiry site built with React 18, Vite 5, and Vercel Node functions. The homepage includes a portrait introduction, a 2018–2026 engineering journey, projects, reviews and contact options. Three service pages and two case studies are prerendered for search discovery.

## Start locally

Use Node.js 22 (also used by the lead-hunter workflow) and npm.

~~~powershell
npm ci
npm run dev
~~~

Open the URL printed by Vite. For local Jiya chat, copy [.env.example](.env.example) to .env.local and set GROQ_API_KEY. Vite serves /api/chat locally; it does **not** serve /api/lead. Use a Vercel development environment or deployed preview for the real lead function. Static preview runs neither function.

## Build and check

~~~powershell
npm run build
npm run preview
npm test
npm run check:tokens
npm run check:leadform
npm run check:seo
npm run check:search -- --http
node scripts/check-editorial-contrast.mjs
~~~

The build generates the social image, bundles assets, renders six public HTML pages and a 404, and generates robots.txt, sitemap.xml and compressed HTML sidecars. Use npm run build rather than calling Vite directly. Tests use fixtures/mocks; running scripts/lead-hunter.js directly can send real email and append Sheet rows.

## Where to edit

| Change | Source |
| --- | --- |
| Personal details, reviews, achievements and career history | src/data/profile.js |
| Homepage copy, services, कामCREW and explorations | src/data/portfolio.js |
| All eight original project records | src/data/projects.js |
| Timeline and technology chips | src/data/engineeringJourney.js |
| Service and case-study pages | src/data/searchPages.js |
| Production origin and search metadata | src/data/site.js, src/data/seo.js, src/data/positioning.js |
| Theme colours | src/styles/tokens.css |
| Scroll coordination | src/lib/usePageMotion.js |
| Hero geometry and movement | src/styles/immersive-journey.css |
| Chat and enquiry endpoints | api/chat.js, api/lead.js |

[Documentation index](docs/README.md) covers architecture, development, design, APIs, deployment, SEO and integrations. [Cleanup notes](docs/CLEANUP.md) explain retired files. Earlier reports are historical evidence, not current acceptance results.
