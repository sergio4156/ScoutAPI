import * as cheerio from "cheerio";
import { Listing, ScrapeResult } from "./types";
import { fetchWithScraperAPI, hasScraperAPI, launchBrowser } from "./browser";

const LOCATION_MAP: Record<string, string> = {
  sfbay: "san-francisco-ca", losangeles: "los-angeles-ca", newyork: "new-york-ny",
  chicago: "chicago-il", seattle: "seattle-wa", portland: "portland-or",
  denver: "denver-co", austin: "austin-tx", boston: "boston-ma", miami: "miami-fl",
  dallas: "dallas-tx", houston: "houston-tx", atlanta: "atlanta-ga",
  phoenix: "phoenix-az", sandiego: "san-diego-ca", minneapolis: "minneapolis-mn",
  detroit: "detroit-mi", philadelphia: "philadelphia-pa", washingtondc: "washington-dc",
  orlando: "orlando-fl",
};

function parseListings(html: string, maxResults: number): Listing[] {
  const $ = cheerio.load(html);
  const results: Listing[] = [];
  const seen = new Set<string>();

  $('a[href*="/item/"]').each((i, el) => {
    if (results.length >= maxResults) return false;
    const href = $(el).attr("href") || "";
    const idMatch = href.match(/\/item\/([^/]+)/);
    const id = idMatch ? idMatch[1] : `ou-${i}`;
    if (seen.has(id)) return;
    seen.add(id);

    const container = $(el).closest("li").length ? $(el).closest("li") : $(el).parent();
    const titleEl = container.find('[class*="MuiTypography-subtitle1"], [class*="MuiTypography-subtitle2"]').first();
    const priceEl = container.find('[class*="MuiTypography-body1"]').first();
    const locEl = container.find('[class*="MuiTypography-body2"]').first();
    const img = container.find("img").first();

    const title = titleEl.text().trim();
    if (!title) return;

    results.push({
      id, title,
      price: priceEl.text().trim() ? Number(priceEl.text().trim().replace(/[$,]/g, "").split(" ")[0]) || null : null,
      location: locEl.text().trim(),
      url: href.startsWith("http") ? href : `https://offerup.com${href}`,
      posted: "", platform: "offerup",
      image: img.attr("src")?.startsWith("http") ? img.attr("src")! : null,
    });
  });

  return results;
}

export async function scrapeOfferUp(
  query: string, location: string, maxResults: number = 50
): Promise<ScrapeResult> {
  const start = Date.now();
  const offerUpLocation = LOCATION_MAP[location];
  if (!offerUpLocation) {
    return { success: false, error: { code: "INVALID_LOCATION", message: `OfferUp: invalid location "${location}". Supported: ${Object.keys(LOCATION_MAP).join(", ")}` } };
  }

  const url = `https://offerup.com/search/?q=${encodeURIComponent(query)}&location=${offerUpLocation}&radius=50`;

  if (hasScraperAPI()) {
    try {
      const html = await fetchWithScraperAPI(url);
      if (!html) return { success: false, error: { code: "SCRAPE_FAILED", message: "OfferUp scraper error - try again later" } };
      const listings = parseListings(html, maxResults);
      return { success: true, results: listings, count: listings.length, query_time_ms: Date.now() - start };
    } catch {
      return { success: false, error: { code: "SCRAPE_FAILED", message: "OfferUp scraper error - try again later" } };
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
    if (message.includes("timeout")) return { success: false, error: { code: "TIMEOUT", message: "OfferUp scrape timed out" } };
    return { success: false, error: { code: "SCRAPE_FAILED", message: "OfferUp scraper error - try again later" } };
  } finally {
    if (browser) await browser.close();
  }
}
