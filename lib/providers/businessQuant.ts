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

type BusinessQuantResponse = {
  metadata?: { ticker?: string; fund_name?: string };
  summary?: { total_inflow_usd?: number; total_outflow_usd?: number; net_flow_usd?: number };
  data?: Array<{ month_end?: string; net_flow_usd?: number; net_assets_usd?: number; value_out_of_band?: boolean }>;
  message?: string;
  error?: string;
};

const BASE_URL = "https://data.businessquant.com/funds/flows";

export async function getBusinessQuantFundFlows(symbol: string): Promise<FundFlowSnapshot | null> {
  const apiKey = process.env.BUSINESSQUANT_API_KEY?.trim();
  if (!apiKey) return null;

  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), 1));
  const params = new URLSearchParams({
    ticker: symbol.toUpperCase(),
    from_date: from.toISOString().slice(0, 10),
    api_key: apiKey,
  });

  const response = await fetch(`${BASE_URL}?${params.toString()}`, { next: { revalidate: 21600 } });
  if (!response.ok) throw new Error(`BusinessQuant flow request failed with ${response.status}`);

  const payload = (await response.json()) as BusinessQuantResponse;
  if (payload.error || payload.message) throw new Error(payload.error || payload.message || "BusinessQuant unavailable");

  const points = (payload.data ?? [])
    .filter((row) => row.month_end && Number.isFinite(Number(row.net_flow_usd)))
    .map((row) => ({
      monthEnd: row.month_end!,
      netFlowUsd: Number(row.net_flow_usd ?? 0),
      netAssetsUsd: Number(row.net_assets_usd ?? 0),
      flagged: Boolean(row.value_out_of_band),
    }));

  if (!points.length) return null;

  return {
    ticker: payload.metadata?.ticker ?? symbol.toUpperCase(),
    fundName: payload.metadata?.fund_name,
    netFlowUsd: Number(payload.summary?.net_flow_usd ?? points.reduce((sum, p) => sum + p.netFlowUsd, 0)),
    totalInflowUsd: Number(payload.summary?.total_inflow_usd ?? points.filter(p => p.netFlowUsd > 0).reduce((sum, p) => sum + p.netFlowUsd, 0)),
    totalOutflowUsd: Number(payload.summary?.total_outflow_usd ?? points.filter(p => p.netFlowUsd < 0).reduce((sum, p) => sum + p.netFlowUsd, 0)),
    points,
    source: "businessquant",
  };
}
