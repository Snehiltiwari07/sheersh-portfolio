import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression';
import { TITLE_TAG, META_DESCRIPTION } from './src/data/positioning.js';
import { CANONICAL_URL, OG_TYPE, OG_IMAGE_URL, OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT, OG_IMAGE_ALT, jsonLd } from './src/data/seo.js';

/**
 * T-014 — index.html ships the crawler-facing metadata (`<title>`, meta
 * description, canonical, OG/Twitter card, JSON-LD) and gate FAIL #7 said this
 * repo already shipped six different positioning statements. Retyping the title
 * into the OG tags would have created a seventh, so index.html carries
 * `%TOKENS%` that are resolved from the data layer here, at the single point
 * where both `vite` (dev) and `vite build` produce the document: what you check
 * in dev is byte-for-byte what ships.
 *
 * An unresolved `%TOKEN%` fails the build rather than shipping a placeholder to
 * a crawler (a silent placeholder is exactly how #10 stayed invisible).
 */
const HTML_TOKENS = {
  '%POSITIONING_TITLE%': TITLE_TAG,
  '%POSITIONING_META_DESCRIPTION%': META_DESCRIPTION,
  '%CANONICAL_URL%': CANONICAL_URL,
  '%OG_TYPE%': OG_TYPE,
  '%OG_IMAGE_URL%': OG_IMAGE_URL,
  '%OG_IMAGE_WIDTH%': String(OG_IMAGE_WIDTH),
  '%OG_IMAGE_HEIGHT%': String(OG_IMAGE_HEIGHT),
  '%OG_IMAGE_ALT%': OG_IMAGE_ALT,
  '%JSON_LD%': jsonLd(),
};

function positioningHtml() {
  return {
    name: 'positioning-html',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        let out = html;
        for (const [token, value] of Object.entries(HTML_TOKENS)) {
          // replacer function, not a string: a '$&' inside a value would be
          // read as a replacement pattern and corrupt the copy
          out = out.replaceAll(token, () => value);
        }
        const leftover = out.match(/%[A-Z_]+%/);
        if (leftover) {
          throw new Error(
            `index.html: unresolved placeholder ${leftover[0]} — add it to HTML_TOKENS in vite.config.js`
          );
        }
        return out;
      },
    },
  };
}

export default defineConfig({
  plugins: [
    positioningHtml(),
    react(),
    // Pre-compress build assets into Brotli (.br) and Gzip (.gz)
    compression({ algorithm: 'brotliCompress', ext: '.br' }),
    compression({ algorithm: 'gzip', ext: '.gz' }),
  ],
  server: { port: 5173 },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Chunk by package, explicitly: the previous list named only
        // 'react' and 'react-dom', so react/jsx-runtime — which every JSX file
        // needs — was bundled into the framer-motion chunk. The initial chunk
        // therefore imported framer-motion (122 KB) statically and waited on it
        // before the first render. With the runtime pinned to react-vendor,
        // framer-motion is reachable only through the lazy below-the-fold
        // chunks.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('framer-motion')) return 'framer-motion';
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react-vendor';
          return undefined;
        },
      },
    },
  },
  // Automatically strip all console.log and debugger statements from production JS
  esbuild: {
    drop: ['console', 'debugger'],
  },
});
