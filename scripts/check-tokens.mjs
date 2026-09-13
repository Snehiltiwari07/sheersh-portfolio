#!/usr/bin/env node
/**
 * scripts/check-tokens.mjs — the "zero hardcoded values" gate.
 *
 * Fails (exit 1) when a component, library module, style file or the HTML shell
 * contains a raw design value instead of a token:
 *
 *   · hex colours, rgb()/rgba()/hsl() literals
 *   · a px or ms literal inside an inline `style={{…}}` object
 *   · a px / ms / hex literal inside a Tailwind arbitrary value (`[10px]`)
 *
 * `src/styles/tokens.css` is the one file allowed to hold literal values — it
 * IS the token layer. Everything else must read `var(--token)`, a Tailwind
 * utility generated from a token, or the JS accessors in src/styles/tokens.js.
 *
 * It also guards against drift between tokens.css and the non-DOM colour
 * fallbacks in src/styles/tokens.js.
 *
 * Usage:  node scripts/check-tokens.mjs [--quiet]
 * Exceptions live in scripts/token-exceptions.json and must carry a reason.
 */
import { readFileSync, existsSync } from 'node:fs';
import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = process.cwd();
const QUIET = process.argv.includes('--quiet');

/* ------------------------------------------------------------------ */
/* files                                                              */
/* ------------------------------------------------------------------ */
const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
};

const rel = (p) => relative(ROOT, p).split(sep).join('/');

const JS_TARGETS = [
  ...walk(join(ROOT, 'src', 'components')),
  ...walk(join(ROOT, 'src', 'lib')),
  ...walk(join(ROOT, 'src', 'data')),
  ...walk(join(ROOT, 'src', 'context')),
  ...walk(join(ROOT, 'src', 'styles')),
  join(ROOT, 'src', 'App.jsx'),
  join(ROOT, 'src', 'main.jsx'),
].filter((f) => /\.(jsx?|mjs)$/.test(f) && !f.endsWith('tokens.js'));

const HTML_TARGETS = [join(ROOT, 'index.html')];

// Style files other than the token layer itself.
const CSS_TARGETS = walk(join(ROOT, 'src', 'styles')).filter(
  (f) => f.endsWith('.css') && !f.endsWith('tokens.css')
);

/* ------------------------------------------------------------------ */
/* exceptions                                                         */
/* ------------------------------------------------------------------ */
const EXC_PATH = join(ROOT, 'scripts', 'token-exceptions.json');
const exceptions = existsSync(EXC_PATH) ? JSON.parse(readFileSync(EXC_PATH, 'utf8')) : {};
const exceptionFor = (file, rule) => {
  const entry = exceptions[file];
  if (!entry) return null;
  if (!entry.rules || entry.rules.includes(rule)) return entry.reason;
  return null;
};

/* ------------------------------------------------------------------ */
/* rules                                                              */
/* ------------------------------------------------------------------ */
const VALUE_RULES = [
  { id: 'hex', label: 'hex colour', re: /#[0-9a-fA-F]{3,8}\b/g },
  // rgb()/hsl() built from a token var is the token system working, not a
  // literal — only bare colour functions are reported.
  {
    id: 'rgb',
    label: 'rgb()/hsl() literal',
    re: /\b(?:rgba?|hsla?)\([^)'";]*\)/g,
    skip: (text) => text.includes('var('),
  },
  { id: 'px', label: 'px literal', re: /(?<![\w-])-?\d*\.?\d+px\b/g },
  { id: 'ms', label: 'ms literal', re: /(?<![\w-])\d*\.?\d+ms\b/g },
];

// Only px/ms/hex *inside* these constructs are design values in a component.
const INLINE_STYLE_RE = /style=\{\{([\s\S]*?)\}\}/g;
const CLASSNAME_RE = /className=(?:"([^"]*)"|'([^']*)'|\{`([\s\S]*?)`\})/g;
const ARBITRARY_RE = /\[[^\][\s"']*\]/g;

const problems = [];
const record = (file, line, rule, text) => {
  const reason = exceptionFor(file, rule);
  if (reason) {
    allowlisted.push({ file, rule, text, reason });
    return;
  }
  problems.push({ file, line, rule, text });
};
const allowlisted = [];

const lineOf = (src, index) => src.slice(0, index).split('\n').length;

/* ------------------------------------------------------------------ */
/* 1. components / modules                                            */
/* ------------------------------------------------------------------ */
for (const file of JS_TARGETS) {
  const relFile = rel(file);
  const src = readFileSync(file, 'utf8');

  // (a) inside inline style objects -> every rule
  for (const match of src.matchAll(INLINE_STYLE_RE)) {
    const body = match[1];
    for (const rule of VALUE_RULES) {
    for (const hit of body.matchAll(rule.re)) {
      if (rule.skip?.(hit[0])) continue;
      record(relFile, lineOf(src, match.index + hit.index), rule.id, hit[0]);
    }
  }
}

  // (b) inside className strings -> arbitrary values only, plus bare hex
  for (const match of src.matchAll(CLASSNAME_RE)) {
    const body = match[1] ?? match[2] ?? match[3] ?? '';
    const offset = match.index + match[0].indexOf(body || '\u0000');
    for (const arb of body.matchAll(ARBITRARY_RE)) {
      const token = arb[0];
      if (!/(px|ms|#)[\w.,#-]*/.test(token)) continue;
      if (/(px|ms)\b/.test(token)) {
        record(relFile, lineOf(src, offset + arb.index), token.includes('ms') ? 'ms' : 'px', token);
      } else if (/#[0-9a-fA-F]{3,8}/.test(token)) {
        record(relFile, lineOf(src, offset + arb.index), 'hex', token);
      }
    }
    for (const hit of body.matchAll(VALUE_RULES[0].re)) {
      record(relFile, lineOf(src, offset + hit.index), 'hex', hit[0]);
    }
  }
}

/* ------------------------------------------------------------------ */
/* 2. the HTML shell and any other style file                         */
/* ------------------------------------------------------------------ */
for (const file of [...HTML_TARGETS, ...CSS_TARGETS]) {
  const relFile = rel(file);
  const src = readFileSync(file, 'utf8');
  // strip comments so prose and commented-out code cannot trip the gate
  const stripped = src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  for (const rule of VALUE_RULES) {
    for (const hit of stripped.matchAll(rule.re)) {
      if (rule.skip?.(hit[0])) continue;
      // absolute viewport units, percentages and 0 are relative, not literal
      record(relFile, lineOf(stripped, hit.index), rule.id, hit[0]);
    }
  }
}

/* ------------------------------------------------------------------ */
/* 3. drift guard: tokens.js fallbacks must match tokens.css          */
/* ------------------------------------------------------------------ */
const tokensCss = readFileSync(join(ROOT, 'src', 'styles', 'tokens.css'), 'utf8');
const cssValues = new Map();
for (const m of tokensCss.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)) {
  cssValues.set(m[1], m[2].trim());
}

const tokensJs = readFileSync(join(ROOT, 'src', 'styles', 'tokens.js'), 'utf8');
const fallbackBlock = tokensJs.match(/const PRIMITIVE_FALLBACK = \{([\s\S]*?)\n\};/);
if (!fallbackBlock) {
  problems.push({ file: 'src/styles/tokens.js', line: 0, rule: 'drift', text: 'PRIMITIVE_FALLBACK not found' });
} else {
  for (const m of fallbackBlock[1].matchAll(/'(--[a-z0-9-]+)':\s*'([^']*)'/g)) {
    const [, name, value] = m;
    const css = cssValues.get(name);
    if (css === undefined) {
      problems.push({ file: 'src/styles/tokens.js', line: 0, rule: 'drift', text: `${name} is not defined in tokens.css` });
    } else if (css !== value) {
      problems.push({
        file: 'src/styles/tokens.js',
        line: 0,
        rule: 'drift',
        text: `${name}: js fallback "${value}" != tokens.css "${css}"`,
      });
    }
  }
}

/* ------------------------------------------------------------------ */
/* report                                                             */
/* ------------------------------------------------------------------ */
if (!QUIET) {
  const scanned = JS_TARGETS.length + HTML_TARGETS.length + CSS_TARGETS.length;
  console.log(`check-tokens: scanned ${scanned} files`);
  for (const a of allowlisted) {
    console.log(`  allowlisted  ${a.file}  [${a.rule}]  ${a.text}  — ${a.reason}`);
  }
}

if (problems.length) {
  console.error(`\nFAIL — ${problems.length} hardcoded design value(s):`);
  for (const p of problems.slice(0, 60)) {
    console.error(`  ${p.file}:${p.line}  [${p.rule}]  ${p.text}`);
  }
  if (problems.length > 60) console.error(`  … and ${problems.length - 60} more`);
  console.error('\nEvery value must come from src/styles/tokens.css (or tokens.js in JS).');
  process.exit(1);
}

console.log(`PASS — no hardcoded colour/px/ms outside the token layer (${allowlisted.length} documented exception(s)).`);
