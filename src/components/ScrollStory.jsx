import { useEffect, useRef, useState } from 'react';
import '../styles/scroll-story.css';

const beats = [
  { label: '01 / THE CHALLENGE', title: 'Complexity, everywhere.', text: 'Disconnected tools. Repeated tasks. Information that never quite reaches the right place.' },
  { label: '02 / THE ENGINEERING', title: 'Bring it into focus.', text: 'Connect the right information, tools, and intelligence. Design around the people doing the work.' },
  { label: '03 / THE RESULT', title: 'A clearer way forward.', text: 'Less chasing. Less waiting. Software that gives your team room to do more.' },
];
const clamp = n => Math.max(0, Math.min(1, n));
const smooth = n => { const x = clamp(n); return x * x * (3 - 2 * x); };
const mix = (a, b, t) => a + (b - a) * t;

export default function ScrollStory() {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const [immersive, setImmersive] = useState(false);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const section = sectionRef.current, canvas = canvasRef.current;
    const clock = section.closest('.editorial');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const desktop = matchMedia('(min-width: 850px)'), reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let near, far;
    const refreshColors = () => {
      const colors = getComputedStyle(section);
      near = colors.getPropertyValue('--particle-near').trim();
      far = colors.getPropertyValue('--particle-far').trim();
    };
    refreshColors();
    let width = 0, height = 0, frame = 0, inView = false, progress = 0, target = 0, lastBeat = -1, disposed = false, lastDraw = 0;
    const pointCount = desktop.matches ? 960 : 420;
    const points = Array.from({ length: pointCount }, (_, i) => {
      const y = 1 - (i / (pointCount - 1)) * 2, r = Math.sqrt(1 - y * y), angle = i * 2.399963;
      return { x: Math.cos(angle) * r, y, z: Math.sin(angle) * r, angle,
        sx: Math.sin(i * 12.9898) * 2.8, sy: Math.cos(i * 7.233) * 2.2, sz: Math.sin(i * 3.117) * 2.8 };
    });
    const measureProgress = () => {
      if (reduced.matches) { target = .5; return; }
      const rect = section.getBoundingClientRect();
      target = desktop.matches ? clamp(-rect.top / Math.max(1, rect.height - innerHeight)) : clamp((innerHeight * .7 - rect.top) / Math.max(1, rect.height + innerHeight * .4));
    };
    const draw = time => {
      frame = 0;
      if (disposed) return;
      const animate = !reduced.matches;
      if (animate && !desktop.matches && time - lastDraw < 1000 / 30) {
        if (inView && !document.hidden) frame = requestAnimationFrame(draw);
        return;
      }
      lastDraw = time;
      progress = animate ? mix(progress, target, .09) : .5;
      const focus = smooth((progress - .08) / .35), unfold = smooth((progress - .54) / .4);
      const beat = progress < .3 ? 0 : progress < .68 ? 1 : 2;
      if (beat !== lastBeat) { lastBeat = beat; setActive(beat); }
      section.style.setProperty('--stellar-progress', progress.toFixed(4));
      ctx.clearRect(0, 0, width, height);
      const rotation = progress * 2.4 + (animate ? time * .000035 : .3);
      const cx = width * (desktop.matches ? .69 : .5), cy = height * (desktop.matches ? .52 : .5);
      const scale = Math.min(width * (desktop.matches ? .24 : .33), height * .34);
      const projected = points.map((point, i) => {
        const ringAngle = (i / points.length) * Math.PI * 2;
        const tube = point.angle;
        let x = mix(mix(point.sx, point.x, focus), Math.cos(ringAngle) * (1.35 + Math.cos(tube) * .19), unfold);
        let y = mix(mix(point.sy, point.y, focus), Math.sin(tube) * .19, unfold);
        let z = mix(mix(point.sz, point.z, focus), Math.sin(ringAngle) * (1.35 + Math.cos(tube) * .19), unfold);
        const rx = x * Math.cos(rotation) + z * Math.sin(rotation);
        z = z * Math.cos(rotation) - x * Math.sin(rotation); x = rx;
        const tilt = .25 + unfold * .7, ry = y * Math.cos(tilt) - z * Math.sin(tilt);
        z = y * Math.sin(tilt) + z * Math.cos(tilt); y = ry;
        const perspective = 3.8 / (3.8 + z);
        return { x: cx + x * scale * perspective, y: cy + y * scale * perspective, z, size: Math.max(.45, perspective * 1.45), alpha: Math.max(.12, Math.min(.95, .6 - z * .2)), near: i % 4 === 0 };
      }).sort((a, b) => b.z - a.z);
      for (const p of projected) {
        ctx.globalAlpha = p.alpha; ctx.fillStyle = p.near ? near : far;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (animate && inView && !document.hidden) frame = requestAnimationFrame(draw);
    };
    const schedule = () => { if (!frame && !disposed) frame = requestAnimationFrame(draw); };
    const resize = () => {
      const rect = canvas.getBoundingClientRect(), ratio = Math.min(devicePixelRatio || 1, 1.5);
      width = rect.width; height = rect.height;
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      measureProgress(); schedule();
    };
    const configure = () => { setImmersive(desktop.matches && !reduced.matches); measureProgress(); schedule(); };
    // Share the page's scroll clock with the portrait, chapter entrances, and rail.
    const scroll = event => { target = event.detail.sceneProgress; if (inView) schedule(); };
    const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else if (inView) schedule(); };
    const observer = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; if (inView) { measureProgress(); schedule(); } else { cancelAnimationFrame(frame); frame = 0; } });
    observer.observe(section);
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(canvas);
    const themeObserver = new MutationObserver(() => { refreshColors(); schedule(); });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    desktop.addEventListener('change', configure); reduced.addEventListener('change', configure);
    clock.addEventListener('portfolio:scroll', scroll); document.addEventListener('visibilitychange', visibility);
    configure(); resize();
    return () => { disposed = true; cancelAnimationFrame(frame); observer.disconnect(); resizeObserver.disconnect(); themeObserver.disconnect(); desktop.removeEventListener('change', configure); reduced.removeEventListener('change', configure); clock.removeEventListener('portfolio:scroll', scroll); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  return <section id="ai-workflow" ref={sectionRef} className={`stellar-story${immersive ? ' is-immersive' : ''}`} aria-labelledby="ai-story-title">
    <h2 id="ai-story-title" className="sr-only">From complexity to clarity: how I approach AI and software.</h2>
    <div className="stellar-stage">
      <canvas ref={canvasRef} className="stellar-canvas" aria-hidden="true" />
      <div className="stellar-kicker"><span>FROM COMPLEXITY TO CLARITY</span><span>SCROLL EXPLORATION / 2026</span></div>
      <div className="stellar-copy">{beats.map((beat, i) => <div key={beat.label} className={`stellar-beat${active === i ? ' is-active' : ''}`} aria-hidden={immersive && active !== i ? true : undefined}><span>{beat.label}</span><h3>{beat.title}</h3><p>{beat.text}</p></div>)}</div>
      <div className="stellar-footer"><span>SCROLL TO BRING IT INTO FOCUS <span aria-hidden="true">↓</span></span><span className="stellar-progress" aria-hidden="true"><i /></span><span>AN INTERACTIVE VISUAL, NOT A LIVE AI SESSION</span></div>
    </div>
  </section>;
}
