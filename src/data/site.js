/**
 * src/data/site.js — deployment-origin facts, in one place.
 *
 * The canonical URL, the `og:url` and the absolute `og:image` URL all derive
 * from SITE_URL: a crawler resolves `og:image` against nothing, so a relative
 * `/og-image.png` is silently ignored by most scrapers. One constant, three
 * consumers (index.html injection + JSON-LD in vite.config.js, the OG renderer
 * in scripts/build-og-image.mjs).
 *
 * T-014 flagged to BOSS: this is the live Vercel origin. If a custom domain
 * (e.g. sheersh.dev) is ever attached, change this one line and re-run
 * `npm run build` — the title/OG/canonical/JSON-LD all follow.
 */
export const SITE_URL = 'https://sheershtiwari.vercel.app';
