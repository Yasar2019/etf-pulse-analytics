import { ETF } from "../types";
import { etfs } from "../demoData";
import { SeriesPoint } from "../analytics";
import type { ETFDataProvider, ProviderStatus } from "../provider";

const BASE_URL = "https://api.twelvedata.com";

type TwelveTimeSeriesResponse = {
  status?: string;
  message?: string;
  values?: Array<{ datetime: string; close: string }>;
};

export class TwelveDataProvider implements ETFDataProvider {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async listETFs(): Promise<ETF[]> {
    // V0.4 keeps our curated taxonomy/metadata while live pricing is introduced.
    // A dedicated fund-metadata feed can replace this method later without UI changes.
    return etfs;
  }

  async getETF(symbol: string): Promise<ETF | null> {
    return etfs.find((etf) => etf.symbol === symbol.toUpperCase()) ?? null;
  }

  async getPerformanceHistory(symbol: string): Promise<SeriesPoint[]> {
    const params = new URLSearchParams({
      symbol: symbol.toUpperCase(),
      interval: "1day",
      outputsize: "180",
      apikey: this.apiKey,
    });

    const response = await fetch(`${BASE_URL}/time_series?${params.toString()}`, {
      next: { revalidate: 900 },
    });

    if (!response.ok) {
      throw new Error(`Twelve Data request failed with ${response.status}`);
    }

    const payload = (await response.json()) as TwelveTimeSeriesResponse;
    if (!payload.values?.length) {
      throw new Error(payload.message || "No Twelve Data history returned");
    }

    const ordered = [...payload.values].reverse();
    const first = Number(ordered[0].close);

    return ordered
      .map((point) => ({
        label: point.datetime,
        value: Number(((Number(point.close) / first) * 100).toFixed(2)),
      }))
      .filter((point) => Number.isFinite(point.value));
  }

  async getProviderStatus(): Promise<ProviderStatus> {
    return {
      mode: "live",
      label: "Twelve Data · live/historical prices",
      provider: "twelve-data",
      historicalPrices: true,
      metadata: false,
      holdings: false,
      flows: false,
    };
  }
}
