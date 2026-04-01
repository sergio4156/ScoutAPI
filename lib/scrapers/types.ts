export type Platform = "craigslist" | "facebook" | "offerup" | "mercari";

export interface ScrapeRequest {
  platform?: Platform;
  platforms?: Platform[];
  query: string;
  location: string;
  max_results?: number;
}

export interface Listing {
  id: string;
  title: string;
  price: number | null;
  location: string;
  url: string;
  posted: string;
  platform: string;
  image: string | null;
  shipping?: string | null;
}

export interface ScrapeResponse {
  success: true;
  results: Listing[];
  count: number;
  query_time_ms: number;
}

export interface ScrapeError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ScrapeResult = ScrapeResponse | ScrapeError;

export interface MultiPlatformResult {
  [platform: string]: ScrapeResult & { cached?: boolean };
}
