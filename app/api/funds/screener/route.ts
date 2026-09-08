import { NextRequest, NextResponse } from "next/server";
import { screenBusinessQuantFunds } from "@/lib/providers/businessQuant";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("q") ?? undefined;
  const sort = searchParams.get("sort") ?? undefined;
  const dirParam = searchParams.get("dir");
  const sortDir = dirParam === "asc" ? "asc" : "desc";
  const category = searchParams.get("category") ?? undefined;
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
    const result = await screenBusinessQuantFunds({ search, sort, sortDir, category, limit, offset });
    if (!result) {
      return NextResponse.json({ mode: "fallback", error: "BusinessQuant provider returned no response", rows: [], offset, limit });
    }
    return NextResponse.json({ mode: "live", ...result });
  } catch (error) {
    return NextResponse.json({
      mode: "fallback",
      error: error instanceof Error ? error.message : "Screener unavailable",
      rows: [],
      offset,
      limit,
    }, { status: 200 });
  }
}
