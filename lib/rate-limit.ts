import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const FREE_LIMIT = parseInt(process.env.DAILY_FREE_LIMIT || '50', 10);

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.fixedWindow(FREE_LIMIT, '24 h'),
  prefix: 'splitdecision',
});

export async function rateLimit(ip: string): Promise<{ ok: boolean; remaining: number }> {
  const { success, remaining } = await ratelimit.limit(ip);
  return { ok: success, remaining };
}
