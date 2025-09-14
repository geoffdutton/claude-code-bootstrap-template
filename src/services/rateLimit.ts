import type { Environment, RateLimitInfo } from '../types';
import { logWithLevel } from '../utils/helpers';

export class RateLimitService {
  private readonly kv: KVNamespace;
  private readonly limitPerMinute: number;

  constructor(env: Environment) {
    this.kv = env.CACHE;
    this.limitPerMinute = parseInt(env.RATE_LIMIT_PER_MINUTE, 10) || 60;
  }

  async checkRateLimit(identifier: string): Promise<RateLimitInfo> {
    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const windowStart = Math.floor(now / 60000) * 60000; // Start of current minute
    const windowEnd = windowStart + 60000;

    try {
      const current = await this.kv.get(key);
      let count = 0;

      if (current !== null) {
        const parsed = JSON.parse(current) as { count: number; window: number };
        if (parsed.window === windowStart) {
          count = parsed.count;
        }
      }

      const remaining = Math.max(0, this.limitPerMinute - count);
      const blocked = remaining === 0;

      if (!blocked) {
        // Increment counter
        const newData = { count: count + 1, window: windowStart };
        await this.kv.put(key, JSON.stringify(newData), {
          expirationTtl: 120, // Keep for 2 minutes to handle edge cases
        });
      }

      logWithLevel('debug', 'Rate limit check', {
        identifier,
        count: count + (blocked ? 0 : 1),
        remaining: blocked ? 0 : remaining - 1,
        blocked,
      });

      return {
        remaining: blocked ? 0 : remaining - 1,
        resetTime: windowEnd,
        blocked,
      };
    } catch (error) {
      logWithLevel('error', 'Rate limit check failed', { identifier, error });
      // Fail open - allow request if rate limiting fails
      return {
        remaining: this.limitPerMinute - 1,
        resetTime: windowEnd,
        blocked: false,
      };
    }
  }

  async getRateLimitStatus(identifier: string): Promise<RateLimitInfo> {
    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const windowStart = Math.floor(now / 60000) * 60000;
    const windowEnd = windowStart + 60000;

    try {
      const current = await this.kv.get(key);
      let count = 0;

      if (current !== null) {
        const parsed = JSON.parse(current) as { count: number; window: number };
        if (parsed.window === windowStart) {
          count = parsed.count;
        }
      }

      const remaining = Math.max(0, this.limitPerMinute - count);

      return {
        remaining,
        resetTime: windowEnd,
        blocked: remaining === 0,
      };
    } catch (error) {
      logWithLevel('error', 'Rate limit status check failed', { identifier, error });
      return {
        remaining: this.limitPerMinute,
        resetTime: windowEnd,
        blocked: false,
      };
    }
  }
}
