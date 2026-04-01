import { Platform, ScrapeResult } from "./types";
import { scrapeCraigslist } from "./craigslist";
import { scrapeFacebook } from "./facebook";
import { scrapeOfferUp } from "./offerup";
import { scrapeMercari } from "./mercari";

export const SUPPORTED_PLATFORMS: Platform[] = ["craigslist", "facebook", "offerup", "mercari"];

const scraperMap: Record<Platform, (query: string, location: string, maxResults: number) => Promise<ScrapeResult>> = {
  craigslist: scrapeCraigslist,
  facebook: scrapeFacebook,
  offerup: scrapeOfferUp,
  mercari: scrapeMercari,
};

/**
 * Run a scraper for the given platform. Returns a platform-specific error
 * if the platform is unsupported — never throws.
 */
export async function scrape(
  platform: string,
  query: string,
  location: string,
  maxResults: number = 50
): Promise<ScrapeResult> {
  const fn = scraperMap[platform as Platform];
  if (!fn) {
    return {
      success: false,
      error: {
        code: "UNSUPPORTED_PLATFORM",
        message: `Platform "${platform}" is not supported. Available: ${SUPPORTED_PLATFORMS.join(", ")}`,
      },
    };
  }

  // Wrap in a 15-second timeout so no single scraper can hang the request
  return Promise.race([
    fn(query, location, maxResults),
    new Promise<ScrapeResult>((resolve) =>
      setTimeout(
        () =>
          resolve({
            success: false,
            error: { code: "TIMEOUT", message: `${platform} scrape timed out after 15s` },
          }),
        15000
      )
    ),
  ]);
}

// --- Health check tracking ---

interface PlatformHealth {
  status: "operational" | "degraded";
  lastCheck: string;
  error?: string;
}

const healthStatus: Record<string, PlatformHealth> = {};

export function reportHealth(platform: string, success: boolean, error?: string) {
  healthStatus[platform] = {
    status: success ? "operational" : "degraded",
    lastCheck: new Date().toISOString(),
    ...(error ? { error } : {}),
  };
}

export function getHealthStatus(): Record<string, PlatformHealth> {
  const result: Record<string, PlatformHealth> = {};
  for (const p of SUPPORTED_PLATFORMS) {
    result[p] = healthStatus[p] ?? { status: "operational", lastCheck: new Date().toISOString() };
  }
  return result;
}
