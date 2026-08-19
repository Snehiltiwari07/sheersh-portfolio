import { useEffect, useRef } from 'react';

export default function InteractiveField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });

    let w = 0, h = 0, particles = [], raf;
    const mouse = { x: -1000, y: -1000 };

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    class Particle {
      constructor() { this.reset(true); }

      reset(init = false) {
        this.x = Math.random() * (w || 800);
        this.y = init ? Math.random() * (h || 600) : (Math.random() > 0.5 ? -10 : h + 10);
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.radius = Math.random() * 1.4 + 0.6;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < -10) this.x = w + 10;
        if (this.x > w + 10) this.x = -10;
        if (this.y < -10) this.y = h + 10;
        if (this.y > h + 10) this.y = -10;

        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = dx * dx + dy * dy; // Avoid Math.sqrt for performance

        if (dist < 10000) { // 100px radius squared
          const force = (1 - dist / 10000) * 1.5;
          this.x += (dx / 100) * force;
          this.y += (dy / 100) * force;
        }
      }

      draw(isLight) {
        ctx.fillStyle = isLight ? 'rgba(124, 92, 255, 0.4)' : 'rgba(0, 229, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function init() {
      resize();
      const count = Math.min(45, Math.floor(w / 30)); // Capped count for 60fps
      particles = Array.from({ length: count }, () => new Particle());
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';

      // Update & Draw particles
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw(isLight);
      }

      // Draw light connections (Distance squared checks to save CPU)
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distSq = dx * dx + dy * dy;

          if (distSq < 6400) { // 80px squared
            const alpha = (1 - distSq / 6400) * 0.12;
            ctx.strokeStyle = isLight ? `rgba(124, 92, 255, ${alpha})` : `rgba(0, 229, 255, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(draw);
    }

    init();
    window.addEventListener('resize', init);
    const onMouseMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', init);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden gpu">
      <div className="absolute top-[-10%] left-[-5%] w-[35vw] h-[35vw] rounded-full bg-violet/10 blur-[90px]" />
      <div className="absolute bottom-[0%] right-[-5%] w-[30vw] h-[30vw] rounded-full bg-cyan/10 blur-[90px]" />
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}