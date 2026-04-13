// --- Platform Configuration ---

export const PLATFORMS = {
  CRAIGSLIST: "craigslist" as const,
  FACEBOOK: "facebook" as const,
  OFFERUP: "offerup" as const,
  MERCARI: "mercari" as const,
};

export const SUPPORTED_PLATFORM_LIST = [
  PLATFORMS.CRAIGSLIST,
  PLATFORMS.FACEBOOK,
  PLATFORMS.OFFERUP,
  PLATFORMS.MERCARI,
] as const;

// --- Craigslist Locations ---

export const CRAIGSLIST_LOCATIONS = [
  "sfbay", "losangeles", "newyork", "chicago", "seattle",
  "portland", "denver", "austin", "boston", "miami",
  "dallas", "houston", "atlanta", "phoenix", "sandiego",
  "minneapolis", "detroit", "philadelphia", "washingtondc", "orlando",
] as const;

// --- Facebook Location IDs ---

export const FACEBOOK_LOCATION_IDS: Record<string, string> = {
  sfbay: "106377336067638",
  losangeles: "108424279189115",
  newyork: "110184922344060",
  chicago: "108659242498155",
  seattle: "110843418940484",
  portland: "108396529193498",
  denver: "115590031789994",
  austin: "113314568664060",
  boston: "111983945494775",
  miami: "109714185714003",
  dallas: "108185579205923",
  houston: "102597493120498",
  atlanta: "108331469188498",
  phoenix: "108296539194498",
  sandiego: "108080445873423",
};

// --- OfferUp Location Map ---

export const OFFERUP_LOCATIONS: Record<string, string> = {
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

// --- Rate Limiting ---

export const RATE_LIMIT = {
  MAX_REQUESTS_PER_MINUTE: 100,
  WINDOW_SECONDS: 60,
};

// --- Caching ---

export const CACHE = {
  TTL_SECONDS: 15 * 60, // 15 minutes
  KEY_PREFIX: "scrape",
};

// --- Scraper Timeouts ---

export const SCRAPER = {
  PLATFORM_TIMEOUT_MS: 30_000,
  SCRAPER_API_TIMEOUT_MS: 45_000,
};

// --- Subscription Plans ---

export const PLANS: Record<string, { name: string; limit: number }> = {
  starter: { name: "starter", limit: 10_000 },
  agent: { name: "agent", limit: 100_000 },
  enterprise: { name: "enterprise", limit: 500_000 },
};

export function getPlanLimit(plan: string): number {
  return PLANS[plan]?.limit ?? PLANS.starter.limit;
}

// --- Error Codes ---

export const ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INVALID_REQUEST: "INVALID_REQUEST",
  UNSUPPORTED_PLATFORM: "UNSUPPORTED_PLATFORM",
  INVALID_LOCATION: "INVALID_LOCATION",
  RATE_LIMITED: "RATE_LIMITED",
  MONTHLY_LIMIT_EXCEEDED: "MONTHLY_LIMIT_EXCEEDED",
  TIMEOUT: "TIMEOUT",
  SCRAPE_FAILED: "SCRAPE_FAILED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
};

// --- Error Messages ---

export const ERROR_MESSAGES = {
  MISSING_API_KEY: "Missing API key. Pass it as: Authorization: Bearer sk_live_...",
  INVALID_API_KEY: "Invalid or inactive API key",
  NO_SUBSCRIPTION: "No active subscription. Subscribe at scoutapi.io to get access.",
  RATE_LIMIT_EXCEEDED: "Rate limit exceeded. Max 100 requests/minute.",
  MISSING_FIELDS: "Missing required fields: query, location",
  MISSING_PLATFORM: "Missing required field: platform (or platforms array)",
  INVALID_MAX_RESULTS: "max_results must be between 1 and 100",
  INTERNAL_ERROR: "An unexpected error occurred",
};
