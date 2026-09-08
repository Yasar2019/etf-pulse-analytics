# ETF Pulse Analytics

A modern, visual-first ETF intelligence platform for exploring funds by asset class, sector, theme, issuer and geography.

## V0.4+

The current prototype includes:

- Market command-center overview with ETF KPIs and ticker strip
- ETF composite performance visualization and monthly fund-flow chart
- Market Intelligence / Insights page with breadth, leadership and regime signals
- ETF screener with search and classification filters
- Sector momentum dashboard
- Head-to-head ETF comparison
- Dynamic ETF detail pages with holdings, ETF DNA, performance chart and readable fund signals
- Provider-aware ETF history with automatic demo fallback
- Live current quote from Twelve Data when configured
- Live-derived YTD return, 1-year return, volatility and risk from daily closes
- Optional Alpha Vantage ETF profile integration for AUM, expense ratio, turnover and holdings
- Visible LIVE / CURATED / DEMO source labels per metric
- `/api/status` health endpoint for inspecting provider mode
- Responsive dark UI designed for newer retail investors without sacrificing analytical depth

## Routes

- `/` — Market overview
- `/explore` — ETF screener
- `/sectors` — Sector intelligence
- `/compare` — ETF comparison
- `/insights` — Market intelligence
- `/etf/[symbol]` — ETF detail
- `/api/status` — data-provider health/status

## Run locally on Windows

```powershell
./run-local.ps1
```

Or manually:

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Live data setup

Copy `.env.example` to `.env.local` and add either or both API keys:

```env
TWELVE_DATA_API_KEY=your_twelve_data_key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
```

Restart the development server after changing environment variables.

### Twelve Data currently powers

- Current/latest ETF quote
- Daily % change
- Historical daily price series
- YTD return derived from price history
- 1-year return derived from price history
- Annualized volatility derived from daily returns
- Risk classification derived from volatility

### Alpha Vantage currently powers

- ETF net assets / AUM
- Expense ratio
- Turnover
- Inception date when available
- Top holdings
- Sector weights in the provider adapter, ready for UI expansion

### Still curated/demo

- 30-day fund flows
- Yield
- Some taxonomy/classification fields

The API keys are server-side only and should never be committed to GitHub.

## Data architecture

ETF Pulse intentionally uses a hybrid provider model. Market-price data and ETF-profile data are isolated behind server-side adapters so providers can be swapped or upgraded later without redesigning the UI. The app falls back to curated/demo data when a provider is missing, rate-limited, or unavailable.

## Next production milestones

1. Real fund-flow provider
2. Sector exposure visualizations using live ETF profiles
3. Caching/persistence layer to minimize third-party API calls
4. Watchlists and saved comparisons
5. Authentication
6. Deployment pipeline

Not investment advice.
