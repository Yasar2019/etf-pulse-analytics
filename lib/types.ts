export type RiskLevel = "Low" | "Moderate" | "High";

export type ETF = {
  symbol: string;
  name: string;
  category: string;
  assetClass: string;
  sector: string;
  theme: string;
  issuer: string;
  geography: string;
  aum: string;
  aumBn: number;
  expense: string;
  expensePct: number;
  ytd: number;
  return1y: number;
  flow: string;
  flowBn: number;
  yieldPct: number;
  volatility: number;
  risk: RiskLevel;
  price: number;
  change: number;
  holdings: { symbol: string; name: string; weight: number }[];
};
