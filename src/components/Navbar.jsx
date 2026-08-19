import { useState, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';
import { profile } from '../data/profile';

const NAV_ITEMS = [
  { name: 'Services', href: '#services' },
  { name: 'Stack', href: '#tech-stack' },
  { name: 'Architecture', href: '#architecture' },
  { name: 'Impact', href: '#achievements' },
  { name: 'Reviews', href: '#reviews' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="fixed top-3 sm:top-5 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
      <div
        className={`pointer-events-auto transition-all duration-300 ease-out flex items-center justify-between gap-3 sm:gap-6 rounded-full px-4 py-2.5 max-w-5xl w-full border backdrop-blur-md gpu ${
          scrolled
            ? 'bg-[var(--nav-bg)] border-line shadow-lg'
            : 'bg-[var(--glass-bg)] border-line/60'
        }`}
      >
        {/* Brand Identity */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-full grad-bg p-0.5 shadow-sm group-hover:scale-105 transition-transform">
            <div className="w-full h-full glass rounded-full flex items-center justify-center font-mono font-bold text-xs text-ink">
              ST
            </div>
          </div>

          <div className="flex items-center gap-1.5 font-display font-bold text-sm sm:text-base text-ink tracking-tight">
            <span>Sheersh</span>
            <span className="grad-text font-mono font-extrabold">.dev</span>
          </div>
        </a>

        {/* Center Nav Items */}
        <nav className="hidden md:flex items-center gap-1 font-mono text-xs text-muted">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="px-3 py-1.5 rounded-full hover:text-ink hover:bg-surface transition-all duration-150"
            >
              {item.name}
            </a>
          ))}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <a
            href={profile.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="chip px-3 py-1.5 rounded-full text-xs font-mono text-emerald-500 hover:border-emerald-500 flex items-center gap-1.5 transition-colors"
          >
            <span>💬</span>
            <span className="hidden lg:inline">WhatsApp</span>
          </a>

          <a
            href={profile.phoneUrl}
            className="chip px-3 py-1.5 rounded-full text-xs font-mono text-cyan hover:border-cyan flex items-center gap-1.5 transition-colors"
          >
            <span>📞</span>
            <span className="hidden lg:inline">Call</span>
          </a>

          <a
            href={profile.resumeUrl}
            download="Sheersh_Tiwari_Resume.pdf"
            className="chip px-3 py-1.5 rounded-full text-xs font-mono hover:border-violet flex items-center gap-1 transition-colors"
          >
            <span>↓</span>
            <span className="hidden sm:inline">Resume</span>
          </a>

          <div className="pl-1 border-l border-line/60">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}