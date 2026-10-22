# Sheersh Tiwari — portfolio

React + Vite personal portfolio, with AI workflows, custom software, and database performance services. “Sheersh / AI & Software” pairs a custom flow mark with personal photography, full-bleed chapters, and coordinated scroll motion. Light and dark themes use the supplied palettes below.

## Content and layout

- Headshot in the hero; motorcycle photograph in About.
- कामCREW as the new 2026 independent-build highlight, with Hermes attribution.
- All eight original projects, with filters and expandable details, metrics, architecture, and code examples.
- All ten original reviews: manual featured-review controls and an expandable full collection.
- Original track-record metrics, achievements, career history, and technology categories.
- Second-section interactive journey from 2018–2026: scroll-controlled years, selectable milestones, technologies, and an evolving drawn path. Earlier years are chapters of the existing career phases, not newly asserted project launch dates.
- Technology badges use local Devicon/Simple Icons assets and original symbols for concepts. Arrow keys, Home, and End move between years; completed years and the current chapter remain visually distinct. Asset credits are in `public/tech-icons/NOTICE.txt`.
- The 2026 journey distinguishes working Hermes/agent-harness work from DeepSeek, vector database/RAG, MCP, and evaluation explorations. Next.js and TypeScript are in the earlier full-stack chapter.
- WhatsApp is in the header; a compact floating link appears after the header leaves view. The existing WhatsApp destination and enquiry form remain available.
- Three service offerings, a project enquiry form, and direct contact links.
- Dedicated service pages at `/services/ai-workflow-automation`, `/services/custom-software`, and `/services/database-optimization`; case studies at `/work/kaamcrew` and `/work/sql-performance`.
- Proposed AI work labeled as explorations.

Existing content remains in `src/data/profile.js` and `src/components/Projects.jsx`; `Portfolio.jsx` reuses it. The original showcase components remain on disk. The simulated local LLM demo is not mounted as a working model.

## Development

- `npm run dev` — local site and `/api/chat` middleware, port 5173.
- `npm run build` — social-card generation, production bundle, and React prerendering of every public page plus the 404 document.
- `npm test` — lead, Sheets, hunter, and chat endpoint tests.
- `npm run check:seo`, `npm run check:leadform`, `npm run check:tokens` — consistency checks.
- `npm run check:search` — checks initial HTML, every public page's metadata and schema, crawlable links, sitemap, 404 settings, and compressed HTML consistency. Add `-- --http` to verify production HTTP routing too.

Verification resumed on request: the production build, SEO/form/token checks, and the full test suite pass. Browser checks cover project filtering/details, all ten reviews, review navigation, form validation and Escape handling, image loading, mobile navigation, and the missing-key Jiya error state. Live Groq generation and real lead delivery still need configured credentials and a deployed environment.

## Jiya — Groq only

Every answer to a visitor question comes from Groq. There is no scripted-answer fallback. If configuration is missing or the provider fails, Jiya shows an unavailable/retry notice and contact links.

Set `GROQ_API_KEY` in the server environment. Local development can read it from `.env.local`; restart Vite after changing it. On Vercel, set it in the deployment environment and redeploy. Optional: `GROQ_MODEL` (default `llama-3.3-70b-versatile`). No local key was present when the integration was updated. Never commit credentials or use a `VITE_` prefix for a model key.

`api/chat.js` provides validation, origin checks, request limits, a provider timeout, and per-instance rate limiting. `CHAT_ALLOWED_ORIGINS` can extend the server allowlist with comma-separated origins. A shared limiter is the upgrade path for higher traffic.

`npm run preview` serves static assets only. Use `npm run dev` or Vercel for API routes. Static hosting by itself cannot power Jiya.

## Source

- `src/components/Portfolio.jsx` — page, gallery, reviews, journey.
- `src/data/searchPages.js`, `src/components/SearchContentPage.jsx` — service scope, case studies, visible buyer answers, and related-page links.
- `src/entry-server.jsx`, `scripts/prerender.mjs` — build-time React rendering; the browser hydrates the same components to preserve interactions.
- `scripts/search-routing.mjs`, `scripts/page-html.mjs` — local clean-URL/404 behavior and route-specific crawler metadata.
- `src/styles/editorial.css` — base layout, form, and chat styles.
- `src/styles/enhanced.css` — current palette application, photographic layout, cards, motion, responsive rules.
- `src/styles/tokens.css` — palette and shared design values.
- `src/styles/immersive-journey.css` — edge-to-edge chapters, pinned portrait, responsive choreography, and shared progress rail.
- `src/components/BrandMark.jsx`, `public/brand-mark.svg` — header/footer identity and matching favicon.
- `src/components/EngineeringJourney.jsx`, `src/data/engineeringJourney.js`, `src/styles/engineering-journey.css` — year-by-year journey, shared scroll-clock subscription, selectable years, and static fallback for reduced motion or short screens.
- `src/data/portfolio.js` — new brand/services/कामCREW content and assistant context.
- `src/components/ChatEngine.jsx`, `api/chat.js` — Groq-powered Jiya UI and endpoint.
- `src/components/HireDrawer.jsx` — scoped-project enquiry form using the existing lead contract.

## Enquiries and deployment

`api/lead.js` is unchanged. Configure `RESEND_API_KEY` and/or `LEAD_STORE_WEBHOOK_URL` according to `docs/DEPLOY-NOTES.md`. Local Vite provides chat middleware, not real lead delivery. No Git push or deployment was performed.

Production hosting uses Vercel `cleanUrls: true` and the generated static HTML files. The former blanket SPA rewrite was removed so missing pages can return HTTP 404 using `dist/404.html`. Do not deploy only the raw Vite app shell: use the complete `npm run build` command, which also generates `sitemap.xml` and `robots.txt` from the canonical origin in `src/data/site.js`.

For Google Search Console URL-prefix verification, set the deployment environment variable `GOOGLE_SITE_VERIFICATION` to the content value from Google's HTML-tag verification method, rebuild/deploy, then verify ownership in the Google account. No verification token or Search Console access was supplied in this session. After publishing, submit `https://sheershtiwari.vercel.app/sitemap.xml` and inspect the public URLs. If using a different production domain, update `SITE_URL` before building and configure redirects from the old domain.

Historical docs describe the prior design; their old performance measurements do not apply to this revision.


## Palette and motion revision

Light theme follows the supplied #3D52A0 / #7091E6 / #8697C4 / #ADBBDA / #EDE8F5 palette. Dark theme follows #141414 / #273DB4 / #C50900 / #F95CA4 / #ED7845, with neutral text shades for contrast. `node scripts/check-editorial-contrast.mjs` checks 26 actual editorial text/background token pairs against WCAG AA.

`usePageMotion.js` manages scroll choreography across the page with one scheduled frame and cached layout measurements. On desktop, a 165svh introduction pins a viewport-sized scene while the portrait crosses the screen, rotates, and enlarges into a closing message. The particle scene subscribes to that same scroll controller; work, services, reviews, process, About, archives, explorations, and contact follow the shared clock. A continuous rail shows the overall journey. All section backgrounds reach both viewport edges; internal padding keeps text readable. Phones use flowing sections and smaller motion instead of pinned chapters. Reduced-motion preferences keep content static.

The year journey pins on sufficiently tall phone screens and flows as individual animated chapters on shorter screens. Mobile particles now respond to scroll using 420 points and a 30 fps cap; rendering stops outside the scene. Phone checks used 390×844 and 360×740 browser viewports, not physical-device performance measurements. Search implementation and remaining publishing/account steps are recorded in `docs/SEO-AEO-PLAN.md`.
