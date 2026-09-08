import { NextRequest, NextResponse } from "next/server";
import { getCachedFundUniverse, queryCachedUniverse } from "@/lib/services/fundUniverse";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("q") ?? undefined;
  const sort = searchParams.get("sort") ?? undefined;
  const dirParam = searchParams.get("dir");
  const sortDir = dirParam === "asc" ? "asc" : "desc";
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 100) || 100, 1), 500);
  const offset = Math.max(Number(searchParams.get("offset") ?? 0) || 0, 0);

  if (!process.env.BUSINESSQUANT_API_KEY?.trim()) {
    return NextResponse.json({
      mode: "demo",
      reason: "BUSINESSQUANT_API_KEY is missing from .env.local",
      rows: [],
      offset,
      limit,
    });
  }

  try {
    const universe = await getCachedFundUniverse();
    if (!universe) {
      return NextResponse.json({ mode: "fallback", error: "BusinessQuant universe snapshot is unavailable", rows: [], offset, limit });
    }

    const result = queryCachedUniverse(universe, { search, sort, sortDir, offset, limit });
    return NextResponse.json({
      mode: "live",
      ...result,
      universeTotal: universe.providerUniverseTotal,
      snapshotSize: universe.snapshotSize,
      refreshedAt: universe.refreshedAt,
      source: universe.source,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Screener unavailable";
    const rateLimited = /429|rate limit/i.test(message);
    return NextResponse.json({
      mode: "fallback",
      reason: rateLimited ? "BusinessQuant daily quota exhausted before a cache snapshot was available" : undefined,
      error: message,
      rows: [],
      offset,
      limit,
      rateLimited,
    }, { status: 200 });
  }
}
