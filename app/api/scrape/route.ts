import { NextRequest, NextResponse } from "next/server";
import { scrapeCraigslist } from "@/lib/scrapers/craigslist";
import { ScrapeRequest } from "@/lib/scrapers/types";

export async function POST(request: NextRequest) {
  try {
    const body: ScrapeRequest = await request.json();
    const { platform, query, location, max_results = 50 } = body;

    // Validate required fields
    if (!platform || !query || !location) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: "Missing required fields: platform, query, location",
          },
        },
        { status: 400 }
      );
    }

    // Validate platform
    if (platform !== "craigslist") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNSUPPORTED_PLATFORM",
            message: `Platform "${platform}" is not yet supported. Available: craigslist`,
          },
        },
        { status: 400 }
      );
    }

    // Validate max_results range
    if (max_results < 1 || max_results > 100) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: "max_results must be between 1 and 100",
          },
        },
        { status: 400 }
      );
    }

    const result = await scrapeCraigslist(query, location, max_results);

    if (!result.success) {
      return NextResponse.json(result, { status: 502 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}
