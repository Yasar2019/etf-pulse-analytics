import type { ETF } from "../types";

const BASE_URL = "https://data.businessquant.com";

function apiKey() {
  return process.env.BUSINESSQUANT_API_KEY?.trim();
}

async function getJson(path: string, params: Record<string, string | number>) {
  const key = apiKey();
  if (!key) return null;
  const search = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([k,v])=>[k,String(v)])), api_key: key });
  const response = await fetch(`${BASE_URL}${path}?${search.toString()}`, { next: { revalidate: 21600 } });
  if (!response.ok) throw new Error(`BusinessQuant ${path} failed with ${response.status}`);
  const payload = await response.json();
  if (payload?.error) throw new Error(String(payload.error));
  return payload;
}

function fmtAum(value?: number) {
  if (!Number.isFinite(value)) return "$0";
  const n = value!;
  if (n >= 1e12) return `$${(n/1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n/1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n/1e6).toFixed(0)}M`;
  return `$${n.toFixed(0)}`;
}

export type BusinessQuantOverview = {
  ticker: string;
  fundName: string;
  className?: string;
  netExpenseRatioPct?: number;
  netAssetsUsd?: number;
  turnoverPct?: number;
  investmentObjective?: string;
  strategy?: string;
  source: "businessquant";
};

export async function getBusinessQuantOverview(symbol: string): Promise<BusinessQuantOverview | null> {
  const payload = await getJson("/funds/overview", { ticker: symbol.toUpperCase() });
  if (!payload?.metadata?.ticker) return null;
  const m = payload.metadata;
  return {
    ticker: String(m.ticker),
    fundName: String(m.fund_name ?? m.ticker),
    className: m.class_name ? String(m.class_name) : undefined,
    netExpenseRatioPct: Number.isFinite(Number(m.net_expense_ratio_pct)) ? Number(m.net_expense_ratio_pct) : undefined,
    netAssetsUsd: Number.isFinite(Number(m.net_assets_usd)) ? Number(m.net_assets_usd) : undefined,
    turnoverPct: Number.isFinite(Number(m.portfolio_turnover_pct)) ? Number(m.portfolio_turnover_pct) : undefined,
    investmentObjective: m.investment_objective ? String(m.investment_objective) : undefined,
    strategy: m.principal_strategy ? String(m.principal_strategy) : undefined,
    source: "businessquant",
  };
}

export async function getBusinessQuantETFStub(symbol: string): Promise<ETF | null> {
  const overview = await getBusinessQuantOverview(symbol);
  if (!overview) return null;
  const aum = overview.netAssetsUsd ?? 0;
  const expense = overview.netExpenseRatioPct ?? 0;
  return {
    symbol: overview.ticker,
    name: overview.fundName,
    category: "ETF",
    assetClass: "ETF",
    sector: "Multi-Sector",
    theme: "Fund",
    issuer: overview.className ?? "Fund issuer",
    geography: "United States",
    aum: fmtAum(aum),
    aumBn: aum / 1e9,
    expense: `${expense.toFixed(2)}%`,
    expensePct: expense,
    ytd: 0,
    return1y: 0,
    flow: "$0",
    flowBn: 0,
    yieldPct: 0,
    volatility: 0,
    risk: "Moderate",
    price: 0,
    change: 0,
    holdings: [],
  };
}

export type PortfolioHolding = {
  key: string;
  ticker?: string;
  name: string;
  issuer?: string;
  weightPct: number;
  sector?: string;
  country?: string;
  assetClass?: string;
};

export async function getBusinessQuantHoldings(symbol: string, limit = 1000): Promise<PortfolioHolding[] | null> {
  const payload = await getJson("/funds/holdings", { ticker: symbol.toUpperCase(), limit: Math.min(Math.max(limit, 1), 5000) });
  const rows = (payload?.data ?? []).map((r: any) => {
    const ticker = r.instrument_ticker ? String(r.instrument_ticker).toUpperCase() : undefined;
    const issuer = r.issuer_name ? String(r.issuer_name) : undefined;
    const name = String(r.instrument_name ?? issuer ?? ticker ?? "Unknown holding");
    return {
      key: ticker || issuer || name,
      ticker,
      name,
      issuer,
      weightPct: Number(r.weight_pct ?? 0),
      sector: r.sector ? String(r.sector) : undefined,
      country: r.country_name ? String(r.country_name) : undefined,
      assetClass: r.asset_class ? String(r.asset_class) : undefined,
    } as PortfolioHolding;
  }).filter((r: PortfolioHolding) => Number.isFinite(r.weightPct) && r.weightPct !== 0);
  return rows.length ? rows : null;
}

export type OverlapResult = {
  a: string;
  b: string;
  overlapPct: number;
  commonCount: number;
  aCount: number;
  bCount: number;
  common: Array<{ key: string; ticker?: string; name: string; weightA: number; weightB: number; overlapWeight: number }>;
  source: "businessquant";
};

export async function comparePortfolioOverlap(a: string, b: string): Promise<OverlapResult | null> {
  const [ha, hb] = await Promise.all([getBusinessQuantHoldings(a), getBusinessQuantHoldings(b)]);
  if (!ha || !hb) return null;
  const mapB = new Map(hb.map(h => [h.key, h]));
  const common = ha.flatMap(x => {
    const y = mapB.get(x.key);
    if (!y) return [];
    return [{
      key: x.key,
      ticker: x.ticker ?? y.ticker,
      name: x.name,
      weightA: x.weightPct,
      weightB: y.weightPct,
      overlapWeight: Math.min(Math.abs(x.weightPct), Math.abs(y.weightPct)),
    }];
  }).sort((x,y)=>y.overlapWeight-x.overlapWeight);
  return {
    a: a.toUpperCase(),
    b: b.toUpperCase(),
    overlapPct: Number(common.reduce((sum, row)=>sum+row.overlapWeight,0).toFixed(2)),
    commonCount: common.length,
    aCount: ha.length,
    bCount: hb.length,
    common: common.slice(0,40),
    source: "businessquant",
  };
}
