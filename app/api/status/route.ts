import { NextResponse } from "next/server";
import { etfProvider } from "@/lib/provider";

export async function GET() {
  const status = await etfProvider.getProviderStatus();
  return NextResponse.json({
    app: "ETF Pulse Analytics",
    version: "0.4.0",
    provider: status,
    generatedAt: new Date().toISOString(),
  });
}
