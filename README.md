# ETF Pulse Analytics

A modern, visual-first ETF intelligence platform for exploring funds by asset class, sector, theme, issuer and geography.

## V0.3

The current prototype includes:

- Market command-center overview with ETF KPIs and ticker strip
- ETF composite performance visualization and monthly fund-flow chart
- Market Intelligence / Insights page with breadth, leadership and regime signals
- ETF screener with search and classification filters
- Sector momentum dashboard
- Head-to-head ETF comparison
- Dynamic ETF detail pages with holdings, ETF DNA, performance chart and readable fund signals
- Responsive dark UI designed for newer retail investors without sacrificing analytical depth
- Provider boundary (`ETFDataProvider`) ready to be connected to licensed production market data

## Routes

- `/` — Market overview
- `/explore` — ETF screener
- `/sectors` — Sector intelligence
- `/compare` — ETF comparison
- `/insights` — Market intelligence
- `/etf/[symbol]` — ETF detail

## Development

```bash
npm install
npm run dev
```

## Data status

All displayed market values are currently curated demo data. They are intentionally isolated behind the provider/data layer so a licensed live data source can replace them without redesigning the application.

## Next production milestones

1. Licensed ETF metadata + quote provider
2. Historical NAV / market-price time series
3. Holdings and sector exposure ingestion
4. Fund-flow history and rankings
5. Persistence, caching and scheduled ingestion
6. Watchlists and saved comparisons
7. Authentication and deployment pipeline

Not investment advice.
