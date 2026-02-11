'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AGENTS,
  AGENT_ORDER,
  PANEL_THEMES,
  DEFAULT_MODEL,
  parseVerdict,
} from '@/lib/config';
import { AgentKey, AgentMessage as AgentMessageType, VerdictData } from '@/lib/types';
import { streamChat, validateComparison } from '@/lib/stream';
import ComparisonInput, { InputState } from '@/components/ComparisonInput';
import AgentMessage from '@/components/AgentMessage';
import VerdictCard from '@/components/VerdictCard';
import TrendingFeed from '@/components/TrendingFeed';
import VSSplash from '@/components/VSSplash';
import ShareCard from '@/components/ShareCard';

type Phase = 'input' | 'validating' | 'debating' | 'done';

export default function Home() {
  const [phase, setPhase] = useState<Phase>('input');
  const [input, setInput] = useState<InputState>({
    optionA: '',
    optionB: '',
    category: 'General',
    theme: 'default',
    apiKey: '',
    model: DEFAULT_MODEL,
  });
  const [messages, setMessages] = useState<AgentMessageType[]>([]);
  const [verdict, setVerdict] = useState<VerdictData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('');
  const [showVSSplash, setShowVSSplash] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);

  const threadEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef(false);
  const savedRef = useRef(false);

  // Auto-scroll during debate
  useEffect(() => {
    if (phase === 'debating') {
      threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, verdict, phase]);

  // Save comparison to history when done
  useEffect(() => {
    if (phase === 'done' && verdict?.winner && verdict?.confidence && !savedRef.current) {
      savedRef.current = true;
      fetch('/api/comparisons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          optionA: input.optionA,
          optionB: input.optionB,
          category: input.category,
          theme: input.theme,
          winner: verdict.winner,
          confidence: verdict.confidence,
        }),
      }).catch(() => {});
    }
  }, [phase, verdict, input]);

  const getVerdictExcerpt = (fullText: string) => {
    const stripped = fullText
      .replace(/^WINNER:.*$/m, '')
      .replace(/^CONFIDENCE:.*$/m, '')
      .replace(/^PICK\s.*$/gm, '')
      .replace(/^WHAT WOULD FLIP THIS:.*$/m, '')
      .trim();
    const sentences = stripped.match(/[^.!?]+[.!?]+/g) || [];
    let excerpt = sentences.slice(0, 2).join(' ').trim();
    if (excerpt.length > 200) excerpt = excerpt.substring(0, 197) + '...';
    return excerpt;
  };

  const runDebate = useCallback(async () => {
    const a = input.optionA.trim();
    const b = input.optionB.trim();

    if (!a || !b) {
      setError('Please enter both options.');
      return;
    }

    setPhase('validating');
    setMessages([]);
    setVerdict(null);
    setError(null);
    abortRef.current = false;
    savedRef.current = false;

    // --- Validate ---
    try {
      const result = await validateComparison(a, b, input.apiKey || undefined, input.model);
      if (!result.valid) {
        setError(
          `These don't make for a meaningful comparison: ${result.reason}\n\nTry comparing things in the same category or that serve a similar purpose.`,
        );
        setPhase('input');
        return;
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Validation failed');
      setPhase('input');
      return;
    }

    setPhase('debating');
    setShowVSSplash(true);
    const apiKey = input.apiKey || undefined;

    // --- Round 1 ---
    setStatusText('Round 1: Agents are debating...');
    const round1Results: Record<string, string> = {};

    for (const agentKey of AGENT_ORDER) {
      if (abortRef.current) return;

      const msgId = `r1-${agentKey}`;
      setMessages((prev) => [
        ...prev,
        { id: msgId, agentKey, round: 1, text: '', isStreaming: true },
      ]);

      let fullText = '';
      try {
        for await (const chunk of streamChat(apiKey, {
          type: 'agent',
          agentKey,
          theme: input.theme,
          roundNum: 1,
          optionA: a,
          optionB: b,
          category: input.category,
          model: input.model,
        })) {
          if (abortRef.current) return;
          fullText += chunk;
          setMessages((prev) =>
            prev.map((msg) => (msg.id === msgId ? { ...msg, text: fullText } : msg)),
          );
        }
      } catch (e: unknown) {
        setError(`${AGENTS[agentKey].name} error: ${e instanceof Error ? e.message : 'Unknown error'}`);
        setPhase('input');
        return;
      }

      round1Results[agentKey] = fullText;
      setMessages((prev) =>
        prev.map((msg) => (msg.id === msgId ? { ...msg, isStreaming: false } : msg)),
      );
    }

    // --- Round 2 ---
    setStatusText('Round 2: Agents respond to each other...');
    const round2Results: Record<string, string> = {};

    for (const agentKey of AGENT_ORDER) {
      if (abortRef.current) return;

      const msgId = `r2-${agentKey}`;
      setMessages((prev) => [
        ...prev,
        { id: msgId, agentKey, round: 2, text: '', isStreaming: true },
      ]);

      let fullText = '';
      try {
        for await (const chunk of streamChat(apiKey, {
          type: 'agent',
          agentKey,
          theme: input.theme,
          roundNum: 2,
          optionA: a,
          optionB: b,
          category: input.category,
          round1Results,
          model: input.model,
        })) {
          if (abortRef.current) return;
          fullText += chunk;
          setMessages((prev) =>
            prev.map((msg) => (msg.id === msgId ? { ...msg, text: fullText } : msg)),
          );
        }
      } catch (e: unknown) {
        setError(`${AGENTS[agentKey].name} Round 2 error: ${e instanceof Error ? e.message : 'Unknown error'}`);
        setPhase('input');
        return;
      }

      round2Results[agentKey] = fullText;
      setMessages((prev) =>
        prev.map((msg) => (msg.id === msgId ? { ...msg, isStreaming: false } : msg)),
      );
    }

    // --- Verdict ---
    setStatusText('Generating verdict...');
    setVerdict({ winner: null, confidence: null, fullText: '', isStreaming: true });

    let verdictText = '';
    try {
      for await (const chunk of streamChat(apiKey, {
        type: 'verdict',
        optionA: a,
        optionB: b,
        round1Results,
        round2Results,
        model: input.model,
      })) {
        if (abortRef.current) return;
        verdictText += chunk;
        const parsed = parseVerdict(verdictText, a, b);
        setVerdict({
          winner: parsed.winner,
          confidence: parsed.confidence,
          fullText: verdictText,
          isStreaming: true,
        });
      }
    } catch (e: unknown) {
      setError(`Verdict error: ${e instanceof Error ? e.message : 'Unknown error'}`);
      setPhase('input');
      return;
    }

    const finalParsed = parseVerdict(verdictText, a, b);
    setVerdict({
      winner: finalParsed.winner,
      confidence: finalParsed.confidence,
      fullText: verdictText,
      isStreaming: false,
    });

    setStatusText('Done!');
    setPhase('done');
  }, [input]);

  const reset = () => {
    abortRef.current = true;
    setPhase('input');
    setMessages([]);
    setVerdict(null);
    setError(null);
    setStatusText('');
    setShowVSSplash(false);
    setShowShareCard(false);
  };

  // Find the index where Round 2 messages start (for divider)
  const round2StartIndex = messages.findIndex((m) => m.round === 2);

  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-2">
            <span style={{ textShadow: '0 0 20px rgba(245,158,11,0.3)' }}>{'\u2694\ufe0f'}</span>{' '}
            SplitDecision
          </h1>
          <p className="text-zinc-400 text-sm">
            Enter two options. Watch AI agents debate. Get a verdict.
          </p>
        </div>

        {/* Input Phase */}
        {(phase === 'input' || phase === 'validating') && (
          <>
            <ComparisonInput
              input={input}
              setInput={setInput}
              onCompare={runDebate}
              isLoading={phase === 'validating'}
              error={error}
            />
            <TrendingFeed
              onSelect={(a, b) => setInput((prev) => ({ ...prev, optionA: a, optionB: b }))}
            />
          </>
        )}

        {/* Debate Phase */}
        {(phase === 'debating' || phase === 'done') && (
          <div>
            {/* Matchup header */}
            <div className="text-center mb-6">
              <div className="text-lg font-bold">
                {input.optionA} <span className="text-amber-400 mx-2">vs</span> {input.optionB}
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                {PANEL_THEMES[input.theme].emoji} {PANEL_THEMES[input.theme].label} {' \u2014 '}
                {PANEL_THEMES[input.theme].description}
              </div>
            </div>

            {/* Status */}
            {phase === 'debating' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center mb-6"
              >
                <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {statusText}
                </span>
              </motion.div>
            )}

            {phase === 'done' && (
              <div className="text-center mb-6">
                <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-300 border border-green-500/20">
                  {'\u2705'} Complete
                </span>
              </div>
            )}

            {/* Debate Thread */}
            <div className="debate-thread">
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <div key={msg.id}>
                    {/* Round 2 divider */}
                    {i === round2StartIndex && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-3 my-6"
                      >
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
                        <span className="text-xs font-semibold text-purple-300 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                          {'\u{1F504}'} Round 2 {'\u2014'} Rebuttals
                        </span>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
                      </motion.div>
                    )}
                    <AgentMessage message={msg} />
                  </div>
                ))}
              </AnimatePresence>

              {/* Verdict */}
              {verdict && <VerdictCard verdict={verdict} />}

              <div ref={threadEndRef} />
            </div>

            {/* Action buttons */}
            <div className="mt-8 text-center flex justify-center gap-3">
              <button
                onClick={reset}
                className="px-6 py-2.5 rounded-xl text-sm font-medium bg-[#13131a] border border-[#2a2a3a] text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
              >
                {'\u{1F504}'} New Comparison
              </button>
              {phase === 'done' && (
                <button
                  onClick={() => setShowShareCard(true)}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium border transition-colors"
                  style={{
                    background: 'rgba(245,158,11,0.1)',
                    borderColor: 'rgba(245,158,11,0.3)',
                    color: '#f59e0b',
                  }}
                >
                  {'\u{1F4E4}'} Share Result
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-zinc-600 text-xs mt-12 pt-6 border-t border-white/5">
          Built with {'\u2764\ufe0f'} using Next.js & OpenAI
        </div>
      </div>

      {/* VS Splash overlay */}
      <AnimatePresence>
        {showVSSplash && (
          <VSSplash
            optionA={input.optionA}
            optionB={input.optionB}
            themeEmoji={PANEL_THEMES[input.theme].emoji}
            themeLabel={PANEL_THEMES[input.theme].label}
            onComplete={() => setShowVSSplash(false)}
          />
        )}
      </AnimatePresence>

      {/* Share Card modal */}
      {verdict && phase === 'done' && (
        <ShareCard
          optionA={input.optionA}
          optionB={input.optionB}
          themeEmoji={PANEL_THEMES[input.theme].emoji}
          themeLabel={PANEL_THEMES[input.theme].label}
          winner={verdict.winner || ''}
          confidence={verdict.confidence ?? 50}
          verdictExcerpt={getVerdictExcerpt(verdict.fullText)}
          isOpen={showShareCard}
          onClose={() => setShowShareCard(false)}
        />
      )}
    </main>
  );
}
