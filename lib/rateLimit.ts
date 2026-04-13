import { RateLimiterMemory } from "rate-limiter-flexible";
import { RATE_LIMIT } from "./constants";

const rateLimiter = new RateLimiterMemory({
  points: RATE_LIMIT.MAX_REQUESTS_PER_MINUTE,
  duration: RATE_LIMIT.WINDOW_SECONDS,
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
    const res = rej as { remainingPoints: number; msBeforeNext: number };
    return {
      allowed: false,
      remaining: 0,
      resetMs: res.msBeforeNext,
    };
  }
}
