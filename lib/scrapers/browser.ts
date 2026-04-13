import type { Browser } from "puppeteer-core";

/**
 * Fetch a fully-rendered page HTML via ScraperAPI.
 * Uses their headless Chrome + proxy infrastructure.
 * Returns the HTML string, or null on failure.
 */
export async function fetchWithScraperAPI(url: string): Promise<string | null> {
  const apiKey = process.env.SCRAPER_API_KEY;
  if (!apiKey) return null;

  try {
    const apiUrl = `https://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(url)}&render=true&country_code=us`;
    const response = await fetch(apiUrl, { signal: AbortSignal.timeout(25000) });
    if (!response.ok) {
      console.error(`ScraperAPI returned ${response.status} for ${url}`);
      return null;
    }
    return await response.text();
  } catch (err) {
    console.error("ScraperAPI fetch error:", err);
    return null;
  }
}

/**
 * Check if ScraperAPI is available (key is set).
 */
export function hasScraperAPI(): boolean {
  return !!process.env.SCRAPER_API_KEY;
}

/**
 * Launch a local Puppeteer browser instance (dev only).
 */
export async function launchBrowser(): Promise<Browser> {
  const puppeteerExtra = await import("puppeteer-extra");
  const StealthPlugin = await import("puppeteer-extra-plugin-stealth");
  puppeteerExtra.default.use(StealthPlugin.default());

  return puppeteerExtra.default.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  }) as unknown as Promise<Browser>;
}
