import { Redis } from '@upstash/redis';
import { ComparisonRecord } from './types';

const redis = Redis.fromEnv();

const KEY = 'splitdecision:comparisons';
const MAX_ENTRIES = 100;

export async function saveComparison(record: ComparisonRecord): Promise<void> {
  await redis.zadd(KEY, { score: record.timestamp, member: JSON.stringify(record) });
  await redis.zremrangebyrank(KEY, 0, -(MAX_ENTRIES + 1));
}

export async function getRecentComparisons(limit: number = 20): Promise<ComparisonRecord[]> {
  const raw = await redis.zrange<string[]>(KEY, 0, limit - 1, { rev: true });
  return raw.map((entry) => {
    if (typeof entry === 'string') return JSON.parse(entry) as ComparisonRecord;
    return entry as unknown as ComparisonRecord;
  });
}
