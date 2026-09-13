import { useState } from 'react';
import ResponsivePhoto from './ResponsivePhoto';
import { MONOGRAM_OWNER } from '../lib/monogram';

/**
 * Above-the-fold hero.
 *
 * Motion contract
 *  · this section is the LCP-critical region, so nothing in it carries an
 *    `opacity: 0 -> 1` entrance: an opacity gate here delays LCP for no
 *    informational gain and couples first paint to a JS animation library.
 *    Above-the-fold content paints with the CSS, nothing else. (Measured:
 *    LCP 3.7 s -> 1.3 s, see docs/evidence/T-005/.)
 *  · the ambient pulse and the hover sweep are the only motion, and both are
 *    collapsed by the global `prefers-reduced-motion` layer in system.css.
 */
export default function Hero({ onOpenHireDrawer }) {
  const [headshotUnavailable, setHeadshotUnavailable] = useState(false);
  const techPills = [
    { label: 'Java Spring Boot', color: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/30' },
    { label: 'Full-Stack Development', color: 'border-violet-500/40 text-violet-300 bg-violet-950/30' },
    { label: 'AI & Machine Learning', color: 'border-cyan-500/40 text-cyan-300 bg-cyan-950/30' },
    { label: 'Python / FastAPI', color: 'border-amber-500/40 text-amber-300 bg-amber-950/30' },
    { label: 'React.js Frontend', color: 'border-blue-500/40 text-blue-300 bg-blue-950/30' },
    { label: 'AWS & Cloud Architecture', color: 'border-orange-500/40 text-orange-300 bg-orange-950/30' },
  ];

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-28 pb-16 px-4 sm:px-6 overflow-hidden">
      {/* Background Ambient Glowing Orbs */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-glow-hero h-glow-hero bg-gradient-to-tr from-violet-600/20 via-cyan-500/15 to-orange-500/10 rounded-full blur-ambient-lg pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">

        {/* Left Column: Professional Pitch & Bio */}
        <div className="lg:col-span-7 text-left space-y-6">

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-mono text-emerald-400 shadow-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span>Available for Full-Stack & AI Systems Contracts</span>
          </div>

          {/* Name & Title */}
          <div className="space-y-2">
            <h1 className="font-display font-black text-4xl sm:text-6xl text-slate-100 tracking-tight leading-none">
              Sheersh <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-cyan-300 to-orange-400">Tiwari</span>
            </h1>
            <p className="font-mono text-xs sm:text-sm text-cyan-400 font-semibold tracking-wider uppercase">
              Senior Software Engineer • Full-Stack & AI Specialist
            </p>
          </div>

          {/* Client-Centric & Impact-Driven Bio */}
          <p className="text-slate-300 text-xs sm:text-sm md:text-base leading-relaxed font-sans">
            I partner with engineering teams and enterprise clients to <strong className="text-slate-100 font-semibold">build scalable enterprise systems, optimize cloud infrastructure, and ship production-grade AI features</strong>. Whether you need to architect resilient end-to-end solutions, develop robust Java and Python microservices, or integrate secure local AI workflows, I bring proven engineering rigor to your product. Recognized with top organizational awards for driving critical technical optimizations and system reliability.
          </p>

          {/* Skill Expertise Pills */}
          <div className="flex flex-wrap gap-2 pt-1">
            {techPills.map((pill) => (
              <span
                key={pill.label}
                className={`px-3 py-1 rounded-lg border font-mono text-mini font-medium shadow-sm ${pill.color}`}
              >
                {pill.label}
              </span>
            ))}
          </div>

          {/* Key Metrics Strip */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80">
              <div className="font-display font-bold text-lg sm:text-xl text-violet-400">Enterprise</div>
              <div className="font-mono text-micro text-slate-400">Architecture</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80">
              <div className="font-display font-bold text-lg sm:text-xl text-cyan-400">Full-Stack</div>
              <div className="font-mono text-micro text-slate-400">Engineering</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80">
              <div className="font-display font-bold text-lg sm:text-xl text-orange-400">Top Performer</div>
              <div className="font-mono text-micro text-slate-400">Excellence Award</div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={onOpenHireDrawer}
              className="px-6 py-3 rounded-full font-mono text-xs font-bold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-orange-500 hover:opacity-90 shadow-xl interactive active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>💼 Scope Project & Hire</span>
            </button>

            <a
              href="#tech-stack"
              className="px-5 py-3 rounded-full font-mono text-xs font-semibold text-slate-300 bg-slate-900/90 border border-slate-800 hover:text-white hover:border-slate-700 interactive shadow-md"
            >
              Explore Experience ➔
            </a>
          </div>

        </div>

        {/* Right Column: Headshot Photo Card & Visual Badge Elements */}
        <div className="lg:col-span-5 flex justify-center relative">
          {/* Card Outer Glow Ring */}
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-violet-600 via-cyan-500 to-orange-500 opacity-30 blur-2xl animate-pulse -z-10" />

          <div className="relative w-full max-w-portrait aspect-[4/5] rounded-3xl p-2.5 bg-slate-950/90 border border-slate-800 shadow-2xl backdrop-blur-2xl overflow-hidden group">

            {/* Image Container */}
            <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800">
              {/* Above-the-fold LCP image: eager + high priority, never lazy */}
              {headshotUnavailable ? (
                <img
                  src={MONOGRAM_OWNER}
                  alt="Sheersh Tiwari monogram"
                  width={96}
                  height={96}
                  loading="eager"
                  decoding="async"
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <ResponsivePhoto
                  photo="headshot"
                  sizes="320px"
                  priority
                  alt="Sheersh Tiwari — Senior Software Engineer, full-stack and AI systems"
                  className="w-full h-full object-cover object-center filter brightness-[0.92] contrast-[1.08] group-hover:scale-105 transition-transform duration-slow"
                  onError={() => setHeadshotUnavailable(true)}
                />
              )}

              {/* Dark Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent opacity-90" />

              {/* Top HUD Badge */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-micro font-mono text-cyan-400 backdrop-blur-md shadow-md flex items-center gap-1.5">
                  <span>India • Remote</span>
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 animate-pulse shadow-live" />
              </div>

              {/* Bottom Details Overlay — a caption, not a section heading
                  (an h3 after the h1 was a heading-order failure). */}
              <div className="absolute bottom-4 left-4 right-4 space-y-1 text-left">
                <p className="font-display font-bold text-lg text-slate-100 tracking-tight">
                  Sheersh Tiwari
                </p>
                <p className="font-mono text-mini text-orange-400">
                  Award-Winning Software Engineer
                </p>
                <p className="font-mono text-micro text-slate-400">
                  Java • Python • Full-Stack • AI
                </p>
              </div>

              {/* Shimmer Highlight */}
              <div className="absolute -inset-full top-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 group-hover:translate-x-full transition-transform duration-shimmer ease-in-out pointer-events-none" />
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
