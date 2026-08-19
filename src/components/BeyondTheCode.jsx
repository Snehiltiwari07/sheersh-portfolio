import { motion } from 'framer-motion';
import ThemeAdaptiveImage from './ThemeAdaptiveImage';
import { profile } from '../data/profile';

export default function BeyondTheCode() {
  return (
    <section id="beyond-code" className="max-w-6xl mx-auto px-6 py-20">
      <div className="card rounded-3xl glass p-8 sm:p-12 border border-line relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Theme Adaptive Lifestyle Image Display */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-6 relative"
          >
            <div className="max-h-[420px] relative">
              <ThemeAdaptiveImage
                src={profile.avatarLifestyle || "/profile-lifestyle.png"}
                alt="Sheersh Tiwari - Beyond the Code"
                className="w-full h-[380px] sm:h-[420px]"
              />
              <div className="absolute bottom-4 left-4 right-4 z-10 glass p-3.5 rounded-xl border border-line/60 flex items-center justify-between">
                <div>
                  <p className="font-mono text-xs font-bold text-ink">Driven by Freedom & Precision</p>
                  <p className="font-mono text-[10px] text-muted">Out on the road • Engineering mindset everywhere</p>
                </div>
                <span className="text-xl">🏍️</span>
              </div>
            </div>
          </motion.div>

          {/* Persona Text */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-6 space-y-5"
          >
            <span className="chip px-3.5 py-1.5 rounded-full text-xs font-mono text-cyan">
              ❯ passion_and_focus.env
            </span>

            <h2 className="font-display font-bold text-3xl sm:text-4xl text-ink leading-tight">
              Beyond the Code: <span className="grad-text">Driven by Precision</span>
            </h2>

            <p className="text-muted text-base leading-relaxed">
              When I'm not refactoring SQL queries or building backend APIs, I'm out exploring open highways. The same focus, discipline, and endurance required for long rides fuel my approach to complex software architecture.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl glass border border-line">
                <p className="font-display font-bold text-lg text-ink">Analytical</p>
                <p className="font-mono text-xs text-muted mt-1">Deep focus on root-cause debugging & system stability.</p>
              </div>
              <div className="p-4 rounded-xl glass border border-line">
                <p className="font-display font-bold text-lg text-ink">Adaptive</p>
                <p className="font-mono text-xs text-muted mt-1">Quick to master new frameworks, clouds, & workflows.</p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}