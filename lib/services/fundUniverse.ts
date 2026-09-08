import { unstable_cache } from "next/cache";
import { screenBusinessQuantFunds, type FundScreenRow } from "@/lib/providers/businessQuant";

export type CachedFundUniverse = {
  rows: FundScreenRow[];
  providerUniverseTotal: number;
  snapshotSize: number;
  refreshedAt: string;
  source: "businessquant-daily-cache";
};

const loadBusinessQuantSnapshot = unstable_cache(
  async (): Promise<CachedFundUniverse | null> => {
    const result = await screenBusinessQuantFunds({
      limit: 500,
      offset: 0,
      sort: "net_assets_usd",
      sortDir: "desc",
    });
    if (!result) return null;
    return {
      rows: result.rows,
      providerUniverseTotal: result.universeTotal,
      snapshotSize: result.rows.length,
      refreshedAt: new Date().toISOString(),
      source: "businessquant-daily-cache",
    };
  },
  ["businessquant-etf-core-universe-v1"],
  { revalidate: 86400, tags: ["businessquant-etf-universe"] },
);

export async function getCachedFundUniverse() {
  return loadBusinessQuantSnapshot();
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
  const value = (r: FundScreenRow) => {
    if (field === "return_1y_pct") return r.return1yPct ?? Number.NEGATIVE_INFINITY;
    if (field === "net_flow_12m_usd") return r.netFlow12mUsd ?? Number.NEGATIVE_INFINITY;
    if (field === "net_expense_ratio_pct") return r.expenseRatioPct ?? Number.POSITIVE_INFINITY;
    return r.netAssetsUsd ?? Number.NEGATIVE_INFINITY;
  };
  rows.sort((a, b) => (value(a) - value(b)) * dir);

  const offset = Math.max(options.offset ?? 0, 0);
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 500);
  return {
    rows: rows.slice(offset, offset + limit),
    totalMatched: rows.length,
    offset,
    limit,
  };
}
