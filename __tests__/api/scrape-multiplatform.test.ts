import { NextRequest } from "next/server";

// --- Mocks ---

const mockPrisma = {
  apiKey: { findUnique: jest.fn() },
  usage: { upsert: jest.fn(), update: jest.fn() },
  apiRequest: { create: jest.fn() },
};

const mockScrape = jest.fn();
const mockCheckRateLimit = jest.fn();
const mockGetCached = jest.fn();
const mockSetCache = jest.fn();
const mockHashApiKey = jest.fn((key: string) => `hashed_${key}`);
const mockReportHealth = jest.fn();

jest.mock("@/lib/db", () => ({ prisma: mockPrisma }));
jest.mock("@/lib/scrapers/index", () => ({
  scrape: mockScrape,
  SUPPORTED_PLATFORMS: ["craigslist", "facebook", "offerup", "mercari"],
  reportHealth: mockReportHealth,
}));
jest.mock("@/lib/rateLimit", () => ({ checkRateLimit: mockCheckRateLimit }));
jest.mock("@/lib/cache", () => ({ getCached: mockGetCached, setCache: mockSetCache }));
jest.mock("@/lib/apiKey", () => ({ hashApiKey: mockHashApiKey }));

import { POST } from "@/app/api/scrape/route";

const VALID_KEY = "sk_live_testkey123";

const mockUser = {
  id: "user_1",
  subscription: { status: "active", plan: "agent", currentPeriodEnd: new Date("2026-12-31") },
};

const mockApiKeyRecord = {
  id: "apikey_1",
  key: `hashed_${VALID_KEY}`,
  active: true,
  user: mockUser,
};

const mockResult = {
  success: true as const,
  results: [{ id: "1", title: "Test", price: 100, location: "SF", url: "https://x.com", posted: "", platform: "craigslist", image: null }],
  count: 1,
  query_time_ms: 500,
};

function makeRequest(body: object): NextRequest {
  return new NextRequest("http://localhost:3000/api/scrape", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${VALID_KEY}` },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.apiKey.findUnique.mockResolvedValue(mockApiKeyRecord);
  mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 99, resetMs: 60000 });
  mockPrisma.usage.upsert.mockResolvedValue({ requestCount: 0, limit: 100_000 });
  mockPrisma.usage.update.mockResolvedValue({});
  mockPrisma.apiRequest.create.mockResolvedValue({});
  mockGetCached.mockResolvedValue(null);
  mockSetCache.mockResolvedValue(undefined);
  mockScrape.mockResolvedValue(mockResult);
});

describe("Multi-platform scraping", () => {
  it("supports facebook platform", async () => {
    const req = makeRequest({ platform: "facebook", query: "laptop", location: "sfbay" });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockScrape).toHaveBeenCalledWith("facebook", "laptop", "sfbay", 50);
  });

  it("supports offerup platform", async () => {
    const req = makeRequest({ platform: "offerup", query: "laptop", location: "sfbay" });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockScrape).toHaveBeenCalledWith("offerup", "laptop", "sfbay", 50);
  });

  it("supports mercari platform", async () => {
    const req = makeRequest({ platform: "mercari", query: "laptop", location: "sfbay" });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockScrape).toHaveBeenCalledWith("mercari", "laptop", "sfbay", 50);
  });

  it("rejects unsupported platform", async () => {
    const req = makeRequest({ platform: "ebay", query: "laptop", location: "sfbay" });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error.code).toBe("UNSUPPORTED_PLATFORM");
  });

  it("handles platforms array for multi-platform request", async () => {
    const req = makeRequest({ platforms: ["craigslist", "facebook"], query: "laptop", location: "sfbay" });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.results.craigslist).toBeDefined();
    expect(data.results.facebook).toBeDefined();
  });

  it("rejects invalid platforms in platforms array", async () => {
    const req = makeRequest({ platforms: ["craigslist", "ebay"], query: "laptop", location: "sfbay" });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error.code).toBe("UNSUPPORTED_PLATFORM");
    expect(data.error.message).toContain("ebay");
  });

  it("continues if one platform fails in multi-platform request", async () => {
    mockScrape.mockImplementation(async (platform: string) => {
      if (platform === "facebook") {
        return { success: false, error: { code: "SCRAPE_FAILED", message: "Facebook unavailable" } };
      }
      return mockResult;
    });

    const req = makeRequest({ platforms: ["craigslist", "facebook"], query: "laptop", location: "sfbay" });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.results.craigslist.success).toBe(true);
    expect(data.results.facebook.success).toBe(false);
  });

  it("counts multi-platform as N calls for usage", async () => {
    const req = makeRequest({ platforms: ["craigslist", "facebook", "offerup"], query: "laptop", location: "sfbay" });
    await POST(req);

    expect(mockPrisma.usage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { requestCount: { increment: 3 } },
      })
    );
  });

  it("returns 429 if multi-platform would exceed usage limit", async () => {
    mockPrisma.usage.upsert.mockResolvedValue({ requestCount: 99_999, limit: 100_000 });
    const req = makeRequest({ platforms: ["craigslist", "facebook"], query: "laptop", location: "sfbay" });
    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it("reports health for each platform", async () => {
    const req = makeRequest({ platforms: ["craigslist", "facebook"], query: "laptop", location: "sfbay" });
    await POST(req);

    expect(mockReportHealth).toHaveBeenCalledWith("craigslist", true, undefined);
    expect(mockReportHealth).toHaveBeenCalledWith("facebook", true, undefined);
  });

  it("returns error when neither platform nor platforms is provided", async () => {
    const req = makeRequest({ query: "laptop", location: "sfbay" });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error.code).toBe("INVALID_REQUEST");
  });
});
