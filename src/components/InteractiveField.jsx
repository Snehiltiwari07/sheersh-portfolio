import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../styles/tokens';
import { GLOW_ORB_LAYERS } from '../styles/decorative';

/**
 * Ambient background: a static grid, an accent glow field and a pointer
 * spotlight.
 *
 * Motion contract
 *  · the pointer spotlight is DECORATIVE MOTION. It is skipped entirely for
 *    anyone with `prefers-reduced-motion: reduce` (no listener, no rAF, no
 *    paint) and the CSS layer hides the layer as well — belt and braces,
 *    because the media query can change while the page is open.
 *  · pointer writes are rAF-throttled to one style write per frame.
 *  · nothing here is `will-change`-ed: both orbs are static, so a permanent
 *    layer promotion costs memory and paint for no benefit.
 */
export default function InteractiveField() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    if (prefersReducedMotion()) return undefined;

    let frameId = null;
    let x = 0;
    let y = 0;

    const onPointerMove = (event) => {
      x = event.clientX;
      y = event.clientY;
      if (frameId) return;
      frameId = requestAnimationFrame(() => {
        container.style.setProperty('--mouse-x', `${x}px`);
        container.style.setProperty('--mouse-y', `${y}px`);
        frameId = null;
      });
    };

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMediaChange = (event) => {
      if (event.matches) {
        window.removeEventListener('pointermove', onPointerMove);
        if (frameId) cancelAnimationFrame(frameId);
        frameId = null;
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    media.addEventListener('change', onMediaChange);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      media.removeEventListener('change', onMediaChange);
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-slate-950"
      data-decorative="ambient-field"
    >
      {/* Modern Sub-Pixel Tech Grid Matrix (static) */}
      <div className="absolute inset-0 tech-grid tech-grid-mask" />

      {/* Dynamic Cursor Spotlight (GPU composited) */}
      <div className="absolute inset-0 pointer-events-none cursor-spotlight" />

      {/* GPU Ambient Glow Orbs (static) */}
      {GLOW_ORB_LAYERS.map((layer) => (
        <div
          key={layer.id}
          className={`absolute ${layer.position} w-96 h-96 rounded-full ${layer.tone} blur-ambient-sm pointer-events-none`}
        />
      ))}
    </div>
  );
}
