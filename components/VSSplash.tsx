'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VSSplashProps {
  optionA: string;
  optionB: string;
  themeEmoji: string;
  themeLabel: string;
  onComplete: () => void;
}

export default function VSSplash({ optionA, optionB, themeEmoji, themeLabel, onComplete }: VSSplashProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const holdTimer = setTimeout(() => setIsExiting(true), 1400);
    const completeTimer = setTimeout(() => onComplete(), 2200);
    return () => {
      clearTimeout(holdTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!isExiting ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0f 70%)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-4 sm:gap-8">
            {/* Option A - flies in from left */}
            <motion.div
              className="text-3xl sm:text-5xl font-black text-white text-right max-w-[200px] sm:max-w-[300px] truncate"
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              {optionA}
            </motion.div>

            {/* VS emblem */}
            <motion.div
              className="text-6xl sm:text-8xl font-black text-amber-400 vs-glow select-none"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.3 }}
            >
              VS
            </motion.div>

            {/* Option B - flies in from right */}
            <motion.div
              className="text-3xl sm:text-5xl font-black text-white text-left max-w-[200px] sm:max-w-[300px] truncate"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              {optionB}
            </motion.div>
          </div>

          {/* Theme badge */}
          <motion.div
            className="absolute bottom-1/3 text-lg text-zinc-400"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.3 }}
          >
            {themeEmoji} {themeLabel}
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0f 70%)' }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center gap-4 sm:gap-8">
            {/* Option A - flies back out left with blur */}
            <motion.div
              className="text-3xl sm:text-5xl font-black text-white text-right max-w-[200px] sm:max-w-[300px] truncate"
              initial={{ x: 0, filter: 'blur(0px)' }}
              animate={{ x: -300, filter: 'blur(8px)', opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeIn' }}
            >
              {optionA}
            </motion.div>

            {/* VS - explodes outward */}
            <motion.div
              className="text-6xl sm:text-8xl font-black text-amber-400 vs-glow select-none"
              initial={{ scale: 1 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeIn' }}
            >
              VS
            </motion.div>

            {/* Option B - flies back out right with blur */}
            <motion.div
              className="text-3xl sm:text-5xl font-black text-white text-left max-w-[200px] sm:max-w-[300px] truncate"
              initial={{ x: 0, filter: 'blur(0px)' }}
              animate={{ x: 300, filter: 'blur(8px)', opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeIn' }}
            >
              {optionB}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
