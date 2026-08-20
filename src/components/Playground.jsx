import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

// --- SYNTHESIZED RETRO AUDIO ENGINE (Zero External Asset Dependency) ---
const playSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'laser') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'explosion') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'powerup') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(600, now + 0.15);
      osc.frequency.linearRampToValueAtTime(900, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'hit') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(50, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch (e) {
    // AudioContext blocked or not supported on device
  }
};

export default function Playground() {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('START'); // START, PLAYING, GAMEOVER
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [health, setHealth] = useState(100);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('sheersh_arcade_highscore') || '0', 10);
  });
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Instant Touch Control Refs for Zero Mobile Input Lag
  const touchLeftRef = useRef(false);
  const touchRightRef = useRef(false);
  const touchShootRef = useRef(false);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Virtual Internal Canvas Resolution
    const W = (canvas.width = 700);
    const H = (canvas.height = 500);

    // Player State
    const player = {
      x: W / 2 - 20,
      y: H - 50,
      w: 40,
      h: 30,
      speed: 6,
      weaponLevel: 1, // 1: Single Laser, 2: Double Laser, 3: Triple Spread
      shield: false,
    };

    let bullets = [];
    let enemies = [];
    let particles = [];
    let powerups = [];
    let boss = null;

    let currentScore = 0;
    let currentWave = 1;
    let currentHealth = 100;
    let frameCount = 0;
    let animationId;

    // Keyboard Input Trackers
    const keys = { left: false, right: false, space: false };

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (!keys.space) shoot();
        keys.space = true;
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
      if (e.key === ' ' || e.key === 'Spacebar') keys.space = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Weapon Projectile Generator
    const shoot = () => {
      if (soundEnabled) playSound('laser');
      if (player.weaponLevel === 1) {
        bullets.push({ x: player.x + player.w / 2 - 2, y: player.y, w: 4, h: 12, dy: -9, color: '#38bdf8' });
      } else if (player.weaponLevel === 2) {
        bullets.push({ x: player.x + 8, y: player.y, w: 4, h: 12, dy: -9, color: '#a855f7' });
        bullets.push({ x: player.x + player.w - 12, y: player.y, w: 4, h: 12, dy: -9, color: '#a855f7' });
      } else {
        bullets.push({ x: player.x + player.w / 2 - 2, y: player.y, w: 4, h: 12, dy: -9, color: '#f97316' });
        bullets.push({ x: player.x + 4, y: player.y, w: 4, h: 12, dy: -8.5, dx: -1.5, color: '#f97316' });
        bullets.push({ x: player.x + player.w - 8, y: player.y, w: 4, h: 12, dy: -8.5, dx: 1.5, color: '#f97316' });
      }
    };

    // Enemy Spawner
    const spawnEnemy = () => {
      const types = [
        { label: '404 Error', color: '#ef4444', hp: 1, speed: 1.8 + currentWave * 0.2, score: 10, symbol: '404' },
        { label: 'Memory Leak', color: '#f59e0b', hp: 2, speed: 1.4 + currentWave * 0.15, score: 25, symbol: 'LEAK' },
        { label: 'DB Deadlock', color: '#a855f7', hp: 4, speed: 1.0 + currentWave * 0.1, score: 50, symbol: 'LOCK' },
      ];

      const type = types[Math.floor(Math.random() * Math.min(types.length, currentWave))];
      enemies.push({
        x: Math.random() * (W - 50) + 10,
        y: -40,
        w: 45,
        h: 28,
        hp: type.hp,
        maxHp: type.hp,
        speed: type.speed,
        color: type.color,
        symbol: type.symbol,
        scoreValue: type.score,
      });
    };

    // Boss Spawner
    const spawnBoss = () => {
      boss = {
        x: W / 2 - 60,
        y: -80,
        targetY: 50,
        w: 120,
        h: 60,
        hp: 40 + currentWave * 20,
        maxHp: 40 + currentWave * 20,
        dx: 2.5,
        color: '#f43f5e',
        name: '200M ROW QUERY LOCK',
      };
    };

    // Particle Explosion Generator
    const createExplosion = (x, y, color, count = 12) => {
      if (soundEnabled) playSound('explosion');
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1;
        particles.push({
          x,
          y,
          dx: Math.cos(angle) * speed,
          dy: Math.sin(angle) * speed,
          radius: Math.random() * 3 + 1,
          color,
          alpha: 1,
        });
      }
    };

    // Powerup Drops
    const maybeDropPowerup = (x, y) => {
      if (Math.random() < 0.22) {
        const pTypes = [
          { type: 'BOOST', color: '#f97316', label: '⚡ SPRING BOOST' },
          { type: 'SHIELD', color: '#10b981', label: '🛡️ DOCKER SHIELD' },
          { type: 'REPAIR', color: '#06b6d4', label: '🔧 HOTFIX (+25 HP)' },
        ];
        const p = pTypes[Math.floor(Math.random() * pTypes.length)];
        powerups.push({ x, y, w: 24, h: 24, dy: 1.8, ...p });
      }
    };

    // MAIN GAME LOOP
    const update = () => {
      frameCount++;

      // Movement Calculations (Keyboard + Touch)
      if ((keys.left || touchLeftRef.current) && player.x > 0) {
        player.x -= player.speed;
      }
      if ((keys.right || touchRightRef.current) && player.x < W - player.w) {
        player.x += player.speed;
      }
      if (touchShootRef.current && frameCount % 12 === 0) {
        shoot();
      }

      // Auto-fire on Space Held
      if (keys.space && frameCount % 10 === 0) {
        shoot();
      }

      // Spawning Progression
      if (!boss && frameCount % Math.max(25, 70 - currentWave * 8) === 0) {
        spawnEnemy();
      }

      // Boss Wave Trigger
      if (!boss && currentScore >= currentWave * 250) {
        spawnBoss();
      }

      // Bullets Update
      bullets.forEach((b, i) => {
        b.y += b.dy;
        if (b.dx) b.x += b.dx;
        if (b.y < -20 || b.x < 0 || b.x > W) bullets.splice(i, 1);
      });

      // Boss Behavior
      if (boss) {
        if (boss.y < boss.targetY) boss.y += 1.5;

        boss.x += boss.dx;
        if (boss.x <= 10 || boss.x + boss.w >= W - 10) boss.dx *= -1;

        if (frameCount % 45 === 0) {
          bullets.push({ x: boss.x + boss.w / 2, y: boss.y + boss.h, w: 6, h: 14, dy: 4, color: '#ef4444', isHostile: true });
        }

        bullets.forEach((b, bi) => {
          if (!b.isHostile && b.x > boss.x && b.x < boss.x + boss.w && b.y > boss.y && b.y < boss.y + boss.h) {
            boss.hp--;
            createExplosion(b.x, b.y, '#f43f5e', 3);
            bullets.splice(bi, 1);

            if (boss.hp <= 0) {
              createExplosion(boss.x + boss.w / 2, boss.y + boss.h / 2, '#f59e0b', 30);
              currentScore += 300;
              setScore(currentScore);
              currentWave++;
              setWave(currentWave);
              maybeDropPowerup(boss.x + boss.w / 2, boss.y + boss.h / 2);
              boss = null;
            }
          }
        });
      }

      // Enemies Update
      enemies.forEach((e, ei) => {
        e.y += e.speed;

        // Collision Enemy -> Player
        if (
          e.x < player.x + player.w &&
          e.x + e.w > player.x &&
          e.y < player.y + player.h &&
          e.y + e.h > player.y
        ) {
          if (!player.shield) {
            currentHealth -= 20;
            setHealth(Math.max(0, currentHealth));
            if (soundEnabled) playSound('hit');
          }
          createExplosion(e.x + e.w / 2, e.y + e.h / 2, e.color, 10);
          enemies.splice(ei, 1);
          return;
        }

        // Enemy Reached Bottom
        if (e.y > H) {
          if (!player.shield) {
            currentHealth -= 10;
            setHealth(Math.max(0, currentHealth));
          }
          enemies.splice(ei, 1);
          return;
        }

        // Bullet Hits Enemy
        bullets.forEach((b, bi) => {
          if (!b.isHostile && b.x > e.x && b.x < e.x + e.w && b.y > e.y && b.y < e.y + e.h) {
            e.hp--;
            bullets.splice(bi, 1);
            createExplosion(b.x, b.y, e.color, 4);

            if (e.hp <= 0) {
              createExplosion(e.x + e.w / 2, e.y + e.h / 2, e.color, 12);
              currentScore += e.scoreValue;
              setScore(currentScore);
              maybeDropPowerup(e.x + e.w / 2, e.y + e.h / 2);
              enemies.splice(ei, 1);
            }
          }
        });
      });

      // Hostile Bullet Hits Player
      bullets.forEach((b, bi) => {
        if (b.isHostile && b.x > player.x && b.x < player.x + player.w && b.y > player.y && b.y < player.y + player.h) {
          if (!player.shield) {
            currentHealth -= 15;
            setHealth(Math.max(0, currentHealth));
            if (soundEnabled) playSound('hit');
          }
          bullets.splice(bi, 1);
        }
      });

      // Powerups Update
      powerups.forEach((p, pi) => {
        p.y += p.dy;
        if (p.x < player.x + player.w && p.x + p.w > player.x && p.y < player.y + player.h && p.y + p.h > player.y) {
          if (soundEnabled) playSound('powerup');
          if (p.type === 'BOOST') player.weaponLevel = Math.min(3, player.weaponLevel + 1);
          if (p.type === 'SHIELD') {
            player.shield = true;
            setTimeout(() => (player.shield = false), 6000);
          }
          if (p.type === 'REPAIR') {
            currentHealth = Math.min(100, currentHealth + 25);
            setHealth(currentHealth);
          }
          powerups.splice(pi, 1);
        } else if (p.y > H) {
          powerups.splice(pi, 1);
        }
      });

      // Particles Update
      particles.forEach((pt, pti) => {
        pt.x += pt.dx;
        pt.y += pt.dy;
        pt.alpha -= 0.025;
        if (pt.alpha <= 0) particles.splice(pti, 1);
      });

      // Check Game Over
      if (currentHealth <= 0) {
        setGameState('GAMEOVER');
        if (currentScore > highScore) {
          setHighScore(currentScore);
          localStorage.setItem('sheersh_arcade_highscore', currentScore.toString());
        }
        return;
      }

      // RENDER PHASE
      ctx.clearRect(0, 0, W, H);

      // Starfield Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = '#334155';
      for (let i = 0; i < 30; i++) {
        const sx = (i * 37 + frameCount * (i % 3 + 1)) % W;
        const sy = (i * 91 + frameCount * 0.5) % H;
        ctx.fillRect(sx, sy, (i % 2) + 1, (i % 2) + 1);
      }

      // Player Ship
      ctx.fillStyle = player.shield ? '#10b981' : '#a855f7';
      ctx.shadowColor = player.shield ? '#10b981' : '#a855f7';
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.moveTo(player.x + player.w / 2, player.y);
      ctx.lineTo(player.x + player.w, player.y + player.h);
      ctx.lineTo(player.x, player.y + player.h);
      ctx.closePath();
      ctx.fill();

      // Cockpit Window
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(player.x + player.w / 2 - 4, player.y + 8, 8, 8);
      ctx.shadowBlur = 0;

      // Shield Effect
      if (player.shield) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(player.x + player.w / 2, player.y + player.h / 2, 28, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Bullets Rendering
      bullets.forEach((b) => {
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.shadowBlur = 0;
      });

      // Enemies Rendering
      enemies.forEach((e) => {
        ctx.fillStyle = e.color;
        ctx.fillRect(e.x, e.y, e.w, e.h);

        ctx.fillStyle = '#ffffff';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(e.symbol, e.x + e.w / 2, e.y + 16);

        if (e.maxHp > 1) {
          ctx.fillStyle = '#334155';
          ctx.fillRect(e.x, e.y - 6, e.w, 3);
          ctx.fillStyle = '#10b981';
          ctx.fillRect(e.x, e.y - 6, (e.w * e.hp) / e.maxHp, 3);
        }
      });

      // Boss Rendering
      if (boss) {
        ctx.fillStyle = boss.color;
        ctx.shadowColor = boss.color;
        ctx.shadowBlur = 15;
        ctx.fillRect(boss.x, boss.y, boss.w, boss.h);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(boss.name, boss.x + boss.w / 2, boss.y + boss.h / 2 + 3);

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(boss.x, boss.y - 12, boss.w, 6);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(boss.x, boss.y - 12, (boss.w * boss.hp) / boss.maxHp, 6);
      }

      // Powerups Rendering
      powerups.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(p.type[0], p.x + p.w / 2, p.y + 16);
      });

      // Particles Rendering
      particles.forEach((pt) => {
        ctx.globalAlpha = pt.alpha;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      animationId = requestAnimationFrame(update);
    };

    animationId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, soundEnabled]);

  const startGame = () => {
    setScore(0);
    setWave(1);
    setHealth(100);
    setGameState('PLAYING');
  };

  return (
    <section id="playground" className="py-16 px-4 max-w-4xl mx-auto text-center">
      {/* Playground Header */}
      <div className="space-y-2 mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-orange-400">
          🎮 Interactive Arcade
        </div>
        <h2 className="font-display font-bold text-2xl sm:text-3xl text-slate-100">
          Dev Defender: 200M Query Smasher
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto">
          Help Sheersh blast production bugs, memory leaks, and database locks in real time!
        </p>
      </div>

      {/* Arcade Machine Wrapper */}
      <div className="rounded-3xl bg-slate-950 border-2 border-slate-800 p-3 sm:p-5 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        
        {/* Arcade HUD Bar */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs font-mono text-slate-300 px-2">
          <div className="flex items-center gap-4">
            <div>SCORE: <span className="text-amber-400 font-bold">{score}</span></div>
            <div>WAVE: <span className="text-purple-400 font-bold">{wave}</span></div>
          </div>

          <div className="flex items-center gap-4">
            <div>HIGH: <span className="text-emerald-400 font-bold">{highScore}</span></div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-400 cursor-pointer"
            >
              {soundEnabled ? '🔊 Sound ON' : '🔇 Muted'}
            </button>
          </div>
        </div>

        {/* Player Health Bar */}
        {gameState === 'PLAYING' && (
          <div className="w-full h-2 bg-slate-900 rounded-full mb-3 overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-200 ${
                health > 50 ? 'bg-emerald-500' : health > 25 ? 'bg-amber-500' : 'bg-red-500 animate-pulse'
              }`}
              style={{ width: `${health}%` }}
            />
          </div>
        )}

        {/* Responsive Canvas Display */}
        <div className="relative aspect-[7/5] w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800/80 flex items-center justify-center">
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* START OVERLAY */}
          {gameState === 'START' && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-600 to-violet-600 flex items-center justify-center text-2xl font-bold text-white shadow-xl mb-4">
                👾
              </div>

              <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-100">
                BUG SMASHER ULTRA
              </h3>
              <p className="text-slate-400 text-xs max-w-sm mt-2 mb-6">
                Use <strong>A / D or Arrow Keys</strong> to move, and <strong>SPACEBAR</strong> to shoot. Collect Docker Shields and Spring Boosts!
              </p>

              <button
                onClick={startGame}
                className="px-8 py-3.5 rounded-xl font-mono text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:opacity-90 shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                🚀 START GAME
              </button>
            </div>
          )}

          {/* GAME OVER OVERLAY */}
          {gameState === 'GAMEOVER' && (
            <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md">
              <h3 className="font-display font-bold text-2xl text-red-500 mb-1">
                SYSTEM CRASH! 💀
              </h3>
              <p className="text-slate-400 text-xs font-mono mb-4">
                Production servers took too much damage.
              </p>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1 mb-6 text-xs font-mono">
                <div>Final Score: <span className="text-amber-400 font-bold">{score}</span></div>
                <div>Waves Survived: <span className="text-purple-400 font-bold">{wave}</span></div>
                <div>Personal Best: <span className="text-emerald-400 font-bold">{highScore}</span></div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={startGame}
                  className="px-6 py-3 rounded-xl font-mono text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                >
                  🔄 PLAY AGAIN
                </button>
                <a
                  href="https://wa.me/917389323262?text=Hey%20Sheersh!%20Played%20your%20portfolio%20game."
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3 rounded-xl font-mono text-xs font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800 hover:bg-emerald-900/50 active:scale-95 transition-all"
                >
                  💬 HIRE SHEERSH
                </a>
              </div>
            </div>
          )}
        </div>

        {/* TOUCH CONTROLS FOR MOBILE PHONES */}
        <div
          className="mt-4 grid grid-cols-3 gap-2 sm:hidden font-mono text-xs select-none"
          style={{ touchAction: 'none' }}
        >
          <button
            onTouchStart={() => (touchLeftRef.current = true)}
            onTouchEnd={() => (touchLeftRef.current = false)}
            onMouseDown={() => (touchLeftRef.current = true)}
            onMouseUp={() => (touchLeftRef.current = false)}
            className="py-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 active:bg-slate-800 text-center font-bold"
          >
            ◀ LEFT
          </button>

          <button
            onTouchStart={() => (touchShootRef.current = true)}
            onTouchEnd={() => (touchShootRef.current = false)}
            onMouseDown={() => (touchShootRef.current = true)}
            onMouseUp={() => (touchShootRef.current = false)}
            className="py-3.5 rounded-xl bg-orange-600 border border-orange-500 text-white font-bold active:bg-orange-700 text-center shadow-lg"
          >
            🔥 FIRE
          </button>

          <button
            onTouchStart={() => (touchRightRef.current = true)}
            onTouchEnd={() => (touchRightRef.current = false)}
            onMouseDown={() => (touchRightRef.current = true)}
            onMouseUp={() => (touchRightRef.current = false)}
            className="py-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 active:bg-slate-800 text-center font-bold"
          >
            RIGHT ▶
          </button>
        </div>

      </div>
    </section>
  );
}