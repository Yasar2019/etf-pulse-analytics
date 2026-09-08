import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import LineChart from "@/components/LineChart";
import { etfs } from "@/lib/demoData";
import { etfProvider } from "@/lib/provider";
import { getAlphaVantageETFProfile } from "@/lib/providers/alphaVantage";

export function generateStaticParams(){return etfs.map(e=>({symbol:e.symbol}))}

export default async function ETFPage({params}:{params:Promise<{symbol:string}>}){
  const {symbol}=await params;
  const e=await etfProvider.getETF(symbol);
  if(!e)return notFound();

  let providerStatus=await etfProvider.getProviderStatus();
  let perf; let quote; let stats;
  try{quote=await etfProvider.getQuote(e.symbol)}catch{quote={price:Number(e.price),change:0,percentChange:Number(e.change),source:"demo" as const};providerStatus={...providerStatus,currentQuote:false}}
  try{perf=await etfProvider.getPerformanceHistory(e.symbol)}catch{const {getPerformanceSeries}=await import("@/lib/analytics");perf=getPerformanceSeries(e.symbol);providerStatus={...providerStatus,historicalPrices:false}}
  try{stats=await etfProvider.getPerformanceStats(e.symbol)}catch{stats={ytdReturn:e.ytd,oneYearReturn:e.return1y,annualizedVolatility:e.volatility,risk:e.risk,source:"demo" as const}}

  let profile=null;
  try{profile=await getAlphaVantageETFProfile(e.symbol)}catch{profile=null}

  const quoteIsLive=quote.source==="twelve-data";
  const statsAreLive=stats.source==="twelve-data";
  const profileIsLive=profile?.source==="alpha-vantage";
  const aumValue=profile?.netAssets?`$${(profile.netAssets/1e9).toFixed(1)}B`:e.aum;
  const expenseValue=profile?.expenseRatio!==undefined?`${(profile.expenseRatio<=1?profile.expenseRatio*100:profile.expenseRatio).toFixed(2)}%`:e.expense;
  const holdings=profile?.holdings?.length?profile.holdings.slice(0,10):e.holdings;

  const metricCards=[
    ["AUM",aumValue,profileIsLive?"live":"curated"],
    ["Expense",expenseValue,profileIsLive?"live":"curated"],
    ["YTD Return",`${stats.ytdReturn}%`,statsAreLive?"live":"demo"],
    ["1Y Return",`${stats.oneYearReturn}%`,statsAreLive?"live":"demo"],
    ["30D Flow",e.flow,"demo"],
    ["Yield",`${e.yieldPct}%`,"curated"],
    ["Volatility",`${stats.annualizedVolatility}%`,statsAreLive?"live":"demo"],
    ["Risk",stats.risk,statsAreLive?"live":"demo"],
  ] as const;

  return <AppShell>
<header className="fundHeader"><div className="fundIdentity"><span className="tickerBadge big">{e.symbol}</span><div><span className="eyebrow">{e.assetClass} · {e.category}</span><h1>{e.name}</h1><p>{e.issuer} · {e.geography} · {e.theme}</p></div></div><div className="fundPrice"><strong>${quote.price.toFixed(2)}</strong><em className={quote.percentChange<0?"negative":"positive"}>{quote.percentChange>0?"+":""}{quote.percentChange.toFixed(2)}% today</em><small>{quoteIsLive?"Live quote":"Demo quote"}{quote.datetime?` · ${quote.datetime}`:""}</small></div></header>
<section className={`dataStatus ${providerStatus.mode}`}><div><span className="statusDot"/><strong>{providerStatus.mode==="live"?"Live market data":"Demo market data"}</strong><small>Twelve Data for prices{profileIsLive?" · Alpha Vantage for ETF profile":""}</small></div><div className="statusChips"><span className={quoteIsLive?"liveChip":"demoChip"}>Quote · {quoteIsLive?"live":"demo"}</span><span className={providerStatus.historicalPrices?"liveChip":"demoChip"}>History · {providerStatus.historicalPrices?"live":"demo"}</span><span className={statsAreLive?"liveChip":"demoChip"}>Returns/risk · {statsAreLive?"live-derived":"demo"}</span><span className={profileIsLive?"liveChip":"demoChip"}>AUM/expense · {profileIsLive?"live":"curated"}</span><span className={profileIsLive&&holdings===profile?.holdings.slice(0,10)?"liveChip":"demoChip"}>Holdings · {profileIsLive?"live":"curated"}</span><span className="demoChip">Flows · demo</span></div></section>
<section className="fundMetrics">{metricCards.map(([k,v,source])=><article key={k}><span>{k}</span><b>{v}</b><small className={`metricSource ${source}`}>{source==="live"?"LIVE":source.toUpperCase()}</small></article>)}</section>
<section className="panel fundChartPanel"><div className="panelHeader"><div><span className="eyebrow">PERFORMANCE</span><h2>Growth of $100</h2></div><div className="periodTabs"><b>1Y</b><span>3Y</span><span>5Y</span></div></div><LineChart data={perf}/></section>
<section className="detailGrid"><article className="panel"><div className="panelHeader"><div><span className="eyebrow">PORTFOLIO</span><h2>Top holdings</h2></div><span className={profileIsLive?"liveChip":"demoChip"}>{profileIsLive?"ALPHA VANTAGE":"CURATED"}</span></div><div className="holdings">{holdings.map((h,i)=><div key={`${h.symbol}-${i}`}><span className="holdingRank">{i+1}</span><div><b>{h.symbol}</b><small>{h.name}</small></div><div className="holdingBar"><i style={{width:`${Math.min(h.weight*5,100)}%`}}/></div><strong>{h.weight.toFixed(2)}%</strong></div>)}</div></article><article className="panel"><div className="panelHeader"><div><span className="eyebrow">CLASSIFICATION</span><h2>ETF DNA</h2></div></div><div className="dnaList">{[["Asset class",e.assetClass],["Sector",e.sector],["Theme",e.theme],["Issuer",e.issuer],["Geography",e.geography],["Category",e.category],["Turnover",profile?.turnover!==undefined?`${(profile.turnover<=1?profile.turnover*100:profile.turnover).toFixed(1)}%`:"—"],["Inception",profile?.inceptionDate??"—"]].map(([k,v])=><div key={k}><span>{k}</span><b>{v}</b></div>)}</div></article></section>
<section className="signalGrid fundSignals"><article className="signalCard"><span>Cost profile · {profileIsLive?"live":"curated"}</span><b>{(profile?.expenseRatio??e.expensePct)<=.1?"Ultra low":"Specialized"}</b><p>Expense ratio is now sourced from Alpha Vantage when configured.</p></article><article className="signalCard"><span>Flow signal · demo</span><b>{e.flowBn>=0?"Accumulating":"Outflows"}</b><p>Fund flows remain demo until a redistribution-safe flow source is connected.</p></article><article className="signalCard"><span>Risk profile · {statsAreLive?"live-derived":"demo"}</span><b>{stats.risk}</b><p>{stats.annualizedVolatility}% annualized volatility from daily closes.</p></article><article className="signalCard"><span>Holdings · {profileIsLive?"live":"curated"}</span><b>{holdings.length} shown</b><p>{profileIsLive?"Holdings loaded from Alpha Vantage ETF_PROFILE.":"Using curated fallback holdings."}</p></article></section>
</AppShell>}
