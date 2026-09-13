/**
 * scripts/lead-endpoint-test.mjs
 *
 * Exercises api/lead.js locally with mocked req/res and a stubbed global fetch, so every
 * response body and every outbound call is real code output — no outbound network, no secrets.
 * CASE 15–19 additionally drive a real node:http mock Apps Script web app on 127.0.0.1 (loopback
 * only, ephemeral port) to prove the 302-redirect handling against a real HTTP redirect.
 *
 * Run:  node scripts/lead-endpoint-test.mjs
 * Exit: 0 = every case passed, 1 = at least one failed.
 */
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import http from 'node:http';

// ── environment under test (dummy values; nothing real is ever sent) ───────────
process.env.RESEND_API_KEY = 'unit-test-dummy-key';
process.env.LEAD_NOTIFY_EMAIL = 'er.sheershtiwari@gmail.com';
process.env.LEAD_FROM_EMAIL = 'Sheersh Portfolio <onboarding@resend.dev>';
process.env.LEAD_STORE_WEBHOOK_URL = 'https://store.example.test/leads';
process.env.LEAD_STORE_WEBHOOK_TOKEN = 'unit-test-dummy-token';
process.env.LEAD_RATE_LIMIT_MAX = '5';
process.env.LEAD_RATE_LIMIT_WINDOW_MS = '600000';

const handlerUrl = pathToFileURL(resolve('api/lead.js')).href;
const { default: handler } = await import(handlerUrl);

// ── stubbed outbound fetch ────────────────────────────────────────────────────
let outbound = [];
const nodeFetch = globalThis.fetch; // the real fetch, kept for the loopback mock-webhook cases
const stubFetch = async (url, init = {}) => {
  outbound.push({
    url: String(url),
    method: init.method || 'GET',
    authorization: init.headers?.['Authorization'] ? 'Bearer <redacted>' : undefined,
    body: init.body ? JSON.parse(init.body) : undefined
  });
  return {
    ok: true,
    status: 200,
    text: async () => '{"id":"stub"}',
    json: async () => ({ id: 'stub' })
  };
};
globalThis.fetch = stubFetch;

// ── mocked req/res ────────────────────────────────────────────────────────────
class MockRes {
  constructor() {
    this.statusCode = 200;
    this.headers = {};
    this.body = '';
  }
  setHeader(key, value) {
    this.headers[String(key).toLowerCase()] = value;
  }
  end(chunk = '') {
    this.body += chunk;
  }
  json() {
    try {
      return JSON.parse(this.body);
    } catch {
      return this.body;
    }
  }
}

async function call({ method = 'POST', body, rawBody, ip = '198.51.100.1', origin = 'https://sheershtiwari.vercel.app', contentLength } = {}) {
  outbound = [];
  const headers = {};
  if (ip) headers['x-forwarded-for'] = ip;
  if (origin) headers.origin = origin;
  if (contentLength !== undefined) headers['content-length'] = String(contentLength);
  const req = {
    method,
    headers,
    body: rawBody !== undefined ? rawBody : body
  };
  const res = new MockRes();
  await handler(req, res);
  return { res, outbound };
}

// ── case runner ───────────────────────────────────────────────────────────────
let pass = 0;
let fail = 0;
const failures = [];

function check(caseName, label, condition, detail) {
  if (condition) {
    console.log(`   ✓ ${label}`);
    pass += 1;
  } else {
    console.log(`   ✗ ${label}${detail ? ` — got: ${JSON.stringify(detail)}` : ''}`);
    fail += 1;
    failures.push(`${caseName}: ${label}`);
  }
}

function header(title, request) {
  console.log(`\n── ${title} ` + '─'.repeat(Math.max(0, 74 - title.length)));
  console.log('   REQUEST  ' + JSON.stringify(request));
}

function response(status, body, extra = {}) {
  console.log('   RESPONSE ' + JSON.stringify({ status, body, ...extra }));
}

const validBody = (over = {}) => ({
  name: 'Priya Raman',
  email: 'priya.raman@acmecorp.example',
  company: 'Acme Corp',
  projectType: 'sql-performance',
  budgetBand: '5k-15k',
  message: 'We have a reporting query on 40M rows that takes minutes. Can you review our indexing strategy?',
  honeypot: '',
  ...over
});

// ─────────────────────────── CASE 1 — happy path ─────────────────────────────
{
  const name = 'CASE 1 valid submission';
  const req = validBody();
  const { res, outbound: calls } = await call({ body: req, ip: '198.51.100.10' });
  const body = res.json();
  header(name, req);
  response(res.statusCode, body, { 'x-request-id': res.headers['x-request-id'], outbound_calls: calls.map((c) => c.url) });
  console.log('   OUTBOUND ' + JSON.stringify(calls.map((c) => ({ url: c.url, method: c.method, body: c.body })), null, 2));
  check(name, 'HTTP 200', res.statusCode === 200, res.statusCode);
  check(name, 'ok:true', body.ok === true, body);
  check(name, 'id is a lead_ id', typeof body.id === 'string' && body.id.startsWith('lead_'), body.id);
  check(name, 'exactly one Resend + one store call', calls.length === 2, calls.map((c) => c.url));
  const resend = calls.find((c) => c.url === 'https://api.resend.com/emails');
  const store = calls.find((c) => c.url === 'https://store.example.test/leads');
  check(name, 'Resend payload has from/to/reply_to/subject', Boolean(resend?.body?.from && resend?.body?.to && resend?.body?.reply_to && resend?.body?.subject), resend?.body);
  check(name, 'Resend reply_to = lead email', resend?.body?.reply_to === req.email, resend?.body?.reply_to);
  const row = store?.body?.row;
  check(name, 'store payload is the normalised row, not the raw lead (11 values)', Array.isArray(row) && row.length === 11 && store?.body?.id === undefined, store?.body);
  check(name, 'row 3/5 = name + email, row 9 = message, row 11 = the lead id', row?.[2] === req.name && row?.[4] === req.email && row?.[8] === req.message && row?.[10] === body.id, row);
  check(name, 'row 2 = "Form (website)", row 6/7 = enum labels, row 8 = "" (hunter-only)', row?.[1] === 'Form (website)' && row?.[5] === 'Database & SQL Performance Rescue' && row?.[6] === '$5,000 – $15,000' && row?.[7] === '', row);
  check(name, 'no-store cache header', res.headers['cache-control'] === 'no-store', res.headers['cache-control']);
}

// ──────────────── CASE 2 — bad input (field-level typed errors) ───────────────
{
  const name = 'CASE 2 invalid fields';
  const req = { name: 'A', email: 'not-an-email', company: '', projectType: '', budgetBand: '', message: 'short', honeypot: '' };
  const { res } = await call({ body: req, ip: '198.51.100.11' });
  const body = res.json();
  header(name, req);
  response(res.statusCode, body);
  check(name, 'HTTP 400', res.statusCode === 400, res.statusCode);
  check(name, 'ok:false', body.ok === false, body);
  check(name, 'per-field errors for all 5 fields', ['name', 'email', 'projectType', 'budgetBand', 'message'].every((k) => typeof body.errors?.[k] === 'string'), body.errors);
}

// ─────────────────── CASE 3 — wrong types (never trust client) ────────────────
{
  const name = 'CASE 3 non-string types';
  const req = { name: 123, email: { v: 1 }, company: [], projectType: 7, budgetBand: false, message: { a: 1 }, honeypot: '' };
  const { res } = await call({ body: req, ip: '198.51.100.12' });
  const body = res.json();
  header(name, req);
  response(res.statusCode, body);
  check(name, 'HTTP 400', res.statusCode === 400, res.statusCode);
  check(name, 'every field reports a string-type error', ['name', 'email', 'company', 'projectType', 'budgetBand', 'message'].every((k) => /must be a string/.test(body.errors?.[k] || '')), body.errors);
  check(name, 'no outbound call on invalid input', outbound.length === 0, outbound.length);
}

// ────────────────────────── CASE 4 — unknown enum values ─────────────────────
{
  const name = 'CASE 4 bad enums';
  const req = validBody({ projectType: 'build-me-a-rocket', budgetBand: 'gold' });
  const { res } = await call({ body: req, ip: '198.51.100.13' });
  const body = res.json();
  header(name, req);
  response(res.statusCode, body);
  check(name, 'HTTP 400', res.statusCode === 400, res.statusCode);
  check(name, 'projectType error lists allowed values', /Allowed: .*sql-performance/.test(body.errors?.projectType || ''), body.errors?.projectType);
  check(name, 'budgetBand error lists allowed values', /Allowed: .*5k-15k/.test(body.errors?.budgetBand || ''), body.errors?.budgetBand);
}

// ─────────────────────────── CASE 5 — message overflow ───────────────────────
{
  const name = 'CASE 5 message over 2000 chars';
  const req = validBody({ message: 'x'.repeat(2001) });
  const { res } = await call({ body: req, ip: '198.51.100.14' });
  const body = res.json();
  header(name, `message: ${'x'.repeat(2001)} (2001 chars)`);
  response(res.statusCode, body);
  check(name, 'HTTP 400', res.statusCode === 400, res.statusCode);
  check(name, 'message length error', /2000 characters or fewer/.test(body.errors?.message || ''), body.errors?.message);
}

// ───────────────────────────── CASE 6 — honeypot ─────────────────────────────
{
  const name = 'CASE 6 honeypot filled -> silent drop';
  const req = validBody({ honeypot: 'http://spam.example' });
  const { res, outbound: calls } = await call({ body: req, ip: '198.51.100.15' });
  const body = res.json();
  header(name, req);
  response(res.statusCode, body, { outbound_calls: calls.length });
  check(name, 'HTTP 200 (bot sees success)', res.statusCode === 200, res.statusCode);
  check(name, 'ok:true decoy id', body.ok === true && String(body.id).startsWith('lead_'), body);
  check(name, 'ZERO outbound calls — nothing persisted, nothing emailed', calls.length === 0, calls.length);
}

// ─────────────────────── CASE 7 — rate limit (5 per 10 min) ──────────────────
{
  const name = 'CASE 7 rate limit';
  const results = [];
  for (let i = 1; i <= 6; i += 1) {
    const { res, outbound: calls } = await call({
      body: validBody({ email: `burst${i}@acme.example`, message: `Burst submission number ${i} from the same connection.` }),
      ip: '203.0.113.77'
    });
    results.push({ attempt: i, status: res.statusCode, body: res.json(), outbound: calls.length, retryAfter: res.headers['retry-after'] });
  }
  header(name, '6 submissions from 203.0.113.77, distinct email+message each');
  results.forEach((r) => response(`attempt ${r.attempt} → ${r.status}`, r.body, { retry_after: r.retryAfter, outbound_calls: r.outbound }));
  check(name, 'attempts 1-5 accepted (200)', results.slice(0, 5).every((r) => r.status === 200), results.map((r) => r.status));
  check(name, 'attempt 6 rejected 429', results[5].status === 429, results[5].status);
  check(name, '429 body is typed {ok:false,errors.form}', results[5].body.ok === false && typeof results[5].body.errors?.form === 'string', results[5].body);
  check(name, 'Retry-After header present', Number(results[5].retryAfter) > 0, results[5].retryAfter);
  check(name, 'rate-limited request made no outbound call', results[5].outbound === 0, results[5].outbound);
}

// ───────────────────── CASE 8 — double-submit suppression ────────────────────
{
  const name = 'CASE 8 duplicate double-click';
  const req = validBody({ email: 'doubleclick@acme.example', message: 'Submitted twice by an impatient double click on the button.' });
  const first = await call({ body: req, ip: '198.51.100.16' });
  const second = await call({ body: req, ip: '198.51.100.16' });
  header(name, req);
  response('first', first.res.json(), { outbound_calls: first.outbound.length });
  response('second', second.res.json(), { outbound_calls: second.outbound.length });
  check(name, 'second identical submit returns the same id', first.res.json().id === second.res.json().id, [first.res.json().id, second.res.json().id]);
  check(name, 'no duplicate notification sent', second.outbound.length === 0, second.outbound.length);
}

// ───────────────────── CASE 9 — method / body / origin guards ────────────────
{
  const name = 'CASE 9 GET';
  const { res } = await call({ method: 'GET', ip: '198.51.100.17' });
  header(name, 'GET /api/lead');
  response(res.statusCode, res.json(), { allow: res.headers.allow });
  check(name, 'HTTP 405', res.statusCode === 405, res.statusCode);
  check(name, 'Allow: POST', res.headers.allow === 'POST', res.headers.allow);
}
{
  const name = 'CASE 10 malformed JSON';
  const { res } = await call({ rawBody: '{"name": "broken",,}', ip: '198.51.100.18' });
  header(name, '{"name": "broken",,}');
  response(res.statusCode, res.json());
  check(name, 'HTTP 400', res.statusCode === 400, res.statusCode);
  check(name, 'form-level JSON error', /not valid JSON/.test(res.json().errors?.form || ''), res.json().errors);
}
{
  const name = 'CASE 11 disallowed origin';
  const { res } = await call({ body: validBody(), ip: '198.51.100.19', origin: 'https://evil.example' });
  header(name, 'Origin: https://evil.example');
  response(res.statusCode, res.json());
  check(name, 'HTTP 403', res.statusCode === 403, res.statusCode);
  check(name, 'no outbound call', outbound.length === 0, outbound.length);
}
{
  const name = 'CASE 12 oversize body';
  const { res } = await call({ body: validBody(), ip: '198.51.100.20', contentLength: 20000 });
  header(name, 'Content-Length: 20000');
  response(res.statusCode, res.json());
  check(name, 'HTTP 413', res.statusCode === 413, res.statusCode);
}

// ───────────── CASE 13 — delivery failure must NOT report success ────────────
{
  const name = 'CASE 13 both delivery paths down';
  const savedKey = process.env.RESEND_API_KEY;
  const savedHook = process.env.LEAD_STORE_WEBHOOK_URL;
  delete process.env.RESEND_API_KEY;
  delete process.env.LEAD_STORE_WEBHOOK_URL;
  const { res, outbound: calls } = await call({
    body: validBody({ email: 'offline@acme.example', message: 'Submitted while every downstream integration is unavailable.' }),
    ip: '198.51.100.21'
  });
  process.env.RESEND_API_KEY = savedKey;
  process.env.LEAD_STORE_WEBHOOK_URL = savedHook;
  header(name, 'RESEND_API_KEY unset + LEAD_STORE_WEBHOOK_URL unset');
  response(res.statusCode, res.json(), { outbound_calls: calls.length });
  check(name, 'HTTP 502 (never a false ok:true)', res.statusCode === 502, res.statusCode);
  check(name, 'ok:false with a form error', res.json().ok === false && typeof res.json().errors?.form === 'string', res.json());
}

// ───────────── CASE 14 — store down, email up → still captured ───────────────
{
  const name = 'CASE 14 store webhook returns 500';
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    outbound.push({ url: String(url), method: init.method || 'GET', body: init.body ? JSON.parse(init.body) : undefined });
    if (String(url).includes('store.example.test')) return { ok: false, status: 500, text: async () => 'boom', json: async () => ({}) };
    return { ok: true, status: 200, text: async () => '{"id":"stub"}', json: async () => ({ id: 'stub' }) };
  };
  const { res } = await call({
    body: validBody({ email: 'degraded@acme.example', message: 'Store webhook is down but email still delivers the lead.' }),
    ip: '198.51.100.22'
  });
  globalThis.fetch = realFetch;
  header(name, 'store webhook → HTTP 500, Resend → 200');
  response(res.statusCode, res.json());
  check(name, 'HTTP 200 — email path recorded the lead', res.statusCode === 200 && res.json().ok === true, res.json());
}

/* ══════════════ T-009 — shared Google Sheet sink: 11-column row contract ══════════════
 * CASE 15–19 cover the parts that only exist because the store is a Google Apps Script
 * web app: the 302 redirect, the always-200 status, and the normalised row mapping.
 * The mock web app below is a real node:http server on 127.0.0.1 that reproduces Apps
 * Script's exact behaviour (POST /exec → 302 → GET /content → 200 JSON). It proves the
 * payload and the protocol handling; it is NOT a real Google Sheet.
 * ════════════════════════════════════════════════════════════════════════════════════ */

/** Mock Apps Script web app: POST /exec answers the 302 it really sends; /content serves the body. */
function startMockWebApp(handleContent) {
  return new Promise((resolve) => {
    const seen = [];
    let port = 0;
    const server = http.createServer((req, res) => {
      let raw = '';
      req.on('data', (chunk) => {
        raw += chunk;
      });
      req.on('end', () => {
        seen.push({ method: req.method, url: req.url, body: raw });
        if (req.method === 'POST' && req.url.indexOf('/exec') === 0) {
          res.writeHead(302, { Location: `http://127.0.0.1:${port}/content`, 'Content-Type': 'text/html' });
          return res.end();
        }
        return handleContent(req, res, raw);
      });
    });
    server.listen(0, '127.0.0.1', () => {
      port = server.address().port;
      resolve({
        seen,
        port,
        url: (path) => `http://127.0.0.1:${port}${path}`,
        calls: () => seen.map((c) => `${c.method} ${c.url}`),
        close: () =>
          new Promise((done) => {
            if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
            server.close(() => done());
          })
      });
    });
  });
}

/** Temporarily swap env vars, then put them back exactly as they were. */
async function withEnv(patch, fn) {
  const saved = {};
  Object.keys(patch).forEach((key) => {
    saved[key] = process.env[key];
    if (patch[key] === undefined) delete process.env[key];
    else process.env[key] = patch[key];
  });
  try {
    return await fn();
  } finally {
    Object.keys(saved).forEach((key) => {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    });
  }
}

/** Capture the endpoint's own log lines (they are assertions here, not decoration). */
function captureConsole() {
  const lines = [];
  const saved = { log: console.log, warn: console.warn, error: console.error };
  const record = (level) => (...args) => lines.push(`${level} ${args.join(' ')}`);
  console.log = record('LOG');
  console.warn = record('WARN');
  console.error = record('ERROR');
  return {
    lines,
    restore() {
      console.log = saved.log;
      console.warn = saved.warn;
      console.error = saved.error;
    },
    entry(message) {
      for (const line of lines) {
        const start = line.indexOf('{');
        if (start === -1) continue;
        try {
          const parsed = JSON.parse(line.slice(start));
          if (parsed.message === message) return parsed;
        } catch {
          /* not a structured line */
        }
      }
      return null;
    }
  };
}

// ──────────── CASE 15 — the Apps Script 302 is followed (real loopback HTTP) ──────────
{
  const name = 'T-009 CASE 15 Apps Script 302 redirect is followed to the content URL';
  const mock = await startMockWebApp((req, res, raw) => {
    const payload = JSON.parse(raw || '{}');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, appended: true, row: 12, source: (payload.row || [])[1] }));
  });
  const req = validBody({ email: 'sheet@acme.example', message: 'Apps Script must append this after following the 302 redirect.' });
  let res;
  let body;
  await withEnv(
    // RESEND_API_KEY unset on purpose: the sheet is then the ONLY durable path, so a 200
    // can only mean "the redirect was followed and the row was accepted".
    { LEAD_STORE_WEBHOOK_URL: `${mock.url('/exec')}?token=unit-test-url-token`, RESEND_API_KEY: undefined },
    async () => {
      const previous = globalThis.fetch;
      globalThis.fetch = nodeFetch; // real HTTP, loopback only
      try {
        const result = await call({ body: req, ip: '198.51.100.30' });
        res = result.res;
        body = res.json();
      } finally {
        globalThis.fetch = previous;
      }
    }
  );
  const posted = mock.seen.find((c) => c.method === 'POST');
  const followed = mock.seen.find((c) => c.method === 'GET' && c.url.indexOf('/content') === 0);
  const row = posted ? JSON.parse(posted.body).row : null;
  header(name, `POST ${mock.url('/exec')}?token=… (RESEND_API_KEY unset)`);
  response(res.statusCode, body, { 'mock_web_app_saw': mock.calls() });
  console.log('   MOCK     ' + JSON.stringify(mock.seen.map((c) => ({ method: c.method, url: c.url, body: c.body ? JSON.parse(c.body) : undefined })), null, 2));
  check(name, 'producer POSTed the row to /exec', Boolean(posted), mock.calls());
  check(name, 'the 302 WAS followed — GET /content observed (not swallowed, not treated as success)', Boolean(followed), mock.calls());
  check(name, 'HTTP 200 + ok:true with the sheet as the only durable path', res.statusCode === 200 && body.ok === true, { status: res.statusCode, body });
  check(name, 'posted row is 11 strings, source column = "Form (website)"', Array.isArray(row) && row.length === 11 && row.every((v) => typeof v === 'string') && row[1] === 'Form (website)', row);
  await mock.close();
}

// ──────────── CASE 16 — an unfollowed 302 is never accepted as a write ────────────────
{
  const name = 'T-009 CASE 16 unfollowed 302 → 502, never a false ok:true';
  const req = validBody({ email: 'unfollowed@acme.example', message: 'A 302 that nobody followed is not a durable write.' });
  let res;
  let body;
  let fatal;
  await withEnv({ LEAD_STORE_WEBHOOK_URL: 'https://script.example.test/exec', RESEND_API_KEY: undefined }, async () => {
    const previous = globalThis.fetch;
    // Simulates a runtime that refuses to follow the redirect and hands the 302 back.
    globalThis.fetch = async (url, init = {}) => {
      outbound.push({ url: String(url), method: init.method || 'GET' });
      return {
        ok: false,
        status: 302,
        headers: {
          get: (key) => (String(key).toLowerCase() === 'location' ? 'https://script.googleusercontent.com/macros/echo?jwt=SECRETISH' : null)
        },
        text: async () => '',
        json: async () => ({})
      };
    };
    const capture = captureConsole();
    try {
      const result = await call({ body: req, ip: '198.51.100.31' });
      res = result.res;
      body = res.json();
      fatal = capture.entry('lead.delivery.failed');
    } finally {
      capture.restore();
      globalThis.fetch = previous;
    }
  });
  header(name, 'store answers 302 + Location; Resend unset → nothing durable');
  response(res.statusCode, body, { 'lead.delivery.failed': fatal });
  check(name, 'HTTP 502 — a 302 is never counted as a recorded lead', res.statusCode === 502, res.statusCode);
  check(
    name,
    'error names the redirect + host, and leaks neither the token nor the full URL',
    /302 redirect not followed/.test(fatal?.store || '') &&
      /script\.googleusercontent\.com/.test(fatal?.store || '') &&
      !/jwt=/.test(fatal?.store || '') &&
      !/script\.example\.test/.test(fatal?.store || ''),
    fatal?.store
  );
}

// ──────────── CASE 17 — Apps Script's only failure channel: {"ok":false} in a 200 ──────
{
  const name = 'T-009 CASE 17 200 body {"ok":false} counts as a failed write';
  const mock = await startMockWebApp((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'unauthorized: missing or wrong token' }));
  });
  let res;
  let body;
  let fatal;
  await withEnv({ LEAD_STORE_WEBHOOK_URL: mock.url('/exec'), RESEND_API_KEY: undefined }, async () => {
    const previous = globalThis.fetch;
    globalThis.fetch = nodeFetch;
    const capture = captureConsole();
    try {
      const result = await call({
        body: validBody({ email: 'rowfail@acme.example', message: 'Apps Script answered 200 but appended nothing.' }),
        ip: '198.51.100.32'
      });
      res = result.res;
      body = res.json();
      fatal = capture.entry('lead.delivery.failed');
    } finally {
      capture.restore();
      globalThis.fetch = previous;
    }
  });
  header(name, 'mock web app: 302 → 200 {"ok":false,"error":"unauthorized…"}; Resend unset');
  response(res.statusCode, body, { 'lead.delivery.failed': fatal });
  check(name, 'HTTP 502 — a 200 whose body says ok:false is not a recorded lead', res.statusCode === 502, res.statusCode);
  check(name, 'the Apps Script error text reaches the log', /store reported failure: unauthorized/.test(fatal?.store || ''), fatal?.store);
  await mock.close();
}

// ──────────── CASE 18 — sheet down, email up: the lead is never lost ──────────────────
{
  const name = 'T-009 CASE 18 sheet write fails + email succeeds → 200, loud WARN logged';
  const mock = await startMockWebApp((req, res) => {
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end('boom');
  });
  let res;
  let body;
  let warn;
  let captured;
  await withEnv({ LEAD_STORE_WEBHOOK_URL: `${mock.url('/exec')}?token=unit-test-url-token` }, async () => {
    const previous = globalThis.fetch;
    // Loopback goes to the mock web app, everything else keeps the fast stub.
    globalThis.fetch = (url, init = {}) => (String(url).indexOf('http://127.0.0.1') === 0 ? nodeFetch(url, init) : stubFetch(url, init));
    const capture = captureConsole();
    try {
      const result = await call({
        body: validBody({ email: 'sheetdown@acme.example', message: 'The sheet is down but the lead must still reach the inbox.' }),
        ip: '198.51.100.33'
      });
      res = result.res;
      body = res.json();
      warn = capture.entry('lead.store.failed');
      captured = capture.entry('lead.captured');
    } finally {
      capture.restore();
      globalThis.fetch = previous;
    }
  });
  header(name, 'mock web app: 302 → GET /content → HTTP 500; Resend → 200');
  response(res.statusCode, body, { 'lead.store.failed': warn, 'lead.captured': captured });
  check(name, 'HTTP 200 ok:true — the email path recorded the lead', res.statusCode === 200 && body.ok === true, { status: res.statusCode, body });
  check(name, 'WARN lead.store.failed is logged — a half-failure is never silent', /HTTP 500/.test(warn?.store || ''), warn);
  check(name, 'lead.captured reports the degraded store detail', captured?.store === 'HTTP 500', captured?.store);
  await mock.close();
}

// ──────────── CASE 19 — the row mapping itself (column order, empty strings) ──────────
{
  const name = 'T-009 CASE 19 row mapping: 11 columns, contractual order, "" for absent values';
  const req = validBody({
    company: '',
    sourcePage: '/#hire',
    message: 'Row mapping check for the shared Google Sheet sink.'
  });
  let res;
  let body;
  let row;
  await withEnv({ LEAD_STORE_WEBHOOK_URL: 'https://store.example.test/leads' }, async () => {
    const result = await call({ body: req, ip: '198.51.100.34' });
    res = result.res;
    body = res.json();
    row = outbound.find((c) => c.url === 'https://store.example.test/leads')?.body?.row;
  });
  const expectedTail = [
    'Form (website)', // 2  Source
    req.name, // 3  Name / Title
    '', // 4  Company (absent → empty string, not null)
    req.email, // 5  Email
    'Database & SQL Performance Rescue', // 6  Project / Type label
    '$5,000 – $15,000', // 7  Budget label
    '', // 8  Score — hunter rows only
    req.message, // 9  Message / Pitch
    '/#hire', // 10 Link = sourcePage
    body.id // 11 ID
  ];
  header(name, 'valid submission with company:"" and sourcePage:"/#hire"');
  response(res.statusCode, body, { row_length: row?.length });
  console.log('   ROW      ' + JSON.stringify(row));
  check(name, 'exactly 11 values', row?.length === 11, row);
  check(name, 'every value is a string', Array.isArray(row) && row.every((v) => typeof v === 'string'), row);
  check(name, 'no null / "null" / "undefined" in any cell', Array.isArray(row) && row.every((v) => v !== 'null' && v !== 'undefined'), row);
  check(name, 'columns 2–11 match the contract exactly, in order', JSON.stringify(row?.slice(1)) === JSON.stringify(expectedTail), { got: row?.slice(1), want: expectedTail });
  check(
    name,
    'column 1 is the ISO-8601 receipt timestamp',
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(String(row?.[0])) && Math.abs(Date.now() - Date.parse(row[0])) < 10000,
    row?.[0]
  );
}

// ── summary ───────────────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(76));
console.log(`RESULT: ${pass} assertions passed, ${fail} failed`);
if (failures.length) failures.forEach((f) => console.log(`   FAILED  ${f}`));
console.log(fail === 0 ? 'STATUS: ALL CASES PASS' : 'STATUS: FAILURES PRESENT');
console.log('═'.repeat(76));

// Exit code via process.exitCode, not process.exit(): the loopback mock web app leaves undici
// keep-alive sockets closing, and process.exit() during that teardown trips a libuv assertion on
// Windows (observed: exit 127 instead of 0). The unref'd fallback only fires if something wedges.
process.exitCode = fail === 0 ? 0 : 1;
setTimeout(() => process.exit(process.exitCode), 5000).unref();
