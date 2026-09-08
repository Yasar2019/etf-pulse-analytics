export type FundFlowPoint = {
  monthEnd: string;
  netFlowUsd: number;
  netAssetsUsd: number;
  flagged: boolean;
};

export type FundFlowSnapshot = {
  ticker: string;
  fundName?: string;
  netFlowUsd: number;
  totalInflowUsd: number;
  totalOutflowUsd: number;
  points: FundFlowPoint[];
  source: "businessquant";
};

export type FundScreenRow = {
  ticker: string;
  fundName: string;
  category?: string;
  expenseRatioPct?: number;
  netAssetsUsd?: number;
  return1yPct?: number;
  netFlow12mUsd?: number;
  holdingsCount?: number;
  topSector?: string;
  topSectorPct?: number;
};

export type FundScreenResult = {
  rows: FundScreenRow[];
  totalMatched: number;
  universeTotal: number;
  source: "businessquant";
};

export type FundComparison = {
  tickers: string[];
  samePortfolio: boolean;
  differingCount: number;
  metricsTotal: number;
  rows: Record<string, unknown>[];
  groups: Array<{
    statement?: string;
    metrics?: Array<{
      field?: string;
      label?: string;
      unit?: string;
      differs?: boolean;
      direction?: string | null;
      leaders?: string[];
      laggards?: string[];
    }>;
  }>;
  source: "businessquant";
};

export type ExposureRow = {
  bucket: string;
  weightPct: number;
  holdingsCount?: number;
  reportPeriod?: string;
};

type BusinessQuantResponse = {
  metadata?: Record<string, any>;
  summary?: Record<string, any>;
  data?: Array<Record<string, any>>;
  message?: string;
  error?: string;
};

const BASE_URL = "https://data.businessquant.com";

function key() {
  return process.env.BUSINESSQUANT_API_KEY?.trim();
}

async function readJson(response: Response): Promise<BusinessQuantResponse> {
  if (!response.ok) throw new Error(`BusinessQuant request failed with ${response.status}`);
  const payload = (await response.json()) as BusinessQuantResponse;
  if (payload.error) throw new Error(String(payload.error));
  return payload;
}

export async function getBusinessQuantFundFlows(symbol: string): Promise<FundFlowSnapshot | null> {
  const apiKey = key();
  if (!apiKey) return null;
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), 1));
  const params = new URLSearchParams({ ticker: symbol.toUpperCase(), from_date: from.toISOString().slice(0, 10), api_key: apiKey });
  const payload = await readJson(await fetch(`${BASE_URL}/funds/flows?${params}`, { next: { revalidate: 21600 } }));
  const points = (payload.data ?? []).filter(r => r.month_end && Number.isFinite(Number(r.net_flow_usd))).map(r => ({
    monthEnd: String(r.month_end), netFlowUsd: Number(r.net_flow_usd ?? 0), netAssetsUsd: Number(r.net_assets_usd ?? 0), flagged: Boolean(r.value_out_of_band),
  }));
  if (!points.length) return null;
  return {
    ticker: String(payload.metadata?.ticker ?? symbol.toUpperCase()),
    fundName: payload.metadata?.fund_name ? String(payload.metadata.fund_name) : undefined,
    netFlowUsd: Number(payload.summary?.net_flow_usd ?? points.reduce((s,p)=>s+p.netFlowUsd,0)),
    totalInflowUsd: Number(payload.summary?.total_inflow_usd ?? points.filter(p=>p.netFlowUsd>0).reduce((s,p)=>s+p.netFlowUsd,0)),
    totalOutflowUsd: Number(payload.summary?.total_outflow_usd ?? points.filter(p=>p.netFlowUsd<0).reduce((s,p)=>s+p.netFlowUsd,0)),
    points, source: "businessquant",
  };
}

export async function screenBusinessQuantFunds(options?: { search?: string; limit?: number; sort?: string; sortDir?: "asc"|"desc"; category?: string }): Promise<FundScreenResult | null> {
  const apiKey = key();
  if (!apiKey) return null;
  const filters: Array<Record<string, unknown>> = [{ field: "vehicle", op: "eq", value: "ETF" }];
  if (options?.category) filters.push({ field: "category", op: "eq", value: options.category });
  const body: Record<string, unknown> = {
    filters,
    fields: ["category","net_expense_ratio_pct","net_assets_usd","return_1y_pct","net_flow_12m_usd","holdings_count","top_sector","top_sector_pct"],
    sort: [{ field: options?.sort || "net_assets_usd", dir: options?.sortDir || "desc" }],
    limit: Math.min(options?.limit ?? 40, 100),
  };
  if (options?.search?.trim()) body.search = options.search.trim().slice(0, 120);
  const response = await fetch(`${BASE_URL}/funds/screener?api_key=${encodeURIComponent(apiKey)}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), next: { revalidate: 900 },
  });
  const payload = await readJson(response);
  return {
    rows: (payload.data ?? []).map(r => ({
      ticker: String(r.ticker ?? ""), fundName: String(r.fund_name ?? r.className ?? "Unnamed fund"), category: r.category ? String(r.category) : undefined,
      expenseRatioPct: Number.isFinite(Number(r.net_expense_ratio_pct)) ? Number(r.net_expense_ratio_pct) : undefined,
      netAssetsUsd: Number.isFinite(Number(r.net_assets_usd)) ? Number(r.net_assets_usd) : undefined,
      return1yPct: Number.isFinite(Number(r.return_1y_pct)) ? Number(r.return_1y_pct) : undefined,
      netFlow12mUsd: Number.isFinite(Number(r.net_flow_12m_usd)) ? Number(r.net_flow_12m_usd) : undefined,
      holdingsCount: Number.isFinite(Number(r.holdings_count)) ? Number(r.holdings_count) : undefined,
      topSector: r.top_sector ? String(r.top_sector) : undefined,
      topSectorPct: Number.isFinite(Number(r.top_sector_pct)) ? Number(r.top_sector_pct) : undefined,
    })).filter(r => r.ticker),
    totalMatched: Number(payload.metadata?.total_matched ?? 0), universeTotal: Number(payload.metadata?.universe_total ?? 0), source: "businessquant",
  };
}

export async function compareBusinessQuantFunds(tickers: string[]): Promise<FundComparison | null> {
  const apiKey = key();
  if (!apiKey || tickers.length < 2) return null;
  const clean = tickers.map(t=>t.toUpperCase()).filter(Boolean).slice(0,6);
  const params = new URLSearchParams({ tickers: clean.join(","), api_key: apiKey });
  const payload = await readJson(await fetch(`${BASE_URL}/funds/compare?${params}`, { next: { revalidate: 1800 } }));
  return {
    tickers: (payload.metadata?.resolved ?? clean).map(String), samePortfolio: Boolean(payload.metadata?.same_portfolio),
    differingCount: Number(payload.metadata?.differing_count ?? 0), metricsTotal: Number(payload.metadata?.metrics_total ?? 0),
    rows: payload.data ?? [], groups: (payload.metadata?.groups ?? []) as FundComparison["groups"], source: "businessquant",
  };
}

export async function getBusinessQuantExposure(symbol: string, breakdown: "sector"|"country"|"asset_class" = "sector"): Promise<ExposureRow[] | null> {
  const apiKey = key();
  if (!apiKey) return null;
  const params = new URLSearchParams({ ticker: symbol.toUpperCase(), breakdown, periods: "1", api_key: apiKey });
  const payload = await readJson(await fetch(`${BASE_URL}/funds/exposure?${params}`, { next: { revalidate: 21600 } }));
  const rows = (payload.data ?? []).map(r => ({ bucket: String(r.bucket ?? "Other"), weightPct: Number(r.weight_pct ?? 0), holdingsCount: Number(r.holdings_count ?? 0), reportPeriod: r.reportperiod ? String(r.reportperiod) : undefined })).filter(r=>r.weightPct>0);
  return rows.length ? rows : null;
}
