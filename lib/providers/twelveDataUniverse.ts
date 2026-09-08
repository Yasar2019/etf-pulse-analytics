export type TwelveDataETFDirectoryRow = {
  ticker: string;
  fundName: string;
  category?: string;
  exchange?: string;
  currency?: string;
  country?: string;
};

type DirectoryRecord = Record<string, unknown>;
type TwelveDirectoryPayload =
  | DirectoryRecord[]
  | {
      data?: DirectoryRecord[];
      result?: DirectoryRecord[] | DirectoryRecord;
      status?: string;
      message?: string;
      code?: number;
    };

const BASE_URL = "https://api.twelvedata.com";

export async function getTwelveDataETFDirectory(): Promise<TwelveDataETFDirectoryRow[] | null> {
  const apiKey = process.env.TWELVE_DATA_API_KEY?.trim();
  if (!apiKey) return null;

  // Twelve Data's documented ETF reference endpoint is /etf.
  // Reference docs list symbol and format filters; do not send unsupported country filters here.
  const params = new URLSearchParams({ apikey: apiKey, format: "JSON" });
  const response = await fetch(`${BASE_URL}/etf?${params.toString()}`, { next: { revalidate: 86400 } });
  if (!response.ok) {
    let detail = "";
    try { detail = JSON.stringify(await response.json()); } catch {}
    throw new Error(`Twelve Data ETF directory failed with ${response.status}${detail ? ` · ${detail.slice(0,240)}` : ""}`);
  }

  const payload = (await response.json()) as TwelveDirectoryPayload;
  if (!Array.isArray(payload) && payload.status === "error") {
    throw new Error(payload.message || `Twelve Data ETF directory unavailable${payload.code ? ` (${payload.code})` : ""}`);
  }

  const raw: DirectoryRecord[] = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.data)
      ? payload.data
      : Array.isArray(payload.result)
        ? payload.result
        : [];

  const rows = raw.map((r) => {
    const ticker = String(r.symbol ?? r.ticker ?? "").trim().toUpperCase();
    const fundName = String(r.name ?? r.fund_name ?? r.description ?? ticker).trim();
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
