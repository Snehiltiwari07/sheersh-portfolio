/**
 * The persistent "estimate project cost" affordance.
 *
 * It lives in its own module because App.jsx imports it eagerly: while it was
 * exported from HireDrawer.jsx, that static import pulled the whole drawer —
 * and with it framer-motion (122 KB) — into the initial chunk, so the first
 * render waited on an animation library it does not use. The drawer is now
 * reachable only through its lazy import.
 */
export function FloatingHireButton({ onClick }) {
  return (
    <div className="fixed bottom-6 left-6 z-40">
      <button
        onClick={onClick}
        className="relative group flex items-center gap-2.5 px-4 py-3 rounded-full font-mono text-xs font-bold text-white bg-slate-950/90 border border-violet-500/40 hover:border-violet-400 shadow-2xl backdrop-blur-xl hover:scale-105 active:scale-95 interactive cursor-pointer overflow-hidden"
      >
        {/* Glow Aura */}
        <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-violet-600 to-orange-500 opacity-30 blur-md group-hover:opacity-70 transition-opacity" aria-hidden="true" />

        {/* Live Indicator */}
        <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
        </span>

        {/* Text */}
        <span className="relative z-10 text-slate-100 group-hover:text-violet-300 transition-colors">
          💼 Estimate Project Cost
        </span>
      </button>
    </div>
  );
}

export default FloatingHireButton;
