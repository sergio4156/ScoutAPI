import { NextRequest, NextResponse } from "next/server";
import { scrapeCraigslist } from "@/lib/scrapers/craigslist";
import { ScrapeRequest } from "@/lib/scrapers/types";
import { prisma } from "@/lib/db";
import { hashApiKey } from "@/lib/apiKey";

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
    // --- Auth: require Bearer API key ---
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errorJson(
        "UNAUTHORIZED",
        'Missing API key. Pass it as: Authorization: Bearer sk_live_...',
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

    // Check usage limits
    const month = currentMonth();
    const usage = await prisma.usage.upsert({
      where: { userId_month: { userId: user.id, month } },
      update: {},
      create: { userId: user.id, month, requestCount: 0, limit: subscription.plan === "enterprise" ? 500_000 : subscription.plan === "agent" ? 100_000 : 10_000 },
    });

    if (usage.requestCount >= usage.limit) {
      return errorJson(
        "RATE_LIMITED",
        `Monthly limit reached (${usage.limit.toLocaleString()} calls). Upgrade your plan for more.`,
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
          query: { platform, query: body.query, location, max_results },
          statusCode: result.success ? 200 : 502,
          responseTime: result.success ? result.query_time_ms : 0,
        },
      }),
    ]);

    if (!result.success) {
      return NextResponse.json(result, { status: 502 });
    }

    return NextResponse.json(result);
  } catch {
    return errorJson("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
