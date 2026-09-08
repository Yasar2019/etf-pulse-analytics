"use client";

import Link from "next/link";
import { assetMix, etfs, headline, sectors } from "@/lib/demoData";
import { marketPerformance, monthlyFlows } from "@/lib/analytics";
import ETFTable from "./ETFTable";
import SectionHeader from "./SectionHeader";
import LineChart from "./LineChart";
import FlowBars from "./FlowBars";

function Sparkline({ values }: { values: number[] }) { const width=180,height=54,min=Math.min(...values),max=Math.max(...values),range=Math.max(max-min,1); const points=values.map((v,i)=>`${(i/(values.length-1))*width},${height-((v-min)/range)*height}`).join(" "); return <svg viewBox={`0 0 ${width} ${height}`} className="sparkline" aria-hidden><polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg> }

export default function Dashboard() {
  return <>
    <SectionHeader eyebrow="ETF MARKET COMMAND CENTER" title="See where ETF money is moving." description="Discover sectors, themes and funds through a faster, visual-first analytics experience." action={<Link className="primaryBtn" href="/explore">Explore ETFs →</Link>} />
    <div className="tickerStrip">{etfs.slice(0,6).map(e=><span key={e.symbol}><b>{e.symbol}</b> {e.price.toFixed(2)} <em className={e.change<0?"down":""}>{e.change>0?"+":""}{e.change}%</em></span>)}</div>
    <section className="metricGrid">{headline.map((item,i)=><article className="metricCard" key={item.label}><div><span>{item.label}</span><b>{item.value}</b><small>{item.delta}</small></div><Sparkline values={[[40,43,42,48,51,53,57,61],[45,46,49,47,55,59,62,67],[60,55,58,62,61,68,74,79],[68,65,64,60,61,57,56,53]][i]}/></article>)}</section>
    <section className="overviewChartGrid"><article className="panel chartPanel"><div className="panelHeader"><div><span className="eyebrow">MARKET PULSE</span><h2>ETF composite performance</h2></div><Link href="/insights" className="ghostBtn">Full intelligence →</Link></div><LineChart data={marketPerformance}/><div className="chartSummary"><b>+21.4%</b><span>YTD · demo composite</span></div></article><article className="panel"><div className="panelHeader"><div><span className="eyebrow">FUND FLOWS</span><h2>Net creations</h2></div><span className="liveChip">6 MONTHS</span></div><FlowBars data={monthlyFlows}/></article></section>
    <section className="mainGrid"><article className="panel sectorPanel"><div className="panelHeader"><div><span className="eyebrow">MARKET MAP</span><h2>Sector momentum</h2></div><Link href="/sectors" className="ghostBtn">View all →</Link></div><div className="sectorList">{sectors.map((s,idx)=><div className="sectorRow" key={s.name}><span className="rank">{String(idx+1).padStart(2,"0")}</span><div className="sectorMeta"><b>{s.name}</b><small>{s.flow>=0?"+":""}${s.flow}B flow</small></div><div className="momentumTrack"><i style={{width:`${s.score}%`}}/></div><strong>+{s.returnPct}%</strong></div>)}</div></article>
    <article className="panel allocationPanel"><div className="panelHeader"><div><span className="eyebrow">UNIVERSE</span><h2>ETF asset mix</h2></div></div><div className="donut"><div><b>3,842</b><span>funds</span></div></div><div className="legend">{assetMix.map(item=><div key={item.label}><span>{item.label}</span><b>{item.share}%</b></div>)}</div></article></section>
    <section className="panel explorerPanel"><div className="panelHeader"><div><span className="eyebrow">TRENDING NOW</span><h2>Funds to watch</h2></div><Link href="/explore" className="ghostBtn">Open screener →</Link></div><ETFTable rows={etfs.slice(0,6)}/></section>
  </>;
}
