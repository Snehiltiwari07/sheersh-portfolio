import { motion } from 'framer-motion';
import { techCategories } from '../data/profile';

export default function TechStack() {
  return (
    <section id="tech-stack" className="max-w-6xl mx-auto px-6 py-20">
      <div className="text-center space-y-3 mb-14">
        <p className="cmd-label justify-center flex">cat skills.json</p>
        <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">
          Technical Stack & Work Competencies
        </h2>
        <p className="text-muted text-sm max-w-xl mx-auto">
          Technologies, frameworks, and database architectures Sheersh works with daily to build production applications.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {techCategories.map((cat, idx) => (
          <motion.div
            key={cat.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="card p-6 rounded-2xl glass flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-3 mb-5 border-b border-line">
                <h3 className="font-display font-bold text-lg text-white">{cat.title}</h3>
                <span className="font-mono text-xs text-cyan">0{idx + 1}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {cat.techs.map((t) => (
                  <div
                    key={t.name}
                    className="flex items-center gap-3 p-3 rounded-xl glass border border-line hover:border-violet/50 transition group"
                  >
                    <img
                      src={t.icon}
                      alt={t.name}
                      className="w-7 h-7 object-contain group-hover:scale-110 transition shrink-0"
                    />
                    <div className="overflow-hidden">
                      <p className="font-mono text-xs font-semibold text-white truncate">{t.name}</p>
                      <p className="font-mono text-[10px] text-muted">{t.level}</p>
                    </div>
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