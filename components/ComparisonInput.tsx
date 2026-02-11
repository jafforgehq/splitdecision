'use client';

import { useState } from 'react';
import { CATEGORIES, EXAMPLES, PANEL_THEMES, THEME_ORDER, MODELS, DEFAULT_MODEL } from '@/lib/config';
import { ThemeKey } from '@/lib/types';

export interface InputState {
  optionA: string;
  optionB: string;
  category: string;
  theme: ThemeKey;
  apiKey: string;
  model: string;
}

interface Props {
  input: InputState;
  setInput: React.Dispatch<React.SetStateAction<InputState>>;
  onCompare: () => void;
  isLoading: boolean;
  error: string | null;
}

export default function ComparisonInput({ input, setInput, onCompare, isLoading, error }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const update = (field: keyof InputState, value: string) => {
    setInput((prev) => ({ ...prev, [field]: value }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && input.optionA.trim() && input.optionB.trim()) {
      onCompare();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Options */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1">
          <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Option A</label>
          <input
            type="text"
            value={input.optionA}
            onChange={(e) => update('optionA', e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. React"
            className="w-full bg-[#13131a] border border-[#2a2a3a] rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>

        <div
          className="text-amber-400 font-black text-xl mt-5 px-2 select-none"
          style={{ textShadow: '0 0 12px rgba(245,158,11,0.4)' }}
        >
          VS
        </div>

        <div className="flex-1">
          <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Option B</label>
          <input
            type="text"
            value={input.optionB}
            onChange={(e) => update('optionB', e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Svelte"
            className="w-full bg-[#13131a] border border-[#2a2a3a] rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Category + Theme */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1">
          <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Category</label>
          <select
            value={input.category}
            onChange={(e) => update('category', e.target.value)}
            className="w-full bg-[#13131a] border border-[#2a2a3a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Panel Theme</label>
          <select
            value={input.theme}
            onChange={(e) => update('theme', e.target.value)}
            className="w-full bg-[#13131a] border border-[#2a2a3a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
          >
            {THEME_ORDER.map((t) => (
              <option key={t} value={t}>
                {PANEL_THEMES[t].emoji} {PANEL_THEMES[t].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Advanced settings */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-xs text-zinc-500 hover:text-zinc-300 mb-3 transition-colors"
      >
        {showAdvanced ? '\u25BE' : '\u25B8'} Advanced Settings
      </button>

      {showAdvanced && (
        <div className="mb-5 p-4 bg-[#0d0d15] rounded-xl border border-[#1e1e2e] space-y-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
              OpenAI API Key <span className="text-zinc-600">(optional {'\u2014'} leave blank for free tier)</span>
            </label>
            <input
              type="password"
              value={input.apiKey}
              onChange={(e) => update('apiKey', e.target.value)}
              placeholder="sk-..."
              className="w-full bg-[#13131a] border border-[#2a2a3a] rounded-xl px-4 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Model</label>
            <select
              value={input.model}
              onChange={(e) => update('model', e.target.value)}
              className="w-full bg-[#13131a] border border-[#2a2a3a] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
            >
              {Object.entries(MODELS).map(([key, m]) => (
                <option key={key} value={key}>{m.label}</option>
              ))}
            </select>
            <p className="text-[0.65rem] text-zinc-600 mt-1">{MODELS[input.model]?.description}</p>
          </div>
        </div>
      )}

      {/* Examples */}
      <div className="mb-5">
        <p className="text-xs text-zinc-500 mb-2 font-medium">Try these:</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => setInput((prev) => ({ ...prev, optionA: ex.a, optionB: ex.b }))}
              className="text-xs px-3 py-1.5 rounded-lg bg-[#13131a] border border-[#2a2a3a] text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm whitespace-pre-wrap">
          {error}
        </div>
      )}

      {/* Compare button */}
      <button
        onClick={onCompare}
        disabled={isLoading || !input.optionA.trim() || !input.optionB.trim()}
        className="w-full py-3.5 rounded-xl font-bold text-base transition-all bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30"
      >
        {isLoading ? 'Checking...' : '\u2694\ufe0f Compare'}
      </button>

      {!input.apiKey && (
        <p className="text-center text-[0.65rem] text-zinc-600 mt-2">
          Free tier {'\u2014'} 5 comparisons/day {'\u2022'} Add your own API key for unlimited
        </p>
      )}
    </div>
  );
}
