import { RateLimiterMemory } from "rate-limiter-flexible";

// 100 requests per minute per API key
const rateLimiter = new RateLimiterMemory({
  points: 100,
  duration: 60, // seconds
});

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

export async function checkRateLimit(apiKeyId: string): Promise<RateLimitResult> {
  try {
    const res = await rateLimiter.consume(apiKeyId);
    return {
      allowed: true,
      remaining: res.remainingPoints,
      resetMs: res.msBeforeNext,
    };
  } catch (rej) {
    // rate-limiter-flexible rejects when limit exceeded
    const res = rej as { remainingPoints: number; msBeforeNext: number };
    return {
      allowed: false,
      remaining: 0,
      resetMs: res.msBeforeNext,
    };
  }
}
