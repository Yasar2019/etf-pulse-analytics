import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import LineChart from "@/components/LineChart";
import { etfs } from "@/lib/demoData";
import { etfProvider } from "@/lib/provider";
import { getAlphaVantageETFProfile } from "@/lib/providers/alphaVantage";
import { getBusinessQuantFundFlows } from "@/lib/providers/businessQuant";

export function generateStaticParams(){return etfs.map(e=>({symbol:e.symbol}))}

function formatUsd(value:number){
  const abs=Math.abs(value);
  if(abs>=1e9)return `${value<0?"-":""}$${(abs/1e9).toFixed(1)}B`;
  if(abs>=1e6)return `${value<0?"-":""}$${(abs/1e6).toFixed(1)}M`;
  return `${value<0?"-":""}$${abs.toLocaleString("en-US",{maximumFractionDigits:0})}`;
}

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

  let flowSnapshot=null;
  try{flowSnapshot=await getBusinessQuantFundFlows(e.symbol)}catch{flowSnapshot=null}

  const quoteIsLive=quote.source==="twelve-data";
  const statsAreLive=stats.source==="twelve-data";
  const profileIsLive=profile?.source==="alpha-vantage";
  const flowsAreLive=flowSnapshot?.source==="businessquant";
  const aumValue=profile?.netAssets?`$${(profile.netAssets/1e9).toFixed(1)}B`:e.aum;
  const expenseValue=profile?.expenseRatio!==undefined?`${(profile.expenseRatio<=1?profile.expenseRatio*100:profile.expenseRatio).toFixed(2)}%`:e.expense;
  const holdings=profile?.holdings?.length?profile.holdings.slice(0,10):e.holdings;
  const sectors=profile?.sectors?.slice(0,8)??[];
  const latestFlow=flowSnapshot?.points.at(-1)?.netFlowUsd;
  const flowValue=latestFlow!==undefined?formatUsd(latestFlow):e.flow;

  const metricCards=[
    ["AUM",aumValue,profileIsLive?"live":"curated"],
    ["Expense",expenseValue,profileIsLive?"live":"curated"],
    ["YTD Return",`${stats.ytdReturn}%`,statsAreLive?"live":"demo"],
    ["1Y Return",`${stats.oneYearReturn}%`,statsAreLive?"live":"demo"],
    ["Latest Flow",flowValue,flowsAreLive?"live":"demo"],
    ["Yield",`${e.yieldPct}%`,"curated"],
    ["Volatility",`${stats.annualizedVolatility}%`,statsAreLive?"live":"demo"],
    ["Risk",stats.risk,statsAreLive?"live":"demo"],
  ] as const;

  const maxSector=Math.max(...sectors.map(s=>s.weight),1);
  const flowPoints=flowSnapshot?.points.slice(-12)??[];
  const maxFlow=Math.max(...flowPoints.map(p=>Math.abs(p.netFlowUsd)),1);

  return <AppShell>
<header className="fundHeader"><div className="fundIdentity"><span className="tickerBadge big">{e.symbol}</span><div><span className="eyebrow">{e.assetClass} · {e.category}</span><h1>{e.name}</h1><p>{e.issuer} · {e.geography} · {e.theme}</p></div></div><div className="fundPrice"><strong>${quote.price.toFixed(2)}</strong><em className={quote.percentChange<0?"negative":"positive"}>{quote.percentChange>0?"+":""}{quote.percentChange.toFixed(2)}% today</em><small>{quoteIsLive?"Live quote":"Demo quote"}{quote.datetime?` · ${quote.datetime}`:""}</small></div></header>
<section className={`dataStatus ${providerStatus.mode}`}><div><span className="statusDot"/><strong>{providerStatus.mode==="live"?"Live market data":"Demo market data"}</strong><small>Twelve Data{profileIsLive?" · Alpha Vantage":""}{flowsAreLive?" · BusinessQuant":""}</small></div><div className="statusChips"><span className={quoteIsLive?"liveChip":"demoChip"}>Quote · {quoteIsLive?"live":"demo"}</span><span className={providerStatus.historicalPrices?"liveChip":"demoChip"}>History · {providerStatus.historicalPrices?"live":"demo"}</span><span className={statsAreLive?"liveChip":"demoChip"}>Returns/risk · {statsAreLive?"live-derived":"demo"}</span><span className={profileIsLive?"liveChip":"demoChip"}>Profile/holdings · {profileIsLive?"live":"curated"}</span><span className={flowsAreLive?"liveChip":"demoChip"}>Flows · {flowsAreLive?"live":"demo"}</span></div></section>
<section className="fundMetrics">{metricCards.map(([k,v,source])=><article key={k}><span>{k}</span><b>{v}</b><small className={`metricSource ${source}`}>{source==="live"?"LIVE":source.toUpperCase()}</small></article>)}</section>
<section className="panel fundChartPanel"><div className="panelHeader"><div><span className="eyebrow">PERFORMANCE</span><h2>Growth of $100</h2></div><div className="periodTabs"><b>1Y</b><span>3Y</span><span>5Y</span></div></div><LineChart data={perf}/></section>
<section className="detailGrid"><article className="panel"><div className="panelHeader"><div><span className="eyebrow">PORTFOLIO</span><h2>Top holdings</h2></div><span className={profileIsLive?"liveChip":"demoChip"}>{profileIsLive?"ALPHA VANTAGE":"CURATED"}</span></div><div className="holdings">{holdings.map((h,i)=><div key={`${h.symbol}-${i}`}><span className="holdingRank">{i+1}</span><div><b>{h.symbol}</b><small>{h.name}</small></div><div className="holdingBar"><i style={{width:`${Math.min(h.weight*5,100)}%`}}/></div><strong>{h.weight.toFixed(2)}%</strong></div>)}</div></article><article className="panel"><div className="panelHeader"><div><span className="eyebrow">CLASSIFICATION</span><h2>ETF DNA</h2></div></div><div className="dnaList">{[["Asset class",e.assetClass],["Sector",e.sector],["Theme",e.theme],["Issuer",e.issuer],["Geography",e.geography],["Category",e.category],["Turnover",profile?.turnover!==undefined?`${(profile.turnover<=1?profile.turnover*100:profile.turnover).toFixed(1)}%`:"—"],["Inception",profile?.inceptionDate??"—"]].map(([k,v])=><div key={k}><span>{k}</span><b>{v}</b></div>)}</div></article></section>
{sectors.length>0&&<section className="panel exposurePanel"><div className="panelHeader"><div><span className="eyebrow">EXPOSURE</span><h2>Sector allocation</h2></div><span className="liveChip">ALPHA VANTAGE</span></div><div className="sectorExposure">{sectors.map(s=><div key={s.sector}><div><span>{s.sector}</span><strong>{s.weight.toFixed(1)}%</strong></div><div className="sectorRail"><i style={{width:`${(s.weight/maxSector)*100}%`}}/></div></div>)}</div></section>}
{flowPoints.length>0&&<section className="panel flowHistoryPanel"><div className="panelHeader"><div><span className="eyebrow">FUND FLOWS</span><h2>Monthly net flows</h2></div><span className="liveChip">BUSINESSQUANT · SEC FILINGS</span></div><div className="flowHistoryChart">{flowPoints.map(p=>{const positive=p.netFlowUsd>=0;return <div className="flowHistoryBar" key={p.monthEnd}><span>{formatUsd(p.netFlowUsd)}</span><div className="flowHistoryRail"><i className={positive?"positiveBar":"negativeBar"} style={{height:`${Math.max(8,Math.abs(p.netFlowUsd)/maxFlow*100)}%`}}/></div><small>{p.monthEnd.slice(0,7)}</small></div>})}</div><div className="flowSummary"><div><span>12M net flow</span><b className={(flowSnapshot?.netFlowUsd??0)>=0?"positive":"negative"}>{formatUsd(flowSnapshot?.netFlowUsd??0)}</b></div><div><span>Total inflow</span><b>{formatUsd(flowSnapshot?.totalInflowUsd??0)}</b></div><div><span>Total outflow</span><b>{formatUsd(flowSnapshot?.totalOutflowUsd??0)}</b></div></div></section>}
<section className="signalGrid fundSignals"><article className="signalCard"><span>Cost profile · {profileIsLive?"live":"curated"}</span><b>{(profile?.expenseRatio??e.expensePct)<=.1?"Ultra low":"Specialized"}</b><p>Expense ratio is sourced from Alpha Vantage when configured.</p></article><article className="signalCard"><span>Flow signal · {flowsAreLive?"live":"demo"}</span><b>{(latestFlow??e.flowBn)>=0?"Accumulating":"Outflows"}</b><p>{flowsAreLive?"Based on the latest SEC-filed monthly flow record.":"Using demo flow data until BusinessQuant is configured."}</p></article><article className="signalCard"><span>Risk profile · {statsAreLive?"live-derived":"demo"}</span><b>{stats.risk}</b><p>{stats.annualizedVolatility}% annualized volatility from daily closes.</p></article><article className="signalCard"><span>Holdings · {profileIsLive?"live":"curated"}</span><b>{holdings.length} shown</b><p>{profileIsLive?"Holdings loaded from Alpha Vantage ETF_PROFILE.":"Using curated fallback holdings."}</p></article></section>
</AppShell>}
