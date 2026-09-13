/**
 * T-006 — performance / Core Web Vitals measurement harness + enforced budget gate.
 *
 *   node scripts/measure-perf.mjs                          # build dist/, serve it, measure, gate
 *   node scripts/measure-perf.mjs --no-build               # reuse the existing dist/
 *   node scripts/measure-perf.mjs --url https://host/      # measure a remote URL (baseline mode)
 *   node scripts/measure-perf.mjs --label baseline --out docs/evidence/T-006/perf-baseline.json
 *
 * What it does, per run:
 *   1. production build (`vite build`) unless --no-build
 *   2. starts `vite preview` on a free port, waits for it, and ALWAYS stops it again
 *   3. drives headless Chrome over CDP with a cold cache and records, from the browser itself:
 *        - every network response and its real transfer bytes (encodedDataLength)
 *        - LCP and CLS from PerformanceObserver in the page
 *        - event-timing durations for a fixed set of synthetic interactions (INP *proxy* only)
 *        - loadEventEnd of the navigation
 *   4. runs Lighthouse (mobile, simulated throttling) for the Lighthouse score
 *   5. prints a PASS/FAIL table and exits non-zero if an enforced budget is breached
 *
 * Two measured passes, one per viewport:
 *   mobile  390x844 @2x, Lighthouse-equivalent Slow-4G + 4x CPU throttling
 *   desktop 1440x900 @1x, no throttling (lab)
 *
 * Honest limitations are printed at the end of every run and written down in docs/PERF-BUDGET.md.
 * Nothing here is estimated: a metric that could not be captured is reported as NOT MEASURED.
 */
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------- budgets
// Enforced by scripts/measure-perf.mjs. Sourced from docs/PRD.md §1/§9.
// REBASELINED 2026-09-13 by BOSS decision: pass 1 gates on Lighthouse mobile
// >= 60; the pass-2 target stays 90 and is what docs/PRD.md §9 specifies.
// See docs/PERF-BUDGET.md row 7.
export const BUDGETS = {
  transferBytes: 500 * 1024, // < 500 KB total page transfer (all resources)
  loadMs: 1000, // < 1,000 ms loadEventEnd on the local preview (unthrottled)
  lcpMs: 2500, // < 2.5 s LCP (mobile, throttled) — measured and reported in pass 1
  inpMs: 200, // < 200 ms worst event duration for the scripted interaction set (INP proxy)
  cls: 0.1, // < 0.1 CLS
  lighthouseMobile: 60, // >= 60 Lighthouse mobile performance, pass-1 gate (BOSS 2026-09-13)
  lighthouseMobilePass2: 90, // pass-2 / PRD target — not enforced yet
};

const MOBILE = { name: 'mobile', width: 390, height: 844, dpr: 2, throttle: true };
const DESKTOP = { name: 'desktop', width: 1440, height: 900, dpr: 1, throttle: false };
// Lighthouse's documented "mobileSlow4G" preset, applied for real by the browser.
const SLOW_4G = { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 };
const MOBILE_UA =
  'Mozilla/5.0 (Linux; Android 12; Moto G Power) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';

// ---------------------------------------------------------------- args
const argv = process.argv.slice(2);
const arg = (name, fallback = undefined) => {
  const i = argv.indexOf(name);
  return i === -1 ? fallback : argv[i + 1];
};
const flag = (name) => argv.includes(name);

const OPT = {
  url: arg('--url', null),
  noBuild: flag('--no-build'),
  label: arg('--label', 'current'),
  out: arg('--out', 'docs/evidence/T-006/perf-report.json'),
  port: Number(arg('--port', '4188')),
  skipLighthouse: flag('--skip-lighthouse'),
};
const remote = Boolean(OPT.url);

// ---------------------------------------------------------------- helpers
const kb = (b) => `${Math.round(b / 1024)} KB`;
const num = (n, d = 0) => (n === null || n === undefined ? 'n/a' : Number(n).toFixed(d));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    path.join(os.homedir(), 'AppData/Local/Google/Chrome/Application/chrome.exe'),
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ].filter(Boolean);
  for (const c of candidates) if (fs.existsSync(c)) return c;
  throw new Error('No Chrome/Edge binary found. Set CHROME_PATH to a Chromium executable.');
}

async function httpText(url, timeoutMs = 30000) {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  return { status: res.status, text: await res.text(), headers: res.headers };
}

async function waitForHttp(url, timeoutMs = 45000) {
  const deadline = Date.now() + timeoutMs;
  let last = '';
  while (Date.now() < deadline) {
    try {
      const r = await httpText(url, 5000);
      if (r.status >= 200 && r.status < 500) return true;
      last = `HTTP ${r.status}`;
    } catch (e) {
      last = e.message;
    }
    await sleep(250);
  }
  throw new Error(`Timed out waiting for ${url} (${last})`);
}

const portFree = (port) =>
  new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', () => resolve(false));
    s.listen(port, '127.0.0.1', () => s.close(() => resolve(true)));
  });

// ---------------------------------------------------------------- minimal CDP client
class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Map(); // `${sessionId || ''}:${method}` -> [fn]
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(typeof ev.data === 'string' ? ev.data : ev.data.toString());
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(`${msg.error.message} (${msg.error.code})`)) : resolve(msg.result);
      } else if (msg.method) {
        for (const fn of this.listeners.get(`${msg.sessionId || ''}:${msg.method}`) || []) fn(msg.params);
        for (const fn of this.listeners.get(`*:${msg.method}`) || []) fn(msg.params);
      }
    });
  }
  static async connect(wsUrl) {
    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', (e) => reject(new Error('CDP socket error: ' + (e.message || 'unknown'))), { once: true });
    });
    return new Cdp(ws);
  }
  on(method, fn, sessionId = '') {
    const key = `${sessionId}:${method}`;
    if (!this.listeners.has(key)) this.listeners.set(key, []);
    this.listeners.get(key).push(fn);
  }
  send(method, params = {}, sessionId = undefined) {
    const id = ++this.id;
    this.ws.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
}

const PROBE = `(() => {
  const S = { lcp: null, lcpEl: null, lcpUrl: null, lcpInRoot: null, lcpEntries: [], cls: 0, shifts: [], events: [], longtasks: [], ltTotal: 0 };
  Object.defineProperty(window, '__perfProbe', { value: S, configurable: true });
  const root = () => document.getElementById('root');
  const describe = (el) => {
    try {
      return {
        tag: (el.tagName || '?').toLowerCase(),
        id: el.id || null,
        cls: el.className && typeof el.className === 'string' ? el.className.slice(0, 60) : null,
        text: (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 40),
        inRoot: Boolean(root() && root().contains(el)),
      };
    } catch (e) { return null; }
  };
  const obs = (type, cb, opts = {}) => { try { new PerformanceObserver(cb).observe({ type, buffered: true, ...opts }); } catch (e) {} };
  obs('largest-contentful-paint', (l) => {
    for (const e of l.getEntries()) {
      S.lcp = e.startTime;
      S.lcpEl = e.element ? describe(e.element) : null;
      S.lcpUrl = e.url || null;
      S.lcpInRoot = S.lcpEl ? S.lcpEl.inRoot : null;
      S.lcpEntries.push({ start: Math.round(e.startTime), size: e.size, tag: S.lcpEl ? S.lcpEl.tag : null, text: S.lcpEl ? S.lcpEl.text : null });
    }
  });
  obs('layout-shift', (l) => { for (const e of l.getEntries()) { if (!e.hadRecentInput) { S.cls += e.value; S.shifts.push({ value: e.value, start: e.startTime }); } } });
  obs('event', (l) => { for (const e of l.getEntries()) S.events.push({ name: e.name, dur: e.duration, start: e.startTime, proc: e.processingStart - e.startTime, pres: e.processingEnd - e.processingStart }); }, { durationThreshold: 0 });
  obs('longtask', (l) => { for (const e of l.getEntries()) { S.ltTotal += e.duration; S.longtasks.push(Math.round(e.duration)); } });
})();`;

// Event names that carry an interactionId per the Event Timing spec — the ones INP is computed from.
// pointerover/out/move are deliberately excluded: they are not interactions under the spec.
const INPUT_EVENT_NAMES = ['pointerdown', 'pointerup', 'click', 'mousedown', 'mouseup', 'keydown', 'keyup', 'pointercancel'];

/** One measured page-load pass in a fresh isolated browser context, cold cache, given viewport + throttling. */
async function measurePass(cdp, url, view, origin) {
  let browserContextId;
  try {
    ({ browserContextId } = await cdp.send('Target.createBrowserContext'));
  } catch {
    browserContextId = undefined; // older Chrome: fall back to the default context
  }
  const { targetId } = await cdp.send('Target.createTarget', {
    url: 'about:blank',
    ...(browserContextId ? { browserContextId } : {}),
  });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  const send = (m, p) => cdp.send(m, p, sessionId);

  const requests = new Map(); // requestId -> {url,type}
  const byUrl = new Map(); // url -> bytes (last response)
  const responses = [];
  cdp.on('Network.requestWillBeSent', (p) => requests.set(p.requestId, { url: p.request.url, type: p.type }), sessionId);
  cdp.on('Network.responseReceived', (p) => {
    const r = p.response;
    responses.push({
      url: r.url,
      status: r.status,
      type: p.type,
      mimeType: r.mimeType,
      fromCache: Boolean(r.fromDiskCache || r.fromServiceWorker || r.fromPrefetchCache),
      contentEncoding: r.headers && (r.headers['content-encoding'] || r.headers['Content-Encoding']),
      protocol: r.protocol,
    });
  }, sessionId);
  cdp.on('Network.loadingFinished', (p) => {
    const req = requests.get(p.requestId);
    const url = req ? req.url : responses.find((r) => r.url && r.url.endsWith('?'))?.url;
    if (!url || !req) return;
    byUrl.set(url, (byUrl.get(url) || 0) + (p.encodedDataLength || 0));
  }, sessionId);

  await send('Page.enable');
  await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Network.clearBrowserCache');
  await send('Emulation.setDeviceMetricsOverride', {
    width: view.width,
    height: view.height,
    deviceScaleFactor: view.dpr,
    mobile: view.name === 'mobile',
  });
  if (view.name === 'mobile') await send('Emulation.setUserAgentOverride', { userAgent: MOBILE_UA });
  await send('Emulation.setCPUThrottlingRate', { rate: view.throttle ? 4 : 1 });
  await send('Network.emulateNetworkConditions', view.throttle ? SLOW_4G : { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: PROBE });

  const loaded = new Promise((resolve) => cdp.on('Page.loadEventFired', resolve, sessionId));
  const t0 = Date.now();
  await send('Page.navigate', { url });
  await Promise.race([loaded, sleep(30000)]);
  const loadWallMs = Date.now() - t0;

  // Let late paint/shift/event entries land before reading the probe.
  await sleep(view.name === 'mobile' ? 1500 : 1200);

  const nav = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const origin = ${JSON.stringify(origin)};
      const n = performance.getEntriesByType('navigation')[0] || {};
      const res = performance.getEntriesByType('resource');
      const own = res.filter((r) => r.name.startsWith(origin));
      const third = res.filter((r) => !r.name.startsWith(origin));
      const last = (arr) => (arr.length ? Math.round(Math.max(...arr.map((r) => r.responseEnd))) : null);
      return {
        loadEventEnd: n.loadEventEnd || null,
        domContentLoaded: n.domContentLoadedEventEnd || null,
        responseEnd: n.responseEnd || null,
        resources: res.length,
        firstPartyResources: own.length,
        firstPartyLastResponseEndMs: last(own),
        thirdPartyLastResponseEndMs: last(third),
        transferSizeSameOrigin: own.reduce((a, r) => a + (r.transferSize || 0), 0),
        probe: window.__perfProbe || null,
      };
    })()`,
  });
  const page = nav.result.value;

  // ---- synthetic interaction set for the INP proxy -------------------------
  const targets = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const out = [];
      const root = document.getElementById('root') || document.body;
      const where = (el) => (root.contains(el) ? 'app' : 'third-party');
      const label = (el) =>
        ((el.tagName || '').toLowerCase() + ':' + (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 18)).slice(0, 34);
      const push = (name, el) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.width < 8 || r.height < 8 || r.top < 0 || r.bottom > innerHeight) return;
        out.push({ name, label: label(el), from: where(el), x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) });
      };
      push('nav-link', root.querySelector('nav a[href^="#"]'));
      push('theme-toggle', root.querySelector('[aria-label*="heme" i], [title*="heme" i]'));
      const buttons = [...root.querySelectorAll('button, [role="button"]')].filter((b) => b.offsetParent);
      push('button-1', buttons[0]);
      push('button-2', buttons[1]);
      return out;
    })()`,
  });
  const interactions = [];
  const statsAfter = (from) =>
    send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const names = ${JSON.stringify(INPUT_EVENT_NAMES)};
        const ev = window.__perfProbe.events;
        const tail = ev.slice(${from}).filter((e) => names.includes(e.name));
        return { n: ev.length, worst: tail.reduce((m, e) => (e.dur > m ? e.dur : m), 0), names: tail.map((e) => e.name + ':' + Math.round(e.dur)) };
      })()`,
    });
  for (const t of targets.result.value || []) {
    const before = await send('Runtime.evaluate', { returnByValue: true, expression: 'window.__perfProbe.events.length' });
    for (const type of ['mousePressed', 'mouseReleased']) {
      await send('Input.dispatchMouseEvent', { type, x: t.x, y: t.y, button: 'left', clickCount: 1, buttons: type === 'mousePressed' ? 1 : 0 });
    }
    await sleep(400);
    const after = await statsAfter(before.result.value || 0);
    const stat = after.result.value || { n: 0, worst: 0, names: [] };
    interactions.push({
      ...t,
      kind: 'click',
      newEventEntries: (stat.n || 0) - (before.result.value || 0),
      worstEventMs: Math.round(stat.worst || 0),
      events: stat.names || [],
    });
  }
  // one keyboard interaction (real input pipeline, so it produces event-timing entries too)
  const beforeKey = await send('Runtime.evaluate', { returnByValue: true, expression: 'window.__perfProbe.events.length' });
  for (const type of ['rawKeyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
  await sleep(300);
  const afterKey = await statsAfter(beforeKey.result.value || 0);
  const keyStat = afterKey.result.value || { n: 0, worst: 0, names: [] };
  interactions.push({
    name: 'keyboard-tab',
    kind: 'keydown',
    label: 'Tab',
    from: 'keyboard',
    newEventEntries: (keyStat.n || 0) - (beforeKey.result.value || 0),
    worstEventMs: Math.round(keyStat.worst || 0),
    events: keyStat.names || [],
  });

  const post = await send('Runtime.evaluate', { returnByValue: true, expression: 'window.__perfProbe' });
  const probeInstalled = Boolean(post.result && post.result.value);
  if (!probeInstalled) {
    console.log(`      !! CWV PROBE DID NOT INSTALL in the ${view.name} pass — LCP/CLS/INP are reported as NOT MEASURED, not as zero`);
  }
  const probe = post.result.value || {};

  await cdp.send('Target.closeTarget', { targetId });
  if (browserContextId) {
    try {
      await cdp.send('Target.disposeBrowserContext', { browserContextId });
    } catch {}
  }

  const assets = [...byUrl.entries()].map(([u, bytes]) => ({ url: u, bytes })).sort((a, b) => b.bytes - a.bytes);
  const encodings = new Map(responses.map((r) => [r.url, r.contentEncoding || 'identity']));
  const totalBytes = assets.reduce((a, x) => a + x.bytes, 0);
  const firstPartyBytes = assets.filter((a) => a.url.startsWith(origin)).reduce((a, x) => a + x.bytes, 0);
  const thirdPartyBytes = totalBytes - firstPartyBytes;

  const events = probe.events || [];
  const worst = events.reduce((m, e) => (e.dur > m.dur ? e : m), { name: 'none', dur: 0 });
  const inputEvents = events.filter((e) => INPUT_EVENT_NAMES.includes(e.name));

  return {
    viewport: view,
    viewportLabel: `${view.width}x${view.height} @${view.dpr}x${view.throttle ? ' slow-4G/4xCPU' : ' unthrottled'}`,
    url,
    probeInstalled,
    load: {
      loadEventEndMs: page.loadEventEnd ? Math.round(page.loadEventEnd) : null,
      domContentLoadedMs: page.domContentLoaded ? Math.round(page.domContentLoaded) : null,
      wallClockToLoadEventMs: loadWallMs,
      firstPartyLastResponseEndMs: page.firstPartyLastResponseEndMs ?? null,
      thirdPartyLastResponseEndMs: page.thirdPartyLastResponseEndMs ?? null,
      firstPartyResources: page.firstPartyResources ?? null,
    },
    transfer: {
      totalBytes,
      firstPartyBytes,
      thirdPartyBytes,
      resourceCount: (byUrl.size),
      requestsSeen: responses.length,
      top10: assets.slice(0, 10).map((a) => ({ ...a, contentEncoding: encodings.get(a.url) || 'identity', thirdParty: !a.url.startsWith(origin) })),
    },
    cwv: {
      lcpMs: probe.lcp === null || probe.lcp === undefined ? null : Math.round(probe.lcp),
      lcpElement: probe.lcpEl || null,
      lcpInRoot: probe.lcpInRoot === undefined ? null : probe.lcpInRoot,
      lcpUrl: probe.lcpUrl || null,
      lcpEntries: probe.lcpEntries || [],
      cls: typeof probe.cls === 'number' ? Number(probe.cls.toFixed(4)) : null,
      clsShifts: (probe.shifts || []).length,
      inpProxyMs: inputEvents.length ? Math.round(Math.max(...inputEvents.map((e) => e.dur))) : null,
      inpProxyEvents: inputEvents.length,
      worstEvent: { name: worst.name, durMs: Math.round(worst.dur) },
      eventEntries: (probe.events || []).length,
      longTasks: (probe.longtasks || []).length,
      longTaskTotalMs: Math.round(probe.ltTotal || 0),
      longTaskWorstMs: (probe.longtasks || []).length ? Math.max(...probe.longtasks) : 0,
    },
    interactions,
  };
}

// ---------------------------------------------------------------- Lighthouse
async function runLighthouse(url, chromePath, outDir, label = 'current') {
  let lighthouse;
  let launch;
  try {
    ({ default: lighthouse } = await import('lighthouse'));
    ({ launch } = await import('chrome-launcher'));
  } catch (e) {
    return { ran: false, error: `lighthouse not installed (${e.message}). Run: npm install` };
  }
  const chrome = await launch({
    chromePath,
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });
  try {
    const result = await lighthouse(
      url,
      { port: chrome.port, output: ['json', 'html'], logLevel: 'error', onlyCategories: ['performance'] },
      undefined // default config = mobile preset + simulated throttling
    );
    const lhr = result.lhr;
    fs.mkdirSync(outDir, { recursive: true });
    const jsonPath = path.join(outDir, `lighthouse-${label}.json`);
    const htmlPath = path.join(outDir, `lighthouse-${label}.html`);
    fs.writeFileSync(jsonPath, JSON.stringify(lhr, null, 2));
    fs.writeFileSync(htmlPath, result.report.find((r) => r.startsWith('<!')) || String(result.report));
    const a = lhr.audits;
    return {
      ran: true,
      score: Math.round(lhr.categories.performance.score * 100),
      formFactor: lhr.configSettings.formFactor,
      throttlingMethod: lhr.configSettings.throttlingMethod,
      lcpMs: a['largest-contentful-paint'] ? Math.round(a['largest-contentful-paint'].numericValue) : null,
      cls: a['cumulative-layout-shift'] ? Number(a['cumulative-layout-shift'].numericValue.toFixed(4)) : null,
      tbtMs: a['total-blocking-time'] ? Math.round(a['total-blocking-time'].numericValue) : null,
      fcpMs: a['first-contentful-paint'] ? Math.round(a['first-contentful-paint'].numericValue) : null,
      speedIndexMs: a['speed-index'] ? Math.round(a['speed-index'].numericValue) : null,
      inpAudit: a['interaction-to-next-paint'] ? a['interaction-to-next-paint'].scoreDisplayMode : 'not present in this Lighthouse version',
      reportHtml: path.relative(ROOT, htmlPath).replace(/\\/g, '/'),
      reportJson: path.relative(ROOT, jsonPath).replace(/\\/g, '/'),
    };
  } finally {
    try {
      await chrome.kill();
    } catch {}
  }
}

// ---------------------------------------------------------------- main
async function main() {
  const started = Date.now();
  console.log(`\n=== perf harness (T-006) — ${remote ? 'REMOTE baseline' : 'local built artifact'} mode ===`);
  // self-check: the injected CWV probe must be valid JS, or every CWV row would silently vanish.
  try {
    new Function(PROBE);
  } catch (e) {
    throw new Error(`the injected CWV probe is not valid JavaScript (${e.message}) — refusing to measure`);
  }
  const chromePath = findChrome();
  console.log(`chrome: ${chromePath}`);
  console.log(`label:  ${OPT.label}`);

  let preview = null;
  let previewLog = '';
  let chrome = null;
  let cdp = null;
  const outDir = path.dirname(path.resolve(ROOT, OPT.out));

  try {
    // 1) build + serve, or use --url directly
    let targetUrl = OPT.url;
    if (!remote) {
      if (!OPT.noBuild) {
        console.log('\n[1/4] vite build …');
        await new Promise((resolve, reject) => {
          const p = spawn(process.execPath, [path.join(ROOT, 'node_modules/vite/bin/vite.js'), 'build'], { cwd: ROOT, stdio: 'inherit' });
          p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`vite build exited ${code}`))));
        });
      } else {
        console.log('\n[1/4] --no-build: reusing existing dist/');
      }
      if (!fs.existsSync(path.join(ROOT, 'dist/index.html'))) throw new Error('dist/index.html missing — run without --no-build');

      const free = await portFree(OPT.port);
      if (!free) throw new Error(`port ${OPT.port} is already in use — refusing to start (try --port <n>)`);
      console.log(`[2/4] vite preview on 127.0.0.1:${OPT.port} …`);
      preview = spawn(process.execPath, [path.join(ROOT, 'node_modules/vite/bin/vite.js'), 'preview', '--port', String(OPT.port), '--strictPort', '--host', '127.0.0.1'], {
        cwd: ROOT,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      preview.stdout.on('data', (d) => (previewLog += d.toString()));
      preview.stderr.on('data', (d) => (previewLog += d.toString()));
      targetUrl = `http://127.0.0.1:${OPT.port}/`;
      await waitForHttp(targetUrl);
      console.log(`      preview up: ${targetUrl}`);
    } else {
      console.log(`\n[1/4] remote mode, no build/serve: ${targetUrl}`);
      await waitForHttp(targetUrl);
    }

    // 2) headless chrome over CDP
    console.log('[3/4] headless Chrome over CDP (cold cache) …');
    const debugPort = OPT.port + 100;
    const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'perf-cdp-'));
    chrome = spawn(
      chromePath,
      [
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-component-update',
        '--disable-sync',
        '--metrics-recording-only',
        '--mute-audio',
        '--hide-scrollbars',
        '--window-size=1440,900',
        `--user-data-dir=${profileDir}`,
        `--remote-debugging-port=${debugPort}`,
        'about:blank',
      ],
      { stdio: 'ignore' }
    );
    let version = null;
    for (let i = 0; i < 60 && !version; i++) {
      try {
        version = await httpText(`http://127.0.0.1:${debugPort}/json/version`, 3000);
      } catch {
        await sleep(250);
      }
    }
    if (!version) throw new Error('headless Chrome DevTools endpoint never came up');
    cdp = await Cdp.connect(JSON.parse(version.text).webSocketDebuggerUrl);

    const origin = new URL(targetUrl).origin;
    const passes = {};
    for (const view of [MOBILE, DESKTOP]) {
      console.log(`      measuring ${view.name} (${view.width}x${view.height} @${view.dpr}x) …`);
      passes[view.name] = await measurePass(cdp, targetUrl, view, origin);
    }

    // 3) Lighthouse (mobile, simulated throttling) against the same target
    console.log('[4/4] Lighthouse mobile …');
    const lighthouse = OPT.skipLighthouse
      ? { ran: false, error: '--skip-lighthouse' }
      : await runLighthouse(targetUrl, chromePath, outDir, OPT.label);

    // 4) gate
    const m = passes.mobile;
    const d = passes.desktop;
    const rows = [];
    // `reportOnly` rows are MEASURED and REPORTED but do not gate pass 1 — the
    // 2026-09-13 BOSS decision rebased pass 1 to "Lighthouse mobile >= 60, with
    // LCP/CLS/TBT measured and reported rather than gating". The row still
    // carries its budget and its real number; it just reads REPORTED instead of
    // FAIL and is excluded from the exit code. The pass-2 target is unchanged.
    const push = (metric, measured, budget, pass, note = '', reportOnly = false) =>
      rows.push({
        metric,
        measured,
        budget,
        pass,
        note,
        reportOnly,
        status: pass === null ? 'NOT MEASURED' : reportOnly ? (pass ? 'PASS' : 'REPORTED') : pass ? 'PASS' : 'FAIL',
      });
    const pushReported = (metric, measured, budget, pass, note) => push(metric, measured, budget, pass, note, true);

    const totalTransfer = Math.max(m.transfer.totalBytes, d.transfer.totalBytes);
    push('Total page transfer (all resources, cold cache)', `${kb(m.transfer.totalBytes)} (mobile) / ${kb(d.transfer.totalBytes)} (desktop)`, `< ${kb(BUDGETS.transferBytes)}`, totalTransfer < BUDGETS.transferBytes, `${m.transfer.requestsSeen} responses, ${m.transfer.resourceCount} distinct URLs (mobile); preview serves gzip, Vercel serves brotli`);
    push('First-party transfer', `${kb(m.transfer.firstPartyBytes)} (mobile) / ${kb(d.transfer.firstPartyBytes)} (desktop)`, `< ${kb(BUDGETS.transferBytes)}`, Math.max(m.transfer.firstPartyBytes, d.transfer.firstPartyBytes) < BUDGETS.transferBytes, `third-party: ${kb(m.transfer.thirdPartyBytes)} mobile / ${kb(d.transfer.thirdPartyBytes)} desktop`);

    const loadMs = d.load.loadEventEndMs ?? d.load.wallClockToLoadEventMs;
    push('Load (loadEventEnd, local preview, unthrottled)', `${loadMs} ms (desktop)`, `< ${BUDGETS.loadMs} ms`, loadMs < BUDGETS.loadMs, `${remote ? 'REMOTE run — recorded as the baseline; this budget is defined for the local preview. ' : ''}first-party resources done at ${d.load.firstPartyLastResponseEndMs} ms, last third-party at ${d.load.thirdPartyLastResponseEndMs} ms; mobile throttled load ${m.load.loadEventEndMs} ms (informational)`);

    pushReported('LCP (mobile, slow-4G + 4x CPU)', m.cwv.lcpMs === null ? 'NOT MEASURED' : `${m.cwv.lcpMs} ms`, `< ${BUDGETS.lcpMs} ms`, m.cwv.lcpMs === null ? null : m.cwv.lcpMs < BUDGETS.lcpMs, m.probeInstalled ? `element: ${m.cwv.lcpElement ? `${m.cwv.lcpElement.tag}${m.cwv.lcpElement.id ? '#' + m.cwv.lcpElement.id : ''} ${m.cwv.lcpInRoot === false ? '(NOT in #root — third-party UI)' : '(in #root)'} "${m.cwv.lcpElement.text || ''}"` : 'n/a'}; Lighthouse LCP ${lighthouse.lcpMs ? lighthouse.lcpMs + ' ms' : 'n/a'}` : 'the CWV probe did not install in the mobile pass — no LCP entry was observable, so no number is reported');

    const cwvOk = Boolean(m.probeInstalled && d.probeInstalled);
    push('CLS', cwvOk ? `${m.cwv.cls} (mobile) / ${d.cwv.cls} (desktop)` : 'NOT MEASURED', `< ${BUDGETS.cls}`, cwvOk ? Math.max(m.cwv.cls, d.cwv.cls) < BUDGETS.cls : null, cwvOk ? `${m.cwv.clsShifts + d.cwv.clsShifts} layout-shift entries` : 'the CWV probe did not install in at least one pass — CLS is unknown, not zero');

    // INP: not a field measurement. Enforced only when the scripted interaction set produced events.
    if (m.cwv.inpProxyMs === null) {
      push('INP', 'NOT MEASURED', `< ${BUDGETS.inpMs} ms`, null, m.probeInstalled ? 'no event-timing entries were produced by the scripted interactions — INP is not enforced by this run (never invented)' : 'the CWV probe did not install, so no event-timing entries existed — INP unknown, not zero');
    } else {
      push('INP (proxy: scripted interactions, lab)', `${m.cwv.inpProxyMs} ms`, `< ${BUDGETS.inpMs} ms`, m.cwv.inpProxyMs < BUDGETS.inpMs, `worst event-timing duration over ${m.cwv.inpProxyEvents} input-driven entries; per-interaction maxima: ${m.interactions.map((i) => `${i.name} ${i.worstEventMs} ms`).join(', ')}; NOT field INP (no real users, no RUM)`);
    }

    push('CWV probe installed (harness integrity)', cwvOk ? 'yes, both passes' : 'NO', 'required', cwvOk, cwvOk ? 'PerformanceObserver injected before navigation in both passes; a missing probe would show up as NOT MEASURED rows, never as zeros' : 'the injected probe is broken — no CWV row in this run may be quoted');

    push('Lighthouse mobile performance', lighthouse.ran ? String(lighthouse.score) : 'NOT MEASURED', `>= ${BUDGETS.lighthouseMobile}`, lighthouse.ran ? lighthouse.score >= BUDGETS.lighthouseMobile : null, lighthouse.ran ? `${lighthouse.formFactor}, ${lighthouse.throttlingMethod} throttling, TBT ${lighthouse.tbtMs} ms` : lighthouse.error);

    const enforced = rows.filter((r) => r.status !== 'NOT MEASURED' && r.status !== 'REPORTED');
    const failed = enforced.filter((r) => !r.pass);
    const report = {
      label: OPT.label,
      generatedAt: new Date().toISOString(),
      mode: remote ? 'remote' : 'local-build',
      target: targetUrl,
      commit: null,
      budgets: BUDGETS,
      lighthouse,
      passes,
      rows,
      result: failed.length ? 'FAIL' : 'PASS',
      durationMs: Date.now() - started,
    };
    const gitOut = (args) =>
      new Promise((res) => {
        const p = spawn('git', args, { cwd: ROOT });
        let out = '';
        p.stdout.on('data', (x) => (out += x));
        p.on('error', () => res(''));
        p.on('exit', () => res(out.trim()));
      });
    try {
      report.commit = (await gitOut(['rev-parse', 'HEAD'])) || null;
      const statusLines = (await gitOut(['status', '--porcelain'])).split('\n').filter(Boolean);
      report.treeDirty = statusLines.length > 0;
      report.dirtyFiles = statusLines.slice(0, 20);
      report.treeNote = report.treeDirty
        ? `measured from a DIRTY working tree (${statusLines.length} uncommitted path(s)) — these numbers describe this tree, not commit ${report.commit}`
        : `clean tree at ${report.commit}`;
    } catch {}

    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.resolve(ROOT, OPT.out), JSON.stringify(report, null, 2));

    // ---- print the table ---------------------------------------------------
    const w = [46, 40, 20, 14];
    const line = (c) => '  ' + c[0].padEnd(w[0]) + c[1].padEnd(w[1]) + c[2].padEnd(w[2]) + c[3].padEnd(w[3]);
    console.log(`\n=== PERF BUDGET GATE — ${report.result} (${OPT.label}) ===`);
    console.log(`target: ${targetUrl}`);
    console.log(`tree:   ${report.treeNote || 'n/a'}\n`);
    console.log(line(['METRIC', 'MEASURED', 'BUDGET', 'RESULT']));
    console.log('  ' + '-'.repeat(w.reduce((a, b) => a + b, 0)));
    for (const r of rows) console.log(line([r.metric.slice(0, w[0] - 1), r.measured.slice(0, w[1] - 1), r.budget, r.status]));
    console.log('\n  notes:');
    for (const r of rows) if (r.note) console.log(`   - ${r.metric}: ${r.note}`);
    for (const p of [m, d]) {
      console.log(`\n  interactions dispatched — ${p.viewport.name}:`);
      for (const i of p.interactions) console.log(`    ${i.kind.padEnd(8)} ${String(i.name).padEnd(14)} ${String(i.from).padEnd(12)} ${String(i.label).padEnd(34)} worstEvent=${String(i.worstEventMs).padStart(5)} ms  newEventEntries=${i.newEventEntries}`);
    }

    for (const p of [m, d]) {
      console.log(`\n  top assets — ${p.viewport.name} (${p.viewportLabel}):`);
      console.log(`    ${'BYTES'.padStart(9)}  ${'ENCODING'.padEnd(9)} ${'3P'.padEnd(3)} URL`);
      for (const a of p.transfer.top10) console.log(`    ${String(a.bytes).padStart(9)}  ${(a.contentEncoding || 'identity').padEnd(9)} ${(a.thirdParty ? 'yes' : '-').padEnd(3)} ${a.url}`);
      console.log(`    loadEventEnd ${p.load.loadEventEndMs} ms | DOMContentLoaded ${p.load.domContentLoadedMs} ms | resources ${p.transfer.resourceCount} | long tasks ${p.cwv.longTasks} (worst ${p.cwv.longTaskWorstMs} ms) | interactions dispatched ${p.interactions.length}`);
    }

    console.log(`\n  report: ${OPT.out}`);
    console.log(`\n  HONEST LIMITATIONS (what this harness does NOT measure):
   - INP is NOT field INP. No real users exist here; the row above is the worst event-timing duration
     for a scripted interaction set in a lab tab. Field INP needs real-user monitoring (web-vitals RUM).
   - Lighthouse results are simulated-throttling lab numbers (mobile preset, single run) — they vary
     run to run with machine load; they are not CrUX field data.
   - CLS is read ~1.2-1.5 s after loadEventFired; shifts triggered by later interaction are not counted.
   - Remote (--url) runs depend on the deployed build and the network, not on this working tree.
   - This harness measures weight/CWV only; it says nothing about image fidelity (see
     scripts/check-image-fidelity.mjs) or accessibility.`);
    console.log(`\nexit ${failed.length ? 1 : 0}${failed.length ? ' — breached: ' + failed.map((f) => f.metric).join('; ') : ''}`);
    process.exitCode = failed.length ? 1 : 0;
  } finally {
    // ---- teardown: never leave chrome or a preview server behind -------------
    try {
      if (cdp) {
        await Promise.race([cdp.send('Browser.close'), sleep(2000)]);
        cdp.ws.close();
      }
    } catch {}
    try {
      if (chrome && chrome.exitCode === null) chrome.kill();
    } catch {}
    try {
      if (preview && preview.exitCode === null) preview.kill();
    } catch {}
    await sleep(1200);
    if (!remote) {
      const free = await portFree(OPT.port);
      console.log(`\nteardown: preview server stopped, port ${OPT.port} ${free ? 'is free' : 'STILL IN USE — a process was left behind'}`);
      if (!free) process.exitCode = 1;
    }
    console.log(`teardown: headless Chrome closed (exitCode ${chrome ? chrome.exitCode : 'n/a'})`);
  }
}

main().catch((err) => {
  console.error(`\nharness error: ${err.message}`);
  process.exitCode = 1;
});
