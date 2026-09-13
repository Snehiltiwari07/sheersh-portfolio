/**
 * scripts/lead-hunter-sheet-test.mjs
 *
 * Runs scripts/lead-hunter.js OUTSIDE GitHub Actions, in a node:vm sandbox whose network is stubbed
 * (Reddit / RemoteOK / Hacker News / We Work Remotely / Apify / Remotive / Groq / Resend answers are
 * fixtures), so the ADDITIVE Google Sheet mirror added by card T-010 is exercised as real code output
 * instead of "should work in the cron".
 *
 * Proves:
 *   • the 11-column row, its exact order, and that every cell is a string (never null / "undefined")
 *   • the Source label per platform, including the six sources the hunter actually fetches
 *   • Company parsed from a "<role> (<company>)" title, and '' when there is none
 *   • only Groq-qualified leads are mirrored — the same set that appears in the digest
 *   • the digest email STILL SENDS when the sheet push fails, for every failure mode we can produce:
 *     HTTP 500, an Apps Script 200 carrying {"ok":false}, a thrown network error, a REAL refused
 *     TCP connection on 127.0.0.1, and a malformed URL
 *   • an unset LEAD_STORE_WEBHOOK_URL is a silent skip with one log line, and the pipeline still exits 0
 *
 * Does NOT prove: a real GitHub Actions cron execution (impossible from here), a real Google Sheet, a
 * real Resend delivery, or real Apify/Reddit/Groq responses. The only real network call in this file
 * is one deliberate connection to a closed loopback port.
 *
 * Run:  npm run test:hunter   (or: node scripts/lead-hunter-sheet-test.mjs)
 * Exit: 0 = every case passed, 1 = at least one failed.
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import vm from 'node:vm';
import http from 'node:http';

const SOURCE = await readFile(resolve('scripts/lead-hunter.js'), 'utf8');
const SHEET_URL = 'https://sheet.example.test/exec?token=unit-test-token';

/* ───────────────────────────── fixtures (deterministic) ───────────────────────────── */

const REDDIT_TITLE = '[HIRING] React dashboard for a logistics startup (Northwind Freight)';
const HN_TITLE = 'Acme Systems is hiring a backend engineer';
const HN_TITLE_REMOTE = 'Acme Systems is hiring a backend engineer (Remote)';
const WWR_TITLE = 'Orbit Labs: Full Stack Developer';

const redditPosts = (n) =>
  Array.from({ length: n }, (_, i) => ({
    data: {
      id: `r${i + 1}`,
      title: i === 0 ? REDDIT_TITLE : `[HIRING] Node backend help wanted ${i + 1} (Freight Co ${i + 1})`,
      selftext: 'We need a React + Node build. Budget $45/hr, start next week.',
      permalink: `/r/forhire/comments/r${i + 1}/dev_wanted/`,
      created_utc: 1789000000 + i
    }
  }));

const remoteOkJobs = (n) => [
  { legal: 'fixture header — RemoteOK returns it as element 0' },
  ...Array.from({ length: n }, (_, i) => ({
    id: `rok${i + 1}`,
    position: i === 0 ? 'Senior Node Engineer' : `Backend Engineer ${i + 1}`,
    company: i === 0 ? 'Bluepeak' : `Remote Co ${i + 1}`,
    description: '<p>Node, Postgres, AWS.</p>',
    url: `https://remoteok.com/remote-jobs/rok${i + 1}`,
    date: `2026-09-0${(i % 9) + 1}T00:00:00.000Z`
  }))
];

const rss = (items) =>
  `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel>${items
    .map((it) => `<item><title><![CDATA[${it.title}]]></title><link>${it.link}</link><description><![CDATA[${it.body}]]></description></item>`)
    .join('')}</channel></rss>`;

const hnItems = (n, first = HN_TITLE) =>
  Array.from({ length: n }, (_, i) => ({
    title: i === 0 ? first : `Startup ${i + 1} is hiring a full stack developer`,
    link: `https://news.ycombinator.com/item?id=${i + 1}`,
    body: 'Backend + frontend work, contract.'
  }));

const wwrItems = (n, first = WWR_TITLE) =>
  Array.from({ length: n }, (_, i) => ({
    title: i === 0 ? first : `Company ${i + 1}: Senior React Developer`,
    link: `https://weworkremotely.com/remote-jobs/wwr${i + 1}`,
    body: 'Full stack role, remote.'
  }));

const linkedInJobs = (n) =>
  Array.from({ length: n }, (_, i) => ({
    id: `li${i + 1}`,
    title: i === 0 ? 'Contract React Developer' : `Contract Developer ${i + 1}`,
    companyName: i === 0 ? 'Helio Studio' : `Studio ${i + 1}`,
    descriptionText: 'React contract, 3 months.',
    link: `https://www.linkedin.com/jobs/view/li${i + 1}`,
    postedAt: '2026-09-02T00:00:00.000Z'
  }));

const remotiveJobs = (n) => ({
  jobs: Array.from({ length: n }, (_, i) => ({
    id: `rem${i + 1}`,
    title: i === 0 ? 'Backend Developer' : `Platform Developer ${i + 1}`,
    company_name: i === 0 ? 'Vega Systems' : `Vega ${i + 1}`,
    description: '<p>Python + APIs.</p>',
    url: `https://remotive.com/remote-jobs/rem${i + 1}`,
    publication_date: '2026-09-03T00:00:00.000Z'
  }))
});

const DEFAULT_EVAL = Object.freeze({
  relevant: true,
  score: 88,
  pitch: 'Ships a working slice in days, not sprints. Portfolio: https://sheershtiwari.vercel.app',
  contactEmail: 'buyer@example.com',
  contactInfo: 'Direct Email: buyer@example.com'
});

/* ───────────────────────────── sandbox + network stub ───────────────────────────── */

const res = (bodyText = '', status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => bodyText,
  json: async () => JSON.parse(bodyText)
});

const titleFromPrompt = (prompt) => (prompt.match(/Listing Title: (.*)/) || [])[1] || '';

/**
 * @param sources   { reddit, remoteok, hn, wwr, linkedin, remotive } — how many listings each feed returns
 * @param groq      (title) => evaluation object returned by the Groq fixture
 * @param sheet     ({ callIndex, entry }) => { status, body } — throw to simulate a transport failure
 * @param realFetchFor  URL prefix that must go out over the REAL network (used for the refused-socket case)
 */
function makeStubs({ sources = {}, titles = {}, groq = () => DEFAULT_EVAL, sheet, sheetUrl = SHEET_URL, record, realFetchFor = null }) {
  const count = (name) => Number(sources[name] || 0);

  return async function fetchStub(url, init = {}) {
    const target = String(url);
    const entry = {
      url: target,
      method: init.method || 'GET',
      redirect: init.redirect === undefined ? '(runtime default)' : init.redirect,
      body: init.body ? JSON.parse(init.body) : undefined
    };
    record.push(entry);

    if (realFetchFor && target.startsWith(realFetchFor)) {
      entry.real = true;
      return globalThis.fetch(target, init); // deliberate: real network stack, no stub
    }

    if (target === sheetUrl) {
      entry.sheet = true;
      const callIndex = record.filter((e) => e.sheet).length - 1;
      const out = sheet
        ? await sheet({ callIndex, entry })
        : { status: 200, body: '{"ok":true,"appended":true,"row":2,"source":"Hunter"}' };
      return res(out.body, out.status);
    }
    if (target === 'https://api.resend.com/emails') {
      entry.resend = true;
      return res('{"id":"resend_stub_id"}', 200);
    }
    if (target === 'https://api.groq.com/openai/v1/chat/completions') {
      entry.groq = true;
      const messages = entry.body?.messages || [];
      const prompt = String(messages.find((m) => m.role === 'user')?.content || '');
      const evaluation = groq(titleFromPrompt(prompt));
      return res(JSON.stringify({ choices: [{ message: { content: JSON.stringify(evaluation) } }] }), 200);
    }
    if (target.startsWith('https://www.reddit.com/r/forhire/new.json')) {
      entry.feed = 'reddit';
      return res(JSON.stringify({ data: { children: redditPosts(count('reddit')) } }), 200);
    }
    if (target.startsWith('https://remoteok.com/api')) {
      entry.feed = 'remoteok';
      return res(JSON.stringify(remoteOkJobs(count('remoteok'))), 200);
    }
    if (target.startsWith('https://hnrss.org/jobs')) {
      entry.feed = 'hn';
      return res(rss(hnItems(count('hn'), titles.hn)), 200);
    }
    if (target.startsWith('https://weworkremotely.com/')) {
      entry.feed = 'wwr';
      return res(rss(wwrItems(count('wwr'), titles.wwr)), 200);
    }
    if (target.startsWith('https://api.apify.com/')) {
      entry.feed = 'apify';
      return res(JSON.stringify(linkedInJobs(count('linkedin'))), 200);
    }
    if (target.startsWith('https://remotive.com/api/')) {
      entry.feed = 'remotive';
      return res(JSON.stringify(remotiveJobs(count('remotive'))), 200);
    }
    throw new Error(`harness: unexpected outbound URL ${target}`);
  };
}

/** Runs the real hunter script once, in a fresh sandbox. */
async function runHunter({
  env = {},
  sources = {},
  titles = {},
  groq,
  sheet,
  sheetUrl = SHEET_URL,
  realFetchFor = null,
  timerClampMs = 0
} = {}) {
  const record = [];
  const logs = [];
  const exits = [];

  const capture = (level) => (message) => {
    let parsed;
    try {
      parsed = JSON.parse(String(message));
    } catch {
      parsed = { level, message: String(message) };
    }
    logs.push({ level: parsed.level || level, message: parsed.message, ...parsed });
  };

  const sandbox = {
    console: { log: capture('INFO'), warn: capture('WARN'), error: capture('ERROR') },
    process: {
      env: {
        GROQ_API_KEY: 'unit-test-dummy-groq',
        RESEND_API_KEY: 'unit-test-dummy-resend',
        RECIPIENT_EMAIL: 'er.sheershtiwari@gmail.com',
        LEAD_STORE_WEBHOOK_URL: sheetUrl,
        ...env
      },
      exit: (code) => exits.push(code)
    },
    fetch: makeStubs({ sources, titles, groq, sheet, sheetUrl, record, realFetchFor }),
    // Timers are clamped so the pipeline's 2 s Groq cooldowns do not slow the suite down. The one
    // case that dials a real socket passes a generous clamp so the abort timer cannot win the race.
    setTimeout: (fn, ms, ...rest) => setTimeout(fn, Math.min(Number(ms) || 0, timerClampMs), ...rest),
    clearTimeout,
    AbortController
  };

  const ctx = vm.createContext(sandbox);
  // The script's last statement is `runPipeline().catch(...)`, so its completion value is the promise.
  await vm.runInContext(SOURCE, ctx, { filename: 'scripts/lead-hunter.js' });
  return { record, logs, exits };
}

/* ───────────────────────────── case runner helpers ───────────────────────────── */

let pass = 0;
let fail = 0;
const failures = [];
const everyRow = [];

function check(caseName, label, condition, detail) {
  if (condition) {
    console.log(`   ✓ ${label}`);
    pass += 1;
  } else {
    console.log(`   ✗ ${label}${detail === undefined ? '' : ` — got: ${JSON.stringify(detail)}`}`);
    fail += 1;
    failures.push(`${caseName}: ${label}`);
  }
}

function header(title, request) {
  console.log(`\n── ${title} ` + '─'.repeat(Math.max(0, 78 - title.length)));
  console.log('   SETUP    ' + JSON.stringify(request));
}

const sheetEntries = (record) => record.filter((e) => e.sheet);
const sheetRows = (record) => sheetEntries(record).map((e) => e.body.row);
const resendCalls = (record) => record.filter((e) => e.resend);
const warns = (logs) => logs.filter((l) => l.level === 'WARN' || l.level === 'ERROR');
const ofMsg = (logs, needle) => logs.filter((l) => String(l.message || '').includes(needle));

function report(record, logs) {
  for (const entry of sheetEntries(record)) {
    console.log(`   SHEET    ${entry.real ? '[REAL SOCKET] ' : ''}${entry.method} ${entry.url.replace(/token=.*/, 'token=<redacted>')}`);
    if (entry.body) console.log(`   ROW      ${JSON.stringify(entry.body.row)}`);
  }
  for (const call of resendCalls(record)) {
    console.log(`   DIGEST   subject=${JSON.stringify(call.body.subject)} cards=${(call.body.html.match(/View Opportunity/g) || []).length}`);
  }
  const interesting = logs.filter((l) => l.level !== 'INFO' || /mirror|Sheet|Digest|qualified|No qualified/i.test(String(l.message)));
  for (const line of interesting) console.log(`   LOG      ${line.level} ${line.message} ${JSON.stringify(Object.fromEntries(Object.entries(line).filter(([k]) => !['level', 'message', 'timestamp'].includes(k))))}`);
  for (const row of sheetRows(record)) everyRow.push(row);
}

/* ══════════════ H1 — the row itself: 11 columns, exact order, all strings ══════════════ */
{
  const name = 'H1 row mapping (Reddit lead)';
  const { record, logs, exits } = await runHunter({ sources: { reddit: 1 } });
  header(name, { sources: { reddit: 1 }, sheet: 'default 200 {"ok":true}' });
  report(record, logs);

  const rows = sheetRows(record);
  const outbound = record.map((e) => e.url.replace(/token=.*/, 'token=<redacted>'));
  console.log('   OUTBOUND ' + JSON.stringify(outbound));

  check(name, 'exactly one row pushed', rows.length === 1, rows.length);
  const row = rows[0] || [];
  check(name, 'row has exactly 11 values', row.length === 11, row.length);
  check(name, 'every cell is a string', row.every((c) => typeof c === 'string'), row.map((c) => typeof c));
  check(name, 'payload is {row:[...]} and nothing else', JSON.stringify(Object.keys(sheetEntries(record)[0]?.body || {})) === '["row"]', sheetEntries(record)[0]?.body);
  check(name, '1 Received is an ISO-8601 UTC timestamp', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(row[0]) && new Date(row[0]).toISOString() === row[0], row[0]);
  check(name, '2 Source = "Hunter (Reddit)"', row[1] === 'Hunter (Reddit)', row[1]);
  check(name, '3 Name / Title = the listing title', row[2] === REDDIT_TITLE, row[2]);
  check(name, '4 Company parsed from the "(…)" suffix', row[3] === 'Northwind Freight', row[3]);
  check(name, '5 Email = the Groq contactEmail', row[4] === 'buyer@example.com', row[4]);
  check(name, '6 Project / Type is empty (hunter rows)', row[5] === '', row[5]);
  check(name, '7 Budget is empty (hunter rows)', row[6] === '', row[6]);
  check(name, '8 Score = the Groq score', row[7] === '88', row[7]);
  check(name, '9 Message / Pitch = the Groq pitch', row[8] === DEFAULT_EVAL.pitch, row[8]);
  check(name, '10 Link = the listing URL', row[9] === 'https://www.reddit.com/r/forhire/comments/r1/dev_wanted/', row[9]);
  check(name, '11 ID is empty (hunter rows)', row[10] === '', row[10]);
  check(name, 'POST with JSON content-type and redirect:follow', sheetEntries(record)[0]?.method === 'POST' && sheetEntries(record)[0]?.redirect === 'follow', sheetEntries(record)[0]);
  check(name, 'digest sent exactly once', resendCalls(record).length === 1, resendCalls(record).length);
  check(name, 'digest carries the same lead (1 card)', (resendCalls(record)[0]?.body.html.match(/View Opportunity/g) || []).length === 1);
  check(name, 'sheet push happened AFTER the digest', record.indexOf(resendCalls(record)[0]) < record.indexOf(sheetEntries(record)[0]), outbound);
  check(name, 'success is logged', ofMsg(logs, 'Lead mirrored to Google Sheet').length === 1, logs.map((l) => l.message));
  check(name, 'pipeline exited cleanly (no unhandled failure)', exits.length === 0, exits);
}

/* ══════════════ H2 — Source label for all six platforms the hunter fetches ══════════════ */
{
  const name = 'H2 Source labels across all six feeds';
  const { record, logs, exits } = await runHunter({
    env: { APIFY_TOKEN: 'unit-test-dummy-apify' },
    sources: { reddit: 1, remoteok: 1, hn: 1, wwr: 1, linkedin: 1, remotive: 1 }
  });
  header(name, { sources: 'reddit, remoteok, hn, wwr, linkedin(apify), remotive — 1 each' });
  report(record, logs);

  const rows = sheetRows(record);
  const labels = rows.map((r) => r[1]);
  const expected = ['Hunter (Reddit)', 'Hunter (RemoteOK)', 'Hunter (Hacker News)', 'Hunter (We Work Remotely)', 'Hunter (LinkedIn)', 'Hunter (Remotive)'];
  console.log('   LABELS   ' + JSON.stringify(labels));
  check(name, 'six leads mirrored', rows.length === 6, rows.length);
  check(name, 'Source label per platform, exact strings', JSON.stringify(labels) === JSON.stringify(expected), labels);
  check(name, 'companies parsed from generated titles', JSON.stringify(rows.map((r) => r[3])) === JSON.stringify(['Northwind Freight', 'Bluepeak', '', '', 'Helio Studio', 'Vega Systems']), rows.map((r) => r[3]));
  check(name, 'free-text titles leave Company empty (HN, WWR)', rows[2][3] === '' && rows[3][3] === '', [rows[2][3], rows[3][3]]);
  check(name, 'digest card count equals mirrored row count', (resendCalls(record)[0]?.body.html.match(/View Opportunity/g) || []).length === 6, (resendCalls(record)[0]?.body.html.match(/View Opportunity/g) || []).length);
  check(name, 'pipeline exited cleanly', exits.length === 0, exits);
}

/* ══════════════ H3 — absent values are "" — never null, never "undefined" ══════════════ */
{
  const name = 'H3 absent values → ""';
  const { record, logs, exits } = await runHunter({
    sources: { hn: 1, wwr: 1 },
    titles: { hn: HN_TITLE_REMOTE },
    groq: (title) =>
      title === WWR_TITLE
        ? { relevant: true, score: 90, pitch: '   ', contactEmail: 'undefined' }
        : { relevant: true, score: 90, pitch: 'Direct application link.', contactEmail: null }
  });
  header(name, { groq: 'contactEmail null (HN) / "undefined" + blank pitch (WWR)', titles: { hn: HN_TITLE_REMOTE } });
  report(record, logs);

  const rows = sheetRows(record);
  check(name, 'both leads pushed', rows.length === 2, rows.length);
  check(name, 'null contactEmail → ""', rows[0]?.[4] === '', rows[0]?.[4]);
  check(name, 'null contactEmail is not the string "null"', rows[0]?.[4] !== 'null', rows[0]?.[4]);
  check(name, 'literal "undefined" → ""', rows[1]?.[4] === '', rows[1]?.[4]);
  check(name, 'whitespace-only pitch → ""', rows[1]?.[8] === '', rows[1]?.[8]);
  check(name, 'HN title with a "(Remote)" suffix does not fake a company', rows[0]?.[3] === '', rows[0]?.[3]);
  check(name, 'the title itself is never truncated', rows[0]?.[2] === HN_TITLE_REMOTE, rows[0]?.[2]);
  check(name, 'no cell is null/undefined/"null"/"undefined"', rows.every((r) => r.every((c) => typeof c === 'string' && !/^(null|undefined)$/i.test(c))), rows);
  check(name, 'pipeline exited cleanly', exits.length === 0, exits);
}

/* ══════════════ H4 — only Groq-qualified leads reach the sheet (same set as the digest) ══════════════ */
{
  const name = 'H4 only qualified leads are mirrored';
  const { record, logs, exits } = await runHunter({
    sources: { reddit: 1, remoteok: 1, hn: 1 },
    groq: (title) =>
      title === REDDIT_TITLE
        ? { relevant: true, score: 91, pitch: 'Pitch A', contactEmail: 'a@example.com' }
        : title.startsWith('Senior Node')
          ? { relevant: true, score: 40, pitch: 'Pitch B', contactEmail: 'b@example.com' }
          : { relevant: false }
  });
  header(name, { groq: 'score 91 (kept) / relevant score 40 (below 75) / not relevant' });
  report(record, logs);

  const rows = sheetRows(record);
  check(name, 'exactly one lead mirrored', rows.length === 1, rows.length);
  check(name, 'the mirrored lead is the qualified one', rows[0]?.[2] === REDDIT_TITLE, rows[0]?.[2]);
  const digest = resendCalls(record)[0]?.body;
  check(name, 'the digest contains the same single lead', digest.subject.includes('1 Qualified') && !digest.html.includes('Senior Node Engineer'), digest.subject);
  check(name, 'the two rejects are logged as skipped', ofMsg(logs, 'Skipped').length === 2, ofMsg(logs, 'Skipped').length);
  check(name, 'sheet row count === digest card count', rows.length === (digest.html.match(/View Opportunity/g) || []).length, [rows.length, digest.html]);
  check(name, 'pipeline exited cleanly', exits.length === 0, exits);
}

/* ══════════════ H5 — LEAD_STORE_WEBHOOK_URL unset: silent skip, one line ══════════════ */
{
  const name = 'H5 unset webhook URL';
  const { record, logs, exits } = await runHunter({ env: { LEAD_STORE_WEBHOOK_URL: undefined }, sources: { reddit: 1 } });
  header(name, { env: 'LEAD_STORE_WEBHOOK_URL unset' });
  report(record, logs);

  check(name, 'no sheet request is attempted', sheetEntries(record).length === 0, sheetEntries(record).length);
  check(name, 'exactly one log line announces the skip', ofMsg(logs, 'LEAD_STORE_WEBHOOK_URL not set').length === 1, logs.map((l) => l.message));
  check(name, 'the digest still sends', resendCalls(record).length === 1, resendCalls(record).length);
  check(name, 'the run still finishes (no crash / no exit code)', exits.length === 0 && ofMsg(logs, 'Master Pipeline execution finished').length === 1, exits);
}

/* ══════════════ H6 — sheet push HTTP 500: digest unaffected ══════════════ */
{
  const name = 'H6 sheet returns HTTP 500';
  const { record, logs, exits } = await runHunter({ sources: { reddit: 1 }, sheet: async () => ({ status: 500, body: 'internal error' }) });
  header(name, { sheet: 'HTTP 500' });
  report(record, logs);

  check(name, 'the push was attempted', sheetEntries(record).length === 1, sheetEntries(record).length);
  check(name, 'the failure is logged loudly', warns(logs).some((l) => l.message.includes('Sheet mirror failed') && l.reason === 'HTTP 500'), warns(logs));
  check(name, 'nothing claims success', ofMsg(logs, 'Lead mirrored to Google Sheet').length === 0, logs.map((l) => l.message));
  check(name, 'THE DIGEST STILL SENT', resendCalls(record).length === 1 && ofMsg(logs, 'Master digest delivered successfully').length === 1, resendCalls(record).length);
  check(name, 'the job still ends green (no exit 1)', exits.length === 0, exits);
}

/* ══════════════ H7 — sheet answers 200 {"ok":false}: not counted as a write ══════════════ */
{
  const name = 'H7 sheet answers 200 with {"ok":false}';
  const { record, logs, exits } = await runHunter({
    sources: { reddit: 1 },
    sheet: async () => ({ status: 200, body: '{"ok":false,"error":"unauthorized: missing or wrong token"}' })
  });
  header(name, { sheet: 'HTTP 200 {"ok":false,"error":"unauthorized: …"}' });
  report(record, logs);

  check(name, 'the refusal is logged with the Apps Script message', warns(logs).some((l) => l.message.includes('Sheet mirror rejected') && String(l.reason).includes('unauthorized')), warns(logs));
  check(name, 'a refused write is never reported as mirrored', ofMsg(logs, 'Lead mirrored to Google Sheet').length === 0, logs.map((l) => l.message));
  check(name, 'the token is not leaked into the log line', !JSON.stringify(warns(logs)).includes('unit-test-token'), warns(logs));
  check(name, 'THE DIGEST STILL SENT', resendCalls(record).length === 1 && ofMsg(logs, 'Master digest delivered successfully').length === 1, resendCalls(record).length);
  check(name, 'the job still ends green', exits.length === 0, exits);
}

/* ══════════════ H8 — webhook unreachable: REAL refused connection on 127.0.0.1 ══════════════ */
{
  const name = 'H8 webhook unreachable (real refused connection)';
  const deadPort = await new Promise((done) => {
    const probe = http.createServer();
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => done(port));
    });
  });
  const deadUrl = `http://127.0.0.1:${deadPort}/exec?token=unit-test-token`;
  const { record, logs, exits } = await runHunter({
    sources: { reddit: 1 },
    sheetUrl: deadUrl,
    realFetchFor: 'http://127.0.0.1',
    timerClampMs: 6000 // real timers below the 6 s abort: nothing is racing the socket refusal
  });
  header(name, { sheet: `POST ${deadUrl} — nothing is listening on port ${deadPort}` });
  report(record, logs);

  const push = record.find((e) => e.url === deadUrl);
  check(name, 'the push really went to the network (not stubbed)', push?.real === true, push);
  check(name, 'the transport failure is logged', warns(logs).some((l) => l.message.includes('Sheet mirror failed') && l.error), warns(logs));
  check(name, 'the log names the real cause (ECONNREFUSED)', warns(logs).some((l) => l.cause === 'ECONNREFUSED'), warns(logs));
  check(name, 'no false success', ofMsg(logs, 'Lead mirrored to Google Sheet').length === 0, logs.map((l) => l.message));
  check(name, 'THE DIGEST STILL SENT — and before the failed push', resendCalls(record).length === 1 && record.indexOf(resendCalls(record)[0]) < record.indexOf(push), record.map((e) => e.url.replace(/token=.*/, 'token=<redacted>')));
  check(name, 'the job still ends green', exits.length === 0, exits);
}

/* ══════════════ H9 — malformed webhook URL ══════════════ */
{
  const name = 'H9 malformed webhook URL';
  const { record, logs, exits } = await runHunter({ sources: { reddit: 1 }, sheetUrl: 'not a url at all', realFetchFor: 'not a url' });
  header(name, { sheet: "'not a url at all' (real fetch rejects the URL before any socket opens)" });
  report(record, logs);

  check(name, 'the attempt is recorded', record.some((e) => e.url === 'not a url at all'), record.map((e) => e.url));
  check(name, 'the failure is logged', warns(logs).some((l) => l.message.includes('Sheet mirror failed')), warns(logs));
  check(name, 'THE DIGEST STILL SENT', resendCalls(record).length === 1 && ofMsg(logs, 'Master digest delivered successfully').length === 1, resendCalls(record).length);
  check(name, 'the job still ends green', exits.length === 0, exits);
}

/* ══════════════ H10 — one bad push does not stop the next lead ══════════════ */
{
  const name = 'H10 per-lead isolation';
  const { record, logs, exits } = await runHunter({
    sources: { reddit: 2 },
    sheet: async ({ callIndex }) => {
      if (callIndex === 0) throw new Error('socket hang up');
      return { status: 200, body: '{"ok":true,"appended":true}' };
    }
  });
  header(name, { sheet: 'first call throws, second call succeeds', sources: { reddit: 2 } });
  report(record, logs);

  const rows = sheetRows(record);
  check(name, 'both leads were attempted', rows.length === 2, rows.length);
  check(name, 'the second lead still landed', ofMsg(logs, 'Lead mirrored to Google Sheet').length === 1, logs.map((l) => l.message));
  check(name, 'the first failure is logged', warns(logs).some((l) => l.message.includes('Sheet mirror failed') && l.error === 'socket hang up'), warns(logs));
  check(name, 'both rows are well-formed', rows.every((r) => r.length === 11 && r.every((c) => typeof c === 'string')), rows);
  check(name, 'THE DIGEST STILL SENT', resendCalls(record).length === 1, resendCalls(record).length);
  check(name, 'the job still ends green', exits.length === 0, exits);
}

/* ══════════════ H11 — global invariant over every row produced above ══════════════ */
{
  const name = 'H11 invariant: every row pushed anywhere in this suite';
  const sizes = [...new Set(everyRow.map((r) => r.length))];
  console.log(`\n── ${name} ` + '─'.repeat(Math.max(0, 78 - name.length)));
  console.log(`   ROWS     ${everyRow.length} rows collected across all cases — widths ${JSON.stringify(sizes)}`);
  check(name, 'every row has 11 cells', everyRow.every((r) => r.length === 11), sizes);
  check(name, 'every cell is a string', everyRow.every((r) => r.every((c) => typeof c === 'string')), 'non-string cell found');
  check(name, 'no cell is null / undefined / "null" / "undefined"', everyRow.every((r) => r.every((c) => !/^(null|undefined)$/i.test(c))), everyRow.flat().filter((c) => /^(null|undefined)$/i.test(c)));
  check(name, 'every row names the platform in Source', everyRow.every((r) => /^(Hunter \(|Form \()/.test(r[1])), everyRow.map((r) => r[1]).filter((s) => !/^Hunter \(/.test(s)));
  check(name, 'the form-only columns stay empty in every hunter row', everyRow.every((r) => r[5] === '' && r[6] === '' && r[10] === ''), everyRow.filter((r) => r[5] !== '' || r[6] !== '' || r[10] !== ''));
}

/* ───────────────────────────────── summary ────────────────────────────────────── */
console.log('\n' + '═'.repeat(80));
console.log(`RESULT: ${pass} assertions passed, ${fail} failed`);
if (failures.length) failures.forEach((f) => console.log(`   FAILED  ${f}`));
console.log(fail === 0 ? 'STATUS: ALL CASES PASS' : 'STATUS: FAILURES PRESENT');
console.log('='.repeat(80));
process.exitCode = fail === 0 ? 0 : 1;
setTimeout(() => process.exit(process.exitCode), 5000).unref();
