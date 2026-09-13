import { useEffect, useRef } from 'react';
import { prefersReducedMotion, usePrefersReducedMotion, token } from '../styles/tokens';

const IDLE_STOP_MS = 400;

/**
 * Trailing-ring cursor.
 *
 * Motion contract
 *  · skipped entirely for touch/coarse pointers (unchanged behaviour) and for
 *    `prefers-reduced-motion: reduce` — the effect is pure decoration, so it
 *    simply never runs.
 *  · the render loop is NOT permanent: it starts on the first move and parks
 *    after IDLE_STOP_MS of no input. An always-on rAF loop is the single
 *    biggest input-latency (INP) cost on an otherwise idle page.
 *  · the ring's easing is a token, not a component-invented constant.
 */
export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    if (window.matchMedia('(pointer: coarse)').matches) return undefined;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return undefined;

    const smoothing = Number.parseFloat(token('--cursor-smoothing')) || 0.18;
    const parkIdle = Number.parseFloat(token('--cursor-park-ms')) || IDLE_STOP_MS;

    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;
    let started = false;
    let rafId = null;
    let idleTimer = null;

    const render = () => {
      ringX += (mouseX - ringX) * smoothing;
      ringY += (mouseY - ringY) * smoothing;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      rafId = requestAnimationFrame(render);
    };

    const stop = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    };

    const schedulePark = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        stop();
        started = false;
      }, parkIdle);
    };

    const onMouseMove = (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      if (!started) {
        // start from the current position so the ring never flies in from 0,0
        ringX = mouseX;
        ringY = mouseY;
        started = true;
        rafId = requestAnimationFrame(render);
      }
      schedulePark();
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      if (idleTimer) clearTimeout(idleTimer);
      stop();
    };
  }, []);

  // Not rendered at all under reduced motion: the layer is pure decoration,
  // and leaving it mounted would also leave the idle dot parked in the corner.
  if (reducedMotion) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-cursor hidden md:block overflow-hidden decorative-motion"
      data-decorative="pointer-motion"
      aria-hidden="true"
    >
      {/* Smooth Trailing Ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 w-8 h-8 -mt-4 -ml-4 rounded-full border border-violet/60"
        style={{ willChange: 'transform' }}
      />
      {/* Precision Inner Dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-2 h-2 -mt-1 -ml-1 rounded-full grad-bg shadow-sm"
        style={{ willChange: 'transform' }}
      />
    </div>
  );
}
