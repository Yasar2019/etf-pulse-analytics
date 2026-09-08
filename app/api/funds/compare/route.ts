import { NextRequest, NextResponse } from "next/server";
import { compareBusinessQuantFunds } from "@/lib/providers/businessQuant";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tickers = (searchParams.get("tickers") ?? "").split(",").map(t => t.trim()).filter(Boolean).slice(0, 6);
  if (tickers.length < 2) return NextResponse.json({ mode: "error", error: "At least two tickers are required" }, { status: 400 });
  try {
    const result = await compareBusinessQuantFunds(tickers);
    if (!result) return NextResponse.json({ mode: "demo", reason: "BUSINESSQUANT_API_KEY not configured" });
    return NextResponse.json({ mode: "live", ...result });
  } catch (error) {
    return NextResponse.json({ mode: "fallback", error: error instanceof Error ? error.message : "Comparison unavailable" }, { status: 200 });
  }
}
