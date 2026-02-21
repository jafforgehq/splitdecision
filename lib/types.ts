export type AgentKey = 'analyst' | 'contrarian' | 'pragmatist' | 'wildcard';

export type ThemeKey = 'default' | 'startup_bros' | 'academic_panel' | 'bar_argument' | 'shark_tank' | 'reddit_thread' | 'courtroom' | 'sports_commentary' | 'philosophy_seminar';

export interface Agent {
  name: string;
  emoji: string;
  color: string;
}

export interface ThemeInfo {
  label: string;
  emoji: string;
  description: string;
  agentPrompts: Record<AgentKey, { round1: string; round2: string }>;
}

export interface AgentMessage {
  id: string;
  agentKey: AgentKey;
  round: 1 | 2;
  text: string;
  isStreaming: boolean;
}

export interface VerdictData {
  winner: string | null;
  confidence: number | null;
  fullText: string;
  isStreaming: boolean;
}

export interface Example {
  a: string;
  b: string;
  label: string;
}

export interface ComparisonRecord {
  optionA: string;
  optionB: string;
  category: string;
  theme: ThemeKey;
  winner: string;
  confidence: number;
  timestamp: number;
}

export type StreamRequest =
  | {
      type: 'agent';
      agentKey: AgentKey;
      theme: ThemeKey;
      roundNum: 1 | 2;
      optionA: string;
      optionB: string;
      category: string;
      round1Results?: Record<string, string>;
    }
  | {
      type: 'verdict';
      optionA: string;
      optionB: string;
      round1Results: Record<string, string>;
      round2Results: Record<string, string>;
    };
