import { useEffect, useRef } from 'react';

export default function InteractiveField() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let frameId = null;

    const onPointerMove = (e) => {
      // Throttle DOM style updates using requestAnimationFrame
      if (!frameId) {
        frameId = requestAnimationFrame(() => {
          container.style.setProperty('--mouse-x', `${e.clientX}px`);
          container.style.setProperty('--mouse-y', `${e.clientY}px`);
          frameId = null;
        });
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-slate-950"
      style={{
        '--mouse-x': '-1000px',
        '--mouse-y': '-1000px',
      }}
    >
      {/* Modern Sub-Pixel Tech Grid Matrix */}
      <div 
        className="absolute inset-0 opacity-[0.14] bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_10%,#000_60%,transparent_100%)]"
      />

      {/* Dynamic Cursor Spotlight (GPU Composited) */}
      <div
        className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(168, 85, 247, 0.14), rgba(6, 182, 212, 0.05) 40%, transparent 80%)`,
        }}
      />

      {/* GPU Ambient Glow Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-violet-600/15 blur-[120px] will-change-transform pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 rounded-full bg-cyan-500/10 blur-[120px] will-change-transform pointer-events-none" />
    </div>
  );
}