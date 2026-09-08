"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import SectionHeader from "@/components/SectionHeader";

type OverlapRow={key:string;ticker?:string;name:string;weightA:number;weightB:number;overlapWeight:number};
type OverlapResult={mode?:string;a?:string;b?:string;overlapPct?:number;commonCount?:number;aCount?:number;bCount?:number;common?:OverlapRow[];error?:string};

const STORAGE_KEY="etf-pulse-watchlist-v1";
const DEFAULTS=["VOO","QQQ","SCHD"];

export default function WatchlistPage(){
  const [watchlist,setWatchlist]=useState<string[]>([]);
  const [input,setInput]=useState("");
  const [a,setA]=useState("VOO");
  const [b,setB]=useState("QQQ");
  const [overlap,setOverlap]=useState<OverlapResult|null>(null);
  const [loading,setLoading]=useState(false);

  useEffect(()=>{
    try{
      const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");
      const list=Array.isArray(saved)&&saved.length?saved:DEFAULTS;
      setWatchlist(list);
      setA(list[0]||"VOO");setB(list[1]||"QQQ");
    }catch{setWatchlist(DEFAULTS)}
  },[]);

  useEffect(()=>{if(watchlist.length) localStorage.setItem(STORAGE_KEY,JSON.stringify(watchlist))},[watchlist]);

  const choices=useMemo(()=>Array.from(new Set([...watchlist,"VOO","QQQ","SPY","VTI","SCHD","XLK","XLF"])),[watchlist]);

  function add(){const ticker=input.trim().toUpperCase().replace(/[^A-Z0-9.-]/g,"");if(!ticker)return;setWatchlist(prev=>prev.includes(ticker)?prev:[...prev,ticker]);setInput("")}
  function remove(ticker:string){setWatchlist(prev=>prev.filter(x=>x!==ticker))}
  async function analyze(){setLoading(true);setOverlap(null);try{const r=await fetch(`/api/funds/overlap?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`);setOverlap(await r.json())}catch{setOverlap({mode:"fallback",error:"Overlap request failed"})}finally{setLoading(false)}}

  return <AppShell><SectionHeader eyebrow="WATCHLIST & OVERLAP" title="Track ETFs. Spot hidden duplication." description="Your watchlist is stored locally in this browser. Holdings overlap uses BusinessQuant when configured."/>
  <section className="watchGrid">
    <article className="panel watchPanel"><div className="panelHeader"><div><span className="eyebrow">WATCHLIST</span><h2>{watchlist.length} tracked ETFs</h2></div><span className="demoChip">LOCAL</span></div><div className="watchAdd"><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="Add ticker, e.g. VTI"/><button onClick={add}>Add ETF</button></div><div className="watchRows">{watchlist.map(t=><div key={t}><Link href={`/etf/${t}`}><span className="tickerBadge">{t}</span><b>Open analytics</b></Link><button onClick={()=>remove(t)}>Remove</button></div>)}</div></article>
    <article className="panel overlapSetup"><div className="panelHeader"><div><span className="eyebrow">PORTFOLIO OVERLAP</span><h2>Compare holdings</h2></div></div><div className="overlapPickers"><label>ETF A<input list="watch-tickers" value={a} onChange={e=>setA(e.target.value.toUpperCase())}/></label><div className="versus">VS</div><label>ETF B<input list="watch-tickers" value={b} onChange={e=>setB(e.target.value.toUpperCase())}/></label><datalist id="watch-tickers">{choices.map(t=><option key={t} value={t}/>)}</datalist></div><button className="primaryAction" onClick={analyze} disabled={loading}>{loading?"Analyzing holdings…":"Analyze overlap"}</button><p className="helperText">Overlap is calculated as the sum of the minimum portfolio weight for each common holding.</p></article>
  </section>
  {overlap&&<section className="panel overlapResult"><div className="panelHeader"><div><span className="eyebrow">OVERLAP RESULT</span><h2>{overlap.mode==="live"?`${overlap.a} vs ${overlap.b}`:"Unable to calculate"}</h2></div><span className={overlap.mode==="live"?"liveChip":"demoChip"}>{overlap.mode==="live"?"BUSINESSQUANT":"UNAVAILABLE"}</span></div>{overlap.mode==="live"?<><div className="overlapHero"><div><span>Portfolio overlap</span><b>{overlap.overlapPct?.toFixed(1)}%</b></div><div><span>Common holdings</span><b>{overlap.commonCount}</b></div><div><span>{overlap.a} holdings</span><b>{overlap.aCount}</b></div><div><span>{overlap.b} holdings</span><b>{overlap.bCount}</b></div></div><div className="overlapTable"><div className="overlapTableHeader"><span>Holding</span><span>{overlap.a}</span><span>{overlap.b}</span><span>Overlap</span></div>{overlap.common?.slice(0,20).map(row=><div className="overlapTableRow" key={row.key}><div><b>{row.ticker||row.name}</b><small>{row.name}</small></div><span>{row.weightA.toFixed(2)}%</span><span>{row.weightB.toFixed(2)}%</span><strong>{row.overlapWeight.toFixed(2)}%</strong></div>)}</div></>:<div className="emptyState"><h3>Overlap unavailable</h3><p>{overlap.error||"Try another ETF pair or configure BusinessQuant."}</p></div>}</section>}
  </AppShell>
}
