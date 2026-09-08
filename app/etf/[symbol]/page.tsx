import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import LineChart from "@/components/LineChart";
import { etfs } from "@/lib/demoData";
import { etfProvider } from "@/lib/provider";

export function generateStaticParams(){return etfs.map(e=>({symbol:e.symbol}))}

export default async function ETFPage({params}:{params:Promise<{symbol:string}>}){
  const {symbol}=await params;
  const e=await etfProvider.getETF(symbol);
  if(!e)return notFound();

  let providerStatus=await etfProvider.getProviderStatus();
  let perf;
  let quote;
  let stats;

  try {
    quote=await etfProvider.getQuote(e.symbol);
  } catch {
    quote={
      price:Number(e.price),
      change:Number((Number(e.price)*(Number(e.change)/100)).toFixed(2)),
      percentChange:Number(e.change),
      source:"demo" as const,
    };
    providerStatus={...providerStatus,currentQuote:false,label:`${providerStatus.label} · quote fallback`};
  }

  try {
    perf=await etfProvider.getPerformanceHistory(e.symbol);
  } catch {
    const { getPerformanceSeries } = await import("@/lib/analytics");
    perf=getPerformanceSeries(e.symbol);
    providerStatus={...providerStatus,historicalPrices:false,label:`${providerStatus.label} · history fallback`};
  }

  try {
    stats=await etfProvider.getPerformanceStats(e.symbol);
  } catch {
    stats={
      ytdReturn:e.ytd,
      oneYearReturn:e.return1y,
      annualizedVolatility:e.volatility,
      risk:e.risk,
      source:"demo" as const,
    };
  }

  const quoteIsLive=quote.source==="twelve-data";
  const statsAreLive=stats.source==="twelve-data";
  const changeClass=quote.percentChange<0?"negative":"positive";

  const metricCards = [
    ["AUM",e.aum,"curated"],
    ["Expense",e.expense,"curated"],
    ["YTD Return",`${stats.ytdReturn}%`,statsAreLive?"live":"demo"],
    ["1Y Return",`${stats.oneYearReturn}%`,statsAreLive?"live":"demo"],
    ["30D Flow",e.flow,"demo"],
    ["Yield",`${e.yieldPct}%`,"curated"],
    ["Volatility",`${stats.annualizedVolatility}%`,statsAreLive?"live":"demo"],
    ["Risk",stats.risk,statsAreLive?"live":"demo"],
  ] as const;

  return <AppShell>
<header className="fundHeader"><div className="fundIdentity"><span className="tickerBadge big">{e.symbol}</span><div><span className="eyebrow">{e.assetClass} · {e.category}</span><h1>{e.name}</h1><p>{e.issuer} · {e.geography} · {e.theme}</p></div></div><div className="fundPrice"><strong>${quote.price.toFixed(2)}</strong><em className={changeClass}>{quote.percentChange>0?"+":""}{quote.percentChange.toFixed(2)}% today</em><small>{quoteIsLive?"Live quote":"Demo quote"}{quote.datetime?` · ${quote.datetime}`:""}</small></div></header>
<section className={`dataStatus ${providerStatus.mode}`}><div><span className="statusDot"/><strong>{providerStatus.mode==="live"?"Live data mode":"Demo data mode"}</strong><small>{providerStatus.label}</small></div><div className="statusChips"><span className={providerStatus.currentQuote?"liveChip":"demoChip"}>Current quote · {providerStatus.currentQuote?"live":"demo"}</span><span className={providerStatus.historicalPrices?"liveChip":"demoChip"}>Price history · {providerStatus.historicalPrices?"live":"demo"}</span><span className={statsAreLive?"liveChip":"demoChip"}>Returns & risk · {statsAreLive?"live-derived":"demo"}</span><span className={providerStatus.metadata?"liveChip":"demoChip"}>Fund metadata · {providerStatus.metadata?"live":"curated"}</span><span className={providerStatus.holdings?"liveChip":"demoChip"}>Holdings · {providerStatus.holdings?"live":"curated"}</span><span className={providerStatus.flows?"liveChip":"demoChip"}>Flows · {providerStatus.flows?"live":"demo"}</span></div></section>
<section className="fundMetrics">{metricCards.map(([k,v,source])=><article key={k}><span>{k}</span><b>{v}</b><small className={`metricSource ${source}`}>{source==="live"?"LIVE-DERIVED":source.toUpperCase()}</small></article>)}</section>
<section className="panel fundChartPanel"><div className="panelHeader"><div><span className="eyebrow">PERFORMANCE</span><h2>Growth of $100</h2></div><div className="periodTabs"><b>1Y</b><span>3Y</span><span>5Y</span></div></div><LineChart data={perf}/><div className="performanceFoot"><div><span>Starting value</span><b>$100.00</b></div><div><span>Ending value</span><b>${perf.at(-1)?.value.toFixed(2)}</b></div><div><span>Displayed history</span><b>{providerStatus.historicalPrices?"Provider-backed":"Demo series"}</b></div></div></section>
<section className="detailGrid"><article className="panel"><div className="panelHeader"><div><span className="eyebrow">PORTFOLIO</span><h2>Top holdings</h2></div><span className="demoChip">CURATED</span></div><div className="holdings">{e.holdings.map((h,i)=><div key={`${h.symbol}-${i}`}><span className="holdingRank">{i+1}</span><div><b>{h.symbol}</b><small>{h.name}</small></div><div className="holdingBar"><i style={{width:`${Math.min(h.weight*5,100)}%`}}/></div><strong>{h.weight}%</strong></div>)}</div></article><article className="panel"><div className="panelHeader"><div><span className="eyebrow">CLASSIFICATION</span><h2>ETF DNA</h2></div><span className="demoChip">CURATED</span></div><div className="dnaList">{[["Asset class",e.assetClass],["Sector",e.sector],["Theme",e.theme],["Issuer",e.issuer],["Geography",e.geography],["Category",e.category]].map(([k,v])=><div key={k}><span>{k}</span><b>{v}</b></div>)}</div></article></section>
<section className="signalGrid fundSignals"><article className="signalCard"><span>Cost profile · curated</span><b>{e.expensePct<=.1?"Ultra low":"Specialized"}</b><p>{e.expensePct<=.1?"Expense ratio sits in the low-cost core ETF range.":"Higher fee reflects more specialized exposure."}</p></article><article className="signalCard"><span>Flow signal · demo</span><b>{e.flowBn>=0?"Accumulating":"Outflows"}</b><p>{e.flowBn>=0?"Recent creations suggest positive investor demand.":"Recent redemptions indicate softer investor demand."}</p></article><article className="signalCard"><span>Risk profile · {statsAreLive?"live-derived":"demo"}</span><b>{stats.risk}</b><p>{stats.annualizedVolatility}% annualized volatility calculated from daily closes.</p></article><article className="signalCard"><span>Income profile · curated</span><b>{e.yieldPct?`${e.yieldPct}% yield`:"No yield"}</b><p>{e.yieldPct>=2?"Income is a meaningful part of the fund profile.":"Return profile is driven mainly by price appreciation."}</p></article></section>
</AppShell>}
