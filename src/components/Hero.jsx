import { motion } from 'framer-motion';
import PhotoCard3D from './PhotoCard3D';
import { profile } from '../data/profile';

export default function Hero({ onOpenHireDrawer }) {
  return (
    <section className="relative min-h-[100dvh] flex items-center px-4 sm:px-6 pt-24 sm:pt-28 pb-12 sm:pb-16 overflow-hidden">
      <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12 items-center">
        
        {/* Left Column: Text & CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6 }}
          className="text-left"
        >
          {/* Availability Status Chip */}
          <div className="chip inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-4 sm:mb-6 text-xs font-mono text-cyan backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="truncate">Available for Freelance & Remote Contracting</span>
          </div>

          {/* Headline */}
          <h1 className="font-display font-bold text-3xl sm:text-5xl lg:text-6xl leading-[1.1] sm:leading-[1.08] text-ink tracking-tight">
            Hi, I'm <span className="grad-text">{profile.name}</span>
          </h1>

          {/* SubTitle */}
          <p className="font-mono text-violet font-semibold mt-2 sm:mt-3 text-xs sm:text-base leading-snug">
            {profile.subTitle}
          </p>

          {/* Summary */}
          <p className="mt-4 sm:mt-5 text-muted text-sm sm:text-lg leading-relaxed max-w-xl">
            {profile.summary}
          </p>

          {/* Mobile-Optimized Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 mt-6 sm:mt-8">
            {/* Primary Action Button */}
            <button
              onClick={onOpenHireDrawer}
              className="w-full sm:w-auto px-6 py-3.5 rounded-full font-mono text-sm font-semibold text-white grad-bg shadow-lg hover:shadow-violet/40 transition-all text-center active:scale-95 cursor-pointer"
            >
              💼 Scope Project →
            </button>

            {/* Quick Contact Chips Grid for Mobile */}
            <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <a
                href={profile.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="chip px-2.5 sm:px-5 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-mono text-emerald-500 flex items-center justify-center gap-1.5 hover:border-emerald-500 active:scale-95 transition-all text-center"
              >
                💬 <span className="inline">WhatsApp</span>
              </a>

              <a
                href={profile.phoneUrl}
                className="chip px-2.5 sm:px-5 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-mono text-cyan flex items-center justify-center gap-1.5 hover:border-cyan active:scale-95 transition-all text-center"
              >
                📞 <span className="inline">Call</span>
              </a>

              <a
                href={profile.resumeUrl}
                download="Sheersh_Tiwari_Resume.pdf"
                className="chip px-2.5 sm:px-5 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-mono flex items-center justify-center gap-1.5 active:scale-95 transition-all text-center"
              >
                ↓ <span className="inline">Resume</span>
              </a>
            </div>
          </div>

          {/* Responsive Impact Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-6 sm:pt-8 mt-6 sm:mt-8 border-t border-line">
            {profile.stats.map((s) => (
              <div key={s.label} className="text-left">
                <div className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                  {s.value}
                </div>
                <div className="font-mono text-[10px] sm:text-[11px] text-muted leading-tight mt-0.5">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right Column: 3D Photo Card Wrapper */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.94 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.7, delay: 0.15 }}
          className="flex justify-center items-center w-full max-w-sm sm:max-w-md mx-auto lg:max-w-none mt-2 lg:mt-0"
        >
          <PhotoCard3D />
        </motion.div>

      </div>
    </section>
  );
}