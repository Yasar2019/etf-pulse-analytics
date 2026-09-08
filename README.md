# ETF Pulse Analytics

A visual-first ETF intelligence platform inspired by the useful discovery primitives of ETF databases, redesigned for a younger and more modern audience.

## V0.2

- Overview command center
- ETF screener/explorer
- Sector intelligence page
- Head-to-head ETF comparison
- ETF detail pages with holdings + classification
- Reusable ETF taxonomy: asset class, sector, theme, geography, issuer
- Provider abstraction for replacing demo data with a licensed market/fund-data API
- Responsive dark UI with custom CSS, no component-library lock-in

## Routes

- `/` — Market overview
- `/explore` — ETF screener
- `/sectors` — Sector rankings
- `/compare` — ETF comparison
- `/etf/[symbol]` — ETF detail page

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Data

Current figures are illustrative demo data, intentionally isolated in `lib/demoData.ts`. Do not use them for investment decisions.

The `ETFDataProvider` contract in `lib/provider.ts` is the integration point for live providers.

## Product roadmap

1. Live ETF/fundamental data adapter
2. Historical price + flow timeseries
3. Advanced multi-dimensional screener
4. Theme/geography/issuer dashboards
5. Holdings overlap + stock exposure engine
6. Portfolio analyzer
7. Watchlists and alerts
8. Authentication and saved views
