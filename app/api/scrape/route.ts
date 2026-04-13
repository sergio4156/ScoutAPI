import { NextRequest, NextResponse } from "next/server";
import { ScrapeRequest, ScrapeResult, Platform } from "@/lib/scrapers/types";
import { scrape, SUPPORTED_PLATFORMS, reportHealth } from "@/lib/scrapers/index";
import { prisma } from "@/lib/db";
import { hashApiKey } from "@/lib/apiKey";
import { checkRateLimit } from "@/lib/rateLimit";
import { getCached, setCache } from "@/lib/cache";

function errorJson(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  );
}

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getPlanLimit(plan: string): number {
  switch (plan) {
    case "enterprise": return 500_000;
    case "agent": return 100_000;
    default: return 10_000;
  }
}

export async function POST(request: NextRequest) {
  try {
    // --- Auth ---
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errorJson("UNAUTHORIZED", "Missing API key. Pass it as: Authorization: Bearer sk_live_...", 401);
    }

    const plainKey = authHeader.slice(7);
    const hashedKey = hashApiKey(plainKey);

    const apiKey = await prisma.apiKey.findUnique({
      where: { key: hashedKey },
      include: { user: { include: { subscription: true } } },
    });

    if (!apiKey || !apiKey.active) {
      return errorJson("UNAUTHORIZED", "Invalid or inactive API key", 401);
    }

    const user = apiKey.user;
    const subscription = user.subscription;

    if (!subscription || subscription.status !== "active") {
      return errorJson("FORBIDDEN", "No active subscription. Subscribe at scoutapi.dev to get access.", 403);
    }

    // --- Rate limiting ---
    const rateCheck = await checkRateLimit(apiKey.id);
    if (!rateCheck.allowed) {
      const res = errorJson("RATE_LIMITED", "Rate limit exceeded. Max 100 requests/minute.", 429);
      res.headers.set("Retry-After", String(Math.ceil(rateCheck.resetMs / 1000)));
      res.headers.set("X-RateLimit-Remaining", "0");
      return res;
    }

    // --- Parse request body ---
    const body: ScrapeRequest = await request.json();
    const { query, location, max_results = 50 } = body;

    if (!query || !location) {
      return errorJson("INVALID_REQUEST", "Missing required fields: query, location", 400);
    }

    if (max_results < 1 || max_results > 100) {
      return errorJson("INVALID_REQUEST", "max_results must be between 1 and 100", 400);
    }

    // Determine which platforms to scrape
    let platforms: Platform[];
    if (body.platforms && body.platforms.length > 0) {
      const invalid = body.platforms.filter((p) => !SUPPORTED_PLATFORMS.includes(p));
      if (invalid.length > 0) {
        return errorJson("UNSUPPORTED_PLATFORM", `Unsupported platform(s): ${invalid.join(", ")}. Available: ${SUPPORTED_PLATFORMS.join(", ")}`, 400);
      }
      platforms = body.platforms;
    } else if (body.platform) {
      if (!SUPPORTED_PLATFORMS.includes(body.platform)) {
        return errorJson("UNSUPPORTED_PLATFORM", `Platform "${body.platform}" is not supported. Available: ${SUPPORTED_PLATFORMS.join(", ")}`, 400);
      }
      platforms = [body.platform];
    } else {
      return errorJson("INVALID_REQUEST", "Missing required field: platform (or platforms array)", 400);
    }

    // --- Usage check (each platform counts as 1 call) ---
    const month = currentMonth();
    const planLimit = getPlanLimit(subscription.plan);
    const usage = await prisma.usage.upsert({
      where: { userId_month: { userId: user.id, month } },
      update: {},
      create: { userId: user.id, month, requestCount: 0, limit: planLimit },
    });

    if (usage.requestCount + platforms.length > usage.limit) {
      return errorJson(
        "MONTHLY_LIMIT_EXCEEDED",
        `Monthly limit reached (${usage.limit.toLocaleString()} calls). Upgrade your plan.`,
        429
      );
    }

    // --- Single platform: original response format ---
    if (platforms.length === 1) {
      const platform = platforms[0];
      return await scrapeSinglePlatform(platform, query, location, max_results, user.id, apiKey.id, month, rateCheck.remaining);
    }

    // --- Multi-platform: run all in parallel, fault-isolated ---
    const results: Record<string, ScrapeResult & { cached?: boolean }> = {};

    await Promise.all(
      platforms.map(async (platform) => {
        try {
          // Check cache first
          const cached = await getCached(platform, location, query);
          if (cached && cached.success) {
            results[platform] = { ...cached, cached: true, query_time_ms: 0 };
            reportHealth(platform, true);
          } else {
            const result = await scrape(platform, query, location, max_results);
            results[platform] = { ...result, cached: false };
            reportHealth(platform, result.success, result.success ? undefined : result.error.message);
            if (result.success) {
              await setCache(platform, location, query, result);
            }
          }
        } catch {
          results[platform] = {
            success: false,
            error: { code: "SCRAPE_FAILED", message: `${platform} temporarily unavailable` },
            cached: false,
          };
          reportHealth(platform, false, "Unexpected error");
        }
      })
    );

    // Track usage (N platforms = N calls)
    await Promise.all([
      prisma.usage.update({
        where: { userId_month: { userId: user.id, month } },
        data: { requestCount: { increment: platforms.length } },
      }),
      prisma.apiRequest.create({
        data: {
          userId: user.id,
          apiKeyId: apiKey.id,
          endpoint: "/api/scrape",
          query: { platforms, query, location, max_results },
          statusCode: 200,
          responseTime: 0,
        },
      }),
    ]);

    return NextResponse.json(
      { success: true, results },
      { headers: { "X-RateLimit-Remaining": String(rateCheck.remaining) } }
    );
  } catch (err) {
    console.error("Scrape route error:", err);
    return errorJson("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

/** Handle a single-platform request — preserves the original response format */
async function scrapeSinglePlatform(
  platform: Platform,
  query: string,
  location: string,
  maxResults: number,
  userId: string,
  apiKeyId: string,
  month: string,
  rateLimitRemaining: number
) {
  // Cache check
  const cached = await getCached(platform, location, query);
  if (cached && cached.success) {
    await Promise.all([
      prisma.usage.update({
        where: { userId_month: { userId, month } },
        data: { requestCount: { increment: 1 } },
      }),
      prisma.apiRequest.create({
        data: { userId, apiKeyId, endpoint: "/api/scrape", query: { platform, query, location, max_results: maxResults }, statusCode: 200, responseTime: 0 },
      }),
    ]);
    reportHealth(platform, true);
    return NextResponse.json(
      { ...cached, cached: true, query_time_ms: 0 },
      { headers: { "X-RateLimit-Remaining": String(rateLimitRemaining), "X-Cache": "HIT" } }
    );
  }

  // Scrape
  const result = await scrape(platform, query, location, maxResults);

  reportHealth(platform, result.success, result.success ? undefined : result.error.message);

  await Promise.all([
    prisma.usage.update({
      where: { userId_month: { userId, month } },
      data: { requestCount: { increment: 1 } },
    }),
    prisma.apiRequest.create({
      data: { userId, apiKeyId, endpoint: "/api/scrape", query: { platform, query, location, max_results: maxResults }, statusCode: result.success ? 200 : 502, responseTime: result.success ? result.query_time_ms : 0 },
    }),
  ]);

  if (result.success) {
    await setCache(platform, location, query, result);
  }

  if (!result.success) {
    return NextResponse.json(result, { status: 502 });
  }

  return NextResponse.json(
    { ...result, cached: false },
    { headers: { "X-RateLimit-Remaining": String(rateLimitRemaining), "X-Cache": "MISS" } }
  );
}
