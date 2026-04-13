import { Listing, ScrapeResult } from "./types";
import { FACEBOOK_LOCATION_IDS } from "../constants";

// Map our location codes to city names for RapidAPI
const LOCATION_CITY_NAMES: Record<string, string> = {
  sfbay: "san francisco",
  losangeles: "los angeles",
  newyork: "new york",
  chicago: "chicago",
  seattle: "seattle",
  portland: "portland",
  denver: "denver",
  austin: "austin",
  boston: "boston",
  miami: "miami",
  dallas: "dallas",
  houston: "houston",
  atlanta: "atlanta",
  phoenix: "phoenix",
  sandiego: "san diego",
};

interface RapidAPIListing {
  id?: string;
  marketplace_listing_title?: string;
  listing_price?: {
    formatted_amount?: string;
    amount?: string;
  };
  location?: {
    reverse_geocode?: {
      city?: string;
      state?: string;
    };
  };
  primary_listing_photo?: {
    image?: {
      uri?: string;
    };
  };
  creation_time?: number;
}

/**
 * Scrape Facebook Marketplace via RapidAPI (UnitedAPI).
 * Falls back to returning an error if RapidAPI key is not set.
 */
export async function scrapeFacebook(
  query: string,
  location: string,
  maxResults: number = 50
): Promise<ScrapeResult> {
  const start = Date.now();

  if (!FACEBOOK_LOCATION_IDS[location]) {
    return {
      success: false,
      error: {
        code: "INVALID_LOCATION",
        message: `Facebook Marketplace: invalid location "${location}". Supported: ${Object.keys(FACEBOOK_LOCATION_IDS).join(", ")}`,
      },
    };
  }

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: { code: "SCRAPE_FAILED", message: "Facebook Marketplace not configured (missing API key)" },
    };
  }

  const cityName = LOCATION_CITY_NAMES[location] || location;

  try {
    const url = `https://facebook-marketplace1.p.rapidapi.com/search?query=${encodeURIComponent(query)}&sort=newest&city=${encodeURIComponent(cityName)}&daysSinceListed=1`;

    const response = await fetch(url, {
      headers: {
        "x-rapidapi-host": "facebook-marketplace1.p.rapidapi.com",
        "x-rapidapi-key": apiKey,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      console.error(`RapidAPI Facebook returned ${response.status}`);
      return {
        success: false,
        error: { code: "SCRAPE_FAILED", message: "Facebook Marketplace temporarily unavailable" },
      };
    }

    const data: RapidAPIListing[] = await response.json();

    const listings: Listing[] = data
      .slice(0, maxResults)
      .map((item, i) => {
        const title = item.marketplace_listing_title || "";
        if (!title) return null;

        const priceStr = item.listing_price?.amount || item.listing_price?.formatted_amount || "";
        const price = priceStr ? Number(priceStr.replace(/[^0-9.]/g, "")) || null : null;

        const city = item.location?.reverse_geocode?.city || "";
        const state = item.location?.reverse_geocode?.state || "";
        const loc = city && state ? `${city}, ${state}` : city || state;

        const image = item.primary_listing_photo?.image?.uri || null;

        return {
          id: item.id || `fb-${i}`,
          title,
          price,
          location: loc,
          url: item.id ? `https://www.facebook.com/marketplace/item/${item.id}` : "",
          posted: item.creation_time ? new Date(item.creation_time * 1000).toISOString() : "",
          platform: "facebook",
          image,
        } as Listing;
      })
      .filter((item): item is Listing => item !== null);

    return {
      success: true,
      results: listings,
      count: listings.length,
      query_time_ms: Date.now() - start,
    };
  } catch (err) {
    console.error("Facebook RapidAPI error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("timeout") || message.includes("Timeout")) {
      return { success: false, error: { code: "TIMEOUT", message: "Facebook Marketplace scrape timed out" } };
    }
    return { success: false, error: { code: "SCRAPE_FAILED", message: "Facebook Marketplace temporarily unavailable" } };
  }
}
