import * as cheerio from "cheerio";
import { Listing, ScrapeResult } from "./types";
import { fetchWithScraperAPI, hasScraperAPI, launchBrowser } from "./browser";
import { FACEBOOK_LOCATION_IDS } from "../constants";

function parseListings(html: string, maxResults: number): Listing[] {
  const $ = cheerio.load(html);
  const results: Listing[] = [];
  const seen = new Set<string>();

  $('a[href*="/marketplace/item/"]').each((i, el) => {
    if (results.length >= maxResults) return false;
    const href = $(el).attr("href") || "";
    const idMatch = href.match(/\/item\/(\d+)/);
    const id = idMatch ? idMatch[1] : `fb-${i}`;
    if (seen.has(id)) return;
    seen.add(id);

    const container = $(el).closest("div");
    const img = container.find("img").first();
    const imgAlt = img.attr("alt") || "";
    const spans = container.find("span");

    const uniqueTexts: string[] = [];
    const seenTexts = new Set<string>();
    spans.each((_, span) => {
      const text = $(span).text().trim();
      if (text && !seenTexts.has(text)) { seenTexts.add(text); uniqueTexts.push(text); }
    });

    const priceText = uniqueTexts[0] || "";
    const title = uniqueTexts[1] || imgAlt.split(" in ")[0] || "";
    const loc = uniqueTexts[2] || "";
    if (!title) return;

    results.push({
      id, title,
      price: priceText ? Number(priceText.replace(/[^0-9.]/g, "")) || null : null,
      location: loc,
      url: href.startsWith("http") ? href : "https://www.facebook.com" + href,
      posted: "", platform: "facebook",
      image: img.attr("src")?.startsWith("http") ? img.attr("src")! : null,
    });
  });

  return results;
}

export async function scrapeFacebook(
  query: string, location: string, maxResults: number = 50
): Promise<ScrapeResult> {
  const start = Date.now();
  const locationId = FACEBOOK_LOCATION_IDS[location];
  if (!locationId) {
    return { success: false, error: { code: "INVALID_LOCATION", message: `Facebook Marketplace: invalid location "${location}". Supported: ${Object.keys(FACEBOOK_LOCATION_IDS).join(", ")}` } };
  }

  const url = `https://www.facebook.com/marketplace/${locationId}/search/?query=${encodeURIComponent(query)}`;

  if (hasScraperAPI()) {
    try {
      const html = await fetchWithScraperAPI(url);
      if (!html) return { success: false, error: { code: "SCRAPE_FAILED", message: "Facebook Marketplace temporarily unavailable" } };
      const listings = parseListings(html, maxResults);
      return { success: true, results: listings, count: listings.length, query_time_ms: Date.now() - start };
    } catch {
      return { success: false, error: { code: "SCRAPE_FAILED", message: "Facebook Marketplace temporarily unavailable" } };
    }
  }

  let browser;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36");
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(url, { waitUntil: "networkidle2", timeout: 15000 });
    const html = await page.content();
    const listings = parseListings(html, maxResults);
    return { success: true, results: listings, count: listings.length, query_time_ms: Date.now() - start };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("timeout")) return { success: false, error: { code: "TIMEOUT", message: "Facebook Marketplace scrape timed out" } };
    return { success: false, error: { code: "SCRAPE_FAILED", message: "Facebook Marketplace temporarily unavailable" } };
  } finally {
    if (browser) await browser.close();
  }
}
