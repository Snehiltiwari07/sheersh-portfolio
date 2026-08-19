import { profile } from '../data/profile';

export default function Footer({ onOpenHireDrawer }) {
  return (
    <footer className="glass border-t border-line mt-20 pt-16 pb-28 relative z-10">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-10">
        
        {/* Brand & Bio */}
        <div className="md:col-span-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-xl text-ink">Sheersh<span className="grad-text">.dev</span></span>
            <span className="chip px-2.5 py-0.5 rounded-full text-[10px] text-cyan">v3.0</span>
          </div>

          <p className="text-muted text-sm leading-relaxed max-w-sm">
            {profile.title} based in Indore, India. Available for global remote contracts and full-stack engagements.
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-line text-xs font-mono text-cyan">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Open for New Projects
          </div>
        </div>

        {/* Quick Navigation Links */}
        <div className="md:col-span-3 space-y-3 font-mono text-xs">
          <p className="text-violet font-bold uppercase tracking-wider mb-2">Navigation</p>
          <ul className="space-y-2 text-muted">
            <li><a href="#services" className="hover:text-cyan transition">❯ Services</a></li>
            <li><a href="#tech-stack" className="hover:text-cyan transition">❯ Tech Stack</a></li>
            <li><a href="#achievements" className="hover:text-cyan transition">❯ Achievements</a></li>
            <li><a href="#playground" className="hover:text-cyan transition">❯ Mini Game</a></li>
            <li><a href="#reviews" className="hover:text-cyan transition">❯ Client Reviews</a></li>
          </ul>
        </div>

        {/* Direct Actions & Contacts */}
        <div className="md:col-span-4 space-y-4">
          <p className="font-mono text-xs text-violet font-bold uppercase tracking-wider mb-2">Let's Connect</p>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onOpenHireDrawer}
              className="chip px-4 py-2 rounded-xl text-xs font-mono text-white grad-bg border-none"
            >
              💼 Scope Project
            </button>
            <a
              href={profile.phoneUrl}
              className="chip px-4 py-2 rounded-xl text-xs font-mono text-cyan hover:border-cyan"
            >
              📞 Direct Call
            </a>
            <a
              href={profile.resumeUrl}
              download="Sheersh_Tiwari_Resume.pdf"
              className="chip px-4 py-2 rounded-xl text-xs font-mono hover:border-violet"
            >
              ↓ Resume
            </a>
          </div>

          <div className="flex gap-3 pt-2">
            <a href={profile.linkedin} target="_blank" rel="noreferrer" className="chip px-3 py-1.5 rounded-lg text-xs font-mono">
              LinkedIn
            </a>
            <a href={profile.github} target="_blank" rel="noreferrer" className="chip px-3 py-1.5 rounded-lg text-xs font-mono">
              GitHub
            </a>
          </div>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="max-w-6xl mx-auto px-6 mt-12 pt-6 border-t border-line/60 flex flex-col sm:flex-row items-center justify-between font-mono text-xs text-muted gap-4">
        <p>© 2026 Sheersh Tiwari. All rights reserved.</p>
        <p className="text-[11px]">Crafted with React, Tailwind CSS & Framer Motion</p>
      </div>
    </footer>
  );
}