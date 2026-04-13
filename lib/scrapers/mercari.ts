import * as cheerio from "cheerio";
import { Listing, ScrapeResult } from "./types";
import { fetchWithScraperAPI, hasScraperAPI, launchBrowser } from "./browser";

function parseListings(html: string, maxResults: number): Listing[] {
  const $ = cheerio.load(html);
  const results: Listing[] = [];
  const seen = new Set<string>();

  $('a[href*="/item/"]').each((i, el) => {
    if (results.length >= maxResults) return false;
    const href = $(el).attr("href") || "";
    const idMatch = href.match(/\/item\/([^/]+)/);
    const id = idMatch ? idMatch[1] : `mc-${i}`;
    if (seen.has(id)) return;
    seen.add(id);

    const container = $(el).closest("div");
    const img = container.find("img").first();
    const title = img.attr("alt")?.trim() || "";

    const spans = container.find("span, p");
    let priceText = "";
    let shippingText = "";
    spans.each((_, span) => {
      const text = $(span).text().trim();
      if (text.startsWith("$") && !priceText) priceText = text;
      else if (text.toLowerCase().includes("shipping") || text.toLowerCase().includes("free")) shippingText = text;
    });

    if (!title && !priceText) return;

    results.push({
      id, title: title || "Untitled listing",
      price: priceText ? Number(priceText.replace(/[$,]/g, "").split(" ")[0]) || null : null,
      location: "Ships nationwide",
      url: href.startsWith("http") ? href : `https://www.mercari.com${href}`,
      posted: "", platform: "mercari",
      image: img.attr("src")?.startsWith("http") ? img.attr("src")! : null,
      shipping: shippingText || null,
    });
  });

  return results;
}

export async function scrapeMercari(
  query: string, _location: string, maxResults: number = 50
): Promise<ScrapeResult> {
  const start = Date.now();
  const url = `https://www.mercari.com/search/?keyword=${encodeURIComponent(query)}`;

  if (hasScraperAPI()) {
    try {
      const html = await fetchWithScraperAPI(url);
      if (!html) return { success: false, error: { code: "SCRAPE_FAILED", message: "Mercari scraper error" } };
      const listings = parseListings(html, maxResults);
      return { success: true, results: listings, count: listings.length, query_time_ms: Date.now() - start };
    } catch {
      return { success: false, error: { code: "SCRAPE_FAILED", message: "Mercari scraper error" } };
    }
  }

  let browser;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36");
    await page.goto(url, { waitUntil: "networkidle2", timeout: 15000 });
    const html = await page.content();
    const listings = parseListings(html, maxResults);
    return { success: true, results: listings, count: listings.length, query_time_ms: Date.now() - start };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("timeout")) return { success: false, error: { code: "TIMEOUT", message: "Mercari scrape timed out" } };
    return { success: false, error: { code: "SCRAPE_FAILED", message: "Mercari scraper error" } };
  } finally {
    if (browser) await browser.close();
  }
}
