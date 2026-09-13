import { useState, useEffect } from 'react';
import { profile } from '../data/profile';
import { TAGLINE } from '../data/positioning';
import { cssColor } from '../styles/tokens';

function BrandLogo() {
  return (
    <a href="#" className="flex items-center gap-2.5 group select-none" aria-label="Sheersh.dev — back to top">
      {/* Sleek Minimal Emblem */}
      <div className="relative w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 via-indigo-600 to-orange-500 p-hairline shadow-md shadow-violet-950/40 transition-transform duration-base ease-spring group-hover:scale-105">
        <div className="w-full h-full bg-slate-950 rounded-inner flex items-center justify-center relative overflow-hidden">
          <svg className="w-4 h-4 relative z-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M7 8L3 12L7 16" stroke="url(#logo-g1)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17 8L21 12L17 16" stroke="url(#logo-g1)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 4L10 20" stroke="url(#logo-g2)" strokeWidth="2" strokeLinecap="round" />
            <defs>
              {/* Gradient stops read the colour tokens (src/styles/tokens.css) */}
              <linearGradient id="logo-g1" x1="3" y1="8" x2="21" y2="16" gradientUnits="userSpaceOnUse">
                <stop stopColor={cssColor('--c-violet-400')} />
                <stop offset="1" stopColor={cssColor('--c-cyan-300')} />
              </linearGradient>
              <linearGradient id="logo-g2" x1="14" y1="4" x2="10" y2="20" gradientUnits="userSpaceOnUse">
                <stop stopColor={cssColor('--c-orange-500')} />
                <stop offset="1" stopColor={cssColor('--c-amber-400')} />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Typography */}
      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1">
          <span className="font-display font-black text-xs sm:text-sm tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-slate-100 to-slate-200 group-hover:from-violet-400 group-hover:to-orange-400 transition-colors duration-base">
            SHEERSH
          </span>
          <span className="px-1 py-0.2 rounded bg-violet-500/10 border border-violet-500/30 text-nano font-mono text-violet-300 font-bold tracking-widest">
            ENG
          </span>
        </div>
        <span className="text-tiny font-mono text-slate-400 -mt-0.5 tracking-wide">
          {TAGLINE}
        </span>
      </div>
    </a>
  );
}

export default function Navbar({ onOpenHireDrawer }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleHireClick = () => {
    if (typeof onOpenHireDrawer === 'function') {
      onOpenHireDrawer();
    } else {
      window.location.href = profile.whatsappUrl;
    }
  };

  const navLinks = [
    { name: 'Projects', href: '#projects' },
    { name: 'Tech Stack', href: '#tech-stack' },
    { name: 'Local AI', href: '#local-llm' },
    { name: 'Reviews', href: '#reviews' },
    { name: 'Playground', href: '#playground' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-nav px-3 sm:px-6 pt-3 pointer-events-none">
      <div
        className={`max-w-6xl mx-auto pointer-events-auto transition-all duration-base ease-out rounded-full border ${
          scrolled
            ? 'bg-slate-950/75 backdrop-blur-xl border-slate-800/80 px-4 py-2 shadow-2xl shadow-slate-950/80'
            : 'bg-slate-950/40 backdrop-blur-md border-slate-800/40 px-4 py-2.5'
        } flex items-center justify-between gap-2`}
      >
        {/* Brand Emblem */}
        <BrandLogo />

        {/* Floating Center Navigation */}
        <nav aria-label="Sections" className="hidden md:flex items-center gap-0.5 bg-slate-900/50 border border-slate-800/50 px-2 py-1 rounded-full">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="px-3 py-1.5 rounded-full font-mono text-mini text-slate-400 hover:text-white hover:bg-slate-800/50 interactive"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Right Action Icons & Hire CTA */}
        <div className="hidden sm:flex items-center gap-1.5">
          {/* Subtle Compact Icon Shortcuts */}
          <a
            href={profile.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Message Sheersh on WhatsApp"
            className="w-8 h-8 rounded-full bg-slate-900/80 border border-slate-800 flex items-center justify-center text-xs text-emerald-400 hover:bg-emerald-950/50 hover:border-emerald-700/60 interactive"
          >
            <span aria-hidden="true">💬</span>
          </a>

          <a
            href={profile.phoneUrl}
            aria-label="Call Sheersh"
            className="w-8 h-8 rounded-full bg-slate-900/80 border border-slate-800 flex items-center justify-center text-xs text-cyan-400 hover:bg-cyan-950/50 hover:border-cyan-700/60 interactive"
          >
            <span aria-hidden="true">📞</span>
          </a>

          <a
            href={profile.resumeUrl}
            download="Sheersh_Tiwari_Resume.pdf"
            aria-label="Download Sheersh's résumé (PDF)"
            className="w-8 h-8 rounded-full bg-slate-900/80 border border-slate-800 flex items-center justify-center text-xs text-slate-300 hover:bg-slate-800 hover:border-slate-700 interactive"
          >
            <span aria-hidden="true">↓</span>
          </a>

          {/* Sleek Slim Hire Button */}
          <button
            onClick={handleHireClick}
            className="relative group ml-1 inline-flex items-center gap-2 px-3.5 py-2 rounded-full font-mono text-mini font-bold text-white bg-gradient-to-r from-violet-600 to-orange-500 hover:opacity-90 shadow-md active:scale-95 interactive cursor-pointer overflow-hidden"
          >
            <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            <span>Hire Sheersh</span>
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white interactive cursor-pointer"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Glass Menu Drawer.
          CSS transition instead of an animation library: this file is on the
          critical path, and framer-motion does not belong in the initial
          bundle. Always mounted so the close transition can play; `invisible`
          while closed keeps every link out of the tab order. */}
      <div
        id="mobile-nav"
        aria-hidden={!mobileMenuOpen}
        className={`md:hidden mt-2 max-w-6xl mx-auto bg-slate-950/90 border border-slate-800/90 rounded-2xl backdrop-blur-2xl p-4 shadow-2xl pointer-events-auto font-mono text-xs space-y-3 origin-top transition-[opacity,transform] duration-base ease-spring ${
          mobileMenuOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-2 invisible pointer-events-none'
        }`}
      >
        <div className="grid grid-cols-2 gap-1.5">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-slate-300 bg-slate-900/60 border border-slate-800/80 hover:border-violet-500/50 text-center interactive"
            >
              {link.name}
            </a>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-900">
          <a
            href={profile.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="py-2 rounded-xl text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 text-center flex items-center justify-center gap-1.5 hover:bg-emerald-900/60 interactive"
          >
            {/* Official WhatsApp SVG */}
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span className="text-micro">WhatsApp</span>
          </a>

          <a
            href={profile.phoneUrl}
            className="py-2 rounded-xl text-cyan-400 bg-cyan-950/40 border border-cyan-800/60 text-center flex items-center justify-center gap-1"
          >
            <span aria-hidden="true">📞</span>
            <span className="text-micro">Call</span>
          </a>

          <a
            href={profile.resumeUrl}
            download="Sheersh_Tiwari_Resume.pdf"
            className="py-2 rounded-xl text-slate-300 bg-slate-900 border border-slate-800 text-center flex items-center justify-center gap-1"
          >
            <span aria-hidden="true">↓</span>
            <span className="text-micro">Resume</span>
          </a>
        </div>

        <button
          onClick={() => {
            setMobileMenuOpen(false);
            handleHireClick();
          }}
          className="w-full py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-orange-500 text-center shadow-lg active:scale-95 interactive cursor-pointer flex items-center justify-center gap-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
          <span>Hire Sheersh</span>
        </button>
      </div>
    </header>
  );
}
