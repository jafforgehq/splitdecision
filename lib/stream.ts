import OpenAI from 'openai';
import {
  VALIDATION_SYSTEM_PROMPT,
  getAgentSystemPrompt,
  buildUserPrompt,
  buildRound2UserPrompt,
  buildVerdictPrompt,
  VERDICT_SYSTEM_PROMPT,
  MAX_RESPONSE_TOKENS,
  MAX_RESPONSE_TOKENS_R2,
} from './config';
import { StreamRequest } from './types';

// --- Content Moderation ---

export async function moderateContent(
  text: string,
  client: OpenAI,
): Promise<{ flagged: boolean; reason: string }> {
  try {
    const result = await client.moderations.create({ input: text });
    const output = result.results[0];
    if (!output.flagged) return { flagged: false, reason: '' };

    const categories = Object.entries(output.categories)
      .filter(([, v]) => v)
      .map(([k]) => k.replace(/[/_]/g, ' '));
    return {
      flagged: true,
      reason: `Content flagged for: ${categories.join(', ')}. Please keep it clean.`,
    };
  } catch {
    return { flagged: false, reason: '' };
  }
}

// --- Validation ---

function parseValidationText(text: string): { valid: boolean; reason: string } {
  if (text.toUpperCase().startsWith('VALID')) {
    return { valid: true, reason: '' };
  }
  const reason = text.includes(':') ? text.split(':').slice(1).join(':').trim() : text;
  return { valid: false, reason };
}

export async function validateComparison(
  optionA: string,
  optionB: string,
  apiKey?: string,
  model: string = 'gpt-4o-mini',
): Promise<{ valid: boolean; reason: string }> {
  if (apiKey) {
    // Direct browser call — BYO key
    const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

    // Content moderation check
    const modResult = await moderateContent(`${optionA} ${optionB}`, client);
    if (modResult.flagged) return { valid: false, reason: modResult.reason };

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: VALIDATION_SYSTEM_PROMPT },
        { role: 'user', content: `Option A: ${optionA}\nOption B: ${optionB}` },
      ],
      max_tokens: 60,
      temperature: 0,
    });
    return parseValidationText(response.choices[0]?.message?.content?.trim() || '');
  }

  // API route call — free tier (moderation runs server-side)
  const res = await fetch('/api/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ optionA, optionB, model }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Validation failed' }));
    throw new Error(err.error || 'Validation failed');
  }
  return res.json();
}

// --- Streaming ---

function resolvePromptParams(req: StreamRequest): {
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  temperature: number;
  model: string;
} {
  if (req.type === 'verdict') {
    return {
      systemPrompt: VERDICT_SYSTEM_PROMPT,
      userPrompt: buildVerdictPrompt(req.optionA, req.optionB, req.round1Results, req.round2Results),
      maxTokens: 500,
      temperature: 0.7,
      model: req.model || 'gpt-4o-mini',
    };
  }

  const systemPrompt = getAgentSystemPrompt(req.agentKey, req.theme, req.roundNum);
  const userPrompt =
    req.roundNum === 2 && req.round1Results
      ? buildRound2UserPrompt(req.optionA, req.optionB, req.category, req.round1Results)
      : buildUserPrompt(req.optionA, req.optionB, req.category);
  const maxTokens = req.roundNum === 2 ? MAX_RESPONSE_TOKENS_R2 : MAX_RESPONSE_TOKENS;

  return {
    systemPrompt,
    userPrompt,
    maxTokens,
    temperature: 0.9,
    model: req.model || 'gpt-4o-mini',
  };
}

async function* streamDirect(apiKey: string, req: StreamRequest): AsyncGenerator<string> {
  const { systemPrompt, userPrompt, maxTokens, temperature, model } = resolvePromptParams(req);
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

  const stream = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: maxTokens,
    temperature,
    stream: true,
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content;
    if (text) yield text;
  }
}

async function* streamViaApi(req: StreamRequest): AsyncGenerator<string> {
  const res = await fetch('/api/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Stream failed' }));
    throw new Error(err.error || 'Stream failed');
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    if (text) yield text;
  }
}

export async function* streamChat(
  apiKey: string | undefined,
  req: StreamRequest,
): AsyncGenerator<string> {
  if (apiKey) {
    yield* streamDirect(apiKey, req);
  } else {
    yield* streamViaApi(req);
  }
}
