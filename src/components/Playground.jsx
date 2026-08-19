import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Playground() {
  const [gameState, setGameState] = useState('idle'); // idle, playing, gameover
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [bugs, setBugs] = useState([]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(15);
    setBugs([]);
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameState('gameover');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const spawner = setInterval(() => {
      if (bugs.length < 5) {
        const newBug = {
          id: Math.random(),
          x: Math.floor(Math.random() * 80) + 10,
          y: Math.floor(Math.random() * 70) + 15,
          type: Math.random() > 0.5 ? '🐛 Memory Leak' : '⚡ Slow Query',
        };
        setBugs((prev) => [...prev, newBug]);
      }
    }, 600);

    return () => clearInterval(spawner);
  }, [gameState, bugs]);

  const smashBug = (id) => {
    setScore((prev) => prev + 10);
    setBugs((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <section id="playground" className="max-w-4xl mx-auto px-6 py-20">
      <div className="text-center space-y-2 mb-8">
        <p className="cmd-label justify-center flex">exec arcade_mini_game.sh</p>
        <h2 className="font-display font-bold text-3xl text-white">
          Developer Playground: Bug Smasher
        </h2>
        <p className="text-muted text-sm">
          Smash as many server bugs and slow queries as you can in 15 seconds!
        </p>
      </div>

      <div className="glass rounded-3xl p-6 border-2 border-violet/30 min-h-[360px] relative flex flex-col justify-between overflow-hidden">
        {/* Game Stats Header */}
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <div className="font-mono text-sm">
            <span className="text-muted">Latency Score: </span>
            <span className="text-cyan font-bold">{score} pts</span>
          </div>
          <div className="font-mono text-sm">
            <span className="text-muted">Time Remaining: </span>
            <span className="text-pink font-bold">{timeLeft}s</span>
          </div>
        </div>

        {/* Game Field */}
        <div className="relative flex-1 min-h-[260px] my-4">
          {gameState === 'idle' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-4">
              <span className="text-4xl">🕹️</span>
              <p className="font-mono text-sm text-muted">Ready to test your reaction time?</p>
              <button
                onClick={startGame}
                className="px-6 py-3 rounded-full grad-bg text-white font-mono text-xs font-bold shadow-lg hover:scale-105 transition"
              >
                Start Game ➔
              </button>
            </div>
          )}

          {gameState === 'gameover' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-3">
              <span className="text-4xl">🎉</span>
              <h3 className="font-display font-bold text-xl text-white">System Optimized!</h3>
              <p className="font-mono text-sm text-cyan">Final Score: {score} Points</p>
              <button
                onClick={startGame}
                className="px-6 py-2.5 rounded-full glass border border-violet text-white font-mono text-xs hover:border-cyan transition"
              >
                Play Again ↺
              </button>
            </div>
          )}

          {gameState === 'playing' && (
            <AnimatePresence>
              {bugs.map((bug) => (
                <motion.button
                  key={bug.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  onClick={() => smashBug(bug.id)}
                  style={{ top: `${bug.y}%`, left: `${bug.x}%` }}
                  className="absolute px-3 py-1.5 rounded-full chip bg-pink/20 border-pink text-xs font-mono font-bold text-white shadow-lg cursor-pointer hover:scale-110"
                >
                  {bug.type}
                </motion.button>
              ))}
            </AnimatePresence>
          )}
        </div>

        <p className="font-mono text-[11px] text-muted text-center pt-2 border-t border-line">
          Built natively in React using Framer Motion state physics.
        </p>
      </div>
    </section>
  );
}