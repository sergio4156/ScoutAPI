import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Listing, ScrapeResult } from "./types";

puppeteer.use(StealthPlugin());

// Facebook Marketplace location IDs for common areas
const LOCATION_IDS: Record<string, string> = {
  sfbay: "106377336067638",
  losangeles: "108424279189115",
  newyork: "110184922344060",
  chicago: "108659242498155",
  seattle: "110843418940484",
  portland: "108396529193498",
  denver: "115590031789994",
  austin: "113314568664060",
  boston: "111983945494775",
  miami: "109714185714003",
  dallas: "108185579205923",
  houston: "102597493120498",
  atlanta: "108331469188498",
  phoenix: "108296539194498",
  sandiego: "108080445873423",
};

const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
];

function randomDelay(min: number, max: number): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function scrapeFacebook(
  query: string,
  location: string,
  maxResults: number = 50
): Promise<ScrapeResult> {
  const start = Date.now();

  const locationId = LOCATION_IDS[location];
  if (!locationId) {
    return {
      success: false,
      error: {
        code: "INVALID_LOCATION",
        message: `Facebook Marketplace: invalid location "${location}". Supported: ${Object.keys(LOCATION_IDS).join(", ")}`,
      },
    };
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    });

    const page = await browser.newPage();
    const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    await page.setUserAgent(ua);
    await page.setViewport({ width: 1280, height: 900 });

    const url = `https://www.facebook.com/marketplace/${locationId}/search/?query=${encodeURIComponent(query)}`;
    await page.goto(url, { waitUntil: "networkidle2", timeout: 15000 });

    await randomDelay(1000, 2000);

    // Wait for listing cards to render
    await page.waitForSelector('[aria-label="Collection of Marketplace items"], div[role="main"]', {
      timeout: 10000,
    }).catch(() => {});

    const listings: Listing[] = await page.evaluate((max: number) => {
      const results: Listing[] = [];
      const seen = new Set<string>();
      const links = document.querySelectorAll('a[href*="/marketplace/item/"]');

      for (let i = 0; i < links.length && results.length < max; i++) {
        const link = links[i] as HTMLAnchorElement;
        const href = link.href || link.getAttribute("href") || "";
        const idMatch = href.match(/\/item\/(\d+)/);
        const id = idMatch ? idMatch[1] : `fb-${i}`;
        if (seen.has(id)) continue;
        seen.add(id);

        const container = link.closest("div");
        if (!container) continue;

        // Facebook spans follow pattern: [price, price, title, title, title, location, location, ...]
        const spans = Array.from(container.querySelectorAll("span"));
        const uniqueTexts: string[] = [];
        const seenTexts = new Set<string>();
        for (let j = 0; j < spans.length; j++) {
          const text = spans[j].textContent?.trim() || "";
          if (text && !seenTexts.has(text)) {
            seenTexts.add(text);
            uniqueTexts.push(text);
          }
        }

        // First unique text is price, second is title, third is location
        const priceText = uniqueTexts[0] || "";
        const title = uniqueTexts[1] || "";
        const loc = uniqueTexts[2] || "";

        if (!title) continue;

        // Parse price — handle $, ₹, and other currency symbols
        const priceNum = priceText ? Number(priceText.replace(/[^0-9.]/g, "")) || null : null;

        const imgEl = container.querySelector("img") as HTMLImageElement | null;
        const image = imgEl?.src?.startsWith("http") ? imgEl.src : null;

        results.push({
          id,
          title,
          price: priceNum,
          location: loc,
          url: href.startsWith("http") ? href : "https://www.facebook.com" + href,
          posted: "",
          platform: "facebook",
          image,
        });
      }

      return results;
    }, maxResults);

    const elapsed = Date.now() - start;

    return {
      success: true,
      results: listings,
      count: listings.length,
      query_time_ms: elapsed,
    };
  } catch (err) {
    const elapsed = Date.now() - start;
    const message = err instanceof Error ? err.message : "Unknown error";

    if (message.includes("timeout") || message.includes("Timeout")) {
      return {
        success: false,
        error: { code: "TIMEOUT", message: `Facebook Marketplace scrape timed out after ${elapsed}ms` },
      };
    }

    return {
      success: false,
      error: { code: "SCRAPE_FAILED", message: `Facebook Marketplace temporarily unavailable` },
    };
  } finally {
    if (browser) await browser.close();
  }
}
