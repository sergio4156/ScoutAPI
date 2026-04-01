import { NextRequest } from "next/server";

// --- Mocks must be defined before imports ---

const mockPrisma = {
  apiKey: { findUnique: jest.fn() },
  usage: { upsert: jest.fn(), update: jest.fn() },
  apiRequest: { create: jest.fn() },
};

const mockScrapeCraigslist = jest.fn();
const mockCheckRateLimit = jest.fn();
const mockGetCached = jest.fn();
const mockSetCache = jest.fn();
const mockHashApiKey = jest.fn((key: string) => `hashed_${key}`);

jest.mock("@/lib/db", () => ({ prisma: mockPrisma }));
jest.mock("@/lib/scrapers/craigslist", () => ({ scrapeCraigslist: mockScrapeCraigslist }));
jest.mock("@/lib/rateLimit", () => ({ checkRateLimit: mockCheckRateLimit }));
jest.mock("@/lib/cache", () => ({ getCached: mockGetCached, setCache: mockSetCache }));
jest.mock("@/lib/apiKey", () => ({ hashApiKey: mockHashApiKey }));

import { POST } from "@/app/api/scrape/route";

// --- Fixtures ---

const VALID_KEY = "sk_live_testkey123";

const mockUser = {
  id: "user_1",
  clerkId: "clerk_1",
  email: "test@example.com",
  subscription: {
    id: "sub_1",
    status: "active",
    plan: "starter",
    currentPeriodEnd: new Date("2026-12-31"),
  },
};

const mockApiKeyRecord = {
  id: "apikey_1",
  key: `hashed_${VALID_KEY}`,
  active: true,
  user: mockUser,
};

const mockScrapeResult = {
  success: true as const,
  results: [
    {
      id: "123",
      title: "Test Item",
      price: 100,
      location: "SF",
      url: "https://example.com",
      posted: "1h ago",
      platform: "craigslist",
      image: null,
    },
  ],
  count: 1,
  query_time_ms: 500,
};

function makeRequest(body: object, apiKey?: string): NextRequest {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (apiKey) headers["authorization"] = `Bearer ${apiKey}`;
  return new NextRequest("http://localhost:3000/api/scrape", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

const validBody = { platform: "craigslist", query: "iphone", location: "sfbay", max_results: 5 };

// --- Tests ---

beforeEach(() => {
  jest.clearAllMocks();
  // Default happy-path mocks
  mockPrisma.apiKey.findUnique.mockResolvedValue(mockApiKeyRecord);
  mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 99, resetMs: 60000 });
  mockPrisma.usage.upsert.mockResolvedValue({ requestCount: 0, limit: 10_000 });
  mockPrisma.usage.update.mockResolvedValue({});
  mockPrisma.apiRequest.create.mockResolvedValue({});
  mockGetCached.mockResolvedValue(null);
  mockSetCache.mockResolvedValue(undefined);
  mockScrapeCraigslist.mockResolvedValue(mockScrapeResult);
});

describe("POST /api/scrape", () => {
  describe("Authentication", () => {
    it("returns 401 when no API key is provided", async () => {
      const req = makeRequest(validBody);
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error.code).toBe("UNAUTHORIZED");
      expect(data.error.message).toContain("Missing API key");
    });

    it("returns 401 for invalid API key", async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue(null);
      const req = makeRequest(validBody, "sk_live_invalid");
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error.code).toBe("UNAUTHORIZED");
      expect(data.error.message).toContain("Invalid or inactive");
    });

    it("returns 401 for inactive API key", async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue({ ...mockApiKeyRecord, active: false });
      const req = makeRequest(validBody, VALID_KEY);
      const res = await POST(req);

      expect(res.status).toBe(401);
    });

    it("returns 403 when subscription is not active", async () => {
      const userNoSub = { ...mockUser, subscription: { ...mockUser.subscription, status: "canceled" } };
      mockPrisma.apiKey.findUnique.mockResolvedValue({ ...mockApiKeyRecord, user: userNoSub });
      const req = makeRequest(validBody, VALID_KEY);
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error.code).toBe("FORBIDDEN");
    });

    it("returns 403 when subscription is missing", async () => {
      const userNoSub = { ...mockUser, subscription: null };
      mockPrisma.apiKey.findUnique.mockResolvedValue({ ...mockApiKeyRecord, user: userNoSub });
      const req = makeRequest(validBody, VALID_KEY);
      const res = await POST(req);

      expect(res.status).toBe(403);
    });
  });

  describe("Rate Limiting", () => {
    it("returns 429 with Retry-After when rate limit exceeded", async () => {
      mockCheckRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetMs: 30000 });
      const req = makeRequest(validBody, VALID_KEY);
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(429);
      expect(data.error.code).toBe("RATE_LIMITED");
      expect(res.headers.get("Retry-After")).toBe("30");
      expect(res.headers.get("X-RateLimit-Remaining")).toBe("0");
    });
  });

  describe("Monthly Usage Limits", () => {
    it("returns 429 when monthly limit is reached", async () => {
      mockPrisma.usage.upsert.mockResolvedValue({ requestCount: 10_000, limit: 10_000 });
      const req = makeRequest(validBody, VALID_KEY);
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(429);
      expect(data.error.code).toBe("MONTHLY_LIMIT_EXCEEDED");
    });

    it("allows request when under limit", async () => {
      mockPrisma.usage.upsert.mockResolvedValue({ requestCount: 9_999, limit: 10_000 });
      const req = makeRequest(validBody, VALID_KEY);
      const res = await POST(req);

      expect(res.status).toBe(200);
    });

    it("increments usage count on successful request", async () => {
      const req = makeRequest(validBody, VALID_KEY);
      await POST(req);

      expect(mockPrisma.usage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { requestCount: { increment: 1 } },
        })
      );
    });
  });

  describe("Caching", () => {
    it("returns cached results with cached: true on cache hit", async () => {
      mockGetCached.mockResolvedValue(mockScrapeResult);
      const req = makeRequest(validBody, VALID_KEY);
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.cached).toBe(true);
      expect(data.query_time_ms).toBe(0);
      expect(res.headers.get("X-Cache")).toBe("HIT");
      // Puppeteer should NOT be called
      expect(mockScrapeCraigslist).not.toHaveBeenCalled();
    });

    it("runs scraper on cache miss and stores result", async () => {
      mockGetCached.mockResolvedValue(null);
      const req = makeRequest(validBody, VALID_KEY);
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.cached).toBe(false);
      expect(res.headers.get("X-Cache")).toBe("MISS");
      expect(mockScrapeCraigslist).toHaveBeenCalled();
      expect(mockSetCache).toHaveBeenCalledWith("craigslist", "sfbay", "iphone", mockScrapeResult);
    });

    it("increments usage even on cache hit", async () => {
      mockGetCached.mockResolvedValue(mockScrapeResult);
      const req = makeRequest(validBody, VALID_KEY);
      await POST(req);

      expect(mockPrisma.usage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { requestCount: { increment: 1 } },
        })
      );
    });
  });

  describe("Request Logging", () => {
    it("logs API request on successful scrape", async () => {
      const req = makeRequest(validBody, VALID_KEY);
      await POST(req);

      expect(mockPrisma.apiRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user_1",
          apiKeyId: "apikey_1",
          endpoint: "/api/scrape",
          statusCode: 200,
        }),
      });
    });
  });

  describe("Input Validation", () => {
    it("returns 400 for missing required fields", async () => {
      const req = makeRequest({ platform: "craigslist" }, VALID_KEY);
      const res = await POST(req);

      expect(res.status).toBe(400);
    });

    it("returns 400 for unsupported platform", async () => {
      const req = makeRequest({ ...validBody, platform: "facebook" }, VALID_KEY);
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error.code).toBe("UNSUPPORTED_PLATFORM");
    });

    it("returns 400 for invalid max_results", async () => {
      const req = makeRequest({ ...validBody, max_results: 200 }, VALID_KEY);
      const res = await POST(req);

      expect(res.status).toBe(400);
    });
  });
});
