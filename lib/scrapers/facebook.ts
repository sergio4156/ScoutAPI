import * as cheerio from "cheerio";
import { Listing, ScrapeResult } from "./types";
import { fetchWithScraperAPI, hasScraperAPI, launchBrowser } from "./browser";

const LOCATION_IDS: Record<string, string> = {
  sfbay: "106377336067638", losangeles: "108424279189115", newyork: "110184922344060",
  chicago: "108659242498155", seattle: "110843418940484", portland: "108396529193498",
  denver: "115590031789994", austin: "113314568664060", boston: "111983945494775",
  miami: "109714185714003", dallas: "108185579205923", houston: "102597493120498",
  atlanta: "108331469188498", phoenix: "108296539194498", sandiego: "108080445873423",
};

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
  const locationId = LOCATION_IDS[location];
  if (!locationId) {
    return { success: false, error: { code: "INVALID_LOCATION", message: `Facebook Marketplace: invalid location "${location}". Supported: ${Object.keys(LOCATION_IDS).join(", ")}` } };
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
