import { NextRequest, NextResponse } from "next/server";
import { screenBusinessQuantFunds } from "@/lib/providers/businessQuant";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("q") ?? undefined;
  const sort = searchParams.get("sort") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? 50) || 50, 100);

  try {
    const result = await screenBusinessQuantFunds({ search, sort, category, limit });
    if (!result) return NextResponse.json({ mode: "demo", reason: "BUSINESSQUANT_API_KEY not configured", rows: [] });
    return NextResponse.json({ mode: "live", ...result });
  } catch (error) {
    return NextResponse.json({ mode: "fallback", error: error instanceof Error ? error.message : "Screener unavailable", rows: [] }, { status: 200 });
  }
}
