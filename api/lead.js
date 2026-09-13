/**
 * POST /api/lead — Lead capture endpoint (Vercel serverless function, Node runtime)
 *
 * Contract: docs/api-lead-contract.md
 * Env requirements: docs/DEPLOY-NOTES.md
 *
 * Zero runtime dependencies on purpose: keeps the function cold-start cheap and
 * avoids ESM/CJS interop surprises on Vercel (package.json has "type": "module").
 *
 * Flow:  parse -> origin check -> rate limit -> honeypot -> validate -> persist -> notify
 * Never trusts the client. Never returns ok:true unless the lead was actually recorded.
 */

const LEAD_ID_PREFIX = 'lead_';
const MAX_BODY_BYTES = 16 * 1024; // 16 KB

const LIMITS = {
  name: { min: 2, max: 120 },
  email: { max: 254 },
  company: { max: 160 },
  message: { min: 10, max: 2000 },
  honeypot: { max: 200 }
};

const PROJECT_TYPES = [
  'sql-performance',
  'api-backend',
  'react-frontend',
  'full-stack',
  'ai-integration',
  'integration',
  'consulting',
  'other'
];

const BUDGET_BANDS = ['under-5k', '5k-15k', '15k-50k', '50k-plus', 'not-sure'];

/**
 * Display labels for the two enums. Source of truth: docs/api-lead-contract.md §2 — if a label
 * changes there it changes here, or the Sheet/email disagree with what the visitor picked.
 */
const PROJECT_TYPE_LABELS = {
  'sql-performance': 'Database & SQL Performance Rescue',
  'api-backend': 'Backend / API Engineering',
  'react-frontend': 'React Frontend & Dashboard',
  'full-stack': 'Full-Stack Application (end-to-end)',
  'ai-integration': 'AI / LLM Integration',
  integration: 'Third-Party API Integration',
  consulting: 'Architecture Audit / Consulting',
  other: 'Something else'
};

const BUDGET_BAND_LABELS = {
  'under-5k': 'Under $5,000',
  '5k-15k': '$5,000 – $15,000',
  '15k-50k': '$15,000 – $50,000',
  '50k-plus': '$50,000+',
  'not-sure': 'Not sure yet — advise me'
};

/** Column 2 of the shared Sheet. Hunter rows use 'Hunter (<board>)' instead. */
const SHEET_SOURCE_FORM = 'Form (website)';

// Best-effort, per-instance state. See docs/DEPLOY-NOTES.md for the distributed upgrade path.
const RATE_LIMIT_MAX = Number(process.env.LEAD_RATE_LIMIT_MAX || 5);
const RATE_LIMIT_WINDOW_MS = Number(process.env.LEAD_RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000);
const IDEMPOTENCY_WINDOW_MS = 60 * 1000;

const rateBuckets = new Map(); // ip -> number[] (timestamps)
const recentSubmissions = new Map(); // fingerprint -> { id, at }

const DEFAULT_ALLOWED_ORIGINS = [
  'https://sheershtiwari.vercel.app',
  'https://www.sheershtiwari.com',
  'https://sheershtiwari.com',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173'
];

function log(level, message, data = {}) {
  const line = JSON.stringify({ timestamp: new Date().toISOString(), level, message, ...data });
  if (level === 'ERROR') console.error(line);
  else if (level === 'WARN') console.warn(line);
  else console.log(line);
}

function newId() {
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
  return `${LEAD_ID_PREFIX}${uuid}`;
}

function getAllowedOrigins() {
  const extra = (process.env.LEAD_ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return new Set([...DEFAULT_ALLOWED_ORIGINS, ...extra]);
}

function getClientIp(req) {
  const fwd = req.headers?.['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
  const real = req.headers?.['x-real-ip'];
  if (typeof real === 'string' && real.length) return real.trim();
  return req.socket?.remoteAddress || 'unknown';
}

/** Fast non-reversible tag so logs can correlate abuse without storing raw IPs. */
function hashTag(value) {
  let h = 5381;
  for (let i = 0; i < value.length; i += 1) h = ((h << 5) + h + value.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16).padStart(8, '0');
}

function checkRateLimit(ip) {
  const now = Date.now();
  const hits = (rateBuckets.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (hits.length >= RATE_LIMIT_MAX) {
    const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - hits[0]);
    rateBuckets.set(ip, hits);
    return { limited: true, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
  }
  hits.push(now);
  rateBuckets.set(ip, hits);
  if (rateBuckets.size > 5000) {
    for (const [key, value] of rateBuckets) {
      if (!value.some((t) => now - t < RATE_LIMIT_WINDOW_MS)) rateBuckets.delete(key);
    }
  }
  return { limited: false, retryAfterSeconds: 0 };
}

function asString(value) {
  return typeof value === 'string' ? value : value === undefined || value === null ? '' : null;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const EMAIL_RE = /^[^\s@,.]+(?:\.[^\s@,.]+)*@[^\s@,.]+(?:\.[^\s@,.]+)+$/;

/**
 * Server-side validation. Returns { values, errors }.
 * Every rule mirrors docs/api-lead-contract.md — the client copy is UX sugar only.
 */
function validate(body) {
  const errors = {};
  const values = {};

  // --- name ---
  const rawName = asString(body.name);
  if (rawName === null) errors.name = 'Name must be a string.';
  else {
    const name = rawName.trim().replace(/\s+/g, ' ');
    if (!name) errors.name = 'Name is required.';
    else if (name.length < LIMITS.name.min) errors.name = `Name must be at least ${LIMITS.name.min} characters.`;
    else if (name.length > LIMITS.name.max) errors.name = `Name must be ${LIMITS.name.max} characters or fewer.`;
    else values.name = name;
  }

  // --- email ---
  const rawEmail = asString(body.email);
  if (rawEmail === null) errors.email = 'Email must be a string.';
  else {
    const email = rawEmail.trim().toLowerCase();
    if (!email) errors.email = 'Email is required.';
    else if (email.length > LIMITS.email.max) errors.email = `Email must be ${LIMITS.email.max} characters or fewer.`;
    else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.';
    else values.email = email;
  }

  // --- company (optional) ---
  const rawCompany = asString(body.company);
  if (rawCompany === null) errors.company = 'Company must be a string.';
  else {
    const company = rawCompany.trim().replace(/\s+/g, ' ');
    if (company.length > LIMITS.company.max) errors.company = `Company must be ${LIMITS.company.max} characters or fewer.`;
    else if (company) values.company = company;
  }

  // --- projectType (enum) ---
  const rawProjectType = asString(body.projectType);
  if (rawProjectType === null) errors.projectType = 'projectType must be a string.';
  else {
    const projectType = rawProjectType.trim();
    if (!projectType) errors.projectType = 'Project type is required.';
    else if (!PROJECT_TYPES.includes(projectType)) {
      errors.projectType = `Unknown projectType. Allowed: ${PROJECT_TYPES.join(', ')}.`;
    } else values.projectType = projectType;
  }

  // --- budgetBand (enum) ---
  const rawBudgetBand = asString(body.budgetBand);
  if (rawBudgetBand === null) errors.budgetBand = 'budgetBand must be a string.';
  else {
    const budgetBand = rawBudgetBand.trim();
    if (!budgetBand) errors.budgetBand = 'Budget band is required.';
    else if (!BUDGET_BANDS.includes(budgetBand)) {
      errors.budgetBand = `Unknown budgetBand. Allowed: ${BUDGET_BANDS.join(', ')}.`;
    } else values.budgetBand = budgetBand;
  }

  // --- message ---
  const rawMessage = asString(body.message);
  if (rawMessage === null) errors.message = 'Message must be a string.';
  else {
    const message = rawMessage.trim();
    if (!message) errors.message = 'Message is required.';
    else if (message.length < LIMITS.message.min) {
      errors.message = `Tell me a little more — at least ${LIMITS.message.min} characters.`;
    } else if (message.length > LIMITS.message.max) {
      errors.message = `Message must be ${LIMITS.message.max} characters or fewer.`;
    } else values.message = message;
  }

  // --- honeypot (must be empty; bots fill every field they can see) ---
  const rawHoneypot = asString(body.honeypot);
  if (rawHoneypot === null) errors.honeypot = 'honeypot must be a string.';
  else values.honeypot = rawHoneypot.trim();

  return { values, errors };
}

function parseBody(req) {
  if (req.body === undefined || req.body === null || req.body === '') return { body: null, error: 'Request body is empty. Send a JSON object.' };
  if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return { body: req.body, error: null };
  const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body);
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { body: null, error: 'Request body must be a JSON object.' };
    return { body: parsed, error: null };
  } catch {
    return { body: null, error: 'Request body is not valid JSON.' };
  }
}

/**
 * Canonical 11-column Sheet row — the SHARED shape every producer sends
 * (docs/GOOGLE-SHEET-SETUP.md §4). Normalisation lives here, not in Apps Script: the webhook
 * carries the finished row, so the Google-side code stays a dumb appender that cannot silently
 * mangle a column, and the mapping is testable outside Google's editor.
 * Column order is contractual. Absent values are '' — never null, never "null", never undefined.
 */
function toSheetRow(lead) {
  return [
    lead.receivedAt, // 1  Received
    SHEET_SOURCE_FORM, // 2  Source
    lead.name, // 3  Name / Title
    lead.company || '', // 4  Company
    lead.email, // 5  Email
    PROJECT_TYPE_LABELS[lead.projectType] || lead.projectType, // 6  Project / Type (label, not the id)
    BUDGET_BAND_LABELS[lead.budgetBand] || lead.budgetBand, // 7  Budget (label, not the id)
    '', // 8  Score — hunter rows only
    lead.message, // 9  Message / Pitch
    lead.sourcePage || '', // 10 Link
    lead.id // 11 ID
  ].map((value) => (value === undefined || value === null ? '' : String(value)));
}

/** Durable record #1: optional external store (Google Sheets / CRM / DB adapter) over HTTP. */
async function persistToStore(lead) {
  const url = process.env.LEAD_STORE_WEBHOOK_URL;
  if (!url) return { attempted: false, ok: false, detail: 'LEAD_STORE_WEBHOOK_URL not configured' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      // Google Apps Script web apps answer 302 → script.googleusercontent.com and serve the real
      // body only there (a 302 re-issues this POST as a GET). Decision: FOLLOW the redirect — made
      // explicit rather than relying on the runtime default. Rationale and the unfollowed-redirect
      // branch below: docs/DEPLOY-NOTES.md §7.
      redirect: 'follow',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.LEAD_STORE_WEBHOOK_TOKEN
          ? { Authorization: `Bearer ${process.env.LEAD_STORE_WEBHOOK_TOKEN}` }
          : {})
      },
      // Normalised row, not the raw lead: the webhook contract is { row: [11 strings] }
      // (docs/GOOGLE-SHEET-SETUP.md §4) so every producer — form today, hunter next — writes the
      // same columns and Apps Script needs zero field knowledge.
      body: JSON.stringify({ row: toSheetRow(lead) }),
      signal: controller.signal
    });
    // A 3xx that reaches us was NOT followed (a runtime with redirect: manual/error, or a rejection).
    // Never silently accept it as a write: report a failure so the 502 guarantee stays honest.
    if (res.status >= 300 && res.status < 400) {
      return {
        attempted: true,
        ok: false,
        detail: `HTTP ${res.status} redirect not followed (Location host: ${locationHost(res.headers)})`
      };
    }
    if (!res.ok) return { attempted: true, ok: false, detail: `HTTP ${res.status}` };

    // Apps Script web apps cannot set a status code — a failure still answers 200 — so the store
    // signals it in the body as {"ok":false,...}. Trust that over the status: a row that was not
    // appended must never be reported as recorded. A non-JSON body stays a success (generic
    // webhooks legitimately answer 200 with "ok" or HTML).
    const verdict = parseStoreVerdict(await res.text().catch(() => ''));
    if (verdict && verdict.ok === false) {
      return {
        attempted: true,
        ok: false,
        detail: `store reported failure: ${String(verdict.error || 'ok:false').slice(0, 200)}`
      };
    }
    return { attempted: true, ok: true, detail: `HTTP ${res.status}` };
  } catch (err) {
    return { attempted: true, ok: false, detail: `store request failed: ${err.message}` };
  } finally {
    clearTimeout(timer);
  }
}

/** Host only — never the full Location, and never the store URL: both can carry a secret token. */
function locationHost(headers) {
  try {
    const location = typeof headers?.get === 'function' ? headers.get('location') : null;
    return location ? new URL(location).host : 'unknown';
  } catch {
    return 'unknown';
  }
}

/** Parses a store response body only when it is a JSON object; anything else means "no verdict". */
function parseStoreVerdict(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('{')) return null;
  try {
    const parsed = JSON.parse(trimmed);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Durable record #2 + human notification: the existing Resend account (same pattern as scripts/lead-hunter.js). */
async function notifyByEmail(lead) {
  const apiKey = (process.env.RESEND_API_KEY || '').replace(/['"]/g, '').trim();
  if (!apiKey) return { attempted: false, ok: false, detail: 'RESEND_API_KEY not configured' };

  const to = (process.env.LEAD_NOTIFY_EMAIL || process.env.RECIPIENT_EMAIL || 'er.sheershtiwari@gmail.com').trim();
  const from = (process.env.LEAD_FROM_EMAIL || 'Sheersh Portfolio <onboarding@resend.dev>').trim();

  const rows = [
    ['Lead ID', lead.id],
    ['Name', lead.name],
    ['Email', lead.email],
    ['Company', lead.company || '—'],
    ['Project type', lead.projectType],
    ['Budget band', lead.budgetBand],
    ['Received', lead.receivedAt],
    ['Source page', lead.sourcePage || '—'],
    ['Reference', lead.referrer || '—']
  ];

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 20px; background: #f8fafc; border-radius: 8px;">
      <div style="background: #0f172a; color: #ffffff; padding: 18px; border-radius: 6px 6px 0 0;">
        <h2 style="margin: 0; font-size: 18px;">New portfolio lead</h2>
        <p style="margin: 6px 0 0; font-size: 13px; color: #94a3b8;">${escapeHtml(lead.projectType)} · ${escapeHtml(lead.budgetBand)}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; background: #ffffff; font-size: 14px;">
        ${rows
          .map(
            ([label, value]) =>
              `<tr><td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b; width: 36%;">${escapeHtml(
                label
              )}</td><td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${escapeHtml(
                value
              )}</td></tr>`
          )
          .join('')}
      </table>
      <div style="background: #ffffff; padding: 14px; margin-top: 12px; border-left: 4px solid #a855f7;">
        <p style="margin: 0 0 6px; font-size: 12px; color: #64748b; text-transform: uppercase;">Message</p>
        <p style="margin: 0; font-size: 14px; color: #1e293b; white-space: pre-wrap;">${escapeHtml(lead.message)}</p>
      </div>
      <p style="margin: 16px 0 0;"><a href="mailto:${escapeHtml(lead.email)}" style="background: #a855f7; color: #ffffff; padding: 10px 16px; text-decoration: none; border-radius: 6px; font-size: 14px;">Reply to ${escapeHtml(
        lead.name
      )}</a></p>
    </div>`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: lead.email,
        subject: `New lead: ${lead.name}${lead.company ? ` (${lead.company})` : ''} — ${lead.projectType} / ${lead.budgetBand}`,
        html,
        text: rows.map(([label, value]) => `${label}: ${value}`).join('\n') + `\n\nMessage:\n${lead.message}`
      }),
      signal: controller.signal
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return { attempted: true, ok: false, detail: `Resend HTTP ${res.status} ${detail.slice(0, 200)}` };
    }
    return { attempted: true, ok: true, detail: 'Resend 200' };
  } catch (err) {
    return { attempted: true, ok: false, detail: `resend request failed: ${err.message}` };
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  const requestId = newId();
  const startedAt = Date.now();
  res.setHeader('X-Request-Id', requestId);
  res.setHeader('Cache-Control', 'no-store');

  const send = (status, payload) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(payload));
  };

  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST');
    res.statusCode = 204;
    return res.end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(405, { ok: false, requestId, errors: { form: 'Method not allowed. Use POST.' } });
  }

  // Origin allowlist: blocks drive-by cross-site posts. Missing Origin is allowed (curl/server-side).
  const origin = req.headers?.origin;
  if (origin && !getAllowedOrigins().has(origin)) {
    log('WARN', 'lead.rejected.origin', { requestId, origin });
    return send(403, { ok: false, requestId, errors: { form: 'Requests from this origin are not accepted.' } });
  }

  const contentLength = Number(req.headers?.['content-length'] || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return send(413, { ok: false, requestId, errors: { form: 'Request body is too large.' } });
  }

  const ip = getClientIp(req);
  const limit = checkRateLimit(ip);
  if (limit.limited) {
    log('WARN', 'lead.rejected.rate_limit', { requestId, ipHash: hashTag(ip) });
    res.setHeader('Retry-After', String(limit.retryAfterSeconds));
    return send(429, {
      ok: false,
      requestId,
      errors: {
        form: `Too many submissions from this connection. Please try again in ${Math.ceil(
          limit.retryAfterSeconds / 60
        )} minute(s).`
      }
    });
  }

  const { body, error: bodyError } = parseBody(req);
  if (bodyError) {
    log('WARN', 'lead.rejected.body', { requestId, reason: bodyError });
    return send(400, { ok: false, requestId, errors: { form: bodyError } });
  }

  const { values, errors } = validate(body);
  if (Object.keys(errors).length > 0) {
    log('WARN', 'lead.rejected.validation', { requestId, fields: Object.keys(errors) });
    return send(400, { ok: false, requestId, errors });
  }

  // Honeypot tripped: pretend success so the bot stops, record nothing, notify nobody.
  if (values.honeypot) {
    const fakeId = newId();
    log('WARN', 'lead.rejected.honeypot', { requestId, ipHash: hashTag(ip), id: fakeId });
    return send(200, { ok: true, id: fakeId, requestId });
  }

  // Double-submit guard (best effort, per instance): same email + message within 60 s reuses the id.
  const fingerprint = `${values.email}|${values.message}`;
  const now = Date.now();
  const prior = recentSubmissions.get(fingerprint);
  if (prior && now - prior.at < IDEMPOTENCY_WINDOW_MS) {
    log('INFO', 'lead.duplicate.suppressed', { requestId, id: prior.id });
    return send(200, { ok: true, id: prior.id, requestId });
  }

  const lead = {
    id: newId(),
    name: values.name,
    email: values.email,
    company: values.company || '',
    projectType: values.projectType,
    budgetBand: values.budgetBand,
    message: values.message,
    receivedAt: new Date().toISOString(),
    sourcePage: typeof body.sourcePage === 'string' ? body.sourcePage.slice(0, 300) : '',
    referrer: typeof body.referrer === 'string' ? body.referrer.slice(0, 300) : '',
    userAgent: String(req.headers?.['user-agent'] || '').slice(0, 300),
    ipHash: hashTag(ip)
  };

  // Structured log first: cheapest durable-enough trace, and it survives a notify failure.
  log('INFO', 'lead.received', {
    requestId: lead.id,
    projectType: lead.projectType,
    budgetBand: lead.budgetBand,
    company: lead.company,
    ipHash: lead.ipHash
  });

  const [store, notified] = await Promise.all([persistToStore(lead), notifyByEmail(lead)]);

  if (!notified.ok && !store.ok) {
    log('ERROR', 'lead.delivery.failed', {
      requestId: lead.id,
      store: store.detail,
      email: notified.detail
    });
    return send(502, {
      ok: false,
      requestId,
      errors: {
        form: 'We could not record your message right now. Please email er.sheershtiwari@gmail.com directly — sorry for the hassle.'
      }
    });
  }

  if (!notified.ok) log('WARN', 'lead.notify.degraded', { requestId: lead.id, email: notified.detail });
  if (!store.attempted) log('INFO', 'lead.store.skipped', { requestId: lead.id, store: store.detail });
  // Loud on purpose: a lead that only reached the inbox (or only the sheet) must be visible in the
  // logs, never a silent half-failure. docs/GOOGLE-SHEET-SETUP.md §8 maps these to fixes.
  else if (!store.ok) log('WARN', 'lead.store.failed', { requestId: lead.id, store: store.detail });

  recentSubmissions.set(fingerprint, { id: lead.id, at: now });
  if (recentSubmissions.size > 2000) recentSubmissions.clear();

  log('INFO', 'lead.captured', {
    requestId: lead.id,
    store: store.attempted ? store.detail : 'email-only',
    email: notified.detail,
    durationMs: Date.now() - startedAt
  });

  return send(200, { ok: true, id: lead.id, requestId });
}
