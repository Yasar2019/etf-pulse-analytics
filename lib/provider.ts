import { ETF } from "./types";
import { etfs } from "./demoData";
import { getPerformanceSeries, SeriesPoint } from "./analytics";
import { TwelveDataProvider } from "./providers/twelveData";

export type QuoteSnapshot = {
  price: number;
  change: number;
  percentChange: number;
  previousClose?: number;
  datetime?: string;
  source: "demo" | "twelve-data";
};

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

export interface ETFDataProvider {
  listETFs(): Promise<ETF[]>;
  getETF(symbol: string): Promise<ETF | null>;
  getQuote(symbol: string): Promise<QuoteSnapshot>;
  getPerformanceHistory(symbol: string): Promise<SeriesPoint[]>;
  getProviderStatus(): Promise<ProviderStatus>;
}

export class DemoETFProvider implements ETFDataProvider {
  async listETFs() { return etfs; }
  async getETF(symbol: string) { return etfs.find(e => e.symbol === symbol.toUpperCase()) ?? null; }
  async getQuote(symbol: string): Promise<QuoteSnapshot> {
    const etf = etfs.find(e => e.symbol === symbol.toUpperCase());
    if (!etf) throw new Error(`Unknown ETF symbol: ${symbol}`);
    const price = Number(etf.price);
    const percentChange = Number(etf.change);
    return {
      price,
      change: Number((price * (percentChange / 100)).toFixed(2)),
      percentChange,
      source: "demo",
    };
  }
  async getPerformanceHistory(symbol: string) { return getPerformanceSeries(symbol.toUpperCase()); }
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
