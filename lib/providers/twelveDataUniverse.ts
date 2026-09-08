export type TwelveDataETFDirectoryRow = {
  ticker: string;
  fundName: string;
  category?: string;
  exchange?: string;
  currency?: string;
  country?: string;
};

type TwelveDirectoryPayload = {
  data?: Array<Record<string, unknown>>;
  result?: Array<Record<string, unknown>> | Record<string, unknown>;
  status?: string;
  message?: string;
  code?: number;
};

const BASE_URL = "https://api.twelvedata.com";

export async function getTwelveDataETFDirectory(): Promise<TwelveDataETFDirectoryRow[] | null> {
  const apiKey = process.env.TWELVE_DATA_API_KEY?.trim();
  if (!apiKey) return null;

  const params = new URLSearchParams({ country: "United States", apikey: apiKey });
  const response = await fetch(`${BASE_URL}/etfs/list?${params.toString()}`, { next: { revalidate: 86400 } });
  if (!response.ok) throw new Error(`Twelve Data ETF directory failed with ${response.status}`);

  const payload = (await response.json()) as TwelveDirectoryPayload;
  if (payload.status === "error") throw new Error(payload.message || "Twelve Data ETF directory unavailable");

  const raw = Array.isArray(payload.data)
    ? payload.data
    : Array.isArray(payload.result)
      ? payload.result
      : [];

  const rows = raw.map((r) => {
    const ticker = String(r.symbol ?? r.ticker ?? "").toUpperCase();
    const fundName = String(r.name ?? r.fund_name ?? r.description ?? ticker);
    return {
      ticker,
      fundName,
      category: r.type ? String(r.type) : r.fund_type ? String(r.fund_type) : undefined,
      exchange: r.exchange ? String(r.exchange) : undefined,
      currency: r.currency ? String(r.currency) : undefined,
      country: r.country ? String(r.country) : undefined,
    };
  }).filter((r) => r.ticker);

  return rows.length ? rows : null;
}
