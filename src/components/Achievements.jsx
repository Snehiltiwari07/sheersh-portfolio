import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { keyAchievements } from '../data/profile';

export default function Achievements() {
  const [selectedId, setSelectedId] = useState(keyAchievements[0].id);
  const activeItem = keyAchievements.find((item) => item.id === selectedId);

  return (
    <section id="achievements" className="max-w-6xl mx-auto px-6 py-20">
      <div className="text-center space-y-3 mb-12">
        <p className="cmd-label justify-center flex">exec business_impact.sh</p>
        <h2 className="font-display font-bold text-3xl sm:text-4xl text-ink">
          Key Integrations & System Achievements
        </h2>
        <p className="text-muted text-sm max-w-2xl mx-auto">
          Delivering business results for non-technical teams alongside robust backend engineering for technical leads.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Selector List */}
        <div className="lg:col-span-5 space-y-3">
          {keyAchievements.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`w-full text-left p-4 rounded-2xl transition-all border ${
                  isSelected
                    ? 'glass border-cyan bg-violet/10 shadow-lg'
                    : 'glass border-line/60 hover:border-violet/30 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[11px] text-cyan uppercase font-semibold">{item.category}</span>
                  <span className="font-mono text-xs font-bold text-violet">{item.metric}</span>
                </div>
                <h3 className="font-display font-bold text-sm sm:text-base text-ink">{item.title}</h3>
                <p className="font-mono text-[11px] text-muted mt-0.5">{item.subtext}</p>
              </button>
            );
          })}
        </div>

        {/* Right Detail Panel */}
        <div className="lg:col-span-7 flex">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeItem.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full card p-6 sm:p-8 rounded-3xl glass border border-line flex flex-col justify-between"
            >
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-line pb-4 mb-6 gap-2">
                  <div>
                    <span className="chip px-3 py-1 rounded-full text-xs font-mono text-cyan">
                      {activeItem.category}
                    </span>
                    <h3 className="font-display font-bold text-2xl text-ink mt-2">
                      {activeItem.title}
                    </h3>
                  </div>
                  <div className="sm:text-right">
                    <p className="font-display font-extrabold text-2xl sm:text-3xl grad-text">
                      {activeItem.metric}
                    </p>
                    <p className="font-mono text-xs text-muted">{activeItem.subtext}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-8">
                  <p className="font-mono text-xs text-violet font-semibold uppercase tracking-wider">
                    ❯ Plain English Summary & Technical Execution
                  </p>
                  <p className="text-ink/90 text-sm sm:text-base leading-relaxed">
                    {activeItem.description}
                  </p>
                </div>
              </div>

              <div>
                <p className="font-mono text-xs text-violet mb-3 font-semibold">Technical Stack & Protocol Specs:</p>
                <div className="flex flex-wrap gap-2">
                  {activeItem.techs.map((tech) => (
                    <span key={tech} className="chip px-3 py-1 rounded-lg text-xs">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}