# SEO and answer-engine visibility

Updated 2026-10-23. Implemented locally; public deployment, Search Console ownership, rankings and indexing are not established by these changes.

## Implemented

- Six canonical HTML pages: homepage; /services/ai-workflow-automation; /services/custom-software; /services/database-optimization; /work/kaamcrew; /work/sql-performance.
- Build-time React rendering of actual page content and visible buyer answers, followed by client hydration.
- Unique titles, descriptions, canonicals and social tags; Person identity and appropriate Service/Article, WebPage/WebSite and BreadcrumbList schema.
- Homepage/related links to discover pages, descriptive images and existing LinkedIn/GitHub identity links.
- Generated sitemap.xml and robots.txt using SITE_URL and the route data, rather than manually maintained public copies.
- Clean URLs, alias redirects and a real noindex 404 without a blanket homepage fallback.
- Optional GOOGLE_SITE_VERIFICATION build variable and checks for HTML, schema, internal links, compression and HTTP responses.

## Publishing and Google steps

1. Confirm SITE_URL in src/data/site.js; current origin is https://sheershtiwari.vercel.app. Update it before a domain change and plan redirects from the old origin.
2. Deploy the full npm run build output and functions. Confirm all six pages return useful HTML/200, robots/sitemap are public, and missing pages return 404.
3. Add/verify the matching property in [Google Search Console](https://search.google.com/search-console). For HTML-tag verification, set only the supplied content value as GOOGLE_SITE_VERIFICATION in the build environment and rebuild/deploy. Existing verified ownership can be reused. A .env.local entry alone is not loaded for this build variable.
4. Submit sitemap.xml once for that property. The build automatically regenerates it when route data changes; there is no need to recreate it or submit it on every build. Check processing after publishing.
5. Inspect important URLs and request indexing when appropriate. Monitor indexing, search queries, clicks and actual enquiries.

No Google account token/access was supplied, and no account submission was performed. A sitemap helps discovery; it does not guarantee indexing, ranking or AI citations.

## Content maintenance

Use the same full name and portfolio URL across professional profiles. Explain original work with concrete contribution, architecture, limitations and attributable results. Link project explanations to their case URLs. Add useful answers to genuine buyer questions, not keyword-stuffed duplicates.

Keep explorations distinct from shipped work. The timeline's individual early years are editorial subdivisions of broader experience. Avoid fabricated ratings, client logos or guaranteed percentage improvements. Structured data must match visible facts; buyer FAQs are not a promise of FAQ rich results or answer-engine placement. No special AEO file or schema can guarantee visibility.

## Sources and checks

Official references: [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview), [helpful content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content), [AI features and websites](https://developers.google.com/search/docs/appearance/ai-features).

Run npm run build, npm run check:seo and npm run check:search -- --http. Check source-of-truth fields in searchPages.js, seo.js and site.js together. Google account verification and deployed response checks remain separate from these local gates.
