import { motion } from 'framer-motion';
import ThemeAdaptiveImage from './ThemeAdaptiveImage';
import { profile } from '../data/profile';

export default function BeyondTheCode() {
  return (
    <section id="beyond-code" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 relative">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-[130px] pointer-events-none -z-10" />

      {/* Main Glass Panel */}
      <div className="relative rounded-3xl bg-slate-950/80 border border-slate-800/90 shadow-2xl backdrop-blur-2xl p-6 sm:p-10 lg:p-12 overflow-hidden">
        {/* Top Accent Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-violet-500 to-cyan-500 opacity-80" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Enhanced Theme Adaptive Image Container */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-6 relative group"
          >
            <div className="relative rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-900/60 shadow-xl">
              {/* Image Component */}
              <ThemeAdaptiveImage
                src={profile?.avatarLifestyle || "/profile-lifestyle.png"}
                alt="Sheersh Tiwari - Beyond the Code"
                className="w-full h-[360px] sm:h-[420px] object-cover group-hover:scale-105 transition-transform duration-700"
              />

              {/* Gradient Overlay for Text Legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-90" />

              {/* Floating Top Badge: Pets & Companion */}
              <div className="absolute top-4 right-4 z-10 bg-slate-950/80 border border-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                <span className="text-sm">🐾</span>
                <span className="font-mono text-[11px] font-medium text-slate-200">Pet & Life Balance</span>
              </div>

              {/* Bottom Glass Overlay Bar: Bikes & Highway */}
              <div className="absolute bottom-4 left-4 right-4 z-10 bg-slate-900/85 border border-slate-800/90 backdrop-blur-md p-4 rounded-xl flex items-center justify-between shadow-xl">
                <div className="space-y-0.5">
                  <p className="font-mono text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <span>Driven by Freedom & Precision</span>
                  </p>
                  <p className="font-mono text-[10px] text-slate-400">
                    Open Highways • Two-Wheel Telemetry • Canine Loyalty
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                  <span className="text-lg">🏍️</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Persona Text & Highlights */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-6 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-400 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>❯ passion_and_mindset.env</span>
            </div>

            <h2 className="font-display font-bold text-3xl sm:text-4xl text-slate-100 leading-tight tracking-tight">
              Beyond the Code: <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-amber-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Precision, Speed & Balance
              </span>
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-sans">
              When I'm not tuning 200M+ SQL queries or architecting backend microservices, you'll find me exploring open highways on two wheels or unwinding with my pet companion. Long endurance rides build high-stamina focus and mechanical diagnostic intuition, while my dog provides essential mental clarity. This harmony between mechanical precision and grounded balance directly shapes my high-reliability software design.
            </p>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              
              {/* Card 1: Motorcycling */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-amber-500/40 transition-colors space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 text-sm">🏍️</span>
                  <p className="font-display font-bold text-sm text-slate-100">Highway Telemetry</p>
                </div>
                <p className="font-mono text-[11px] text-slate-400 leading-normal">
                  Endurance riding builds deep root-cause focus, mechanical diagnostic skills, and respect for tolerances under heavy load.
                </p>
              </div>

              {/* Card 2: Pets */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/40 transition-colors space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 text-sm">🐾</span>
                  <p className="font-display font-bold text-sm text-slate-100">Canine Balance</p>
                </div>
                <p className="font-mono text-[11px] text-slate-400 leading-normal">
                  Downtime with pets provides the mental reset required to approach complex concurrency and database bottlenecks with fresh clarity.
                </p>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}