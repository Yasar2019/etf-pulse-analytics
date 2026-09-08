"use client";
import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import SectionHeader from "@/components/SectionHeader";
import { etfs } from "@/lib/demoData";

type LiveCompare={mode?:string;tickers?:string[];samePortfolio?:boolean;differingCount?:number;metricsTotal?:number;groups?:Array<{statement?:string;metrics?:Array<{field?:string;label?:string;unit?:string;differs?:boolean;direction?:string|null;leaders?:string[];laggards?:string[]}>}>;error?:string};

export default function ComparePage(){
 const [a,setA]=useState("VOO"),[b,setB]=useState("QQQ"); const [live,setLive]=useState<LiveCompare|null>(null); const [loading,setLoading]=useState(false);
 const x=etfs.find(e=>e.symbol===a)!,y=etfs.find(e=>e.symbol===b)!;
 useEffect(()=>{let active=true;setLoading(true);fetch(`/api/funds/compare?tickers=${a},${b}`).then(r=>r.json()).then(d=>{if(active)setLive(d)}).catch(()=>{if(active)setLive(null)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[a,b]);
 const demoMetrics=useMemo(()=>[["AUM",x.aum,y.aum,x.aumBn>y.aumBn?"a":"b"],["Expense ratio",x.expense,y.expense,x.expensePct<y.expensePct?"a":"b"],["YTD return",`${x.ytd}%`,`${y.ytd}%`,x.ytd>y.ytd?"a":"b"],["1Y return",`${x.return1y}%`,`${y.return1y}%`,x.return1y>y.return1y?"a":"b"],["30D flow",x.flow,y.flow,x.flowBn>y.flowBn?"a":"b"],["Yield",`${x.yieldPct}%`,`${y.yieldPct}%`,x.yieldPct>y.yieldPct?"a":"b"],["Volatility",`${x.volatility}%`,`${y.volatility}%`,x.volatility<y.volatility?"a":"b"]] as const,[x,y]);
 const liveMode=live?.mode==="live";
 return <AppShell><SectionHeader eyebrow="HEAD TO HEAD" title="Compare ETFs without the noise." description="BusinessQuant comparison intelligence when connected, with a curated fallback view."/>
 <section className="comparePicker"><label>Fund A<select value={a} onChange={e=>setA(e.target.value)}>{etfs.map(e=><option key={e.symbol}>{e.symbol}</option>)}</select></label><div className="versus">VS</div><label>Fund B<select value={b} onChange={e=>setB(e.target.value)}>{etfs.map(e=><option key={e.symbol}>{e.symbol}</option>)}</select></label></section>
 <div className="sectionSource"><span className={liveMode?"liveChip":"demoChip"}>{loading?"LOADING":liveMode?"LIVE COMPARISON":"CURATED FALLBACK"}</span>{liveMode?<small>{live?.differingCount} of {live?.metricsTotal} metrics differ{live?.samePortfolio?" · same portfolio detected":""}</small>:null}</div>
 {liveMode?<section className="compareLiveGrid">{(live?.groups||[]).filter(g=>g.metrics?.length).map((g,gi)=><article className="panel compareGroup" key={`${g.statement||"group"}-${gi}`}><div className="panelHeader"><div><span className="eyebrow">BUSINESSQUANT</span><h2>{g.statement||"Comparison metrics"}</h2></div></div><div className="compareInsights">{g.metrics!.slice(0,10).map((m,mi)=><div key={`${m.field||m.label}-${mi}`}><div><b>{m.label||m.field||"Metric"}</b>{m.unit?<small>{m.unit}</small>:null}</div><span className={m.differs?"positive":""}>{m.differs?"Different":"Similar"}</span><div className="leaderTags">{m.leaders?.map(t=><em key={t}>Leader: {t}</em>)}{m.laggards?.map(t=><em className="laggard" key={t}>Lag: {t}</em>)}</div></div>)}</div></article>)}</section>:<><section className="compareHero"><article><span className="tickerBadge">{x.symbol}</span><h2>{x.name}</h2><strong>${x.price}</strong><em>{x.change>0?"+":""}{x.change}%</em></article><article><span className="tickerBadge">{y.symbol}</span><h2>{y.name}</h2><strong>${y.price}</strong><em>{y.change>0?"+":""}{y.change}%</em></article></section><section className="panel compareTable">{demoMetrics.map(([label,av,bv,winner])=><div className="compareRow" key={label}><b className={winner==="a"?"winner":""}>{av}</b><span>{label}</span><b className={winner==="b"?"winner":""}>{bv}</b></div>)}</section></>}
 </AppShell>
}
