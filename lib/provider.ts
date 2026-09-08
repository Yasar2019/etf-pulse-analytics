import { ETF, RiskLevel } from "./types";
import { etfs } from "./demoData";
import { getPerformanceSeries, SeriesPoint } from "./analytics";
import { TwelveDataProvider } from "./providers/twelveData";
import { getBusinessQuantETFStub } from "./providers/businessQuantPortfolio";

export type ProviderStatus = {
  mode: "demo" | "live";
  label: string;
  provider: "demo" | "twelve-data";
  currentQuote: boolean;
  historicalPrices: boolean;
  metadata: boolean;
  holdings: boolean;
  flows: boolean;
};

export type QuoteSnapshot = {
  price: number;
  change: number;
  percentChange: number;
  previousClose?: number;
  datetime?: string;
  source: "demo" | "twelve-data";
};

export type PerformanceStats = {
  ytdReturn: number;
  oneYearReturn: number;
  annualizedVolatility: number;
  risk: RiskLevel;
  source: "demo" | "twelve-data";
};

export interface ETFDataProvider {
  listETFs(): Promise<ETF[]>;
  getETF(symbol: string): Promise<ETF | null>;
  getQuote(symbol: string): Promise<QuoteSnapshot>;
  getPerformanceHistory(symbol: string): Promise<SeriesPoint[]>;
  getPerformanceStats(symbol: string): Promise<PerformanceStats>;
  getProviderStatus(): Promise<ProviderStatus>;
}

async function resolveETF(symbol: string): Promise<ETF | null> {
  const upper = symbol.toUpperCase();
  const curated = etfs.find(e => e.symbol === upper);
  if (curated) return curated;
  try {
    return await getBusinessQuantETFStub(upper);
  } catch {
    return null;
  }
}

export class DemoETFProvider implements ETFDataProvider {
  async listETFs() { return etfs; }
  async getETF(symbol: string) { return resolveETF(symbol); }
  async getQuote(symbol: string): Promise<QuoteSnapshot> {
    const etf = await this.getETF(symbol);
    if (!etf) throw new Error("ETF not found");
    return { price: etf.price, change: 0, percentChange: etf.change, source: "demo" };
  }
  async getPerformanceHistory(symbol: string) {
    const curated = etfs.find(e => e.symbol === symbol.toUpperCase());
    return curated ? getPerformanceSeries(symbol.toUpperCase()) : [];
  }
  async getPerformanceStats(symbol: string): Promise<PerformanceStats> {
    const etf = await this.getETF(symbol);
    if (!etf) throw new Error("ETF not found");
    return {
      ytdReturn: etf.ytd,
      oneYearReturn: etf.return1y,
      annualizedVolatility: etf.volatility,
      risk: etf.risk,
      source: "demo",
    };
  }
  async getProviderStatus(): Promise<ProviderStatus> {
    return {
      mode: "demo",
      label: "Curated demo dataset",
      provider: "demo",
      currentQuote: false,
      historicalPrices: false,
      metadata: true,
      holdings: true,
      flows: true,
    };
  }
}

const twelveDataKey = process.env.TWELVE_DATA_API_KEY?.trim();

export const etfProvider: ETFDataProvider = twelveDataKey
  ? new TwelveDataProvider(twelveDataKey)
  : new DemoETFProvider();

export { resolveETF };
