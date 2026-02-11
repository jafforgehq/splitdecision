import OpenAI from 'openai';
import { VALIDATION_SYSTEM_PROMPT } from '@/lib/config';
import { rateLimit } from '@/lib/rate-limit';

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

  const { optionA, optionB, model } = await req.json();

  try {
    const client = new OpenAI({ apiKey });
    const response = await client.chat.completions.create({
      model: model || 'gpt-4o-mini',
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
