'use client';

import { motion } from 'framer-motion';
import { AGENTS } from '@/lib/config';
import { AgentMessage as AgentMessageType } from '@/lib/types';

function TypingDots({ color }: { color: string }) {
  return (
    <div className="flex gap-1.5 py-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="typing-dot w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

export default function AgentMessage({ message }: { message: AgentMessageType }) {
  const agent = AGENTS[message.agentKey];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex gap-3 mb-5"
    >
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{
          backgroundColor: agent.color + '18',
          border: `2px solid ${agent.color}`,
        }}
      >
        <span className="text-lg">{agent.emoji}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-bold text-sm" style={{ color: agent.color }}>
            {agent.name}
          </span>
          {message.round === 2 && (
            <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 font-semibold">
              Round 2
            </span>
          )}
        </div>

        <div
          className="rounded-2xl rounded-tl-sm p-4 border"
          style={{
            backgroundColor: '#13131a',
            borderColor: message.round === 2 ? agent.color + '30' : '#1e1e2e',
            borderStyle: message.round === 2 ? 'dashed' : 'solid',
          }}
        >
          {message.text ? (
            <p className="text-[#d1d5db] text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.text}
              {message.isStreaming && (
                <span className="cursor-blink ml-0.5 text-white/60">{'\u2588'}</span>
              )}
            </p>
          ) : message.isStreaming ? (
            <TypingDots color={agent.color} />
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
