import { ETF } from "./types";
import { etfs } from "./demoData";
import { getPerformanceSeries, SeriesPoint } from "./analytics";

export interface ETFDataProvider {
  listETFs(): Promise<ETF[]>;
  getETF(symbol: string): Promise<ETF | null>;
  getPerformanceHistory(symbol: string): Promise<SeriesPoint[]>;
  getProviderStatus(): Promise<{ mode: "demo" | "live"; label: string }>;
}

export class DemoETFProvider implements ETFDataProvider {
  async listETFs() { return etfs; }
  async getETF(symbol: string) { return etfs.find(e => e.symbol === symbol.toUpperCase()) ?? null; }
  async getPerformanceHistory(symbol: string) { return getPerformanceSeries(symbol.toUpperCase()); }
  async getProviderStatus() { return { mode: "demo" as const, label: "Curated demo dataset" }; }
}

export const etfProvider: ETFDataProvider = new DemoETFProvider();
