import { unstable_cache } from "next/cache";
import { screenBusinessQuantFunds, type FundScreenRow } from "@/lib/providers/businessQuant";
import { getTwelveDataETFDirectory } from "@/lib/providers/twelveDataUniverse";

export type CachedFundUniverse = {
  rows: FundScreenRow[];
  providerUniverseTotal: number;
  snapshotSize: number;
  refreshedAt: string;
  source: "businessquant-daily-cache" | "twelve-data-directory";
  enriched: boolean;
};

const loadBusinessQuantSnapshot = unstable_cache(
  async (): Promise<CachedFundUniverse | null> => {
    const result = await screenBusinessQuantFunds({ limit: 500, offset: 0, sort: "net_assets_usd", sortDir: "desc" });
    if (!result) return null;
    return {
      rows: result.rows,
      providerUniverseTotal: result.universeTotal,
      snapshotSize: result.rows.length,
      refreshedAt: new Date().toISOString(),
      source: "businessquant-daily-cache",
      enriched: true,
    };
  },
  ["businessquant-etf-core-universe-v2"],
  { revalidate: 86400, tags: ["businessquant-etf-universe"] },
);

const loadTwelveDataDirectory = unstable_cache(
  async (): Promise<CachedFundUniverse | null> => {
    const directory = await getTwelveDataETFDirectory();
    if (!directory) return null;
    const rows: FundScreenRow[] = directory.map((r) => ({
      ticker: r.ticker,
      fundName: r.fundName,
      category: r.category,
    }));
    return {
      rows,
      providerUniverseTotal: rows.length,
      snapshotSize: rows.length,
      refreshedAt: new Date().toISOString(),
      source: "twelve-data-directory",
      enriched: false,
    };
  },
  ["twelve-data-etf-directory-v1"],
  { revalidate: 86400, tags: ["twelve-data-etf-universe"] },
);

export async function getCachedFundUniverse() {
  let businessQuantError: Error | null = null;
  try {
    const enriched = await loadBusinessQuantSnapshot();
    if (enriched?.rows.length) return { universe: enriched, businessQuantError };
  } catch (error) {
    businessQuantError = error instanceof Error ? error : new Error("BusinessQuant universe unavailable");
  }

  try {
    const directory = await loadTwelveDataDirectory();
    if (directory?.rows.length) return { universe: directory, businessQuantError };
  } catch {}

  return { universe: null, businessQuantError };
}

export function queryCachedUniverse(
  universe: CachedFundUniverse,
  options: { search?: string; sort?: string; sortDir?: "asc" | "desc"; offset?: number; limit?: number },
) {
  const search = options.search?.trim().toLowerCase();
  let rows = search
    ? universe.rows.filter((r) => `${r.ticker} ${r.fundName} ${r.category ?? ""} ${r.topSector ?? ""}`.toLowerCase().includes(search))
    : [...universe.rows];

  const field = options.sort ?? "net_assets_usd";
  const dir = options.sortDir === "asc" ? 1 : -1;
  const numeric = (r: FundScreenRow): number | undefined => {
    if (field === "return_1y_pct") return r.return1yPct;
    if (field === "net_flow_12m_usd") return r.netFlow12mUsd;
    if (field === "net_expense_ratio_pct") return r.expenseRatioPct;
    return r.netAssetsUsd;
  };

  if (universe.enriched) {
    rows.sort((a, b) => {
      const av = numeric(a), bv = numeric(b);
      if (av === undefined && bv === undefined) return a.ticker.localeCompare(b.ticker);
      if (av === undefined) return 1;
      if (bv === undefined) return -1;
      return (av - bv) * dir;
    });
  } else {
    rows.sort((a, b) => a.ticker.localeCompare(b.ticker));
  }

  const offset = Math.max(options.offset ?? 0, 0);
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 500);
  return { rows: rows.slice(offset, offset + limit), totalMatched: rows.length, offset, limit };
}
