import { ETF } from "./types";
import { etfs } from "./demoData";
import { getPerformanceSeries, SeriesPoint } from "./analytics";
import { TwelveDataProvider } from "./providers/twelveData";

export type ProviderStatus = {
  mode: "demo" | "live";
  label: string;
  provider: "demo" | "twelve-data";
  historicalPrices: boolean;
  metadata: boolean;
  holdings: boolean;
  flows: boolean;
};

export interface ETFDataProvider {
  listETFs(): Promise<ETF[]>;
  getETF(symbol: string): Promise<ETF | null>;
  getPerformanceHistory(symbol: string): Promise<SeriesPoint[]>;
  getProviderStatus(): Promise<ProviderStatus>;
}

export class DemoETFProvider implements ETFDataProvider {
  async listETFs() { return etfs; }
  async getETF(symbol: string) { return etfs.find(e => e.symbol === symbol.toUpperCase()) ?? null; }
  async getPerformanceHistory(symbol: string) { return getPerformanceSeries(symbol.toUpperCase()); }
  async getProviderStatus(): Promise<ProviderStatus> {
    return {
      mode: "demo",
      label: "Curated demo dataset",
      provider: "demo",
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
