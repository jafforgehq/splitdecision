'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShareCardProps {
  optionA: string;
  optionB: string;
  themeEmoji: string;
  themeLabel: string;
  winner: string;
  confidence: number;
  verdictExcerpt: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareCard({
  optionA,
  optionB,
  themeEmoji,
  themeLabel,
  winner,
  confidence,
  verdictExcerpt,
  isOpen,
  onClose,
}: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, handleEscape]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: ignore if clipboard not available
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#0a0a0f',
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `splitdecision-${optionA}-vs-${optionB}.png`.replace(/\s+/g, '-').toLowerCase();
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      // Silently fail if html2canvas has issues
    } finally {
      setDownloading(false);
    }
  };

  const handleShareX = () => {
    const text = `${winner} wins! ${optionA} vs ${optionB} — decided by AI debate on SplitDecision`;
    const url = window.location.href;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  const barColor = confidence >= 70 ? '#f59e0b' : '#fbbf24';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="max-w-[400px] w-full"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Capturable card */}
            <div
              ref={cardRef}
              className="rounded-2xl p-6 border"
              style={{
                background: 'linear-gradient(135deg, #13131a 0%, #0a0a0f 100%)',
                borderColor: 'rgba(245,158,11,0.35)',
              }}
            >
              {/* Header */}
              <div className="text-center mb-4">
                <div className="text-xl font-black text-white">
                  {'\u2694\ufe0f'} SplitDecision
                </div>
                <div
                  className="h-px my-3"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.5), transparent)',
                  }}
                />
              </div>

              {/* Matchup */}
              <div className="text-center mb-3">
                <span className="text-lg font-bold text-white">{optionA}</span>
                <span className="text-amber-400 mx-2 font-black">VS</span>
                <span className="text-lg font-bold text-white">{optionB}</span>
              </div>

              {/* Theme */}
              <div className="text-center text-sm text-zinc-400 mb-4">
                {themeEmoji} {themeLabel}
              </div>

              {/* Winner */}
              <div className="text-center mb-3">
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Winner</div>
                <div className="text-2xl font-black text-amber-300">{'\u{1F3C6}'} {winner}</div>
              </div>

              {/* Confidence bar */}
              <div
                className="rounded-lg h-6 w-full mb-4 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                <div
                  className="h-full rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{
                    width: `${confidence}%`,
                    background: barColor,
                    color: '#1a1a2e',
                  }}
                >
                  {confidence}% confidence
                </div>
              </div>

              {/* Verdict excerpt */}
              {verdictExcerpt && (
                <div
                  className="text-sm text-zinc-300 italic leading-relaxed mb-4 p-3 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  &ldquo;{verdictExcerpt}&rdquo;
                </div>
              )}

              {/* Footer */}
              <div className="text-center text-xs text-zinc-600">
                splitdecision.vercel.app {'\u2022'} AI-powered debate
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-4 justify-center">
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-[#13131a] border border-[#2a2a3a] text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
              >
                {copied ? '\u2705 Copied!' : '\u{1F517} Copy Link'}
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-[#13131a] border border-[#2a2a3a] text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors disabled:opacity-50"
              >
                {downloading ? '\u23F3 Saving...' : '\u{1F4F8} Download'}
              </button>
              <button
                onClick={handleShareX}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-[#13131a] border border-[#2a2a3a] text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
              >
                {'\u{1D54F}'} Share to X
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
