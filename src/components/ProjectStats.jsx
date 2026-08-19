import { motion } from 'framer-motion';
import { projectStats } from '../data/profile';

export default function ProjectStats() {
  return (
    <section id="track-record" className="max-w-6xl mx-auto px-6 py-20">
      <div className="text-center space-y-3 mb-12">
        <p className="cmd-label justify-center flex">exec track_record_metrics.sh</p>
        <h2 className="font-display font-bold text-3xl sm:text-4xl text-ink">
          Delivering Value at Scale
        </h2>
        <p className="text-muted text-sm max-w-xl mx-auto">
          A quantitative breakdown of completed contracts, client partnerships, and production benchmarks.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projectStats.map((stat, i) => (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: i * 0.08 }}
            className="card p-6 rounded-3xl glass border border-line flex flex-col justify-between hover:border-violet/40 group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl group-hover:scale-110 transition-transform">
                  {stat.icon}
                </span>
                <span className="chip px-2.5 py-1 rounded-full text-[10px] text-cyan font-mono">
                  {stat.tag}
                </span>
              </div>

              <p className="font-display font-extrabold text-4xl sm:text-5xl grad-text mb-2">
                {stat.value}
              </p>

              <h3 className="font-display font-bold text-lg text-ink mb-1">
                {stat.label}
              </h3>

              <p className="text-xs text-muted leading-relaxed">
                {stat.description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-line/60 flex items-center justify-between font-mono text-[11px] text-violet">
              <span>Verified Metric</span>
              <span>❯ active</span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}