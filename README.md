# ETF Pulse Analytics

A modern, visual-first ETF intelligence platform for exploring funds by asset class, sector, theme, issuer and geography.

## V0.5

The current prototype includes:

- Market command-center overview with ETF KPIs and ticker strip
- ETF composite performance visualization and monthly fund-flow chart
- Market Intelligence / Insights page with breadth, leadership and regime signals
- Live ETF screener backed by BusinessQuant when configured
- Live ETF-universe sector leaderboard aggregated from screener data
- Head-to-head ETF comparison using BusinessQuant comparison intelligence
- Dynamic ETF detail pages with holdings, ETF DNA, performance chart and readable fund signals
- Live current quote from Twelve Data when configured
- Live-derived YTD return, 1-year return, volatility and risk from daily closes
- Optional Alpha Vantage ETF profile integration for AUM, expense ratio, turnover, holdings and sector allocation
- Optional BusinessQuant integration for SEC-filed monthly ETF fund flows
- Visible LIVE / CURATED / DEMO source labels per metric
- Server-side API routes so provider keys stay private
- `/api/status` health endpoint for inspecting provider configuration

## Routes

- `/` — Market overview
- `/explore` — ETF screener
- `/sectors` — Sector intelligence
- `/compare` — ETF comparison
- `/insights` — Market intelligence
- `/etf/[symbol]` — ETF detail
- `/api/status` — data-provider health/status
- `/api/funds/screener` — server-side fund screener proxy
- `/api/funds/compare` — server-side fund comparison proxy

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

Copy `.env.example` to `.env.local` and add whichever providers you want to enable:

```env
TWELVE_DATA_API_KEY=your_twelve_data_key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
BUSINESSQUANT_API_KEY=your_businessquant_key
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
- Sector allocation visualization

### BusinessQuant currently powers

- Monthly ETF net flows sourced from SEC monthly filings
- 12-month flow history chart
- Aggregate inflow, outflow and net flow statistics
- ETF Explorer universe search and sorting
- Sector leadership aggregated from screened ETFs
- Fund comparison intelligence

### Still curated/demo

- Yield
- Some taxonomy/classification fields
- Any metric whose configured provider is missing, rate-limited or unavailable

The API keys are server-side only and should never be committed to GitHub.

## Data architecture

ETF Pulse intentionally uses a hybrid provider model. Market-price data, ETF-profile data, flows, screening and comparison live behind server-side adapters so providers can be swapped or upgraded later without redesigning the UI. The app falls back to curated/demo data when a provider is missing, rate-limited, or unavailable.

## Next production milestones

1. Persistence/cache layer to reduce third-party API calls
2. Live watchlists and saved comparisons
3. Authentication
4. Portfolio overlap analyzer
5. Deployment pipeline
6. Provider licensing review before public commercial launch

Not investment advice.
