'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PANEL_THEMES } from '@/lib/config';
import { ComparisonRecord, ThemeKey } from '@/lib/types';

interface Props {
  onSelect: (optionA: string, optionB: string) => void;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function TrendingFeed({ onSelect }: Props) {
  const [comparisons, setComparisons] = useState<ComparisonRecord[]>([]);

  useEffect(() => {
    fetch('/api/comparisons')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setComparisons(data);
      })
      .catch(() => {});
  }, []);

  if (comparisons.length === 0) return null;

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <p className="text-xs text-zinc-500 mb-3 font-medium">Trending comparisons:</p>
      <div className="space-y-2">
        {comparisons.map((c, i) => {
          const theme = PANEL_THEMES[c.theme as ThemeKey] || PANEL_THEMES.default;
          return (
            <motion.button
              key={`${c.timestamp}-${i}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelect(c.optionA, c.optionB)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#13131a] border border-[#2a2a3a] hover:border-zinc-600 transition-colors text-left group"
            >
              <span className="text-lg flex-shrink-0">{theme.emoji}</span>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-white group-hover:text-amber-300 transition-colors truncate block">
                  {c.optionA} <span className="text-zinc-500">vs</span> {c.optionB}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 truncate max-w-[120px]">
                  {c.winner}
                </span>
                <span className="text-xs text-zinc-500">{c.confidence}%</span>
                <span className="text-xs text-zinc-600">{timeAgo(c.timestamp)}</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
