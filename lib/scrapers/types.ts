export interface ScrapeRequest {
  platform: "craigslist";
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
