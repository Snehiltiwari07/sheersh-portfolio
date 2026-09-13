/** @type {import('tailwindcss').Config} */

// Colour primitives live in src/styles/tokens.css as SPACE-SEPARATED RGB
// CHANNELS. Wrapping them as `rgb(var(--token) / <alpha-value>)` is what makes
// `bg-violet-500/10`, `border-cyan-500/40` … work — a bare hex here silently
// removes the whole shade from the build (which is exactly the defect this
// token layer fixes: `text-cyan-400` produced no CSS at all).
const rgb = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

// The full brand scales used by the components, token-driven.
const scale = (family, steps) =>
  Object.fromEntries(steps.map((s) => [s, rgb(`${family}-${s}`)]));

// Bare `text-violet` / `border-cyan/40` (no shade) existed before this token
// layer as flat brand hex values; the DEFAULT key keeps every one of those
// class names resolving to the same brand colour.
const brand = (family, steps, defaultStep) => ({
  ...scale(family, steps),
  DEFAULT: rgb(`${family}-${defaultStep}`),
});

const VIOLET = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const CYAN = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const PINK = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Brand scales (token-backed, alpha-capable)
        violet: brand('violet', VIOLET, 500),
        cyan: brand('cyan', CYAN, 400),
        pink: brand('pink', PINK, 500),

        // Semantic surfaces
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        line: 'var(--line)',
        ink: 'var(--text)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
        mono: 'var(--font-mono)',
      },
      // The site's HUD type scale. The body scale stays Tailwind's default.
      fontSize: {
        nano: 'var(--text-nano)',
        tiny: 'var(--text-tiny)',
        micro: 'var(--text-micro)',
        mini: 'var(--text-mini)',
      },
      // Ambient glow geometry + component boxes. Only NEW keys are added, so no
      // existing Tailwind size/radius utility changes meaning.
      width: {
        'glow-hero': 'var(--layout-glow-hero-w)',
        'glow-footer': 'var(--layout-glow-footer-w)',
        'panel-sm': 'var(--layout-panel-sm-w)',
        'panel-md': 'var(--layout-panel-md-w)',
      },
      height: {
        'glow-hero': 'var(--layout-glow-hero-h)',
        'accent-bar': 'var(--accent-bar)',
        'photo-sm': 'var(--layout-photo-sm-h)',
        'photo-lg': 'var(--layout-photo-lg-h)',
      },
      maxWidth: { portrait: 'var(--layout-portrait-w)' },
      minWidth: { hud: 'var(--layout-hud-min-w)' },
      minHeight: {
        photo: 'var(--layout-photo-h)',
        quote: 'var(--layout-quote-min-h)',
        card: 'var(--layout-card-min-h)',
      },
      inset: {
        node: 'var(--layout-node-offset)',
        'node-lg': 'var(--layout-node-offset-lg)',
        knob: 'var(--layout-toggle-knob)',
      },
      padding: { hairline: 'var(--hairline)' },
      borderRadius: {
        inner: 'var(--radius-inner)',
        panel: 'var(--radius-panel)',
      },
      blur: {
        'ambient-sm': 'var(--blur-ambient-sm)',
        'ambient-md': 'var(--blur-ambient-md)',
        'ambient-lg': 'var(--blur-ambient-lg)',
        glass: 'var(--blur-glass)',
      },
      boxShadow: {
        hud: 'var(--shadow-hud)',
        live: 'var(--shadow-live)',
      },
      zIndex: {
        content: 'var(--z-content)',
        nav: 'var(--z-nav)',
        overlay: 'var(--z-overlay)',
        cursor: 'var(--z-cursor)',
      },
      transitionDuration: {
        fast: 'var(--dur-fast)',
        base: 'var(--dur-base)',
        slow: 'var(--dur-slow)',
        reveal: 'var(--dur-reveal)',
        shimmer: 'var(--dur-shimmer)',
        ambient: 'var(--dur-ambient)',
      },
      transitionTimingFunction: {
        spring: 'var(--ease-spring)',
        'out-soft': 'var(--ease-out)',
        'in-out-soft': 'var(--ease-in-out)',
      },
    },
  },
  plugins: [],
};
