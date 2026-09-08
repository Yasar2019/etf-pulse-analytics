import { ETF } from "../types";
import { etfs } from "../demoData";
import { SeriesPoint } from "../analytics";
import type { ETFDataProvider, ProviderStatus, QuoteSnapshot } from "../provider";

const BASE_URL = "https://api.twelvedata.com";

type TwelveTimeSeriesResponse = {
  status?: string;
  message?: string;
  values?: Array<{ datetime: string; close: string }>;
};

type TwelveQuoteResponse = {
  status?: string;
  message?: string;
  datetime?: string;
  close?: string;
  previous_close?: string;
  change?: string;
  percent_change?: string;
};

export class TwelveDataProvider implements ETFDataProvider {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async listETFs(): Promise<ETF[]> {
    return etfs;
  }

  async getETF(symbol: string): Promise<ETF | null> {
    return etfs.find((etf) => etf.symbol === symbol.toUpperCase()) ?? null;
  }

  async getQuote(symbol: string): Promise<QuoteSnapshot> {
    const params = new URLSearchParams({
      symbol: symbol.toUpperCase(),
      apikey: this.apiKey,
    });

    const response = await fetch(`${BASE_URL}/quote?${params.toString()}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`Twelve Data quote request failed with ${response.status}`);
    }

    const payload = (await response.json()) as TwelveQuoteResponse;
    const price = Number(payload.close);
    const change = Number(payload.change);
    const percentChange = Number(payload.percent_change);
    const previousClose = Number(payload.previous_close);

    if (!Number.isFinite(price) || !Number.isFinite(percentChange)) {
      throw new Error(payload.message || "No valid Twelve Data quote returned");
    }

    return {
      price,
      change: Number.isFinite(change) ? change : 0,
      percentChange,
      previousClose: Number.isFinite(previousClose) ? previousClose : undefined,
      datetime: payload.datetime,
      source: "twelve-data",
    };
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
      label: "Twelve Data · live quote + historical prices",
      provider: "twelve-data",
      currentQuote: true,
      historicalPrices: true,
      metadata: false,
      holdings: false,
      flows: false,
    };
  }
}
