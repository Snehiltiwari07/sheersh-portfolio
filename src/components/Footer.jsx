import { profile } from '../data/profile';

export default function Footer({ onOpenHireDrawer }) {
  return (
    <footer className="relative z-10 bg-slate-950/90 border-t border-slate-800/80 pt-16 pb-28 sm:pb-20 overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-64 bg-gradient-to-tr from-violet-600/10 via-cyan-500/10 to-orange-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Brand & Identity Column */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="font-display font-black text-xl text-slate-100 tracking-wider">
                SHEERSH<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-orange-400">.dev</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 shadow-sm">
                v3.2 • AI & WebGPU
              </span>
            </div>

            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              Full-Stack & SQL Architect specializing in 200M+ database performance tuning, Spring Boot microservices, and client-side AI systems.
            </p>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Available for Contract & Remote Engagement
              </div>
              <span className="text-xs font-mono text-slate-500">• Indore, India</span>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="md:col-span-3 space-y-3 font-mono text-xs">
            <p className="text-violet-400 font-bold uppercase tracking-widest text-[11px]">
              System Navigation
            </p>
            <ul className="space-y-2 text-slate-400">
              <li>
                <a href="#projects" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                  <span className="text-violet-500">❯</span> Key Engineering Projects
                </a>
              </li>
              <li>
                <a href="#tech-stack" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                  <span className="text-violet-500">❯</span> Roadmap & Tech Stack
                </a>
              </li>
              <li>
                <a href="#skill-matrix" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                  <span className="text-violet-500">❯</span> Interactive Skill Matrix
                </a>
              </li>
              <li>
                <a href="#local-llm" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                  <span className="text-violet-500">❯</span> In-Browser AI Engine
                </a>
              </li>
              <li>
                <a href="#reviews" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                  <span className="text-violet-500">❯</span> Client Recommendations
                </a>
              </li>
            </ul>
          </div>

          {/* Direct Actions & Contact Hub */}
          <div className="md:col-span-4 space-y-4">
            <p className="font-mono text-xs text-violet-400 font-bold uppercase tracking-widest text-[11px]">
              Direct Engagement
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={onOpenHireDrawer}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-orange-500 hover:opacity-90 shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <span>💼 Scope Project</span>
              </button>

              <a
                href={profile.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 hover:bg-emerald-900/50 transition-colors flex items-center gap-1.5"
              >
                <span>💬 WhatsApp</span>
              </a>

              <a
                href={profile.phoneUrl}
                className="px-3.5 py-2 rounded-xl text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/60 hover:bg-cyan-900/50 transition-colors flex items-center gap-1.5"
              >
                <span>📞 Direct Call</span>
              </a>

              <a
                href={profile.resumeUrl}
                download="Sheersh_Tiwari_Resume.pdf"
                className="px-3.5 py-2 rounded-xl text-xs font-mono text-slate-300 bg-slate-900 border border-slate-800 hover:text-white hover:border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <span>↓ Resume</span>
              </a>
            </div>

            {/* Social Network Links */}
            <div className="flex gap-2 pt-1">
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400 bg-slate-900/90 border border-slate-800 hover:text-white hover:border-slate-700 transition-colors"
              >
                LinkedIn ↗
              </a>
              <a
                href={profile.github}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400 bg-slate-900/90 border border-slate-800 hover:text-white hover:border-slate-700 transition-colors"
              >
                GitHub ↗
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar & Copyright Notice */}
        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between font-mono text-xs text-slate-500 gap-4">
          <p>© 2026 Sheersh Tiwari. All rights reserved.</p>
          <div className="flex items-center gap-3 text-[11px]">
            <span>Crafted with React, Tailwind CSS & Framer Motion</span>
            <span>•</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              100% Client-Side WebGPU
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}