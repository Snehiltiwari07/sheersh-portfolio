import { defineConfig, loadEnv } from 'vite';
import chatHandler from './api/chat.js';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression';
import { TITLE_TAG, META_DESCRIPTION } from './src/data/positioning.js';
import { CANONICAL_URL, OG_TYPE, OG_IMAGE_URL, OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT, OG_IMAGE_ALT, jsonLd } from './src/data/seo.js';
import { applyMetadata, escapeHtml } from './scripts/page-html.mjs';
import { searchRouting } from './scripts/search-routing.mjs';

/**
 * Resolve shared HTML tokens, then apply metadata for the requested route.
 * Production prerendering writes route-specific HTML after Vite's asset build.
 * GOOGLE_SITE_VERIFICATION is read from the build process environment.
 * See docs/ARCHITECTURE.md; dev chat configuration is in docs/DEVELOPMENT.md.
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
      handler(html, context) {
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
        const path = new URL(context?.originalUrl || context?.path || '/', 'http://vite.local').pathname;
        out = applyMetadata(out, path === '/index.html' ? '/' : path);
        if (process.env.GOOGLE_SITE_VERIFICATION) out = out.replace('</head>', `<meta name="google-site-verification" content="${escapeHtml(process.env.GOOGLE_SITE_VERIFICATION)}" /></head>`);
        return out;
      },
    },
  };
}

function localChat() {
  return {
    name: 'local-chat-api',
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), 'GROQ_');
      for (const name of ['GROQ_API_KEY', 'GROQ_MODEL']) if (!process.env[name] && env[name]) process.env[name] = env[name];
      server.middlewares.use('/api/chat', async (req, res) => {
        let raw = '';
        for await (const chunk of req) {
          raw += chunk;
          if (Buffer.byteLength(raw) > 16_384) { res.statusCode = 413; res.end('Request too large'); return; }
        }
        req.body = raw;
        res.status = code => { res.statusCode = code; return res; };
        res.json = data => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)); };
        await chatHandler(req, res);
      });
    },
  };
}

export default defineConfig({
  plugins: [
    positioningHtml(),
    searchRouting(),
    localChat(),
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
