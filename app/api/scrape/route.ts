import { NextRequest, NextResponse } from "next/server";
import { scrapeCraigslist } from "@/lib/scrapers/craigslist";
import { ScrapeRequest } from "@/lib/scrapers/types";
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
    // --- Auth: require Bearer API key ---
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errorJson(
        "UNAUTHORIZED",
        "Missing API key. Pass it as: Authorization: Bearer sk_live_...",
        401
      );
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

    // Check subscription status
    if (!subscription || subscription.status !== "active") {
      return errorJson(
        "FORBIDDEN",
        "No active subscription. Subscribe at scoutapi.dev to get access.",
        403
      );
    }

    // --- Rate limiting: 100 requests/minute per API key ---
    const rateCheck = await checkRateLimit(apiKey.id);
    if (!rateCheck.allowed) {
      const res = errorJson(
        "RATE_LIMITED",
        "Rate limit exceeded. Max 100 requests/minute.",
        429
      );
      res.headers.set("Retry-After", String(Math.ceil(rateCheck.resetMs / 1000)));
      res.headers.set("X-RateLimit-Remaining", "0");
      return res;
    }

    // --- Monthly usage check ---
    const month = currentMonth();
    const planLimit = getPlanLimit(subscription.plan);
    const usage = await prisma.usage.upsert({
      where: { userId_month: { userId: user.id, month } },
      update: {},
      create: { userId: user.id, month, requestCount: 0, limit: planLimit },
    });

    if (usage.requestCount >= usage.limit) {
      return errorJson(
        "MONTHLY_LIMIT_EXCEEDED",
        `Monthly limit reached (${usage.limit.toLocaleString()} calls). Upgrade your plan.`,
        429
      );
    }

    // --- Parse and validate request body ---
    const body: ScrapeRequest = await request.json();
    const { platform, query, location, max_results = 50 } = body;

    if (!platform || !query || !location) {
      return errorJson("INVALID_REQUEST", "Missing required fields: platform, query, location", 400);
    }

    if (platform !== "craigslist") {
      return errorJson("UNSUPPORTED_PLATFORM", `Platform "${platform}" is not yet supported. Available: craigslist`, 400);
    }

    if (max_results < 1 || max_results > 100) {
      return errorJson("INVALID_REQUEST", "max_results must be between 1 and 100", 400);
    }

    // --- Cache check ---
    const cached = await getCached(platform, location, query);
    if (cached && cached.success) {
      // Increment usage and log even for cache hits
      await Promise.all([
        prisma.usage.update({
          where: { userId_month: { userId: user.id, month } },
          data: { requestCount: { increment: 1 } },
        }),
        prisma.apiRequest.create({
          data: {
            userId: user.id,
            apiKeyId: apiKey.id,
            endpoint: "/api/scrape",
            query: { platform, query, location, max_results },
            statusCode: 200,
            responseTime: 0,
          },
        }),
      ]);

      return NextResponse.json({
        ...cached,
        cached: true,
        query_time_ms: 0,
      }, {
        headers: {
          "X-RateLimit-Remaining": String(rateCheck.remaining),
          "X-Cache": "HIT",
        },
      });
    }

    // --- Scrape ---
    const result = await scrapeCraigslist(query, location, max_results);

    // Track usage and log request
    await Promise.all([
      prisma.usage.update({
        where: { userId_month: { userId: user.id, month } },
        data: { requestCount: { increment: 1 } },
      }),
      prisma.apiRequest.create({
        data: {
          userId: user.id,
          apiKeyId: apiKey.id,
          endpoint: "/api/scrape",
          query: { platform, query, location, max_results },
          statusCode: result.success ? 200 : 502,
          responseTime: result.success ? result.query_time_ms : 0,
        },
      }),
    ]);

    // Cache successful results for 15 minutes
    if (result.success) {
      await setCache(platform, location, query, result);
    }

    if (!result.success) {
      return NextResponse.json(result, { status: 502 });
    }

    return NextResponse.json(
      { ...result, cached: false },
      {
        headers: {
          "X-RateLimit-Remaining": String(rateCheck.remaining),
          "X-Cache": "MISS",
        },
      }
    );
  } catch {
    return errorJson("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
