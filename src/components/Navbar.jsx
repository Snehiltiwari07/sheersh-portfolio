import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { profile } from '../data/profile';

function BrandLogo() {
  return (
    <a href="#" className="flex items-center gap-3 group focus:outline-none select-none">
      <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-orange-500 p-[1.5px] shadow-lg shadow-violet-950/50 transition-transform group-hover:scale-105">
        <div className="w-full h-full bg-slate-950 rounded-[10.5px] flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:6px_6px] opacity-20" />
          <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 8L3 12L7 16" stroke="url(#logo-g1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17 8L21 12L17 16" stroke="url(#logo-g1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 4L10 20" stroke="url(#logo-g2)" strokeWidth="2.2" strokeLinecap="round" />
            <defs>
              <linearGradient id="logo-g1" x1="3" y1="8" x2="21" y2="16" gradientUnits="userSpaceOnUse">
                <stop stopColor="#a855f7" />
                <stop offset="1" stopColor="#38bdf8" />
              </linearGradient>
              <linearGradient id="logo-g2" x1="14" y1="4" x2="10" y2="20" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f97316" />
                <stop offset="1" stopColor="#fbbf24" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1.5">
          <span className="font-display font-black text-sm sm:text-base tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-slate-100 to-slate-200 group-hover:from-violet-400 group-hover:to-orange-400 transition-all duration-300">
            SHEERSH
          </span>
          <span className="px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/30 text-[9px] font-mono text-violet-300 font-bold tracking-widest">
            ENG
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 -mt-1 tracking-wide">
          SQL & Full-Stack Architect
        </span>
      </div>
    </a>
  );
}

// ULTRA-ENHANCED HIRE ME BUTTON COMPONENT
function HireMeButton({ onClick, fullWidth = false }) {
  return (
    <div className={`relative group ${fullWidth ? 'w-full' : 'inline-block'}`}>
      {/* Outer Glowing Neon Aura */}
      <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-violet-600 opacity-70 blur-md group-hover:opacity-100 group-hover:blur-lg transition-all duration-300 animate-pulse" />

      {/* Main Glassmorphic Button */}
      <button
        onClick={onClick}
        className={`relative ${fullWidth ? 'w-full justify-center' : ''} flex items-center gap-2.5 px-5 py-2.5 rounded-full font-mono text-xs font-bold text-white bg-slate-950/90 hover:bg-slate-900 border border-orange-500/40 hover:border-orange-400 transition-all duration-300 shadow-2xl active:scale-95 overflow-hidden cursor-pointer`}
      >
        {/* Animated Inner Shimmer Sweep */}
        <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-in-out pointer-events-none" />

        {/* Live Status Beacon Indicator */}
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
        </span>

        {/* Button Text & Icon */}
        <span className="tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-200 group-hover:from-orange-300 group-hover:to-amber-200 transition-colors">
          Hire Sheersh
        </span>

        <span className="text-orange-400 group-hover:translate-x-0.5 transition-transform duration-200">
          ➔
        </span>
      </button>
    </div>
  );
}

export default function Navbar({ onOpenHireDrawer }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
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
    { name: 'Reviews', href: '#reviews' },
    { name: 'Playground', href: '#playground' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 py-2.5 shadow-2xl'
          : 'bg-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
        
        <BrandLogo />

        {/* Desktop Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-900/80 border border-slate-800/80 px-4 py-1.5 rounded-full backdrop-blur-md shadow-inner">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="px-3.5 py-1.5 rounded-full font-mono text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Desktop Action Bar */}
        <div className="hidden md:flex items-center gap-2.5">
          <a
            href={profile.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 rounded-full text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 hover:bg-emerald-900/50 transition-colors flex items-center gap-1.5"
            title="Chat on WhatsApp"
          >
            <span>💬</span>
            <span className="hidden xl:inline">WhatsApp</span>
          </a>

          <a
            href={profile.phoneUrl}
            className="px-3 py-2 rounded-full text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/60 hover:bg-cyan-900/50 transition-colors flex items-center gap-1.5"
            title="Call Sheersh"
          >
            <span>📞</span>
            <span className="hidden xl:inline">Call</span>
          </a>

          <a
            href={profile.resumeUrl}
            download="Sheersh_Tiwari_Resume.pdf"
            className="px-3 py-2 rounded-full text-xs font-mono text-slate-300 bg-slate-900 border border-slate-800 hover:text-white hover:border-slate-700 transition-colors flex items-center gap-1.5"
            title="Download Resume"
          >
            <span>↓</span>
            <span className="hidden xl:inline">Resume</span>
          </a>

          {/* Enhanced Hire Me CTA */}
          <HireMeButton onClick={handleHireClick} />
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          aria-label="Toggle mobile navigation menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-slate-950/95 border-b border-slate-800/90 backdrop-blur-2xl overflow-hidden shadow-2xl"
          >
            <div className="px-4 pt-3 pb-6 space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-2">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3.5 py-2.5 rounded-xl text-slate-200 bg-slate-900/80 border border-slate-800/80 hover:border-violet-500/50 transition-colors text-center"
                  >
                    {link.name}
                  </a>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-900">
                <a
                  href={profile.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-2.5 rounded-xl text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 text-center flex flex-col items-center justify-center gap-1"
                >
                  <span className="text-sm">💬</span>
                  <span className="text-[10px]">WhatsApp</span>
                </a>

                <a
                  href={profile.phoneUrl}
                  className="px-2.5 py-2.5 rounded-xl text-cyan-400 bg-cyan-950/40 border border-cyan-800/60 text-center flex flex-col items-center justify-center gap-1"
                >
                  <span className="text-sm">📞</span>
                  <span className="text-[10px]">Call</span>
                </a>

                <a
                  href={profile.resumeUrl}
                  download="Sheersh_Tiwari_Resume.pdf"
                  className="px-2.5 py-2.5 rounded-xl text-slate-300 bg-slate-900 border border-slate-800 text-center flex flex-col items-center justify-center gap-1"
                >
                  <span className="text-sm">↓</span>
                  <span className="text-[10px]">Resume</span>
                </a>
              </div>

              {/* Mobile Full-Width Hire Me CTA */}
              <div className="pt-1">
                <HireMeButton
                  fullWidth
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleHireClick();
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}