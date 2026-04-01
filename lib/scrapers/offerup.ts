import { Listing, ScrapeResult } from "./types";
import { launchBrowser } from "./browser";

// OfferUp uses city/state format in URLs
const LOCATION_MAP: Record<string, string> = {
  sfbay: "san-francisco-ca",
  losangeles: "los-angeles-ca",
  newyork: "new-york-ny",
  chicago: "chicago-il",
  seattle: "seattle-wa",
  portland: "portland-or",
  denver: "denver-co",
  austin: "austin-tx",
  boston: "boston-ma",
  miami: "miami-fl",
  dallas: "dallas-tx",
  houston: "houston-tx",
  atlanta: "atlanta-ga",
  phoenix: "phoenix-az",
  sandiego: "san-diego-ca",
  minneapolis: "minneapolis-mn",
  detroit: "detroit-mi",
  philadelphia: "philadelphia-pa",
  washingtondc: "washington-dc",
  orlando: "orlando-fl",
};

export async function scrapeOfferUp(
  query: string,
  location: string,
  maxResults: number = 50
): Promise<ScrapeResult> {
  const start = Date.now();

  const offerUpLocation = LOCATION_MAP[location];
  if (!offerUpLocation) {
    return {
      success: false,
      error: {
        code: "INVALID_LOCATION",
        message: `OfferUp: invalid location "${location}". Supported: ${Object.keys(LOCATION_MAP).join(", ")}`,
      },
    };
  }

  let browser;
  try {
    browser = await launchBrowser();

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    );

    const url = `https://offerup.com/search/?q=${encodeURIComponent(query)}&location=${offerUpLocation}&radius=50`;
    await page.goto(url, { waitUntil: "networkidle2", timeout: 15000 });

    // Wait for listing cards
    await page.waitForSelector('[data-testid="listing-card"], a[href*="/item/"]', {
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
        const id = idMatch ? idMatch[1] : `ou-${i}`;
        if (seen.has(id)) continue;
        seen.add(id);

        // Walk up to find the card container (li or direct parent with listing content)
        let container: Element = link;
        const li = link.closest("li");
        if (li) container = li;

        // Use MUI typography classes to find structured data
        const titleEl = container.querySelector('[class*="MuiTypography-subtitle1"], [class*="MuiTypography-subtitle2"]');
        const priceEl = container.querySelector('[class*="MuiTypography-body1"][class*="jss"]');
        const locEl = container.querySelector('[class*="MuiTypography-body2"]');
        const imgEl = container.querySelector("img") as HTMLImageElement | null;

        const title = titleEl?.textContent?.trim() || "";
        const priceText = priceEl?.textContent?.trim() || "";
        const loc = locEl?.textContent?.trim() || "";

        if (!title) continue;

        const image = imgEl?.src?.startsWith("http") ? imgEl.src : null;

        results.push({
          id,
          title,
          price: priceText ? Number(priceText.replace(/[$,]/g, "").split(" ")[0]) || null : null,
          location: loc,
          url: href.startsWith("http") ? href : `https://offerup.com${href}`,
          posted: "",
          platform: "offerup",
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
        error: { code: "TIMEOUT", message: `OfferUp scrape timed out after ${elapsed}ms` },
      };
    }

    return {
      success: false,
      error: { code: "SCRAPE_FAILED", message: `OfferUp scraper error - try again later` },
    };
  } finally {
    if (browser) await browser.close();
  }
}
