import { motion } from 'framer-motion';
import { careerRoadmap } from '../data/profile';

export default function TechStack() {
  return (
    <section id="tech-stack" className="max-w-5xl mx-auto px-4 sm:px-6 py-20 relative">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Section Header */}
      <div className="text-center space-y-3 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400 shadow-md">
          ⚡ Continuous Skill Evolution
        </div>
        <h2 className="font-display font-bold text-3xl sm:text-4xl text-slate-100 tracking-tight">
          Tech Stack & Engineering Journey (2018 – 2026)
        </h2>
        <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
          Scroll through the connected timeline to explore what Sheersh built, optimized, and integrated at every stage.
        </p>
      </div>

      {/* CONTINUOUS TIMELINE ROADMAP */}
      <div className="relative pl-6 sm:pl-10 space-y-12">
        {/* Continuous Connecting Line */}
        <div className="absolute left-2.5 sm:left-4 top-4 bottom-4 w-1 bg-gradient-to-b from-orange-500 via-violet-500 to-emerald-500 rounded-full z-0" />

        {careerRoadmap.map((item, idx) => (
          <motion.div
            key={item.era}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            className="relative z-10"
          >
            {/* Timeline Node Dot */}
            <div className="absolute -left-[31px] sm:-left-[39px] top-2 w-5 h-5 rounded-full bg-slate-950 border-4 border-slate-700 shadow-md flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            </div>

            {/* Content Card */}
            <div className="rounded-3xl bg-slate-950/90 border border-slate-800/90 p-5 sm:p-7 shadow-xl backdrop-blur-xl hover:border-slate-700 transition-colors">
              
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-800/80">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-violet-500/10 text-violet-300 border border-violet-500/30">
                      {item.era}
                    </span>
                    <span className="text-xs font-mono text-slate-400">• {item.role}</span>
                  </div>

                  <h3 className="font-display font-bold text-lg sm:text-xl text-slate-100">
                    {item.title}
                  </h3>
                </div>

                <span className="text-xs font-mono text-slate-300 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto font-medium">
                  {item.highlight}
                </span>
              </div>

              {/* Story Paragraphs */}
              <div className="space-y-2.5 mb-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
                {item.paragraphs.map((p, pIdx) => (
                  <p key={pIdx}>{p}</p>
                ))}
              </div>

              {/* Tech Skill Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {item.techs.map((tech) => (
                  <div
                    key={tech.name}
                    className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center text-center hover:border-violet-500/50 transition-colors group"
                  >
                    <img
                      src={tech.icon}
                      alt={tech.name}
                      className="w-6 h-6 object-contain mb-1.5 group-hover:scale-110 transition-transform"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${tech.name}`;
                      }}
                    />
                    <span className="font-sans text-[11px] font-bold text-slate-100 leading-tight truncate w-full">
                      {tech.name}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                      {tech.level}
                    </span>
                  </div>
                ))}
              </div>

            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}