import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync, brotliDecompressSync } from 'node:zlib';
import { resolve } from 'node:path';
import { crawlablePaths, metadataForPath } from '../src/data/seo.js';
import { searchPages } from '../src/data/searchPages.js';
import { SITE_URL } from '../src/data/site.js';
import { escapeHtml } from './page-html.mjs';

const fileFor = path => resolve('dist', path === '/' ? 'index.html' : `${path.slice(1)}.html`);
const documents = new Map();
const titles = new Set();
for (const path of crawlablePaths) {
  const file = fileFor(path), html = readFileSync(file, 'utf8');
  const meta = metadataForPath(path);
  assert.match(html, /<div id="root"><(?:div|main)/, `${path}: body must be prerendered`);
  assert.equal([...html.matchAll(/<h1(?:\s|>)/g)].length, 1, `${path}: exactly one h1`);
  assert.ok(html.includes(`<title>${escapeHtml(meta.title)}</title>`), `${path}: title`);
  assert.ok(!titles.has(meta.title), `${path}: unique title`); titles.add(meta.title);
  assert.ok(html.includes(`rel="canonical" href="${meta.canonical}"`), `${path}: canonical`);
  assert.ok(html.includes(`name="description" content="${escapeHtml(meta.description)}"`), `${path}: description`);
  assert.ok(html.includes('name="robots" content="index,follow,max-image-preview:large"'), `${path}: indexable`);
  assert.ok(!/%[A-Z_]{3,}%/.test(html), `${path}: unresolved placeholder`);
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  if (path === '/') assert.equal(schema['@type'], 'Person');
  else {
    assert.ok(schema['@graph'].some(item => item['@type'] === 'WebPage' && item.url === meta.canonical));
    assert.ok(schema['@graph'].some(item => ['Service', 'Article'].includes(item['@type'])));
    assert.ok(schema['@graph'].some(item => item['@type'] === 'BreadcrumbList'));
    const page = searchPages.find(item => item.path === path);
    for (const [question, answer] of page.faqs) {
      // React escapes apostrophes differently from attribute encoders.
      const plain = html.replaceAll('&#x27;', "'").replaceAll('&amp;', '&');
      assert.ok(plain.includes(question) && plain.includes(answer), `${path}: visible questions and answers in initial HTML`);
    }
  }
  assert.equal(gunzipSync(readFileSync(`${file}.gz`)).toString(), html, `${path}: gzip must match prerender`);
  assert.equal(brotliDecompressSync(readFileSync(`${file}.br`)).toString(), html, `${path}: Brotli must match prerender`);
  documents.set(path, html);
  console.log(`PASS ${path}: initial HTML, metadata, schema, and compression`);
}
for (const [path, html] of documents) {
  for (const match of html.matchAll(/href="([^"<>]*)"/g)) {
    const href = match[1].replaceAll('&amp;', '&');
    if (!href.startsWith('/') && !href.startsWith('#')) continue;
    const url = new URL(href, `${SITE_URL}${path}`);
    if (!documents.has(url.pathname)) {
      assert.ok(existsSync(resolve('dist', `.${url.pathname}`)), `${path}: broken internal link ${href}`);
    } else if (url.hash.length > 1) {
      assert.ok(documents.get(url.pathname).includes(`id="${url.hash.slice(1)}"`), `${path}: missing anchor ${href}`);
    }
  }
}
for (const page of searchPages) assert.ok(documents.get('/').includes(`href="${page.path}"`), `${page.path}: crawlable from homepage`);
const sitemap = readFileSync('dist/sitemap.xml', 'utf8');
const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
assert.deepEqual(locations, crawlablePaths.map(path => `${SITE_URL}${path}`));
assert.match(readFileSync('dist/robots.txt', 'utf8'), new RegExp(`Sitemap: ${SITE_URL.replaceAll('.', '\\.')}\/sitemap.xml`));
const missing = readFileSync('dist/404.html', 'utf8');
assert.ok(missing.includes('content="noindex,follow"') && !missing.includes('rel="canonical"'));
const hosting = JSON.parse(readFileSync('vercel.json', 'utf8'));
assert.equal(hosting.cleanUrls, true);
assert.ok(!hosting.rewrites?.some(rule => rule.destination === '/index.html'), 'No blanket SPA rewrite that creates soft 404s');
console.log('PASS internal links, sitemap, crawl policy, and 404 hosting configuration');

if (process.argv.includes('--http')) {
  const { preview } = await import('vite');
  const server = await preview({ logLevel: 'error', preview: { port: 0, host: '127.0.0.1', open: false } });
  try {
    const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
    for (const path of crawlablePaths) {
      const response = await fetch(origin + path);
      assert.equal(response.status, 200, `${path}: HTTP status`);
      assert.equal(await response.text(), documents.get(path), `${path}: served prerendered document`);
    }
    for (const path of ['/not-a-page', '/services', '/work/missing-case']) {
      const response = await fetch(origin + path);
      assert.equal(response.status, 404, `${path}: must not serve homepage with HTTP 200`);
      assert.ok((await response.text()).includes('noindex,follow'));
    }
    for (const path of ['/services/custom-software/', '/services/custom-software.html']) {
      const response = await fetch(origin + path, { redirect: 'manual' });
      assert.equal(response.status, 308); assert.equal(response.headers.get('location'), '/services/custom-software');
    }
    assert.equal((await fetch(origin + '/sitemap.xml')).status, 200);
    assert.equal((await fetch(origin + '/robots.txt')).status, 200);
    console.log('PASS HTTP pages, clean URL redirects, sitemap, robots, and real 404 responses');
  } finally {
    await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
  }
}
