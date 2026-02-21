import OpenAI from 'openai';
import { DEFAULT_MODEL, VALIDATION_SYSTEM_PROMPT } from '@/lib/config';
import { moderateContent } from '@/lib/stream';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const limit = await rateLimit(ip);
  if (!limit.ok) {
    return Response.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: 'Server OpenAI key is not configured.' },
      { status: 500 },
    );
  }

  const { optionA, optionB } = await req.json();

  try {
    const client = new OpenAI({ apiKey });

    // Content moderation check (free, fast)
    const modResult = await moderateContent(`${optionA} ${optionB}`, client);
    if (modResult.flagged) {
      return Response.json({ valid: false, reason: modResult.reason });
    }

    const response = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: VALIDATION_SYSTEM_PROMPT },
        { role: 'user', content: `Option A: ${optionA}\nOption B: ${optionB}` },
      ],
      max_tokens: 60,
      temperature: 0,
    });

    const text = response.choices[0]?.message?.content?.trim() || '';

    if (text.toUpperCase().startsWith('VALID')) {
      return Response.json({ valid: true, reason: '' });
    }

    const reason = text.includes(':') ? text.split(':').slice(1).join(':').trim() : text;
    return Response.json({ valid: false, reason });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Validation failed';
    return Response.json({ error: message }, { status: 500 });
  }
}
