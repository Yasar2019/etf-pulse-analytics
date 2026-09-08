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

  let perf;
  let providerStatus=await etfProvider.getProviderStatus();
  try {
    perf=await etfProvider.getPerformanceHistory(e.symbol);
  } catch {
    const { getPerformanceSeries } = await import("@/lib/analytics");
    perf=getPerformanceSeries(e.symbol);
    providerStatus={...providerStatus, mode:"demo", label:`${providerStatus.label} · price history fallback`, historicalPrices:false};
  }

  return <AppShell>
<header className="fundHeader"><div className="fundIdentity"><span className="tickerBadge big">{e.symbol}</span><div><span className="eyebrow">{e.assetClass} · {e.category}</span><h1>{e.name}</h1><p>{e.issuer} · {e.geography} · {e.theme}</p></div></div><div className="fundPrice"><strong>${e.price}</strong><em className={e.change<0?"negative":"positive"}>{e.change>0?"+":""}{e.change}% today</em></div></header>
<section className={`dataStatus ${providerStatus.mode}`}><div><span className="statusDot"/><strong>{providerStatus.mode==="live"?"Live data mode":"Demo data mode"}</strong><small>{providerStatus.label}</small></div><div className="statusChips"><span className={providerStatus.historicalPrices?"liveChip":"demoChip"}>Price history · {providerStatus.historicalPrices?"live":"demo"}</span><span className={providerStatus.metadata?"liveChip":"demoChip"}>Fund metadata · {providerStatus.metadata?"live":"curated"}</span><span className={providerStatus.holdings?"liveChip":"demoChip"}>Holdings · {providerStatus.holdings?"live":"curated"}</span><span className={providerStatus.flows?"liveChip":"demoChip"}>Flows · {providerStatus.flows?"live":"demo"}</span></div></section>
<section className="fundMetrics">{[["AUM",e.aum],["Expense",e.expense],["YTD Return",`${e.ytd}%`],["1Y Return",`${e.return1y}%`],["30D Flow",e.flow],["Yield",`${e.yieldPct}%`],["Volatility",`${e.volatility}%`],["Risk",e.risk]].map(([k,v])=><article key={k}><span>{k}</span><b>{v}</b></article>)}</section>
<section className="panel fundChartPanel"><div className="panelHeader"><div><span className="eyebrow">PERFORMANCE</span><h2>Growth of $100</h2></div><div className="periodTabs"><b>1Y</b><span>3Y</span><span>5Y</span></div></div><LineChart data={perf}/><div className="performanceFoot"><div><span>Starting value</span><b>$100.00</b></div><div><span>Ending value</span><b>${perf.at(-1)?.value.toFixed(2)}</b></div><div><span>Displayed history</span><b>{providerStatus.historicalPrices?"Provider-backed":"Demo series"}</b></div></div></section>
<section className="detailGrid"><article className="panel"><div className="panelHeader"><div><span className="eyebrow">PORTFOLIO</span><h2>Top holdings</h2></div></div><div className="holdings">{e.holdings.map((h,i)=><div key={`${h.symbol}-${i}`}><span className="holdingRank">{i+1}</span><div><b>{h.symbol}</b><small>{h.name}</small></div><div className="holdingBar"><i style={{width:`${Math.min(h.weight*5,100)}%`}}/></div><strong>{h.weight}%</strong></div>)}</div></article><article className="panel"><div className="panelHeader"><div><span className="eyebrow">CLASSIFICATION</span><h2>ETF DNA</h2></div></div><div className="dnaList">{[["Asset class",e.assetClass],["Sector",e.sector],["Theme",e.theme],["Issuer",e.issuer],["Geography",e.geography],["Category",e.category]].map(([k,v])=><div key={k}><span>{k}</span><b>{v}</b></div>)}</div></article></section>
<section className="signalGrid fundSignals"><article className="signalCard"><span>Cost profile</span><b>{e.expensePct<=.1?"Ultra low":"Specialized"}</b><p>{e.expensePct<=.1?"Expense ratio sits in the low-cost core ETF range.":"Higher fee reflects more specialized exposure."}</p></article><article className="signalCard"><span>Flow signal</span><b>{e.flowBn>=0?"Accumulating":"Outflows"}</b><p>{e.flowBn>=0?"Recent creations suggest positive investor demand.":"Recent redemptions indicate softer investor demand."}</p></article><article className="signalCard"><span>Risk profile</span><b>{e.risk}</b><p>{e.volatility}% modeled volatility in the current dataset.</p></article><article className="signalCard"><span>Income profile</span><b>{e.yieldPct?`${e.yieldPct}% yield`:"No yield"}</b><p>{e.yieldPct>=2?"Income is a meaningful part of the fund profile.":"Return profile is driven mainly by price appreciation."}</p></article></section>
</AppShell>}
