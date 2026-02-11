'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { VerdictData } from '@/lib/types';

const CONFETTI_COLORS = ['#f59e0b', '#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#fbbf24'];

function generateConfetti(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const distance = 80 + Math.random() * 120;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const rotation = Math.random() * 720 - 360;
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const isCircle = Math.random() > 0.5;
    return { id: i, x, y, rotation, color, isCircle };
  });
}

export default function VerdictCard({ verdict }: { verdict: VerdictData }) {
  const { winner, confidence, fullText, isStreaming } = verdict;
  const confidenceVal = confidence ?? 50;
  const barColor = confidenceVal >= 70 ? '#f59e0b' : '#fbbf24';

  const [hasRevealed, setHasRevealed] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const prevIsStreamingRef = useRef(isStreaming);

  const confettiParticles = useMemo(() => generateConfetti(24), []);

  useEffect(() => {
    if (prevIsStreamingRef.current && !isStreaming && !hasRevealed) {
      setHasRevealed(true);
      setShowReveal(true);
      setShowConfetti(true);

      const confettiCleanup = setTimeout(() => {
        setShowConfetti(false);
      }, 2000);

      return () => {
        clearTimeout(confettiCleanup);
      };
    }
    prevIsStreamingRef.current = isStreaming;
  }, [isStreaming, hasRevealed]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mt-6 rounded-2xl p-6 border relative"
      style={{
        background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(234,179,8,0.04) 100%)',
        borderColor: 'rgba(245,158,11,0.35)',
        overflow: showConfetti ? 'visible' : 'hidden',
        boxShadow: showReveal ? '0 0 30px rgba(245,158,11,0.3), 0 0 60px rgba(245,158,11,0.1)' : 'none',
      }}
    >
      {/* Confetti burst */}
      {showConfetti && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ overflow: 'visible' }}>
          {confettiParticles.map((p) => (
            <span
              key={p.id}
              className="confetti-particle"
              style={{
                '--confetti-x': `${p.x}px`,
                '--confetti-y': `${p.y}px`,
                '--confetti-r': `${p.rotation}deg`,
                backgroundColor: p.color,
                width: p.isCircle ? '8px' : '6px',
                height: p.isCircle ? '8px' : '10px',
                borderRadius: p.isCircle ? '50%' : '2px',
                left: '50%',
                top: '50%',
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      <div className="text-xl font-extrabold text-amber-400 mb-1">{'\u{1F3C6}'} Final Verdict</div>

      {winner && (
        <motion.div
          className={`text-2xl font-black text-amber-300 my-2 ${showReveal ? 'winner-highlight' : ''}`}
          animate={showReveal ? { scale: [1.03, 1] } : {}}
          transition={showReveal ? { type: 'spring', stiffness: 300, damping: 20 } : {}}
        >
          {winner}
        </motion.div>
      )}

      {confidence !== null && (
        <div
          className="rounded-lg h-7 w-full my-3 overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <div
            className={`confidence-fill h-full rounded-lg flex items-center justify-center text-xs font-bold ${showReveal ? 'bar-shimmer' : ''}`}
            style={{
              width: `${confidenceVal}%`,
              background: barColor,
              color: '#1a1a2e',
            }}
          >
            {confidenceVal}% confidence
          </div>
        </div>
      )}

      <p className="text-[#d1d5db] text-sm leading-relaxed whitespace-pre-wrap">
        {fullText}
        {isStreaming && <span className="cursor-blink ml-0.5 text-white/60">{'\u2588'}</span>}
      </p>
    </motion.div>
  );
}
