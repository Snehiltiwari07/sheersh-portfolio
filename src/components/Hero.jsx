import { motion } from 'framer-motion';
import PhotoCard3D from './PhotoCard3D';
import { profile } from '../data/profile';

export default function Hero({ onOpenHireDrawer }) {
  return (
    <section className="relative min-h-screen flex items-center px-6 pt-28 pb-16">
      <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="chip inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6 text-xs font-mono text-cyan">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Available for Freelance & Remote Contracting
          </div>

          <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.08] text-ink">
            Hi, I'm <span className="grad-text">{profile.name}</span>
          </h1>

          <p className="font-mono text-violet font-semibold mt-3 text-sm sm:text-base">
            {profile.subTitle}
          </p>

          <p className="mt-5 text-muted text-base sm:text-lg leading-relaxed max-w-xl">
            {profile.summary}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-8">
            <button
              onClick={onOpenHireDrawer}
              className="px-6 py-3.5 rounded-full font-mono text-sm font-semibold text-white grad-bg shadow-lg hover:shadow-violet/40 transition-all"
            >
              💼 Scope Project →
            </button>
            <a
              href={profile.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="chip px-5 py-3 rounded-full text-sm font-mono text-emerald-500 flex items-center gap-2 hover:border-emerald-500"
            >
              💬 WhatsApp
            </a>
            <a
              href={profile.phoneUrl}
              className="chip px-5 py-3 rounded-full text-sm font-mono text-cyan flex items-center gap-2 hover:border-cyan"
            >
              📞 Call
            </a>
            <a
              href={profile.resumeUrl}
              download="Sheersh_Tiwari_Resume.pdf"
              className="chip px-5 py-3 rounded-full text-sm font-mono flex items-center gap-2"
            >
              ↓ Resume
            </a>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-8 mt-8 border-t border-line">
            {profile.stats.map((s) => (
              <div key={s.label}>
                <div className="font-display text-2xl font-bold text-ink">{s.value}</div>
                <div className="font-mono text-[11px] text-muted">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.15 }}>
          <PhotoCard3D />
        </motion.div>
      </div>
    </section>
  );
}