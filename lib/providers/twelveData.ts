import { ETF } from "../types";
import { etfs } from "../demoData";
import { SeriesPoint } from "../analytics";
import { getBusinessQuantETFStub } from "./businessQuantPortfolio";
import type { ETFDataProvider, ProviderStatus, QuoteSnapshot, PerformanceStats } from "../provider";

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

type DailyClose = { date: string; close: number };

export class TwelveDataProvider implements ETFDataProvider {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async listETFs(): Promise<ETF[]> {
    return etfs;
  }

  async getETF(symbol: string): Promise<ETF | null> {
    const upper = symbol.toUpperCase();
    const curated = etfs.find((etf) => etf.symbol === upper);
    if (curated) return curated;
    try {
      return await getBusinessQuantETFStub(upper);
    } catch {
      return null;
    }
  }

  async getQuote(symbol: string): Promise<QuoteSnapshot> {
    const params = new URLSearchParams({ symbol: symbol.toUpperCase(), apikey: this.apiKey });
    const response = await fetch(`${BASE_URL}/quote?${params.toString()}`, { next: { revalidate: 60 } });
    if (!response.ok) throw new Error(`Twelve Data quote request failed with ${response.status}`);

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

  private async getDailyCloses(symbol: string, outputsize = 320): Promise<DailyClose[]> {
    const params = new URLSearchParams({
      symbol: symbol.toUpperCase(),
      interval: "1day",
      outputsize: String(outputsize),
      apikey: this.apiKey,
    });

    const response = await fetch(`${BASE_URL}/time_series?${params.toString()}`, {
      next: { revalidate: 900 },
    });
    if (!response.ok) throw new Error(`Twelve Data request failed with ${response.status}`);

    const payload = (await response.json()) as TwelveTimeSeriesResponse;
    if (!payload.values?.length) throw new Error(payload.message || "No Twelve Data history returned");

    return [...payload.values]
      .reverse()
      .map((point) => ({ date: point.datetime, close: Number(point.close) }))
      .filter((point) => Number.isFinite(point.close));
  }

  async getPerformanceHistory(symbol: string): Promise<SeriesPoint[]> {
    const ordered = await this.getDailyCloses(symbol, 260);
    const first = ordered[0]?.close;
    if (!first) throw new Error("Insufficient price history");

    return ordered.map((point) => ({
      label: point.date,
      value: Number(((point.close / first) * 100).toFixed(2)),
    }));
  }

  async getPerformanceStats(symbol: string): Promise<PerformanceStats> {
    const closes = await this.getDailyCloses(symbol, 320);
    if (closes.length < 30) throw new Error("Insufficient history for performance statistics");

    const latest = closes.at(-1)!;
    const latestDate = new Date(`${latest.date}T00:00:00`);
    const year = latestDate.getUTCFullYear();

    const yearStart = closes.find((point) => new Date(`${point.date}T00:00:00`).getUTCFullYear() === year) ?? closes[0];
    const oneYearCutoff = new Date(latestDate);
    oneYearCutoff.setUTCFullYear(oneYearCutoff.getUTCFullYear() - 1);
    const oneYearStart = closes.find((point) => new Date(`${point.date}T00:00:00`) >= oneYearCutoff) ?? closes[0];

    const ytdReturn = ((latest.close / yearStart.close) - 1) * 100;
    const oneYearReturn = ((latest.close / oneYearStart.close) - 1) * 100;

    const recent = closes.slice(-253);
    const dailyReturns: number[] = [];
    for (let i = 1; i < recent.length; i++) {
      dailyReturns.push((recent[i].close / recent[i - 1].close) - 1);
    }

    const mean = dailyReturns.reduce((sum, value) => sum + value, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / Math.max(1, dailyReturns.length - 1);
    const annualizedVolatility = Math.sqrt(variance) * Math.sqrt(252) * 100;
    const risk: PerformanceStats["risk"] = annualizedVolatility < 12 ? "Low" : annualizedVolatility < 22 ? "Moderate" : "High";

    return {
      ytdReturn: Number(ytdReturn.toFixed(2)),
      oneYearReturn: Number(oneYearReturn.toFixed(2)),
      annualizedVolatility: Number(annualizedVolatility.toFixed(2)),
      risk,
      source: "twelve-data",
    };
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
