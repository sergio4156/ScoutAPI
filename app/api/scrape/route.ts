import { NextRequest, NextResponse } from "next/server";
import { ScrapeRequest, ScrapeResult, Platform } from "@/lib/scrapers/types";
import { scrape, SUPPORTED_PLATFORMS, reportHealth } from "@/lib/scrapers/index";
import { prisma } from "@/lib/db";
import { hashApiKey } from "@/lib/apiKey";
import { checkRateLimit } from "@/lib/rateLimit";
import { getCached, setCache } from "@/lib/cache";
import { ERROR_CODES, ERROR_MESSAGES, getPlanLimit, FREE_PLAN, getPlanRateLimit } from "@/lib/constants";

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

export async function POST(request: NextRequest) {
  try {
    // --- Auth ---
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errorJson(ERROR_CODES.UNAUTHORIZED, ERROR_MESSAGES.MISSING_API_KEY, 401);
    }

    const plainKey = authHeader.slice(7);
    const hashedKey = hashApiKey(plainKey);

    const apiKey = await prisma.apiKey.findUnique({
      where: { key: hashedKey },
      include: { user: { include: { subscription: true } } },
    });

    if (!apiKey || !apiKey.active) {
      return errorJson(ERROR_CODES.UNAUTHORIZED, ERROR_MESSAGES.INVALID_API_KEY, 401);
    }

    const user = apiKey.user;
    const subscription = user.subscription;

    // Determine plan: active subscription or free tier
    const isFreeTier = !subscription || subscription.status !== "active";
    const currentPlan = isFreeTier ? FREE_PLAN.name : subscription!.plan;

    // --- Rate limiting (10/min for free, 100/min for paid) ---
    const planRateLimit = getPlanRateLimit(currentPlan);
    const rateCheck = await checkRateLimit(apiKey.id);
    if (!rateCheck.allowed) {
      const res = errorJson(ERROR_CODES.RATE_LIMITED, `Rate limit exceeded. Max ${planRateLimit} requests/minute.${isFreeTier ? " Upgrade for higher limits." : ""}`, 429);
      res.headers.set("Retry-After", String(Math.ceil(rateCheck.resetMs / 1000)));
      res.headers.set("X-RateLimit-Remaining", "0");
      return res;
    }

    // --- Parse request body ---
    const body: ScrapeRequest = await request.json();
    const { query, location, max_results = 50 } = body;

    if (!query || !location) {
      return errorJson(ERROR_CODES.INVALID_REQUEST, ERROR_MESSAGES.MISSING_FIELDS, 400);
    }

    if (max_results < 1 || max_results > 100) {
      return errorJson(ERROR_CODES.INVALID_REQUEST, ERROR_MESSAGES.INVALID_MAX_RESULTS, 400);
    }

    // Determine which platforms to scrape
    let platforms: Platform[];
    if (body.platforms && body.platforms.length > 0) {
      const invalid = body.platforms.filter((p) => !SUPPORTED_PLATFORMS.includes(p));
      if (invalid.length > 0) {
        return errorJson(ERROR_CODES.UNSUPPORTED_PLATFORM, `Unsupported platform(s): ${invalid.join(", ")}. Available: ${SUPPORTED_PLATFORMS.join(", ")}`, 400);
      }
      platforms = body.platforms;
    } else if (body.platform) {
      if (!SUPPORTED_PLATFORMS.includes(body.platform)) {
        return errorJson(ERROR_CODES.UNSUPPORTED_PLATFORM, `Platform "${body.platform}" is not supported. Available: ${SUPPORTED_PLATFORMS.join(", ")}`, 400);
      }
      platforms = [body.platform];
    } else {
      return errorJson(ERROR_CODES.INVALID_REQUEST, ERROR_MESSAGES.MISSING_PLATFORM, 400);
    }

    // --- Usage check (each platform counts as 1 call) ---
    const month = currentMonth();
    const planLimit = getPlanLimit(currentPlan);
    const usage = await prisma.usage.upsert({
      where: { userId_month: { userId: user.id, month } },
      update: {},
      create: { userId: user.id, month, requestCount: 0, limit: planLimit },
    });

    if (usage.requestCount + platforms.length > usage.limit) {
      return errorJson(
        ERROR_CODES.MONTHLY_LIMIT_EXCEEDED,
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
    return errorJson(ERROR_CODES.INTERNAL_ERROR, ERROR_MESSAGES.INTERNAL_ERROR, 500);
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
