import { ETF } from "./types";

export const headline = [
  { label: "ETF Universe", value: "3,842", delta: "+126 Y/Y" },
  { label: "Tracked AUM", value: "$12.6T", delta: "+11.8% Y/Y" },
  { label: "30D Net Flows", value: "+$91.4B", delta: "+14.2% M/M" },
  { label: "Median Fee", value: "0.22%", delta: "-2 bps Y/Y" },
];

export const sectors = [
  { name: "Technology", returnPct: 18.4, flow: 12.8, score: 94 },
  { name: "Industrials", returnPct: 15.2, flow: 5.4, score: 82 },
  { name: "Financials", returnPct: 13.8, flow: 7.1, score: 78 },
  { name: "Communication", returnPct: 12.5, flow: 4.2, score: 72 },
  { name: "Consumer Discretionary", returnPct: 10.9, flow: 3.8, score: 65 },
  { name: "Healthcare", returnPct: 7.6, flow: -1.1, score: 52 },
];

export const assetMix = [
  { label: "Equity", share: 66 },
  { label: "Fixed Income", share: 22 },
  { label: "Commodity", share: 5 },
  { label: "Multi-Asset", share: 4 },
  { label: "Alternatives", share: 3 },
];

export const etfs: ETF[] = [
  { symbol: "VOO", name: "Vanguard S&P 500 ETF", category: "Large Blend", assetClass: "Equity", sector: "Broad Market", theme: "Core", issuer: "Vanguard", geography: "United States", aum: "$685.0B", aumBn: 685, expense: "0.03%", expensePct: .03, ytd: 11.8, return1y: 18.9, flow: "+$8.6B", flowBn: 8.6, yieldPct: 1.2, volatility: 12.8, risk: "Moderate", price: 587.42, change: .62, holdings: [{symbol:"NVDA",name:"NVIDIA",weight:7.4},{symbol:"MSFT",name:"Microsoft",weight:6.6},{symbol:"AAPL",name:"Apple",weight:6.1},{symbol:"AMZN",name:"Amazon",weight:3.9},{symbol:"META",name:"Meta Platforms",weight:2.9}] },
  { symbol: "QQQ", name: "Invesco QQQ Trust", category: "Large Growth", assetClass: "Equity", sector: "Technology", theme: "Growth", issuer: "Invesco", geography: "United States", aum: "$340.0B", aumBn: 340, expense: "0.20%", expensePct: .20, ytd: 14.9, return1y: 22.6, flow: "+$4.2B", flowBn: 4.2, yieldPct: .55, volatility: 16.7, risk: "High", price: 611.84, change: .91, holdings: [{symbol:"NVDA",name:"NVIDIA",weight:9.2},{symbol:"MSFT",name:"Microsoft",weight:8.1},{symbol:"AAPL",name:"Apple",weight:7.7},{symbol:"AMZN",name:"Amazon",weight:5.8},{symbol:"AVGO",name:"Broadcom",weight:5.1}] },
  { symbol: "XLK", name: "Technology Select Sector SPDR Fund", category: "Technology", assetClass: "Equity", sector: "Technology", theme: "Sector", issuer: "State Street", geography: "United States", aum: "$78.4B", aumBn: 78.4, expense: "0.08%", expensePct: .08, ytd: 18.4, return1y: 27.2, flow: "+$2.8B", flowBn: 2.8, yieldPct: .66, volatility: 18.1, risk: "High", price: 283.11, change: 1.12, holdings: [{symbol:"NVDA",name:"NVIDIA",weight:15.8},{symbol:"MSFT",name:"Microsoft",weight:13.7},{symbol:"AAPL",name:"Apple",weight:12.9},{symbol:"AVGO",name:"Broadcom",weight:8.1},{symbol:"CRM",name:"Salesforce",weight:3.2}] },
  { symbol: "XLF", name: "Financial Select Sector SPDR Fund", category: "Financials", assetClass: "Equity", sector: "Financials", theme: "Sector", issuer: "State Street", geography: "United States", aum: "$54.1B", aumBn: 54.1, expense: "0.08%", expensePct: .08, ytd: 13.8, return1y: 17.5, flow: "+$1.9B", flowBn: 1.9, yieldPct: 1.45, volatility: 14.5, risk: "Moderate", price: 56.42, change: .38, holdings: [{symbol:"BRK.B",name:"Berkshire Hathaway",weight:12.1},{symbol:"JPM",name:"JPMorgan Chase",weight:11.4},{symbol:"V",name:"Visa",weight:8.2},{symbol:"MA",name:"Mastercard",weight:6.4},{symbol:"BAC",name:"Bank of America",weight:4.3}] },
  { symbol: "TLT", name: "iShares 20+ Year Treasury Bond ETF", category: "Fixed Income — Long Government", assetClass: "Fixed Income", sector: "Government Bonds", theme: "Duration", issuer: "iShares", geography: "United States", aum: "$51.2B", aumBn: 51.2, expense: "0.15%", expensePct: .15, ytd: 3.1, return1y: 4.8, flow: "+$3.5B", flowBn: 3.5, yieldPct: 4.1, volatility: 13.4, risk: "Moderate", price: 88.27, change: -.18, holdings: [{symbol:"UST",name:"U.S. Treasury 4.75%",weight:7.3},{symbol:"UST",name:"U.S. Treasury 4.625%",weight:6.8},{symbol:"UST",name:"U.S. Treasury 4.5%",weight:6.4},{symbol:"UST",name:"U.S. Treasury 4.25%",weight:5.9},{symbol:"UST",name:"U.S. Treasury 4.0%",weight:5.5}] },
  { symbol: "GLD", name: "SPDR Gold Shares", category: "Commodity — Precious Metals", assetClass: "Commodity", sector: "Precious Metals", theme: "Gold", issuer: "State Street", geography: "Global", aum: "$98.6B", aumBn: 98.6, expense: "0.40%", expensePct: .40, ytd: 21.7, return1y: 29.4, flow: "+$1.4B", flowBn: 1.4, yieldPct: 0, volatility: 15.1, risk: "Moderate", price: 351.63, change: .25, holdings: [{symbol:"GOLD",name:"Gold bullion",weight:100}] },
  { symbol: "ARKK", name: "ARK Innovation ETF", category: "Thematic Innovation", assetClass: "Equity", sector: "Multi-Sector", theme: "Disruptive Innovation", issuer: "ARK Invest", geography: "Global", aum: "$7.4B", aumBn: 7.4, expense: "0.75%", expensePct: .75, ytd: 9.2, return1y: 10.8, flow: "-$0.6B", flowBn: -.6, yieldPct: 0, volatility: 34.8, risk: "High", price: 74.18, change: 1.48, holdings: [{symbol:"TSLA",name:"Tesla",weight:10.1},{symbol:"COIN",name:"Coinbase",weight:8.3},{symbol:"ROKU",name:"Roku",weight:6.7},{symbol:"HOOD",name:"Robinhood",weight:6.1},{symbol:"CRSP",name:"CRISPR Therapeutics",weight:5.3}] },
  { symbol: "SCHD", name: "Schwab U.S. Dividend Equity ETF", category: "Dividend Equity", assetClass: "Equity", sector: "Multi-Sector", theme: "Dividend", issuer: "Schwab", geography: "United States", aum: "$74.8B", aumBn: 74.8, expense: "0.06%", expensePct: .06, ytd: 8.1, return1y: 13.7, flow: "+$2.1B", flowBn: 2.1, yieldPct: 3.5, volatility: 11.2, risk: "Low", price: 31.82, change: .22, holdings: [{symbol:"ABBV",name:"AbbVie",weight:4.4},{symbol:"HD",name:"Home Depot",weight:4.2},{symbol:"CSCO",name:"Cisco",weight:4.1},{symbol:"KO",name:"Coca-Cola",weight:4.0},{symbol:"AMGN",name:"Amgen",weight:3.9}] },
];

export const taxonomy = {
  assetClasses: ["Equity", "Fixed Income", "Commodity", "Multi-Asset", "Alternatives"],
  sectors: ["Technology", "Financials", "Healthcare", "Industrials", "Energy", "Real Estate", "Consumer", "Utilities", "Communication"],
  themes: ["Core", "Growth", "Dividend", "Sector", "Disruptive Innovation", "Gold", "Duration"],
  geographies: ["United States", "Developed Markets", "Emerging Markets", "Global", "Single Country"],
  issuers: ["Vanguard", "iShares", "State Street", "Invesco", "Schwab", "ARK Invest"],
};
