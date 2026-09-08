export type SeriesPoint = { label: string; value: number };

export const marketPerformance: SeriesPoint[] = [
  { label: "Jan", value: 100 }, { label: "Feb", value: 103 }, { label: "Mar", value: 101.5 },
  { label: "Apr", value: 106.4 }, { label: "May", value: 109.2 }, { label: "Jun", value: 113.8 },
  { label: "Jul", value: 112.6 }, { label: "Aug", value: 118.9 }, { label: "Sep", value: 121.4 },
];

export const monthlyFlows: SeriesPoint[] = [
  { label: "Apr", value: 48 }, { label: "May", value: 62 }, { label: "Jun", value: 55 },
  { label: "Jul", value: 74 }, { label: "Aug", value: 69 }, { label: "Sep", value: 91.4 },
];

export const breadth = [
  { label: "Above 200D MA", value: 68, tone: "positive" },
  { label: "Positive 30D flow", value: 61, tone: "positive" },
  { label: "New 3M highs", value: 43, tone: "neutral" },
  { label: "High-volatility funds", value: 27, tone: "negative" },
];

export const flowLeaders = [
  { symbol: "VOO", name: "Vanguard S&P 500 ETF", value: 8.6 },
  { symbol: "TLT", name: "iShares 20+ Year Treasury", value: 3.5 },
  { symbol: "XLK", name: "Technology Select Sector", value: 2.8 },
  { symbol: "SCHD", name: "Schwab U.S. Dividend Equity", value: 2.1 },
  { symbol: "XLF", name: "Financial Select Sector", value: 1.9 },
];

export const marketSignals = [
  { label: "Risk appetite", value: "Constructive", detail: "Equity and growth ETFs continue to lead flows." },
  { label: "Leadership", value: "Technology", detail: "Highest combined momentum and 30D inflows." },
  { label: "Defensive bid", value: "Rising", detail: "Long-duration Treasury demand has improved." },
  { label: "Fee pressure", value: "Persistent", detail: "Core beta funds remain clustered below 10 bps." },
];

const profiles: Record<string, number[]> = {
  VOO: [100,101.8,100.9,104.7,106.1,109.6,108.9,113.2,115.6,118.9],
  QQQ: [100,102.4,100.7,106.8,109.4,113.8,112.1,118.6,120.8,122.6],
  XLK: [100,103.2,101.1,107.9,111.2,115.3,113.4,120.2,124.1,127.2],
  XLF: [100,101.1,102.6,104.2,106.8,108.7,108.1,111.9,114.3,117.5],
  TLT: [100,98.4,99.2,97.8,100.1,101.6,100.7,102.9,103.8,104.8],
  GLD: [100,103.9,106.8,108.4,112.9,115.1,117.8,121.3,126.8,129.4],
  ARKK: [100,96.2,99.8,102.4,105.7,101.9,106.3,108.1,109.7,110.8],
  SCHD: [100,101.4,102.1,103.8,105.6,107.2,106.9,109.4,111.5,113.7],
};

export function getPerformanceSeries(symbol: string): SeriesPoint[] {
  const values = profiles[symbol.toUpperCase()];
  if (!values) return [];
  const labels = ["Dec","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep"];
  return values.map((value, i) => ({ label: labels[i], value }));
}
