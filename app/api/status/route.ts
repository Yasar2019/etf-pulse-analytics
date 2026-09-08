import { NextResponse } from "next/server";
import { etfProvider } from "@/lib/provider";

export async function GET() {
  const status = await etfProvider.getProviderStatus();
  const businessQuantConfigured = Boolean(process.env.BUSINESSQUANT_API_KEY?.trim());
  return NextResponse.json({
    app: "ETF Pulse Analytics",
    version: "0.7.0",
    providers: {
      marketData: status,
      alphaVantageProfile: Boolean(process.env.ALPHA_VANTAGE_API_KEY?.trim()),
      businessQuantFunds: businessQuantConfigured,
    },
    explorer: {
      liveUniverseEnabled: businessQuantConfigured,
      fallbackFundCount: 8,
      note: businessQuantConfigured
        ? "Explorer should use the live BusinessQuant ETF universe."
        : "Explorer is using the 8-fund curated fallback because BUSINESSQUANT_API_KEY is not configured.",
    },
    portfolioAnalyzer: {
      enabled: true,
      liveLookThrough: businessQuantConfigured,
      liveRisk: Boolean(process.env.TWELVE_DATA_API_KEY?.trim()),
    },
    generatedAt: new Date().toISOString(),
  });
}
