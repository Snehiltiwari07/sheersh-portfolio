import { useEffect, useState } from 'react';

/**
 * True once the browser has painted the first frame and has spare capacity.
 *
 * Used to mount the below-the-fold sections, which are not needed for the
 * first paint and whose JavaScript (11 chunks + an animation library) would
 * otherwise compete with the hero for the main thread during load — the
 * single biggest contributor to Total Blocking Time on this page.
 *
 * The work is deferred, never dropped: `requestIdleCallback` gets a hard
 * timeout so a busy device still renders the sections.
 */
export function useAfterFirstPaint({ timeout = 600, fallbackDelay = 250 } = {}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let cancelScheduled = () => {};

    const mount = () => {
      if (!cancelled) setReady(true);
    };

    const schedule = () => {
      if (typeof window.requestIdleCallback === 'function') {
        const id = window.requestIdleCallback(mount, { timeout });
        cancelScheduled = () => window.cancelIdleCallback?.(id);
        return;
      }
      const timer = setTimeout(mount, fallbackDelay);
      cancelScheduled = () => clearTimeout(timer);
    };

    // two frames: the first gives the hero its paint, the second is spare time
    let raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        schedule();
      });
      cancelScheduled = () => cancelAnimationFrame(raf2);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
      cancelScheduled();
    };
  }, [timeout, fallbackDelay]);

  return ready;
}
