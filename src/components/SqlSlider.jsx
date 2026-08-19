import { useState } from 'react';
import { motion } from 'framer-motion';

export default function SqlSlider() {
  const [value, setValue] = useState(50);

  const seconds = Math.round(900 - (value / 100) * 894); // 900s -> 6s
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const beforeTimeLabel = value < 100 ? (mins > 0 ? `${mins}m ${secs}s` : `${secs}s`) : '6 sec';
  const cpuBefore = Math.round(92 - (value / 100) * 84);
  const cpuAfter = Math.max(8, 92 - cpuBefore);

  return (
    <section className="max-w-5xl mx-auto px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        className="text-center"
      >
        <p className="cmd-label justify-center flex">EXPLAIN ANALYZE</p>
        <h2 className="font-display font-bold text-3xl md:text-4xl mt-2">The 15-Minute → 6-Second Query</h2>
        <p className="text-muted mt-2 max-w-xl mx-auto">Drag the slider to see the before/after across 200M+ records.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        className="glass glow-violet rounded-2xl p-6 md:p-8 mt-10"
      >
        <div className="grid grid-cols-2 gap-6 text-center mb-6">
          <div>
            <p className="font-mono text-xs text-muted">UNOPTIMIZED QUERY</p>
            <p className="font-display font-bold text-3xl mt-1 text-pink" style={{ opacity: 1 - value / 140 }}>
              {beforeTimeLabel}
            </p>
            <p className="font-mono text-xs text-muted mt-1">
              {cpuBefore}% CPU · {value < 60 ? 'full table scan' : 'partial index'}
            </p>
          </div>
          <div>
            <p className="font-mono text-xs text-muted">SHEERSH'S INDEXED ARCHITECTURE</p>
            <p className="font-display font-bold text-3xl mt-1 grad-text" style={{ opacity: 0.4 + value / 170 }}>
              6 sec
            </p>
            <p className="font-mono text-xs text-muted mt-1">
              {cpuAfter}% CPU · {value > 60 ? 'indexed + query-plan tuned' : 'still optimizing...'}
            </p>
          </div>
        </div>

        <div className="relative h-3 rounded-full overflow-hidden bg-black/20">
          <div className="absolute inset-y-0 left-0 grad-bg transition-all" style={{ width: `${value}%` }} />
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => setValue(+e.target.value)}
          className="sql-range mt-4"
        />
        <p className="font-mono text-xs text-muted text-center mt-3">
          Techniques: composite indexing strategy · execution plan analysis · stored procedure refactor
        </p>
      </motion.div>
    </section>
  );
}
