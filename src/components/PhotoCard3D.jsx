import { useRef, useState } from 'react';
import ThemeAdaptiveImage from './ThemeAdaptiveImage';
import { profile } from '../data/profile';

export default function PhotoCard3D() {
  const cardRef = useRef(null);
  const [holoOn, setHoloOn] = useState(false);
  const [glitch, setGlitch] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotY = (px - 0.5) * 14;
    const rotX = (0.5 - py) * 14;
    cardRef.current.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
    cardRef.current.style.setProperty('--sx', `${px * 100}%`);
    cardRef.current.style.setProperty('--sy', `${py * 100}%`);
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
  };

  const toggleHolo = (e) => {
    e.stopPropagation();
    setHoloOn((v) => !v);
    setGlitch(true);
    setTimeout(() => setGlitch(false), 260);
  };

  return (
    <div className="tilt-wrap w-full max-w-md mx-auto animate-float" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <div
        ref={cardRef}
        className={`card rounded-3xl w-full min-h-[460px] p-6 relative overflow-hidden flex flex-col items-center justify-between border border-line ${
          holoOn ? 'holo-on' : ''
        } ${glitch ? 'glitch-on' : ''}`}
        style={{ transformStyle: 'preserve-3d', transition: 'transform .2s cubic-bezier(0.2, 0, 0.2, 1)' }}
      >
        {/* Hologram Effects */}
        <div className="tilt-spotlight" />
        <div className="holo-overlay" />

        {/* Headshot Display */}
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 mt-2 z-10">
          <ThemeAdaptiveImage
            src={profile.avatarHeadshot || "/profile-headshot.png"}
            alt={profile.name}
            className="w-full h-full"
          />
          <div className="absolute bottom-2 right-2 z-20 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-surface animate-pulse" />
        </div>

        {/* Info */}
        <div className="text-center mt-4 space-y-1 z-10">
          <h3 className="font-display font-bold text-xl text-ink">{profile.name}</h3>
          <p className="font-mono text-xs text-violet font-semibold">Full-Stack & Systems Engineer</p>
          <p className="font-mono text-[11px] text-muted">{profile.location}</p>
        </div>

        {/* Action Button Strip */}
        <div className="flex items-center gap-3 w-full mt-4 pt-4 border-t border-line z-10">
          <button
            type="button"
            onClick={toggleHolo}
            className="chip flex-1 py-2.5 rounded-xl text-xs font-mono text-center hover:border-violet cursor-pointer active:scale-95 transition-transform"
          >
            ✨ {holoOn ? 'Holo Active' : 'Toggle Hologram'}
          </button>
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noreferrer"
            className="chip px-4 py-2.5 rounded-xl text-xs font-mono text-cyan flex items-center gap-1.5 hover:border-cyan"
          >
            LinkedIn ↗
          </a>
        </div>
      </div>
    </div>
  );
}