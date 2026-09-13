/* ============================================================================
 * src/styles/decorative.js — the decorative-effect registry
 * ----------------------------------------------------------------------------
 * Every ambient / pointer-driven effect on the site is declared here, so the
 * question "what moves for no informational reason, and what happens to it
 * under `prefers-reduced-motion: reduce`?" has one answer in one file.
 *
 *   tone      — an accent utility built from the colour tokens
 *   motion    — 'pointer' (driven by the pointer; skipped under reduced motion)
 *               'ambient' (loops; durations collapse to 1ms under reduced motion)
 *               'static'  (never moves; kept in both modes)
 * ========================================================================= */

export const GLOW_ORB_LAYERS = [
  { id: 'violet', position: '-top-40 -left-40', tone: 'bg-violet-600/15', motion: 'static' },
  { id: 'cyan', position: 'top-1/2 -right-40', tone: 'bg-cyan-500/10', motion: 'static' },
];

/** Layers that only exist because a pointer is moving: switched off entirely. */
export const POINTER_MOTION_LAYERS = ['cursor-spotlight', 'custom-cursor'];
