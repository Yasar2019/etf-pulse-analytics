export type LiveHolding = { symbol: string; name: string; weight: number };
export type SectorWeight = { sector: string; weight: number };
export type ETFProfileSnapshot = {
  netAssets?: number;
  expenseRatio?: number;
  turnover?: number;
  nav?: number;
  inceptionDate?: string;
  holdings: LiveHolding[];
  sectors: SectorWeight[];
  source: "alpha-vantage";
};

type AlphaHolding = { symbol?: string; description?: string; weight?: string | number };
type AlphaSector = { sector?: string; weight?: string | number };
type AlphaProfile = {
  Information?: string;
  Note?: string;
  net_assets?: string | number;
  expense_ratio?: string | number;
  turnover?: string | number;
  nav?: string | number;
  inception_date?: string;
  holdings?: AlphaHolding[];
  sectors?: AlphaSector[];
};

const BASE_URL = "https://www.alphavantage.co/query";

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string") return undefined;
  const normalized = value.replace(/[$,%]/g, "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeWeight(value: unknown): number {
  const n = toNumber(value) ?? 0;
  return n <= 1 ? n * 100 : n;
}

export async function getAlphaVantageETFProfile(symbol: string): Promise<ETFProfileSnapshot | null> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY?.trim();
  if (!apiKey) return null;

  const params = new URLSearchParams({ function: "ETF_PROFILE", symbol: symbol.toUpperCase(), apikey: apiKey });
  const response = await fetch(`${BASE_URL}?${params.toString()}`, { next: { revalidate: 86400 } });
  if (!response.ok) throw new Error(`Alpha Vantage ETF profile failed with ${response.status}`);

  const payload = (await response.json()) as AlphaProfile;
  if (payload.Information || payload.Note) throw new Error(payload.Information || payload.Note || "Alpha Vantage unavailable");

  return {
    netAssets: toNumber(payload.net_assets),
    expenseRatio: toNumber(payload.expense_ratio),
    turnover: toNumber(payload.turnover),
    nav: toNumber(payload.nav),
    inceptionDate: payload.inception_date,
    holdings: (payload.holdings ?? []).map((h) => ({
      symbol: h.symbol ?? "—",
      name: h.description ?? h.symbol ?? "Unknown",
      weight: normalizeWeight(h.weight),
    })).filter((h) => h.weight > 0),
    sectors: (payload.sectors ?? []).map((s) => ({
      sector: s.sector ?? "Other",
      weight: normalizeWeight(s.weight),
    })).filter((s) => s.weight > 0),
    source: "alpha-vantage",
  };
}
