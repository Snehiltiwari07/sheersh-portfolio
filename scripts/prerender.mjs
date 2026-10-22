import { createServer } from 'vite';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { crawlablePaths } from '../src/data/seo.js';
import { SITE_URL } from '../src/data/site.js';
import { applyMetadata, escapeHtml } from './page-html.mjs';

const dist = resolve('dist');
const template = await readFile(resolve(dist, 'index.html'), 'utf8');
const vite = await createServer({ server: { middlewareMode: true, watch: null }, appType: 'custom' });
try {
  const { render } = await vite.ssrLoadModule('/src/entry-server.jsx');
  for (const path of [...crawlablePaths, '/404']) {
    const body = render(path);
    if (!body.includes('<h1')) throw new Error(`Prerender produced no heading: ${path}`);
    const html = applyMetadata(template, path).replace('<div id="root"></div>', () => `<div id="root">${body}</div>`);
    const file = resolve(dist, path === '/' ? 'index.html' : `${path.slice(1)}.html`);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, html);
    // The normal Vite compression pass runs before prerendering. Replace its
    // HTML sidecars too, so hosts never serve a stale compressed app shell.
    await writeFile(`${file}.gz`, gzipSync(html));
    await writeFile(`${file}.br`, brotliCompressSync(html));
    console.log(`Prerendered ${path} (${Buffer.byteLength(html)} bytes)`);
  }
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${crawlablePaths.map(path => `  <url><loc>${escapeHtml(`${SITE_URL}${path}`)}</loc></url>`).join('\n')}\n</urlset>\n`;
  await writeFile(resolve(dist, 'sitemap.xml'), sitemap);
  await writeFile(resolve(dist, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
} finally {
  await vite.close();
}
