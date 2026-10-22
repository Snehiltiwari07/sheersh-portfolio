# Development guide

Updated 2026-10-23. Use Node.js 22 and npm ci from the repository root. Keep real credentials in ignored environment files or the hosting/Actions environment.

## Commands

| Command | Purpose |
| --- | --- |
| npm run dev | Vite, route-aware metadata and local /api/chat |
| npm run build | Social-image prebuild, bundle, React prerender, discovery files |
| npm run preview | Serves dist with clean URLs and 404s; no functions |
| npm run build:images | Rebuilds personal photo candidates from assets-src |
| npm run build:og | Rebuilds the 1200 × 630 social card |
| npm test | Lead, Apps Script, hunter and chat fixture tests |
| npm run test:lead | Lead validation, delivery and redirects |
| npm run test:sheet | Apps Script with stubbed Google services |
| npm run test:hunter | Hunter mapping/webhook tests with fixtures |
| npm run test:chat | Chat validation and mocked provider paths |
| npm run check:tokens | Token and dangling-variable checks |
| npm run check:leadform | Client/server enums and analytics contract |
| npm run check:seo | Homepage metadata, social card and positioning |
| npm run check:search -- --http | Built pages, schema, links, sitemap, compression and HTTP |
| node scripts/check-editorial-contrast.mjs | Current editorial theme colour pairs |
| npm run measure-perf -- --no-build | Lab measurement; see performance notes |

Build before SEO/search checks. A Vite-only build omits prerendering. The performance harness invokes Vite directly unless --no-build is supplied; run npm run build first and then use --no-build.

## Editing recipes

- Add service/case content in src/data/searchPages.js. Its path feeds lookup, sitemap and prerendering. Add a relevant visible link and review metadata, facts, FAQs and schema together.
- Edit original project records in src/data/projects.js. Portfolio selects four IDs initially; filters/expansion expose all eight. Do not remove data to simplify the first screen.
- Edit years in src/data/engineeringJourney.js and local icons in public/tech-icons/. Preserve notices and exploration labels.
- Edit photo sources/candidates through src/data/image-manifest.js and ResponsivePhoto. Keep masters and rebuild assets when masters change.
- Change palette variables in tokens.css, then check both themes/contrast. CSS layers are order-dependent; see DESIGN-SYSTEM.md.
- Adjust hero movement in immersive-journey.css. Keep the portrait in its column throughout scroll and its name caption visible.
- Keep lead option IDs aligned across src/data/leadForm.js, src/lib/lead.js, api/lead.js and the lead contract.

## Troubleshooting

Jiya unavailable: set GROQ_API_KEY in .env.local and restart Vite. GROQ_MODEL is optional. CHAT_ALLOWED_ORIGINS comes from the server process; the local loader only loads GROQ_ variables. Missing configuration shows an error rather than scripted replies.

Form unavailable in Vite: only chat has a Vite API adapter. Use the function runtime and configure at least one successful email/store path. Fixture tests check the contract without sending real leads.

Wrong sitemap domain: change SITE_URL in src/data/site.js and rebuild. Do not edit generated dist files. GOOGLE_SITE_VERIFICATION must be a build-process/deployment variable; placing it in .env.local alone is not wired into the loader.

Wrong production route: confirm the complete build ran and clean-URL hosting has no blanket fallback. Search checks cover missing paths, aliases and noindex 404 responses.

After motion changes inspect start/middle/end and reverse scroll, desktop, 390 × 844 and 360 × 740 phones, resize and reduced motion. Check portrait caption, text overlap, focus and horizontal overflow. Emulation is not physical-device frame-rate evidence.
