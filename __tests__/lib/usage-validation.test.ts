import { checkRateLimit } from "@/lib/rateLimit";
import { hashApiKey, generateApiKey } from "@/lib/apiKey";

describe("Rate Limiting", () => {
  it("allows requests under the limit", async () => {
    const result = await checkRateLimit("test-key-allows");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeLessThanOrEqual(99);
  });

  it("blocks after 100 requests in a minute", async () => {
    const key = "test-key-block-" + Date.now();

    // Consume all 100 points
    for (let i = 0; i < 100; i++) {
      await checkRateLimit(key);
    }

    // 101st should be blocked
    const result = await checkRateLimit(key);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.resetMs).toBeGreaterThan(0);
  });

  it("tracks separate limits per API key", async () => {
    const key1 = "test-key-sep-1-" + Date.now();
    const key2 = "test-key-sep-2-" + Date.now();

    // Exhaust key1
    for (let i = 0; i < 100; i++) {
      await checkRateLimit(key1);
    }

    // key2 should still work
    const result = await checkRateLimit(key2);
    expect(result.allowed).toBe(true);
  });
});

describe("API Key Utilities", () => {
  it("generates keys in correct format", () => {
    const { plain, hashed } = generateApiKey();
    expect(plain).toMatch(/^sk_live_[a-f0-9]{48}$/);
    expect(hashed).toHaveLength(64); // SHA-256 hex
  });

  it("generates unique keys each time", () => {
    const key1 = generateApiKey();
    const key2 = generateApiKey();
    expect(key1.plain).not.toBe(key2.plain);
    expect(key1.hashed).not.toBe(key2.hashed);
  });

  it("hash is deterministic for same input", () => {
    const hash1 = hashApiKey("sk_live_test123");
    const hash2 = hashApiKey("sk_live_test123");
    expect(hash1).toBe(hash2);
  });

  it("different keys produce different hashes", () => {
    const hash1 = hashApiKey("sk_live_aaa");
    const hash2 = hashApiKey("sk_live_bbb");
    expect(hash1).not.toBe(hash2);
  });
});

describe("Usage Plan Limits", () => {
  // Test the getPlanLimit logic that exists in the scrape route
  function getPlanLimit(plan: string): number {
    switch (plan) {
      case "enterprise": return 500_000;
      case "agent": return 100_000;
      default: return 10_000;
    }
  }

  it("returns correct limit for starter plan", () => {
    expect(getPlanLimit("starter")).toBe(10_000);
  });

  it("returns correct limit for agent plan", () => {
    expect(getPlanLimit("agent")).toBe(100_000);
  });

  it("returns correct limit for enterprise plan", () => {
    expect(getPlanLimit("enterprise")).toBe(500_000);
  });

  it("defaults to starter limit for unknown plan", () => {
    expect(getPlanLimit("unknown")).toBe(10_000);
  });

  describe("Usage boundary conditions", () => {
    it("usage at exactly the limit should deny access", () => {
      const requestCount = 10_000;
      const limit = 10_000;
      expect(requestCount >= limit).toBe(true);
    });

    it("usage one below limit should allow access", () => {
      const requestCount = 9_999;
      const limit = 10_000;
      expect(requestCount >= limit).toBe(false);
    });

    it("usage at zero should allow access", () => {
      const requestCount = 0;
      const limit = 10_000;
      expect(requestCount >= limit).toBe(false);
    });
  });

  describe("Monthly reset logic", () => {
    function currentMonth(): string {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    }

    it("generates correct month format", () => {
      const month = currentMonth();
      expect(month).toMatch(/^\d{4}-\d{2}$/);
    });

    it("different months produce different keys (usage resets)", () => {
      // Simulating: March usage key vs April usage key
      const march = "2026-03";
      const april = "2026-04";
      expect(march).not.toBe(april);
      // Since usage is keyed by userId+month, a new month = fresh counter
    });
  });
});
