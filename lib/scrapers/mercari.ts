import { Listing, ScrapeResult } from "./types";
import { launchBrowser } from "./browser";

// Mercari is a national marketplace — no location filtering needed
// We accept any location but ignore it (all results are nationwide)

export async function scrapeMercari(
  query: string,
  _location: string,
  maxResults: number = 50
): Promise<ScrapeResult> {
  const start = Date.now();

  let browser;
  try {
    browser = await launchBrowser();

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    );

    const url = `https://www.mercari.com/search/?keyword=${encodeURIComponent(query)}`;
    await page.goto(url, { waitUntil: "networkidle2", timeout: 15000 });

    // Wait for product grid
    await page.waitForSelector('[data-testid="SearchResults"], [data-testid="ItemContainer"], a[href*="/item/"]', {
      timeout: 10000,
    }).catch(() => {});

    const listings: Listing[] = await page.evaluate((max: number) => {
      const results: Listing[] = [];
      const seen = new Set<string>();
      const links = document.querySelectorAll('a[href*="/item/"]');

      for (let i = 0; i < links.length && results.length < max; i++) {
        const link = links[i] as HTMLAnchorElement;
        const href = link.getAttribute("href") || "";

        const idMatch = href.match(/\/item\/([^/]+)/);
        const id = idMatch ? idMatch[1] : `mc-${i}`;
        if (seen.has(id)) continue;
        seen.add(id);

        const container = link.closest("div") || link;

        // Mercari puts the title in the img alt attribute
        const imgEl = container.querySelector("img") as HTMLImageElement | null;
        const title = imgEl?.alt?.trim() || "";

        // Price is in span/p elements
        const spans = Array.from(container.querySelectorAll("span, p"));
        let priceText = "";
        let shippingText = "";

        for (let j = 0; j < spans.length; j++) {
          const text = spans[j].textContent?.trim() || "";
          if (text.startsWith("$") && !priceText) {
            priceText = text;
          } else if (text.toLowerCase().includes("shipping") || text.toLowerCase().includes("free")) {
            shippingText = text;
          }
        }

        if (!title && !priceText) continue;

        const image = imgEl?.src?.startsWith("http") ? imgEl.src : null;

        results.push({
          id,
          title: title || "Untitled listing",
          price: priceText ? Number(priceText.replace(/[$,]/g, "").split(" ")[0]) || null : null,
          location: "Ships nationwide",
          url: href.startsWith("http") ? href : `https://www.mercari.com${href}`,
          posted: "",
          platform: "mercari",
          image,
          shipping: shippingText || null,
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
        error: { code: "TIMEOUT", message: `Mercari scrape timed out after ${elapsed}ms` },
      };
    }

    return {
      success: false,
      error: { code: "SCRAPE_FAILED", message: `Mercari blocked request - rate limited` },
    };
  } finally {
    if (browser) await browser.close();
  }
}
