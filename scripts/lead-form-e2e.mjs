#!/usr/bin/env node
/**
 * scripts/lead-form-e2e.mjs — the local stand-in for `vercel dev`.
 *
 * WHY: the hire form's acceptance evidence has to come from a real browser
 * talking to the REAL `api/lead.js` over HTTP. `vite dev`/`vite preview` only
 * serve the SPA, so `/api/lead` would 404, and `vercel dev` needs a linked
 * project + credentials. This mounts the production build (dist/) and the real
 * serverless handler in one Node process:
 *
 *   POST /api/lead   -> api/lead.js, untouched, with a Vercel-style req.body
 *   POST /__store    -> a loopback store webhook that records the 11-column row
 *                       the endpoint would send to Google Sheets, so a `200`
 *                       here means a row really was written (contract §8)
 *   GET  /*          -> dist/ static files with the SPA fallback
 *
 * Every request/response pair is printed and appended to
 * docs/evidence/T-008/e2e-traffic.json — that file IS the raw evidence.
 *
 * NOTHING IS SENT TO THE INTERNET: RESEND_API_KEY is left unset (the email path
 * reports "not configured"), and the store webhook points at loopback.
 *
 * Usage: node scripts/lead-form-e2e.mjs            (port 4173)
 *        E2E_PORT=4180 LEAD_RATE_LIMIT_MAX=2 node scripts/lead-form-e2e.mjs
 */
import http from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync, statSync, createReadStream } from 'node:fs';
import { extname, join, resolve, normalize } from 'node:path';
import { pathToFileURL } from 'node:url';

const PORT = Number(process.env.E2E_PORT || 4173);
const DIST = resolve('dist');
const EVIDENCE_DIR = resolve('docs/evidence/T-008');
const EVIDENCE_FILE = process.env.E2E_EVIDENCE_FILE
  ? resolve(process.env.E2E_EVIDENCE_FILE)
  : join(EVIDENCE_DIR, 'e2e-traffic.json');

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('dist/index.html missing — run `npm run build` first.');
  process.exit(1);
}

// ── environment under test ───────────────────────────────────────────────────
// The store webhook is a loopback mock; Resend stays unconfigured on purpose so
// no real email can leave this machine.
process.env.LEAD_STORE_WEBHOOK_URL = `http://127.0.0.1:${PORT}/__store`;
delete process.env.LEAD_STORE_WEBHOOK_TOKEN;
delete process.env.RESEND_API_KEY;
process.env.LEAD_NOTIFY_EMAIL = process.env.LEAD_NOTIFY_EMAIL || 'er.sheershtiwari@gmail.com';
process.env.LEAD_RATE_LIMIT_MAX = process.env.LEAD_RATE_LIMIT_MAX || '50';

const { default: leadHandler } = await import(pathToFileURL(resolve('api/lead.js')).href);

// ── evidence capture ─────────────────────────────────────────────────────────
const traffic = [];
const storeRows = [];
let seq = 0;

const persist = async () => {
  await mkdir(EVIDENCE_DIR, { recursive: true });
  await writeFile(
    EVIDENCE_FILE,
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        server: { port: PORT, dist: DIST, resend: 'not configured (offline on purpose)', store: process.env.LEAD_STORE_WEBHOOK_URL, rateLimitMax: process.env.LEAD_RATE_LIMIT_MAX },
        requests: traffic,
        storeRows
      },
      null,
      2
    )
  );
};

const stamp = () => new Date().toISOString();

// ── static files ─────────────────────────────────────────────────────────────
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8'
};

const serveStatic = (req, res, pathname) => {
  const rel = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '').replace(/^[/\\]+/, '');
  let file = join(DIST, rel);
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(DIST, 'index.html');
  const type = TYPES[extname(file).toLowerCase()] || 'application/octet-stream';
  res.setHeader('Content-Type', type);
  res.setHeader('Cache-Control', 'no-store');
  if (file.endsWith('index.html')) res.setHeader('Cache-Control', 'no-store');
  createReadStream(file).pipe(res);
};

const readBody = (req) =>
  new Promise((resolvePromise) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolvePromise(Buffer.concat(chunks)));
  });

// ── the server ───────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const id = ++seq;

  // The loopback store webhook — records the normalised row the endpoint sends.
  if (url.pathname === '/__store') {
    const raw = (await readBody(req)).toString('utf8');
    let row = null;
    try {
      row = JSON.parse(raw).row || null;
    } catch {
      /* recorded as null */
    }
    storeRows.push({ t: stamp(), columns: row ? row.length : 0, row });
    console.log(`[store] row ${storeRows.length} accepted — ${row ? row.length : 0} columns`);
    await persist();
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, appended: row ? row.length : 0 }));
    return;
  }

  if (url.pathname === '/__evidence') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ requests: traffic.length, storeRows: storeRows.length, file: EVIDENCE_FILE }));
    return;
  }

  // The real endpoint, mounted exactly as Vercel would call it.
  if (url.pathname === '/api/lead' || url.pathname.startsWith('/api/')) {
    const body = await readBody(req);
    req.body = body.length ? body : undefined; // Vercel parses JSON bodies; the handler reads req.body

    const requestRecord = {
      id,
      t: stamp(),
      method: req.method,
      path: url.pathname,
      headers: {
        origin: req.headers.origin || null,
        contentType: req.headers['content-type'] || null,
        contentLength: req.headers['content-length'] || null,
        xForwardedFor: req.headers['x-forwarded-for'] || null,
        userAgent: req.headers['user-agent'] || null
      },
      body: (() => {
        try {
          return JSON.parse(body.toString('utf8'));
        } catch {
          return body.toString('utf8') || null;
        }
      })()
    };

    const chunks = [];
    const originalWrite = res.write.bind(res);
    const originalEnd = res.end.bind(res);
    res.write = (chunk, ...rest) => {
      if (chunk && typeof chunk !== 'function') chunks.push(Buffer.from(chunk));
      return originalWrite(chunk, ...rest);
    };
    res.end = (chunk, ...rest) => {
      if (chunk && typeof chunk !== 'function') chunks.push(Buffer.from(chunk));
      const raw = Buffer.concat(chunks).toString('utf8');
      let parsed = raw;
      try {
        parsed = JSON.parse(raw);
      } catch {
        /* leave as text */
      }
      const record = {
        ...requestRecord,
        response: {
          status: res.statusCode,
          headers: {
            'x-request-id': res.getHeader('X-Request-Id') || null,
            'retry-after': res.getHeader('Retry-After') ?? null,
            'content-type': res.getHeader('Content-Type') || null,
            'cache-control': res.getHeader('Cache-Control') || null
          },
          body: parsed
        }
      };
      traffic.push(record);
      console.log(
        `\n[${id}] ${requestRecord.method} ${requestRecord.path}  origin=${requestRecord.headers.origin}\n` +
          `     REQUEST  ${JSON.stringify(requestRecord.body)}\n` +
          `     RESPONSE ${res.statusCode} ${raw}`
      );
      persist().catch(() => {});
      return originalEnd(chunk, ...rest);
    };

    await leadHandler(req, res);
    return;
  }

  serveStatic(req, res, url.pathname);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`lead-form e2e server on http://localhost:${PORT}`);
  console.log(`  store webhook  ${process.env.LEAD_STORE_WEBHOOK_URL}`);
  console.log(`  rate limit max ${process.env.LEAD_RATE_LIMIT_MAX} / 10 min (in-memory, per instance)`);
  console.log(`  evidence       ${EVIDENCE_FILE}`);
});

const shutdown = async () => {
  await persist().catch(() => {});
  console.log(`\nwrote ${traffic.length} request(s) and ${storeRows.length} store row(s) to ${EVIDENCE_FILE}`);
  server.close(() => process.exit(0));
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
