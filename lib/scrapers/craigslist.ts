import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Listing, ScrapeResult } from "./types";

puppeteer.use(StealthPlugin());

// Supported Craigslist location codes
const VALID_LOCATIONS = [
  "sfbay", "losangeles", "newyork", "chicago", "seattle",
  "portland", "denver", "austin", "boston", "miami",
  "dallas", "houston", "atlanta", "phoenix", "sandiego",
  "minneapolis", "detroit", "philadelphia", "washingtondc", "orlando",
];

/**
 * Build the Craigslist search URL from query parameters.
 * Format: https://{location}.craigslist.org/search/sss?query={query}
 */
function buildSearchUrl(query: string, location: string): string {
  const encodedQuery = encodeURIComponent(query);
  return `https://${location}.craigslist.org/search/sss?query=${encodedQuery}`;
}

/**
 * Scrape Craigslist search results for the given query and location.
 * Uses Puppeteer with stealth plugin to avoid bot detection.
 */
export async function scrapeCraigslist(
  query: string,
  location: string,
  maxResults: number = 50
): Promise<ScrapeResult> {
  const start = Date.now();

  // Validate location
  if (!VALID_LOCATIONS.includes(location)) {
    return {
      success: false,
      error: {
        code: "INVALID_LOCATION",
        message: `Invalid location "${location}". Supported: ${VALID_LOCATIONS.join(", ")}`,
      },
    };
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    // Set a realistic user agent
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    const url = buildSearchUrl(query, location);
    // Use networkidle2 so JS-rendered results (with images & dates) load
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    // Wait for JS-rendered search results which include dates and images
    await page.waitForSelector(".cl-search-result", { timeout: 15000 }).catch(() => {
      // May not exist if no results found
    });

    // Extract listing data from JS-rendered search results
    // Structure: div.cl-search-result[data-pid]
    //   .posting-title .label  — title
    //   .priceinfo              — price
    //   .result-posted-date     — relative time (e.g. "6h ago")
    //   .result-location        — neighborhood
    //   img[data-image-index]   — thumbnail image
    const listings: Listing[] = await page.evaluate((max: number) => {
      const results: Listing[] = [];
      const items = document.querySelectorAll(".cl-search-result");

      for (let i = 0; i < Math.min(items.length, max); i++) {
        const item = items[i];

        const titleEl = item.querySelector(".posting-title .label");
        const title = titleEl?.textContent?.trim() || "";
        if (!title) continue;

        const priceEl = item.querySelector(".priceinfo");
        const priceText = priceEl?.textContent?.trim() || null;

        const locEl = item.querySelector(".result-location");
        const loc = locEl?.textContent?.trim() || "";

        const linkEl = item.querySelector("a.posting-title") as HTMLAnchorElement | null;
        const href = linkEl?.href || "";

        // Posting ID from data attribute or URL
        const postId = item.getAttribute("data-pid") ||
          href.match(/\/(\d+)\.html/)?.[1] ||
          ("unknown-" + i);

        // Posted date from .result-posted-date (e.g. "6h ago", "3/29")
        const dateEl = item.querySelector(".result-posted-date");
        const posted = dateEl?.textContent?.trim() || "";

        // First thumbnail image — filter out 1x1 placeholder data URIs
        const imgEl = item.querySelector("img[data-image-index]") as HTMLImageElement | null;
        const rawSrc = imgEl?.src || null;
        const image = rawSrc && rawSrc.startsWith("http") ? rawSrc : null;

        results.push({
          id: postId,
          title,
          price: priceText ? Number(priceText.replace(/[$,]/g, "")) || null : null,
          location: loc,
          url: href,
          posted,
          platform: "craigslist",
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

    // Distinguish timeout errors from other failures
    if (message.includes("timeout") || message.includes("Timeout")) {
      return {
        success: false,
        error: {
          code: "TIMEOUT",
          message: `Scrape timed out after ${elapsed}ms`,
        },
      };
    }

    return {
      success: false,
      error: {
        code: "SCRAPE_FAILED",
        message: `Could not retrieve listings from Craigslist: ${message}`,
      },
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
