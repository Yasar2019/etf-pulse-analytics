# ETF Pulse Analytics

A modern, visual-first ETF intelligence platform for exploring funds by asset class, sector, theme, issuer and geography.

## V0.4

The current prototype includes:

- Market command-center overview with ETF KPIs and ticker strip
- ETF composite performance visualization and monthly fund-flow chart
- Market Intelligence / Insights page with breadth, leadership and regime signals
- ETF screener with search and classification filters
- Sector momentum dashboard
- Head-to-head ETF comparison
- Dynamic ETF detail pages with holdings, ETF DNA, performance chart and readable fund signals
- Provider-aware ETF history with automatic demo fallback
- Visible live-vs-demo data status indicators
- Server-side Twelve Data adapter for historical ETF price series
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

## Run the real website locally on Windows

### Easiest way

Clone the repository, open PowerShell inside the project folder, then run:

```powershell
./run-local.ps1
```

The script installs dependencies when needed, opens your browser, and starts the real Next.js development server at:

```text
http://localhost:3000
```

### Manual way

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

Node.js LTS is required.

## Optional live ETF price history

The application runs without credentials using curated demo data.

To enable provider-backed historical ETF prices:

1. Copy `.env.example` to `.env.local`.
2. Add your Twelve Data API key:

```env
TWELVE_DATA_API_KEY=your_key_here
```

3. Restart the development server.
4. Open an ETF page such as `/etf/SPY` and inspect the data-status banner.
5. Visit `/api/status` to verify the active provider.

The API key is read server-side only and should never be committed to GitHub.

## Data architecture

V0.4 intentionally uses a hybrid approach:

- Historical ETF price series can come from Twelve Data when configured.
- Classification, holdings, AUM, fees, yields and flows still use the curated prototype dataset.
- If the live price provider fails, ETF detail pages automatically fall back to the demo performance series rather than breaking the UI.

This separation lets us add licensed ETF metadata, holdings and flow providers later without redesigning the front end.

## Next production milestones

1. Live ETF quote + metadata adapter
2. Holdings and sector exposure ingestion
3. Fund-flow history and rankings
4. Persistence, caching and scheduled ingestion
5. Watchlists and saved comparisons
6. Authentication and deployment pipeline

Not investment advice.
