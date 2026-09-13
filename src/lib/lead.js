/**
 * src/lib/lead.js — the client half of POST /api/lead.
 *
 * Implemented from docs/api-lead-contract.md §6 (the reference implementation)
 * and §5 (the GA4 conversion contract). Nothing here invents a field name, an
 * enum id, an event name or a status code — the contract is authoritative and
 * the server re-validates everything this file sends.
 *
 *   submitLead(values, estimate) -> POST /api/lead, fire GA4, return a typed result
 *   validateLead(values)         -> client-side UX sugar only (the server still decides)
 *
 * PII rule (contract §5.1): `name`, `email`, `company` and the message body
 * must NEVER reach GA4. Only the opaque `lead_id` uuid leaves the client.
 */
import { profile } from '../data/profile';
import {
  BUDGET_BAND_IDS,
  HIRE_COPY,
  HIRE_FORM_ID,
  MESSAGE_MAX,
  MESSAGE_MIN,
  PROJECT_TYPE_IDS
} from '../data/leadForm';

export const LEAD_ENDPOINT = '/api/lead';

/** Shown when the response was not the JSON the contract promises. */
export const UNEXPECTED_RESPONSE_ERROR = `Unexpected server response. Please email ${profile.email}.`;

/** Network-level failure text — the visitor still has a working email path. */
export const NETWORK_ERROR = `Could not reach the server. Please check your connection or email ${profile.email}.`;

export const EMPTY_LEAD = {
  name: '',
  email: '',
  company: '',
  projectType: '',
  budgetBand: '',
  message: ''
};

/**
 * GA4 push. `window.gtag` is defined by index.html once CookieHub consent for
 * `analytics` is granted; before that this is a silent no-op (no new analytics
 * dependency is added).
 */
function track(eventName, params) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return false;
  window.gtag('event', eventName, params);
  return true;
}

/**
 * The estimator is part of the drawer's pitch, and before this card the
 * estimate travelled inside the `mailto:` body. It now travels with the
 * enquiry instead of being lost: the block is appended to the message, and the
 * block is dropped entirely rather than pushing the body over the server's
 * ceiling.
 */
export function appendEstimate(message, estimate) {
  if (!estimate) return message;
  const block = [
    '',
    '---',
    `Estimated on-site scope: ${estimate.services}`,
    `Delivery: ${estimate.speed}`,
    `Estimate shown: $${estimate.minCost} - $${estimate.maxCost} USD / ${estimate.minDays}-${estimate.maxDays} business days`
  ].join('\n');
  const body = `${message}${block}`;
  return body.length <= MESSAGE_MAX ? body : message;
}

/**
 * Client-side validation — UX sugar only. Mirrors the server's rules so the
 * visitor does not have to round-trip to discover a typo; a server `400` is
 * always displayed verbatim on top of this, because the server is authoritative.
 * Returns `{ <field>: <message> }` for the failing fields only.
 */
export function validateLead(values) {
  const errors = {};
  const name = (values.name || '').trim();
  const email = (values.email || '').trim();
  const company = (values.company || '').trim();
  const message = (values.message || '').trim();

  if (name.length < 2 || name.length > 120) errors.name = HIRE_COPY.errors.name;

  // Deliberately loose, matching the server's shape check: a stricter client
  // regex would reject addresses the server accepts.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
    errors.email = HIRE_COPY.errors.email;
  }

  if (company.length > 160) errors.company = HIRE_COPY.errors.company;
  if (!PROJECT_TYPE_IDS.includes(values.projectType)) errors.projectType = HIRE_COPY.errors.projectType;
  if (!BUDGET_BAND_IDS.includes(values.budgetBand)) errors.budgetBand = HIRE_COPY.errors.budgetBand;
  if (message.length < MESSAGE_MIN || message.length > MESSAGE_MAX) errors.message = HIRE_COPY.errors.message;

  return errors;
}

/**
 * POST the lead. Returns one of:
 *   { ok: true,  id, requestId, status }
 *   { ok: false, status, errors, requestId, retryAfterSeconds }
 *
 * On `200` the GA4 `generate_lead` conversion event fires (and only then); on
 * every other outcome the `lead_form_error` diagnostic fires with the status
 * and the failing field NAMES — never their contents.
 */
export async function submitLead(values, estimate) {
  const message = appendEstimate((values.message || '').trim(), estimate);

  const payload = {
    name: (values.name || '').trim(),
    email: (values.email || '').trim(),
    company: (values.company || '').trim(),
    projectType: values.projectType,
    budgetBand: values.budgetBand,
    message,
    // Contract §6: always empty from a real visitor.
    honeypot: '',
    sourcePage: typeof window !== 'undefined' ? window.location.pathname : '',
    referrer: typeof document !== 'undefined' ? document.referrer || '' : ''
  };

  let res;
  try {
    res = await fetch(LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch {
    track('lead_form_error', { form_id: HIRE_FORM_ID, http_status: 0, error_fields: 'network' });
    return {
      ok: false,
      status: 0,
      requestId: null,
      retryAfterSeconds: 0,
      errors: { form: NETWORK_ERROR }
    };
  }

  const data = await res.json().catch(() => null);

  if (res.ok && data?.ok) {
    track('generate_lead', {
      form_id: HIRE_FORM_ID,
      lead_id: data.id,
      project_type: payload.projectType,
      budget_band: payload.budgetBand,
      has_company: Boolean(payload.company),
      page_path: window.location.pathname
    });
    return { ok: true, id: data.id, requestId: data.requestId, status: res.status };
  }

  const errors = data?.errors || { form: UNEXPECTED_RESPONSE_ERROR };

  track('lead_form_error', {
    form_id: HIRE_FORM_ID,
    http_status: res.status,
    error_fields: Object.keys(errors).join(',')
  });

  const rawRetry = Number(res.headers.get('Retry-After'));

  return {
    ok: false,
    status: res.status,
    requestId: data?.requestId ?? res.headers.get('X-Request-Id'),
    retryAfterSeconds: Number.isFinite(rawRetry) && rawRetry > 0 ? Math.ceil(rawRetry) : 0,
    errors
  };
}
