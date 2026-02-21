import OpenAI from 'openai';
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

export async function validateComparison(
  optionA: string,
  optionB: string,
): Promise<{ valid: boolean; reason: string }> {
  const res = await fetch('/api/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ optionA, optionB }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Validation failed' }));
    throw new Error(err.error || 'Validation failed');
  }
  return res.json();
}

// --- Streaming ---

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

export async function* streamChat(req: StreamRequest): AsyncGenerator<string> {
  yield* streamViaApi(req);
}
