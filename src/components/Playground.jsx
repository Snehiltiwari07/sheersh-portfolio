import { useEffect, useRef, useState, useCallback } from 'react';

// --- SYNTHESIZED RETRO AUDIO ENGINE (Zero External Assets) ---
const playSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    if (type === 'flap') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'score') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.setValueAtTime(600, now + 0.1);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'crash') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(20, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (e) {
    // AudioContext blocked by browser policy until interaction
  }
};

// Funny Rage-Bait Death Messages
const DEATH_MESSAGES = [
  "You pushed to main without testing! 💀",
  "OOM Killer terminated your process! 💥",
  "Forgot the WHERE clause in production! 🔥",
  "Merge conflict ruined your deploy! 🛑",
  "AWS US-East-1 went down again! ☁️",
  "NullPointerException in the chat! 🚨"
];

export default function Playground() {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('START'); // START, PLAYING, GAMEOVER
  const [score, setScore] = useState(0);
  const [deathMsg, setDeathMsg] = useState('');
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('sheersh_flappy_highscore') || '0', 10);
  });
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Use refs for game state to avoid React re-renders during the 60fps animation frame
  const gameRef = useRef({
    frames: 0,
    speed: 3.5, // Moving left speed
    gravity: 0.45, // Fall speed
    jumpPower: -7.5, // Upward force
    gap: 160 // Gap between pipes (shrinks over time for rage bait)
  });

  const jumpRef = useRef(false);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });

    // Internal resolution (Widescreen to fit UI)
    const W = (canvas.width = 800);
    const H = (canvas.height = 450);

    // Player (The "Data Packet")
    const player = {
      x: 150,
      y: H / 2,
      size: 24,
      velocity: 0,
      rotation: 0
    };

    let pipes = [];
    let particles = [];
    let currentScore = 0;
    let animationId;
    
    // Reset Game Settings
    gameRef.current.frames = 0;
    gameRef.current.speed = 4;
    gameRef.current.gap = 160;

    // --- CONTROLS ---
    const flap = () => {
      if (gameState === 'PLAYING') {
        player.velocity = gameRef.current.jumpPower;
        if (soundEnabled) playSound('flap');
        createParticles(player.x, player.y + player.size, '#38bdf8', 5);
      }
    };

    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!jumpRef.current) flap();
        jumpRef.current = true;
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') jumpRef.current = false;
    };
    const handleTouch = (e) => {
      e.preventDefault(); // Prevent double-zoom on mobile
      flap();
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    canvas.addEventListener('mousedown', flap);

    // --- GENERATORS ---
    const addPipe = () => {
      const minHeight = 50;
      const maxHeight = H - gameRef.current.gap - 50;
      const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
      
      pipes.push({
        x: W,
        w: 60,
        top: topHeight,
        bottom: topHeight + gameRef.current.gap,
        passed: false
      });
    };

    const createParticles = (x, y, color, count) => {
      for (let i = 0; i < count; i++) {
        particles.push({
          x, y,
          vx: (Math.random() - 0.5) * 4 - 2, // Move left mostly
          vy: (Math.random() - 0.5) * 4,
          life: 1,
          color
        });
      }
    };

    const triggerGameOver = () => {
      if (soundEnabled) playSound('crash');
      createParticles(player.x, player.y, '#ef4444', 30);
      
      setDeathMsg(DEATH_MESSAGES[Math.floor(Math.random() * DEATH_MESSAGES.length)]);
      setGameState('GAMEOVER');
      if (currentScore > highScore) {
        setHighScore(currentScore);
        localStorage.setItem('sheersh_flappy_highscore', currentScore.toString());
      }
    };

    // --- GAME LOOP ---
    const update = () => {
      gameRef.current.frames++;

      // 1. Update Physics
      player.velocity += gameRef.current.gravity;
      player.y += player.velocity;
      player.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (player.velocity * 0.1)));

      // Check Floor/Ceiling Collision
      if (player.y + player.size >= H || player.y <= 0) {
        triggerGameOver();
        return;
      }

      // 2. Manage Pipes (Firewalls)
      if (gameRef.current.frames % 90 === 0) {
        addPipe();
      }

      for (let i = 0; i < pipes.length; i++) {
        let p = pipes[i];
        p.x -= gameRef.current.speed;

        // Collision Detection (Tight Hitbox for Rage Bait)
        const hitX = player.x + player.size - 4 > p.x && player.x + 4 < p.x + p.w;
        const hitY = player.y + 4 < p.top || player.y + player.size - 4 > p.bottom;
        
        if (hitX && hitY) {
          triggerGameOver();
          return;
        }

        // Score Calculation
        if (p.x + p.w < player.x && !p.passed) {
          p.passed = true;
          currentScore++;
          setScore(currentScore);
          if (soundEnabled) playSound('score');
          
          // Rage Mechanic: Slowly increase speed and decrease gap
          if (currentScore % 5 === 0) {
            gameRef.current.speed += 0.2;
            gameRef.current.gap = Math.max(100, gameRef.current.gap - 5);
          }
        }
      }
      
      // Cleanup off-screen pipes
      pipes = pipes.filter(p => p.x + p.w > 0);

      // 3. Update Particles
      particles.forEach(pt => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life -= 0.03;
      });
      particles = particles.filter(pt => pt.life > 0);

      // --- RENDER ---
      // Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, W, H);

      // Scrolling Grid (Cyberpunk feel)
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      const offset = gameRef.current.frames * 2 % 40;
      for (let i = 0; i < W; i += 40) {
        ctx.beginPath(); ctx.moveTo(i - offset, 0); ctx.lineTo(i - offset, H); ctx.stroke();
      }

      // Draw Pipes (Neon Red Firewalls)
      pipes.forEach(p => {
        // Gradient for pipes
        const grad = ctx.createLinearGradient(p.x, 0, p.x + p.w, 0);
        grad.addColorStop(0, '#ef4444');
        grad.addColorStop(1, '#991b1b');
        
        ctx.fillStyle = grad;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
        
        // Top Pipe
        ctx.fillRect(p.x, 0, p.w, p.top);
        ctx.fillStyle = '#f87171'; // Pipe lip
        ctx.fillRect(p.x - 2, p.top - 15, p.w + 4, 15);
        
        // Bottom Pipe
        ctx.fillStyle = grad;
        ctx.fillRect(p.x, p.bottom, p.w, H - p.bottom);
        ctx.fillStyle = '#f87171'; // Pipe lip
        ctx.fillRect(p.x - 2, p.bottom, p.w + 4, 15);
        
        ctx.shadowBlur = 0; // reset
      });

      // Draw Particles
      particles.forEach(pt => {
        ctx.globalAlpha = pt.life;
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x, pt.y, 4, 4);
      });
      ctx.globalAlpha = 1;

      // Draw Player (Glowing Cyan Box)
      ctx.save();
      ctx.translate(player.x + player.size / 2, player.y + player.size / 2);
      ctx.rotate(player.rotation);
      
      ctx.fillStyle = '#22d3ee'; // Cyan body
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 15;
      ctx.fillRect(-player.size / 2, -player.size / 2, player.size, player.size);
      
      // "Eye" or Data Core
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 0;
      ctx.fillRect(-player.size / 2 + 12, -player.size / 2 + 4, 6, 6);
      
      ctx.restore();

      animationId = requestAnimationFrame(update);
    };

    animationId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('touchstart', handleTouch);
      canvas.removeEventListener('mousedown', flap);
    };
  }, [gameState, soundEnabled, highScore]);

  const startGame = () => {
    setScore(0);
    setGameState('PLAYING');
  };

  return (
    <section id="playground" className="py-16 px-4 max-w-4xl mx-auto text-center">
      
      {/* Header */}
      <div className="space-y-2 mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400">
          🎮 Interactive Arcade
        </div>
        <h2 className="font-display font-bold text-2xl sm:text-3xl text-slate-100">
          Flappy Deploy: Prod Run
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto">
          Navigate your data packet through the production firewalls. Warning: Highly frustrating.
        </p>
      </div>

      {/* Game Wrapper */}
      <div className="rounded-3xl bg-slate-950 border-2 border-slate-800 p-3 sm:p-5 shadow-2xl relative overflow-hidden backdrop-blur-xl touch-none">
        
        {/* HUD */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs font-mono text-slate-300 px-2">
          <div className="flex items-center gap-4">
            <div>DEPLOYS: <span className="text-cyan-400 font-bold text-base">{score}</span></div>
          </div>
          <div className="flex items-center gap-4">
            <div>RECORD: <span className="text-emerald-400 font-bold">{highScore}</span></div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="px-2 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-400 cursor-pointer"
            >
              {soundEnabled ? '🔊 ON' : '🔇 OFF'}
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800/80 cursor-pointer select-none group">
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* START OVERLAY */}
          {gameState === 'START' && (
            <div 
              onClick={startGame}
              className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm cursor-pointer hover:bg-slate-950/70 transition-colors"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-3xl shadow-xl mb-4 animate-bounce">
                🚀
              </div>
              <h3 className="font-display font-bold text-xl sm:text-3xl text-white tracking-widest">
                FLAPPY DEPLOY
              </h3>
              <p className="text-cyan-400 text-xs font-mono mt-2 mb-8 bg-cyan-950/50 px-4 py-1.5 rounded-full border border-cyan-900">
                Press SPACE or TAP to flap
              </p>
              <button className="px-8 py-3.5 rounded-xl font-mono text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 shadow-[0_0_20px_rgba(8,145,178,0.4)] transition-transform active:scale-95">
                START DEPLOYMENT
              </button>
            </div>
          )}

          {/* GAMEOVER OVERLAY */}
          {gameState === 'GAMEOVER' && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md">
              <h3 className="font-display font-bold text-2xl text-red-500 mb-2">
                DEPLOYMENT FAILED
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm font-mono mb-6 max-w-xs bg-red-950/40 border border-red-900/50 p-3 rounded-xl">
                {deathMsg}
              </p>

              <div className="flex gap-4">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center min-w-[100px]">
                  <div className="text-[10px] text-slate-500 font-mono mb-1">SCORE</div>
                  <div className="text-2xl font-bold text-cyan-400">{score}</div>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center min-w-[100px]">
                  <div className="text-[10px] text-slate-500 font-mono mb-1">BEST</div>
                  <div className="text-2xl font-bold text-emerald-400">{highScore}</div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={startGame}
                  className="px-6 py-3 rounded-xl font-mono text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all border border-slate-700"
                >
                  🔄 TRY AGAIN
                </button>
                <a
                  href="https://wa.me/917389323262?text=Hey%20Sheersh!%20I%20got%20a%20score%20of%20"
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3 rounded-xl font-mono text-xs font-bold text-cyan-400 bg-cyan-950/50 border border-cyan-800 hover:bg-cyan-900/50 active:scale-95 transition-all"
                  onClick={(e) => {
                    e.currentTarget.href += `${score} on Flappy Deploy!`;
                  }}
                >
                  💬 BRAG TO SHEERSH
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}