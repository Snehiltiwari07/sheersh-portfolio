import { motion } from 'framer-motion';
import { profile } from '../data/profile';

export default function Hero({ onOpenHireDrawer }) {
  const techPills = [
    { label: 'Spring Boot Microservices', color: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/30' },
    { label: '200M+ SQL Optimization', color: 'border-violet-500/40 text-violet-300 bg-violet-950/30' },
    { label: 'AI Agents & RAG Pipelines', color: 'border-cyan-500/40 text-cyan-300 bg-cyan-950/30' },
    { label: 'Python / FastAPI', color: 'border-amber-500/40 text-amber-300 bg-amber-950/30' },
    { label: 'React.js Frontend', color: 'border-blue-500/40 text-blue-300 bg-blue-950/30' },
    { label: 'AWS & Docker Containers', color: 'border-orange-500/40 text-orange-300 bg-orange-950/30' },
  ];

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-28 pb-16 px-4 sm:px-6 overflow-hidden">
      {/* Background Ambient Glowing Orbs */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-violet-600/20 via-cyan-500/15 to-orange-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">

        {/* Left Column: Professional Pitch & Bio */}
        <div className="lg:col-span-7 text-left space-y-6">

          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-mono text-emerald-400 shadow-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span>Available for Full-Stack & AI Systems Contracts</span>
          </motion.div>

          {/* Name & Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-2"
          >
            <h1 className="font-display font-black text-4xl sm:text-6xl text-slate-100 tracking-tight leading-none">
              Sheersh <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-cyan-300 to-orange-400">Tiwari</span>
            </h1>
            <p className="font-mono text-xs sm:text-sm text-cyan-400 font-semibold tracking-wider uppercase">
              Full-Stack & SQL Architect • AI Systems Specialist
            </p>
          </motion.div>

          {/* Client-Centric & Impact-Driven Bio */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-300 text-xs sm:text-sm md:text-base leading-relaxed font-sans"
          >
            I partner with founders, engineering teams, and enterprise clients to <strong className="text-slate-100 font-semibold">solve critical system bottlenecks, cut cloud infrastructure bills, and ship production-grade AI features</strong> across SaaS, Fintech, and high-scale platforms. Whether you need to refactor a slow database, build resilient Spring Boot/Python microservices, or integrate secure local AI workflows, I bring proven architectural rigor to your product. Winner of <strong className="text-orange-400 font-semibold">"The Beacon — Employee of the Year 2024"</strong> for optimizing 200M+ record queries—slashing execution latencies from 15 minutes to 6 seconds and cutting CPU load by 92%.
          </motion.p>

          {/* Skill Expertise Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap gap-2 pt-1"
          >
            {techPills.map((pill) => (
              <span
                key={pill.label}
                className={`px-3 py-1 rounded-lg border font-mono text-[11px] font-medium shadow-sm ${pill.color}`}
              >
                {pill.label}
              </span>
            ))}
          </motion.div>

          {/* Key Metrics Strip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="grid grid-cols-3 gap-3 pt-2"
          >
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80">
              <div className="font-display font-bold text-lg sm:text-xl text-violet-400">200M+</div>
              <div className="font-mono text-[10px] text-slate-400">Records Optimized</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80">
              <div className="font-display font-bold text-lg sm:text-xl text-cyan-400">15m ➔ 6s</div>
              <div className="font-mono text-[10px] text-slate-400">Execution Speedup</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80">
              <div className="font-display font-bold text-lg sm:text-xl text-orange-400">Beacon 2024</div>
              <div className="font-mono text-[10px] text-slate-400">Executive Award</div>
            </div>
          </motion.div>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap items-center gap-3 pt-3"
          >
            <button
              onClick={onOpenHireDrawer}
              className="px-6 py-3 rounded-full font-mono text-xs font-bold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-orange-500 hover:opacity-90 shadow-xl transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>💼 Scope Project & Hire</span>
            </button>

            <a
              href="#tech-stack"
              className="px-5 py-3 rounded-full font-mono text-xs font-semibold text-slate-300 bg-slate-900/90 border border-slate-800 hover:text-white hover:border-slate-700 transition-all shadow-md"
            >
              Explore Experience ➔
            </a>
          </motion.div>

        </div>

        {/* Right Column: Headshot Photo Card & Visual Badge Elements */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-5 flex justify-center relative"
        >
          {/* Card Outer Glow Ring */}
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-violet-600 via-cyan-500 to-orange-500 opacity-30 blur-2xl animate-pulse -z-10" />

          <div className="relative w-full max-w-[340px] aspect-[4/5] rounded-3xl p-2.5 bg-slate-950/90 border border-slate-800 shadow-2xl backdrop-blur-2xl overflow-hidden group">

            {/* Image Container */}
            <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800">
              <img
                src="/profile-headshot.png"
                alt="Sheersh Tiwari"
                className="w-full h-full object-cover object-center filter brightness-[0.92] contrast-[1.08] group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80";
                }}
              />

              {/* Dark Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent opacity-90" />

              {/* Top HUD Badge */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-cyan-400 backdrop-blur-md shadow-md">
                  Indore, MP, India
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 animate-pulse" />
              </div>

              {/* Bottom Details Overlay */}
              <div className="absolute bottom-4 left-4 right-4 space-y-1 text-left">
                <h3 className="font-display font-bold text-lg text-slate-100 tracking-tight">
                  Sheersh Tiwari
                </h3>
                <p className="font-mono text-[11px] text-orange-400">
                  The Beacon — Employee of the Year 2024
                </p>
                <p className="font-mono text-[10px] text-slate-400">
                  Java Spring • Python • SQL • WebGPU AI
                </p>
              </div>

              {/* Shimmer Highlight */}
              <div className="absolute -inset-full top-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
            </div>

          </div>
        </motion.div>

      </div>
    </section>
  );
}