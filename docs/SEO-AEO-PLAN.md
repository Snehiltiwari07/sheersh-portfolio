# Search visibility plan for Sheersh Tiwari

Implemented locally on 2026-10-23. Live indexing, Search Console ownership, rankings, and deployed response headers have not been verified; no deployment was performed.

## Implemented

- The three service URLs and two case-study URLs below, with crawlable links from the homepage.
- Initial HTML containing the actual homepage, services, case studies, and buyer answers, produced by React prerendering. The client hydrates the same components for theme, enquiry, and motion controls.
- Unique page titles, descriptions, canonicals, and social metadata; Person identity, Service/Article, WebPage/WebSite, and BreadcrumbList structured data matching the page content.
- Generated production robots.txt and sitemap.xml containing the six canonical public URLs.
- Clean URL hosting, a noindex 404 document, and removal of the blanket rewrite that could return the homepage for missing URLs.
- An optional `GOOGLE_SITE_VERIFICATION` environment variable for the Google HTML-tag ownership method.
- Checks for raw HTML content, internal links, metadata, schema, compression, HTTP status, and redirects.

## Publishing and Google account steps still required

1. Confirm the canonical production domain in `src/data/site.js`; it currently uses `https://sheershtiwari.vercel.app`.
2. Deploy the full `npm run build` output. These local changes do not affect public search results until published.
3. In Google Search Console, add the URL-prefix property for that origin. Copy the HTML-tag verification content value into the deployment's `GOOGLE_SITE_VERIFICATION` environment variable, rebuild/deploy, and complete verification in the Google account. Use an existing ownership method instead if already verified.
4. Submit `/sitemap.xml`; inspect the homepage and each service/case-study URL and request indexing where appropriate.
5. Monitor indexing, queries, clicks, and actual enquiries. Continue improving the original case studies as more shareable evidence becomes available.

No Google account access or verification token was available, so verification and sitemap submission were not attempted.

## What is already present

- Build-time title, description, canonical, social cards, and Person JSON-LD.
- LinkedIn and GitHub identity links, readable service descriptions, original project material, and descriptive image text.
- The configured production origin is https://sheershtiwari.vercel.app.

## Scope used for this implementation and continued content work

1. **Real service URLs.** Added `/services/ai-workflow-automation`, `/services/custom-software`, and `/services/database-optimization`. Each has a distinct title, scope, examples, delivery approach, and enquiry link. Homepage fragments such as `#projects` remain sections of one document.
2. **Content in initial HTML.** The former empty React root is now populated at build time for the homepage, services, and case studies. Google can render JavaScript; prerendering also serves crawlers that do not.
3. **Publish evidence-rich case studies.** Start with कामCREW and the SQL optimization work. Include the problem, personal contribution, architecture, limitations, and demonstrable outcomes. Use screenshots or code that may be shared. Keep experiments explicitly separate from completed work; substantiate quantitative claims.
4. **Discovery files for the production origin.** The build now generates robots.txt and a sitemap containing the actual canonical pages. A sitemap is a discovery aid, not a ranking guarantee. Search Console submission remains an account step after deployment.
5. **Verify the production site in Search Console.** Check URL Inspection, Page Indexing, sitemap processing, and search queries. Confirm the production pages return useful HTML with 200 status and no unintended noindex or blocked assets. Localhost changes have no public search impact until deployed.
6. **Strengthen identity and discovery.** Use the same name, service focus, and canonical portfolio link on LinkedIn and GitHub. Share original project explanations that link to the relevant case study. A personal domain can help brand ownership; it is not a ranking shortcut. If changing domains, update the canonical source and use redirects.

## Content targets

| Audience intent | Relevant content |
| --- | --- |
| Find Sheersh Tiwari | Clear personal profile, consistent identity links, contact |
| Hire an AI workflow developer | AI workflow service page, a working-system case study, defined deliverables |
| Find a SQL optimization consultant | Database service page, measured optimization case study |
| Understand कामCREW | Dedicated architecture and product walkthrough with Hermes attribution |
| Assess approach and scope | Concise answers about integrations, data handling, engagement process, maintenance |

Treat these as query hypotheses. Use actual Search Console impressions and enquiries to decide what to improve; no search-volume claims were researched.

## AEO / AI search

Use clear, self-contained explanations and original evidence that help a buyer understand the work. Keep material available as readable page text rather than only inside a chatbot or animation. Make any structured data match the visible content. Do not add unsupported review stars or claim expertise with tools that are still explorations.

Google says its generative AI features use the same SEO foundations. It does not require special AI markup or llms.txt. These recommendations improve clarity and accessibility; they do not guarantee AI citations or rankings.

## Measure results

Track indexed pages, branded versus service-query impressions, relevant clicks, and enquiry conversions. Prioritize qualified enquiries over raw traffic. Compare after deployment and allow time for recrawling; avoid promises of a fixed ranking or timeline.

## Primary guidance

- Google, generative AI search: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Google, JavaScript SEO: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- Google, helpful content: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google, sitemaps: https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
