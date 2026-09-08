import { NextRequest, NextResponse } from "next/server";
import { getCachedFundUniverse, queryCachedUniverse } from "@/lib/services/fundUniverse";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("q") ?? undefined;
  const sort = searchParams.get("sort") ?? undefined;
  const sortDir = searchParams.get("dir") === "asc" ? "asc" : "desc";
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 100) || 100, 1), 500);
  const offset = Math.max(Number(searchParams.get("offset") ?? 0) || 0, 0);

  if (!process.env.BUSINESSQUANT_API_KEY?.trim() && !process.env.TWELVE_DATA_API_KEY?.trim()) {
    return NextResponse.json({
      mode: "demo",
      reason: "Neither BUSINESSQUANT_API_KEY nor TWELVE_DATA_API_KEY is configured",
      rows: [], offset, limit,
    });
  }

  try {
    const { universe, businessQuantError, twelveDataError } = await getCachedFundUniverse();
    if (!universe) {
      const reasons = [
        businessQuantError ? `BusinessQuant: ${businessQuantError.message}` : null,
        twelveDataError ? `Twelve Data: ${twelveDataError.message}` : null,
      ].filter(Boolean);
      return NextResponse.json({
        mode: "fallback",
        reason: reasons.length ? reasons.join(" | ") : "No ETF universe provider is currently available",
        providerErrors: {
          businessQuant: businessQuantError?.message ?? null,
          twelveData: twelveDataError?.message ?? null,
        },
        rows: [], offset, limit,
      });
    }

    const result = queryCachedUniverse(universe, { search, sort, sortDir, offset, limit });
    return NextResponse.json({
      mode: "live",
      ...result,
      universeTotal: universe.providerUniverseTotal,
      snapshotSize: universe.snapshotSize,
      refreshedAt: universe.refreshedAt,
      source: universe.source,
      enriched: universe.enriched,
      providerWarning: businessQuantError?.message,
      providerErrors: {
        businessQuant: businessQuantError?.message ?? null,
        twelveData: twelveDataError?.message ?? null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Screener unavailable";
    return NextResponse.json({ mode: "fallback", error: message, rows: [], offset, limit }, { status: 200 });
  }
}
