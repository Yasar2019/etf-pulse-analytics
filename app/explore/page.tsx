"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import SectionHeader from "@/components/SectionHeader";
import ETFTable from "@/components/ETFTable";
import { etfs } from "@/lib/demoData";

type LiveRow = {
  ticker:string; fundName:string; category?:string; expenseRatioPct?:number; netAssetsUsd?:number;
  return1yPct?:number; netFlow12mUsd?:number; holdingsCount?:number; topSector?:string; topSectorPct?:number;
};

type ApiResult = { mode:string; rows:LiveRow[]; totalMatched?:number; universeTotal?:number; error?:string };

function money(n?:number){if(n===undefined)return "—";const a=Math.abs(n);if(a>=1e12)return `$${(n/1e12).toFixed(1)}T`;if(a>=1e9)return `$${(n/1e9).toFixed(1)}B`;if(a>=1e6)return `$${(n/1e6).toFixed(0)}M`;return `$${n.toFixed(0)}`}

export default function ExplorePage(){
  const [query,setQuery]=useState(""); const [sort,setSort]=useState("net_assets_usd"); const [data,setData]=useState<ApiResult|null>(null); const [loading,setLoading]=useState(true);
  useEffect(()=>{const controller=new AbortController();const timer=setTimeout(async()=>{setLoading(true);try{const p=new URLSearchParams({limit:"60",sort});if(query.trim())p.set("q",query.trim());const r=await fetch(`/api/funds/screener?${p}`,{signal:controller.signal});setData(await r.json())}catch{}finally{setLoading(false)}},350);return()=>{clearTimeout(timer);controller.abort()}},[query,sort]);
  const live=data?.mode==="live"&&data.rows?.length>0;
  const fallbackRows=useMemo(()=>etfs.filter(e=>`${e.symbol} ${e.name} ${e.category} ${e.theme}`.toLowerCase().includes(query.toLowerCase())),[query]);
  return <AppShell><SectionHeader eyebrow="ETF SCREENER" title="Search the ETF universe." description="Live fund discovery when BusinessQuant is connected, with automatic curated fallback."/>
  <section className="panel filterPanel"><div className="searchBar"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search ticker, fund name or category…"/><span className={live?"liveChip":"demoChip"}>{live?"LIVE UNIVERSE":"CURATED FALLBACK"}</span></div><div className="filterGrid"><label>Sort by<select value={sort} onChange={e=>setSort(e.target.value)}><option value="net_assets_usd">Largest AUM</option><option value="return_1y_pct">1Y return</option><option value="net_flow_12m_usd">12M net flow</option><option value="net_expense_ratio_pct">Expense ratio</option></select></label></div><div className="resultMeta">{loading?"Loading…":live?<><b>{data?.rows.length}</b> shown · {data?.totalMatched||"many"} matched across {data?.universeTotal||"the"} fund universe</>:<><b>{fallbackRows.length}</b> curated funds</>}</div></section>
  {live?<section className="panel liveScreener"><div className="liveTableHeader"><span>Fund</span><span>AUM</span><span>Expense</span><span>1Y Return</span><span>12M Flow</span><span>Top sector</span></div>{data!.rows.map(r=><Link href={`/etf/${r.ticker}`} className="liveTableRow" key={r.ticker}><div><b>{r.ticker}</b><small>{r.fundName}</small></div><span>{money(r.netAssetsUsd)}</span><span>{r.expenseRatioPct!==undefined?`${r.expenseRatioPct.toFixed(2)}%`:"—"}</span><span className={(r.return1yPct||0)>=0?"positive":"negative"}>{r.return1yPct!==undefined?`${r.return1yPct>0?"+":""}${r.return1yPct.toFixed(1)}%`:"—"}</span><span className={(r.netFlow12mUsd||0)>=0?"positive":"negative"}>{money(r.netFlow12mUsd)}</span><span>{r.topSector||"—"}{r.topSectorPct!==undefined?<small>{r.topSectorPct.toFixed(1)}%</small>:null}</span></Link>)}</section>:<section className="panel explorerPanel"><ETFTable rows={fallbackRows}/></section>}
  </AppShell>;
}
