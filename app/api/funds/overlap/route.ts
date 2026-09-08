import { NextRequest, NextResponse } from "next/server";
import { comparePortfolioOverlap } from "@/lib/providers/businessQuantPortfolio";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const a = (searchParams.get("a") ?? "").trim().toUpperCase();
  const b = (searchParams.get("b") ?? "").trim().toUpperCase();
  if (!a || !b) return NextResponse.json({ mode:"error", error:"Two ETF tickers are required" }, { status:400 });
  if (a === b) return NextResponse.json({ mode:"error", error:"Choose two different ETFs" }, { status:400 });

  try {
    const result = await comparePortfolioOverlap(a,b);
    if (!result) return NextResponse.json({ mode:"fallback", error:"Holdings overlap unavailable. Configure BusinessQuant or try another pair." });
    return NextResponse.json({ mode:"live", ...result });
  } catch (error) {
    return NextResponse.json({ mode:"fallback", error:error instanceof Error?error.message:"Overlap unavailable" });
  }
}
