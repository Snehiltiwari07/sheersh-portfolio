/* ============================================================================
 * src/styles/tokens.js — the token layer, from JavaScript
 * ----------------------------------------------------------------------------
 * One source of truth: every value here is READ BACK from tokens.css at runtime,
 * so canvas drawing, SVG gradients and JS-driven timing can never drift from the
 * CSS. There are no duplicated literals in this file.
 *
 *   token('--c-violet-500')            -> '124 92 255'   (raw channels)
 *   color('--c-violet-500', 0.4)       -> 'rgba(124, 92, 255, 0.4)'   (canvas)
 *   cssColor('--c-violet-500', 0.4)    -> 'rgb(124 92 255 / 0.4)'     (CSS / SVG)
 *
 * Values are cached per theme (a canvas draw loop must not call
 * getComputedStyle 60 times a second) and the cache is dropped when
 * `data-theme` changes.
 * ========================================================================= */
import { useEffect, useState } from 'react';

let cache = new Map();
let cacheTheme = null;

/**
 * Channel fallbacks for environments without a DOM (Node scripts, tests,
 * static tooling). They exist so `monogramDataUri()` and friends still return
 * real colours outside the browser.
 *
 * They are NOT a second source of truth: scripts/check-tokens.mjs parses
 * tokens.css and fails the build if any entry here drifts from it.
 */
const PRIMITIVE_FALLBACK = {
  '--c-white': '255 255 255',
  '--c-violet-400': '165 133 247',
  '--c-violet-600': '124 58 237',
  '--c-cyan-300': '103 232 249',
  '--c-cyan-400': '0 229 255',
  '--c-cyan-500': '0 200 230',
  '--c-cyan-600': '8 145 178',
  '--c-sky-400': '56 189 248',
  '--c-red-400': '248 113 113',
  '--c-red-500': '239 68 68',
  '--c-red-800': '153 27 27',
  '--c-amber-50': '255 251 235',
  '--c-amber-700': '180 83 9',
  '--c-orange-500': '249 115 22',
  '--c-ink-50': '248 250 252',
  '--c-ink-300': '203 213 225',
  '--c-ink-400': '170 178 190',
  '--c-ink-700': '51 65 85',
  '--c-ink-800': '30 41 59',
  '--c-ink-900': '15 23 42',
  '--ease-spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
  '--ease-out': 'cubic-bezier(0.22, 1, 0.36, 1)',
};

const themeKey = () =>
  typeof document === 'undefined' ? 'ssr' : document.documentElement.getAttribute('data-theme') || 'dark';

/** Raw token value, e.g. token('--c-violet-500') === '124 92 255'. */
export function token(name) {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return PRIMITIVE_FALLBACK[name] ?? '';
  }
  const key = themeKey();
  if (key !== cacheTheme) {
    cache = new Map();
    cacheTheme = key;
  }
  if (!cache.has(name)) {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
    cache.set(name, raw.trim() || PRIMITIVE_FALLBACK[name] || '');
  }
  return cache.get(name);
}

/** Exposed for scripts/check-tokens.mjs (drift guard only). */
export const primitiveFallback = () => ({ ...PRIMITIVE_FALLBACK });

/** Channels of a colour primitive -> [r, g, b]. */
export function channels(name) {
  const parts = token(name).split(/\s+/).filter(Boolean);
  if (parts.length < 3) return [0, 0, 0];
  return parts.slice(0, 3).map((n) => Number.parseFloat(n) || 0);
}

/** `rgba(r, g, b, a)` — the form canvas 2D contexts accept everywhere. */
export function color(name, alpha = 1) {
  const [r, g, b] = channels(name);
  return alpha >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** `rgb(r g b / a)` — the form CSS and SVG attributes accept. */
export function cssColor(name, alpha = 1) {
  const [r, g, b] = channels(name);
  return alpha >= 1 ? `rgb(${r} ${g} ${b})` : `rgb(${r} ${g} ${b} / ${alpha})`;
}

/** Numeric token (durations, lengths) with a fallback for first paint. */
export function seconds(name) {
  const raw = token(name);
  if (!raw) return 0;
  if (raw.endsWith('ms')) return Number.parseFloat(raw) / 1000;
  if (raw.endsWith('s')) return Number.parseFloat(raw);
  return Number.parseFloat(raw);
}

/** Imperative reduced-motion check for effects (rAF loops, listeners). */
export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Reactive reduced-motion flag; re-renders when the OS setting changes. */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(prefersReducedMotion);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (event) => setReduced(event.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

/** Canonical motion vocabulary for JS-driven animation (framer-motion etc.). */
export function motionTokens() {
  return {
    fast: seconds('--dur-fast'),
    base: seconds('--dur-base'),
    slow: seconds('--dur-slow'),
    reveal: seconds('--dur-reveal'),
    ambient: seconds('--dur-ambient'),
    spring: token('--ease-spring') || 'cubic-bezier(0.16, 1, 0.3, 1)',
    out: token('--ease-out') || 'cubic-bezier(0.22, 1, 0.36, 1)',
  };
}

/**
 * Shared entrance/exit variants for framer-motion. Below the fold only:
 * an opacity gate on above-the-fold content is an LCP delay with no
 * informational payoff.
 */
export function revealVariants({ y = 20, duration, opacityFrom = 0 } = {}) {
  const t = motionTokens();
  return {
    initial: { opacity: opacityFrom, y },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: duration ?? t.reveal, ease: [0.16, 1, 0.3, 1] },
  };
}
