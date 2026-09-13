#!/usr/bin/env node
/**
 * scripts/check-lead-form.mjs — the client/server contract drift guard.
 *
 * The hire form is the only consumer of POST /api/lead, and every way it can
 * drift is silent until a real buyer hits it:
 *
 *   · an enum id renamed on either side  -> the visitor gets a 400 they cannot fix
 *   · a service mapped to an unknown project type
 *   · a GA4 param renamed, or a PII field added to the `generate_lead` payload
 *
 * The three sources of truth are read as TEXT and compared, so the check stays
 * independent of how the app modules are written (the app keeps the project's
 * extensionless import style; Node ESM would not resolve those):
 *
 *   src/data/leadForm.js           <- the client's option lists
 *   src/lib/lead.js                <- the payload the client actually sends
 *   api/lead.js                    <- the server's own enum arrays
 *   docs/api-lead-contract.md §5.1 <- the GA4 payload the funnel is measured on
 *
 * Usage: node scripts/check-lead-form.mjs   (npm run check:leadform)
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const failures = [];
const ok = (label) => console.log(`  PASS  ${label}`);
const fail = (label, detail) => {
  failures.push(`${label}: ${detail}`);
  console.error(`  FAIL  ${label} — ${detail}`);
};

const sliceBlock = (src, marker) => {
  const start = src.indexOf(marker);
  if (start === -1) return null;
  const end = src.indexOf('];', start);
  return end === -1 ? null : src.slice(start, end + 2);
};

const idsInBlock = (block) => [...block.matchAll(/id:\s*'([^']+)'/g)].map((m) => m[1]);
const bareStrings = (src) => [...src.matchAll(/'([^']+)'/g)].map((m) => m[1]);

const data = read('src/data/leadForm.js');
const clientLib = read('src/lib/lead.js');
const serverSrc = read('api/lead.js');
const contract = read('docs/api-lead-contract.md');

const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

/* 1. enum ids: the client's option lists vs the server's own arrays --------- */
const clientProjectTypes = idsInBlock(sliceBlock(data, 'export const PROJECT_TYPES = [') || '');
const clientBudgetBands = idsInBlock(sliceBlock(data, 'export const BUDGET_BANDS = [') || '');
const serverProjectTypes = bareStrings(sliceBlock(serverSrc, 'const PROJECT_TYPES = [') || '');
const serverBudgetBands = bareStrings(sliceBlock(serverSrc, 'const BUDGET_BANDS = [') || '');

if (!clientProjectTypes.length || !serverProjectTypes.length) {
  fail('projectType enum parsed', `client=${clientProjectTypes.length} server=${serverProjectTypes.length}`);
} else if (!same(clientProjectTypes, serverProjectTypes)) {
  fail('projectType enum', `client [${clientProjectTypes}] != server [${serverProjectTypes}]`);
} else ok(`projectType enum matches api/lead.js (${clientProjectTypes.length} ids, same order)`);

if (!clientBudgetBands.length || !serverBudgetBands.length) {
  fail('budgetBand enum parsed', `client=${clientBudgetBands.length} server=${serverBudgetBands.length}`);
} else if (!same(clientBudgetBands, serverBudgetBands)) {
  fail('budgetBand enum', `client [${clientBudgetBands}] != server [${serverBudgetBands}]`);
} else ok(`budgetBand enum matches api/lead.js (${clientBudgetBands.length} ids, same order)`);

/* 2. every estimator service maps onto a real project type ----------------- */
const estimatorBlock = sliceBlock(data, 'export const ESTIMATOR_SERVICES = [') || '';
const mapped = [...estimatorBlock.matchAll(/projectType:\s*'([^']+)'/g)].map((m) => m[1]);
const stray = mapped.filter((id) => !serverProjectTypes.includes(id));
if (!mapped.length) fail('estimator -> projectType map parsed', 'no projectType entries found');
else if (stray.length) fail('estimator -> projectType map', `unknown ids [${stray}]`);
else ok(`all ${mapped.length} estimator services map onto a contract projectType`);

/* 3. GA4: event name, param set, and the PII prohibition ------------------- */
const payloadKeys = (text, marker) => {
  const start = text.indexOf(marker);
  if (start === -1) return null;
  const end = text.indexOf('});', start);
  if (end === -1) return null;
  return [...text.slice(start + marker.length, end).matchAll(/([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g)].map((m) => m[1]);
};

const contractParams = payloadKeys(contract, "'event', 'generate_lead', {");
const clientParams = payloadKeys(clientLib, "'generate_lead', {");

if (!contractParams || !clientParams) {
  fail('GA4 generate_lead payload parsed', `contract=${!!contractParams} client=${!!clientParams}`);
} else {
  const missing = contractParams.filter((k) => !clientParams.includes(k));
  const extra = clientParams.filter((k) => !contractParams.includes(k));
  if (missing.length || extra.length) fail('GA4 generate_lead params', `missing [${missing}] extra [${extra}]`);
  else ok(`generate_lead params match the contract (${contractParams.join(', ')})`);

  const leaked = ['name', 'email', 'company', 'message'].filter((f) => clientParams.includes(f));
  if (leaked.length) fail('GA4 PII prohibition (contract §5.1)', `payload contains ${leaked.join(', ')}`);
  else ok('no PII field in the generate_lead payload');
}

const allFormIds = [...clientLib.matchAll(/form_id:\s*HIRE_FORM_ID/g)].length;
// generate_lead once + lead_form_error twice (the fetch rejection path and the
// non-2xx path both report the diagnostic).
if (allFormIds !== 3) fail('form_id on every tracked event', `found ${allFormIds} of 3`);
else if (!data.includes("HIRE_FORM_ID = 'hire_form'")) fail('form_id value', "is not 'hire_form'");
else ok("form_id is HIRE_FORM_ID = 'hire_form' on all 3 tracked events");

if (!clientLib.includes("'lead_form_error'")) fail('lead_form_error diagnostic', 'not found in src/lib/lead.js');
else ok('lead_form_error diagnostic present');

if (!/LEAD_ENDPOINT = '\/api\/lead'/.test(clientLib)) fail('endpoint', 'not /api/lead');
else if (!/method:\s*'POST'/.test(clientLib)) fail('method', 'not POST');
else ok('POST /api/lead, JSON body');

if (!/honeypot:\s*''/.test(clientLib)) fail('honeypot', "the client does not send honeypot: ''");
else ok("honeypot is always sent as '' (contract §6)");

/* report ------------------------------------------------------------------ */
if (failures.length) {
  console.error(`\nFAIL — ${failures.length} lead-form contract drift(s):`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log('\nPASS — hire form matches the API + GA4 contract (8 checks).');
