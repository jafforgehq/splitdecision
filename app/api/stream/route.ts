import OpenAI from 'openai';
import {
  getAgentSystemPrompt,
  buildUserPrompt,
  buildRound2UserPrompt,
  buildVerdictPrompt,
  VERDICT_SYSTEM_PROMPT,
  MAX_RESPONSE_TOKENS,
  MAX_RESPONSE_TOKENS_R2,
} from '@/lib/config';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const limit = await rateLimit(ip);
  if (!limit.ok) {
    return Response.json(
      { error: 'Rate limit exceeded. Add your own API key in Advanced Settings for unlimited access.' },
      { status: 429 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: 'Free tier is not configured on this server. Please add your own API key.' },
      { status: 500 },
    );
  }

  const body = await req.json();

  let systemPrompt: string;
  let userPrompt: string;
  let maxTokens: number;
  let temperature = 0.9;

  if (body.type === 'verdict') {
    systemPrompt = VERDICT_SYSTEM_PROMPT;
    userPrompt = buildVerdictPrompt(body.optionA, body.optionB, body.round1Results, body.round2Results);
    maxTokens = 500;
    temperature = 0.7;
  } else {
    systemPrompt = getAgentSystemPrompt(body.agentKey, body.theme, body.roundNum);
    userPrompt =
      body.roundNum === 2 && body.round1Results
        ? buildRound2UserPrompt(body.optionA, body.optionB, body.category, body.round1Results)
        : buildUserPrompt(body.optionA, body.optionB, body.category);
    maxTokens = body.roundNum === 2 ? MAX_RESPONSE_TOKENS_R2 : MAX_RESPONSE_TOKENS;
  }

  try {
    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: body.model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Stream failed';
    return Response.json({ error: message }, { status: 500 });
  }
}
