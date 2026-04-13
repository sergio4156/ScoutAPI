import * as cheerio from "cheerio";
import { Listing, ScrapeResult } from "./types";
import { fetchWithScraperAPI, hasScraperAPI, launchBrowser } from "./browser";
import { CRAIGSLIST_LOCATIONS } from "../constants";

function buildSearchUrl(query: string, location: string): string {
  return `https://${location}.craigslist.org/search/sss?query=${encodeURIComponent(query)}`;
}

function parseListings(html: string, maxResults: number): Listing[] {
  const $ = cheerio.load(html);
  const results: Listing[] = [];

  // Try JS-rendered results first, then static fallback
  const jsResults = $(".cl-search-result");
  const staticResults = $(".cl-static-search-result");

  if (jsResults.length > 0) {
    jsResults.each((i, el) => {
      if (results.length >= maxResults) return false;
      const $el = $(el);
      const title = $el.find(".posting-title .label").text().trim();
      if (!title) return;
      const priceText = $el.find(".priceinfo").text().trim();
      const loc = $el.find(".result-location").text().trim();
      const href = $el.find("a.posting-title").attr("href") || "";
      const postId = $el.attr("data-pid") || href.match(/\/(\d+)\.html/)?.[1] || `cl-${i}`;
      const posted = $el.find(".result-posted-date").text().trim();
      const imgSrc = $el.find("img[data-image-index]").attr("src") || null;

      results.push({
        id: postId, title,
        price: priceText ? Number(priceText.replace(/[$,]/g, "")) || null : null,
        location: loc, url: href, posted, platform: "craigslist",
        image: imgSrc?.startsWith("http") ? imgSrc : null,
      });
    });
  } else {
    staticResults.each((i, el) => {
      if (results.length >= maxResults) return false;
      const $el = $(el);
      const title = $el.find(".title").text().trim();
      if (!title) return;
      const priceText = $el.find(".price").text().trim();
      const loc = $el.find(".location").text().trim();
      const href = $el.find("a").attr("href") || "";
      const idMatch = href.match(/\/(\d+)\.html/);

      results.push({
        id: idMatch ? idMatch[1] : `cl-${i}`, title,
        price: priceText ? Number(priceText.replace(/[$,]/g, "")) || null : null,
        location: loc, url: href, posted: "", platform: "craigslist", image: null,
      });
    });
  }

  return results;
}

export async function scrapeCraigslist(
  query: string,
  location: string,
  maxResults: number = 50
): Promise<ScrapeResult> {
  const start = Date.now();

  if (!(CRAIGSLIST_LOCATIONS as readonly string[]).includes(location)) {
    return {
      success: false,
      error: {
        code: "INVALID_LOCATION",
        message: `Invalid location "${location}". Supported: ${CRAIGSLIST_LOCATIONS.join(", ")}`,
      },
    };
  }

  const url = buildSearchUrl(query, location);

  // Use ScraperAPI in production, Puppeteer locally
  if (hasScraperAPI()) {
    try {
      const html = await fetchWithScraperAPI(url);
      if (!html) {
        return { success: false, error: { code: "SCRAPE_FAILED", message: "Could not retrieve listings from Craigslist" } };
      }
      const listings = parseListings(html, maxResults);
      return { success: true, results: listings, count: listings.length, query_time_ms: Date.now() - start };
    } catch {
      return { success: false, error: { code: "SCRAPE_FAILED", message: "Craigslist scrape failed" } };
    }
  }

  // Local dev: use Puppeteer
  let browser;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    await page.waitForSelector(".cl-search-result", { timeout: 15000 }).catch(() => {});

    const listings: Listing[] = await page.evaluate((max: number) => {
      const results: Listing[] = [];
      const items = document.querySelectorAll(".cl-search-result");
      for (let i = 0; i < Math.min(items.length, max); i++) {
        const item = items[i];
        const titleEl = item.querySelector(".posting-title .label");
        const title = titleEl?.textContent?.trim() || "";
        if (!title) continue;
        const priceEl = item.querySelector(".priceinfo");
        const locEl = item.querySelector(".result-location");
        const linkEl = item.querySelector("a.posting-title") as HTMLAnchorElement | null;
        const href = linkEl?.href || "";
        const postId = item.getAttribute("data-pid") || href.match(/\/(\d+)\.html/)?.[1] || ("unknown-" + i);
        const dateEl = item.querySelector(".result-posted-date");
        const imgEl = item.querySelector("img[data-image-index]") as HTMLImageElement | null;
        const rawSrc = imgEl?.src || null;
        results.push({
          id: postId, title,
          price: priceEl?.textContent?.trim() ? Number(priceEl.textContent.trim().replace(/[$,]/g, "")) || null : null,
          location: locEl?.textContent?.trim() || "",
          url: href, posted: dateEl?.textContent?.trim() || "", platform: "craigslist",
          image: rawSrc && rawSrc.startsWith("http") ? rawSrc : null,
        });
      }
      return results;
    }, maxResults);

    return { success: true, results: listings, count: listings.length, query_time_ms: Date.now() - start };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("timeout") || message.includes("Timeout")) {
      return { success: false, error: { code: "TIMEOUT", message: `Craigslist scrape timed out` } };
    }
    return { success: false, error: { code: "SCRAPE_FAILED", message: `Could not retrieve listings from Craigslist` } };
  } finally {
    if (browser) await browser.close();
  }
}
