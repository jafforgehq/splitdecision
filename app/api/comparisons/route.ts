import { NextResponse } from 'next/server';
import { saveComparison, getRecentComparisons } from '@/lib/redis';
import { ComparisonRecord, ThemeKey } from '@/lib/types';
import { PANEL_THEMES } from '@/lib/config';

const VALID_THEMES = Object.keys(PANEL_THEMES) as ThemeKey[];
const MAX_FIELD_LEN = 100;

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) : str;
}

export async function GET() {
  try {
    const comparisons = await getRecentComparisons(20);
    return NextResponse.json(comparisons);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { optionA, optionB, category, theme, winner, confidence } = body as Partial<ComparisonRecord>;

    if (!optionA || !optionB || !winner || confidence == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!VALID_THEMES.includes(theme as ThemeKey)) {
      return NextResponse.json({ error: 'Invalid theme' }, { status: 400 });
    }

    const record: ComparisonRecord = {
      optionA: truncate(String(optionA), MAX_FIELD_LEN),
      optionB: truncate(String(optionB), MAX_FIELD_LEN),
      category: truncate(String(category || 'General'), MAX_FIELD_LEN),
      theme: theme as ThemeKey,
      winner: truncate(String(winner), MAX_FIELD_LEN),
      confidence: Math.max(50, Math.min(95, Number(confidence))),
      timestamp: Date.now(),
    };

    await saveComparison(record);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save comparison' }, { status: 500 });
  }
}
