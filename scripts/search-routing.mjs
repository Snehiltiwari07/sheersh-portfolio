import { readFile } from 'node:fs/promises';
import { statSync } from 'node:fs';
import { resolve } from 'node:path';
import { crawlablePaths } from '../src/data/seo.js';
import { normalizePath } from '../src/data/searchPages.js';
import { SITE_URL } from '../src/data/site.js';

const sitemap = () => `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${crawlablePaths.map(path => `<url><loc>${SITE_URL}${path}</loc></url>`).join('')}</urlset>`;
const robots = () => `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
const isFile = path => { try { return statSync(path).isFile(); } catch { return false; } };
const internal = path => /^\/(?:api(?:\/|$)|src\/|@|node_modules\/|assets\/|docs\/)/.test(path);
const send = (res, status, type, body) => { res.statusCode = status; res.setHeader('Content-Type', type); res.end(body); };

export function searchRouting() {
  return {
    name: 'search-content-routing',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = new URL(req.url, 'http://vite.local').pathname;
        if (path === '/robots.txt') return send(res, 200, 'text/plain; charset=utf-8', robots());
        if (path === '/sitemap.xml') return send(res, 200, 'application/xml; charset=utf-8', sitemap());
        if (internal(path) || path === '/index.html' || crawlablePaths.includes(normalizePath(path)) || isFile(resolve('public', `.${path}`))) return next();
        try {
          const template = await readFile('index.html', 'utf8');
          const { render } = await server.ssrLoadModule('/src/entry-server.jsx');
          const html = (await server.transformIndexHtml(path, template)).replace('<div id="root"></div>', () => `<div id="root">${render(path)}</div>`);
          return send(res, 404, 'text/html; charset=utf-8', html);
        } catch (error) { next(error); }
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
        const url = new URL(req.url, 'http://vite.local');
        const path = normalizePath(url.pathname);
        const clean = path.replace(/\.html$/, '');
        if (path === '/index.html') { res.statusCode = 308; res.setHeader('Location', '/' + url.search); return res.end(); }
        if (path === '/') return next();
        if (crawlablePaths.includes(clean)) {
          if (url.pathname !== clean) { res.statusCode = 308; res.setHeader('Location', clean + url.search); return res.end(); }
          return send(res, 200, 'text/html; charset=utf-8', await readFile(resolve('dist', `.${clean}.html`), 'utf8'));
        }
        if (/^\/api(?:\/|$)/.test(path)) return send(res, 404, 'application/json', '{"error":"API routes require the development or deployment server."}');
        if (internal(path) || path === '/' || isFile(resolve('dist', `.${path}`))) return next();
        return send(res, 404, 'text/html; charset=utf-8', await readFile('dist/404.html', 'utf8'));
        } catch (error) { next(error); }
      });
    },
  };
}
