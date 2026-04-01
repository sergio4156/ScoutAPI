import { Redis } from "@upstash/redis";
import { ScrapeResult } from "./scrapers/types";

// Cache TTL: 15 minutes
const CACHE_TTL = 15 * 60;

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

/**
 * Build a cache key from scrape parameters.
 */
function buildKey(platform: string, location: string, query: string): string {
  return `scrape:${platform}:${location}:${query.toLowerCase().trim()}`;
}

/**
 * Try to get cached scrape results.
 * Returns null on cache miss or if Redis is not configured.
 */
export async function getCached(
  platform: string,
  location: string,
  query: string
): Promise<ScrapeResult | null> {
  const r = getRedis();
  if (!r) return null;

  try {
    const key = buildKey(platform, location, query);
    const data = await r.get<ScrapeResult>(key);
    return data ?? null;
  } catch {
    return null;
  }
}

/**
 * Store scrape results in cache.
 */
export async function setCache(
  platform: string,
  location: string,
  query: string,
  result: ScrapeResult
): Promise<void> {
  const r = getRedis();
  if (!r) return;

  try {
    const key = buildKey(platform, location, query);
    await r.set(key, result, { ex: CACHE_TTL });
  } catch {
    // Silently fail — caching is best-effort
  }
}
