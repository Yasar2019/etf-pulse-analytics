import { NextResponse } from "next/server";
import { etfProvider } from "@/lib/provider";

export async function GET() {
  const status = await etfProvider.getProviderStatus();
  return NextResponse.json({
    app: "ETF Pulse Analytics",
    version: "0.6.0",
    providers: {
      marketData: status,
      alphaVantageProfile: Boolean(process.env.ALPHA_VANTAGE_API_KEY?.trim()),
      businessQuantFunds: Boolean(process.env.BUSINESSQUANT_API_KEY?.trim()),
    },
    generatedAt: new Date().toISOString(),
  });
}
