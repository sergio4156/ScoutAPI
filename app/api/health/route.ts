import { NextResponse } from "next/server";
import { getHealthStatus } from "@/lib/scrapers/index";

export async function GET() {
  const platforms = getHealthStatus();
  const allOperational = Object.values(platforms).every((p) => p.status === "operational");

  return NextResponse.json({
    status: allOperational ? "operational" : "degraded",
    platforms,
  });
}
