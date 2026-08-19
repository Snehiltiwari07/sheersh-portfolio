import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SKILL_NODES = [
  {
    id: 'spring-boot',
    name: 'Spring Boot',
    category: 'Backend',
    proficiency: 95,
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/spring/spring-original.svg',
    impact: 'Powers core CloudLIMS REST microservices, Spring Security auth, & scheduled search pipelines across 200M+ records.',
    highlight: 'Microservices Architect'
  },
  {
    id: 'sql-tuning',
    name: 'SQL Optimization',
    category: 'Databases',
    proficiency: 98,
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg',
    impact: 'Reduced cross-module table scan queries from 15 minutes down to 6 seconds with custom composite indexes.',
    highlight: 'Sub-second Query Latency'
  },
  {
    id: 'python',
    name: 'Python',
    category: 'Backend',
    proficiency: 90,
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
    impact: 'Automated data migration pipelines, automated ETL scripts, and rapid API prototyping.',
    highlight: 'Automation & Data Pipelines'
  },
  {
    id: 'react',
    name: 'React',
    category: 'Frontend',
    proficiency: 92,
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
    impact: 'Engineered high-throughput client reporting dashboards with component modularity & responsive layouts.',
    highlight: 'Reactive State Architecture'
  },
  {
    id: 'aws',
    name: 'AWS Cloud',
    category: 'Cloud & DevOps',
    proficiency: 88,
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg',
    impact: 'Managed cloud deployments across EC2, S3 bucket management, RDS instances, and Lambda serverless functions.',
    highlight: 'Scalable Cloud Infra'
  },
  {
    id: 'docker',
    name: 'Docker',
    category: 'Cloud & DevOps',
    proficiency: 85,
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg',
    impact: 'Containerized local and production environments for standardized CI/CD pipelines.',
    highlight: 'Containerized Deployments'
  },
  {
    id: 'kafka',
    name: 'Apache Kafka',
    category: 'Backend',
    proficiency: 82,
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apachekafka/apachekafka-original.svg',
    impact: 'Asynchronous event streaming layer for multilingual platform synchronization & reporting jobs.',
    highlight: 'Event-Driven Systems'
  },
  {
    id: 'tailwind',
    name: 'Tailwind CSS',
    category: 'Frontend',
    proficiency: 94,
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg',
    impact: 'Designed fluid glassmorphism UI systems, theme-switching engines, and responsive layouts.',
    highlight: 'Modern Design Systems'
  }
];

const CATEGORIES = ['All', 'Backend', 'Databases', 'Frontend', 'Cloud & DevOps'];

export default function SkillOrbit() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedSkill, setSelectedSkill] = useState(SKILL_NODES[0]);

  const filteredSkills = activeCategory === 'All' 
    ? SKILL_NODES 
    : SKILL_NODES.filter(s => s.category === activeCategory);

  return (
    <section id="skill-matrix" className="max-w-6xl mx-auto px-6 py-24 relative">
      {/* Header */}
      <div className="text-center space-y-3 mb-12">
        <p className="cmd-label justify-center flex">exec skill_matrix.node</p>
        <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">
          Interactive Skill & Technology Matrix
        </h2>
        <p className="text-muted text-sm max-w-xl mx-auto">
          Explore core technical competencies, proficiency levels, and real-world system impacts.
        </p>
      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap justify-center gap-2 mb-12">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full font-mono text-xs transition-all ${
              activeCategory === cat
                ? 'grad-bg text-white shadow-lg shadow-violet/30 font-semibold'
                : 'glass text-muted hover:text-white border border-line'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Interactive Matrix Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Interactive Node Grid */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {filteredSkills.map((skill) => {
            const isSelected = selectedSkill.id === skill.id;
            return (
              <motion.button
                key={skill.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedSkill(skill)}
                className={`card p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer relative transition-all ${
                  isSelected 
                    ? 'border-cyan bg-violet/10 shadow-xl shadow-cyan/10' 
                    : 'glass border-line hover:border-violet/40'
                }`}
              >
                {/* Active Indicator Beacon */}
                {isSelected && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan animate-ping" />
                )}

                <div className="w-12 h-12 rounded-xl glass p-2 flex items-center justify-center mb-3">
                  <img src={skill.icon} alt={skill.name} className="w-8 h-8 object-contain" />
                </div>

                <h3 className="font-mono text-xs font-bold text-white mb-1">{skill.name}</h3>
                <span className="font-mono text-[10px] text-muted">{skill.category}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Right Active Skill Insights Panel */}
        <div className="lg:col-span-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedSkill.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="card p-6 sm:p-8 rounded-3xl glass border-2 border-violet/40 relative overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl glass p-2.5 border border-cyan/40 shrink-0">
                  <img src={selectedSkill.icon} alt={selectedSkill.name} className="w-full h-full object-contain" />
                </div>
                <div>
                  <span className="chip px-2.5 py-0.5 rounded-full text-[10px] text-cyan mb-1 inline-block">
                    {selectedSkill.highlight}
                  </span>
                  <h3 className="font-display font-bold text-xl text-white">{selectedSkill.name}</h3>
                </div>
              </div>

              {/* Skill Proficiency Bar */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-muted">Mastery Index</span>
                  <span className="text-cyan font-bold">{selectedSkill.proficiency}%</span>
                </div>
                <div className="h-2 rounded-full bg-line overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${selectedSkill.proficiency}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full grad-bg"
                  />
                </div>
              </div>

              {/* Real World Impact */}
              <div className="space-y-2 pt-4 border-t border-line">
                <p className="font-mono text-xs text-violet font-semibold">❯ Production Impact & Application</p>
                <p className="text-sm text-text/90 leading-relaxed">
                  {selectedSkill.impact}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}