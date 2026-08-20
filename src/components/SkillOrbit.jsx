import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { skillNodes, skillCategories } from '../data/profile';

const LEVEL_COLORS = {
  Expert: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
  Advanced: 'bg-violet-950/80 text-violet-300 border-violet-700/60',
  Proficient: 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60',
};

export default function SkillOrbit() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedSkillId, setSelectedSkillId] = useState(skillNodes[0]?.id);

  // Filter skills by category
  const filteredSkills = useMemo(() => {
    if (activeCategory === 'All') return skillNodes;
    return skillNodes.filter((s) => s.category === activeCategory);
  }, [activeCategory]);

  // Fallback to guarantee active skill is always defined and visible
  const activeSkill = useMemo(() => {
    const found = filteredSkills.find((s) => s.id === selectedSkillId);
    return found || filteredSkills[0] || skillNodes[0];
  }, [filteredSkills, selectedSkillId]);

  return (
    <section id="skill-matrix" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 relative">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="text-center space-y-3 mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400 shadow-md">
          exec skill_matrix.node
        </div>
        <h2 className="font-display font-bold text-3xl sm:text-4xl text-slate-100 tracking-tight">
          Interactive Skill Matrix
        </h2>
        <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
          Select any technology node to inspect core highlights and real-world system impact.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {skillCategories.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                const firstMatch = cat === 'All' ? skillNodes[0] : skillNodes.find((s) => s.category === cat);
                if (firstMatch) setSelectedSkillId(firstMatch.id);
              }}
              className={`px-4 py-2 rounded-full font-mono text-xs transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-950/50 font-semibold scale-105'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Interactive Grid & Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Skill Nodes Grid */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {filteredSkills.map((skill) => {
              const isSelected = activeSkill.id === skill.id;
              return (
                <motion.button
                  key={skill.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedSkillId(skill.id)}
                  className={`p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer relative transition-all border ${
                    isSelected
                      ? 'bg-slate-900/90 border-cyan-400 shadow-xl shadow-cyan-950/30 ring-1 ring-cyan-400/40'
                      : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  {/* Selection Beacon */}
                  {isSelected && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  )}

                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 p-2.5 flex items-center justify-center mb-2.5 shadow-sm">
                    <img
                      src={skill.icon}
                      alt={skill.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${skill.name}&backgroundColor=0f172a`;
                      }}
                    />
                  </div>

                  <h3 className="font-display font-bold text-xs sm:text-sm text-slate-100 mb-0.5 truncate w-full">
                    {skill.name}
                  </h3>
                  <span className="font-mono text-[10px] text-slate-400">{skill.category}</span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Right Active Skill Details Panel */}
        <div className="lg:col-span-5 sticky top-24">
          <AnimatePresence mode="wait">
            {activeSkill && (
              <motion.div
                key={activeSkill.id}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                className="rounded-3xl bg-slate-950/95 border-2 border-violet-500/40 p-6 sm:p-7 shadow-2xl backdrop-blur-xl relative overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 p-2.5 shrink-0 shadow-md">
                    <img
                      src={activeSkill.icon}
                      alt={activeSkill.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${activeSkill.name}&backgroundColor=0f172a`;
                      }}
                    />
                  </div>

                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 mb-1 inline-block">
                      {activeSkill.highlight}
                    </span>
                    <h3 className="font-display font-bold text-xl text-slate-100">{activeSkill.name}</h3>
                  </div>
                </div>

                {/* Level Badge */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
                  <span className="text-xs font-mono text-slate-400">Competency Tier</span>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold border ${LEVEL_COLORS[activeSkill.level] || LEVEL_COLORS.Proficient}`}>
                    {activeSkill.level}
                  </span>
                </div>

                {/* Real-World Impact */}
                <div className="space-y-1.5">
                  <p className="font-mono text-xs text-violet-400 font-semibold flex items-center gap-1">
                    <span>❯</span> Production Impact
                  </p>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {activeSkill.impact}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}