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

type ApiResult = {
  mode:string; rows:LiveRow[]; totalMatched?:number; universeTotal?:number; returned?:number; offset?:number; limit?:number;
  error?:string; reason?:string; source?:"businessquant-daily-cache"|"twelve-data-directory"; enriched?:boolean; refreshedAt?:string; snapshotSize?:number; providerWarning?:string;
};

function money(n?:number){if(n===undefined)return "—";const a=Math.abs(n);const sign=n<0?"-":"";if(a>=1e12)return `${sign}$${(a/1e12).toFixed(1)}T`;if(a>=1e9)return `${sign}$${(a/1e9).toFixed(1)}B`;if(a>=1e6)return `${sign}$${(a/1e6).toFixed(0)}M`;return `${sign}$${a.toFixed(0)}`}

export default function ExplorePage(){
  const [query,setQuery]=useState("");
  const [sort,setSort]=useState("net_assets_usd");
  const [rows,setRows]=useState<LiveRow[]>([]);
  const [meta,setMeta]=useState<ApiResult|null>(null);
  const [loading,setLoading]=useState(true);
  const [loadingMore,setLoadingMore]=useState(false);

  async function load(offset=0, append=false){
    const dir=sort==="net_expense_ratio_pct"?"asc":"desc";
    const p=new URLSearchParams({limit:"100",offset:String(offset),sort,dir});
    if(query.trim())p.set("q",query.trim());
    const r=await fetch(`/api/funds/screener?${p}`);
    const payload:ApiResult=await r.json();
    setMeta(payload);
    if(payload.mode==="live") setRows(prev=>append?[...prev,...(payload.rows||[])]:payload.rows||[]);
    else setRows([]);
  }

  useEffect(()=>{
    let active=true;
    const timer=setTimeout(async()=>{
      setLoading(true);setRows([]);
      try{await load(0,false)}catch{if(active){setMeta({mode:"fallback",rows:[],error:"Live screener request failed"});setRows([])}}finally{if(active)setLoading(false)}
    },300);
    return()=>{active=false;clearTimeout(timer)};
  },[query,sort]);

  async function loadMore(){
    if(!meta||meta.mode!=="live")return;
    setLoadingMore(true);
    try{await load(rows.length,true)}finally{setLoadingMore(false)}
  }

  const providerAvailable=meta?.mode==="live";
  const fallbackRows=useMemo(()=>etfs.filter(e=>`${e.symbol} ${e.name} ${e.category} ${e.theme}`.toLowerCase().includes(query.toLowerCase())),[query]);
  const fallbackReason=meta?.reason||meta?.error||"Live ETF providers are unavailable";
  const hasMore=providerAvailable&&(meta?.totalMatched??0)>rows.length;
  const directoryMode=meta?.source==="twelve-data-directory";
  const sourceLabel=directoryMode?"TWELVE DATA DIRECTORY":meta?.source==="businessquant-daily-cache"?"BUSINESSQUANT · DAILY CACHE":"LIVE UNIVERSE";

  return <AppShell><SectionHeader eyebrow="ETF SCREENER" title="Search the ETF universe." description="ETF Pulse uses a cached BusinessQuant universe for enriched analytics and automatically falls back to Twelve Data's ETF directory when the BusinessQuant quota is exhausted."/>
  <section className="panel filterPanel"><div className="searchBar"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search ticker, fund name or category…"/><span className={providerAvailable?"liveChip":"demoChip"}>{providerAvailable?sourceLabel:"8-FUND FALLBACK"}</span></div><div className="filterGrid"><label>Sort by<select value={sort} onChange={e=>setSort(e.target.value)} disabled={directoryMode}><option value="net_assets_usd">Largest AUM</option><option value="return_1y_pct">Best 1Y return</option><option value="net_flow_12m_usd">Largest 12M net flow</option><option value="net_expense_ratio_pct">Lowest expense ratio</option></select></label></div><div className="resultMeta">{loading?"Loading…":providerAvailable?<><b>{rows.length}</b> loaded · {meta?.totalMatched??0} matched{meta?.refreshedAt?<span> · cached {new Date(meta.refreshedAt).toLocaleString()}</span>:null}</>:<><b>{fallbackRows.length}</b> curated funds</>}</div></section>
  {!loading&&providerAvailable&&directoryMode&&<section className="providerNotice"><strong>BusinessQuant quota reached — Explorer is still live.</strong><span>ETF names and symbols are coming from Twelve Data. Enriched columns such as AUM, fees, flows and sector data will show “—” until the BusinessQuant daily cache can refresh.</span>{meta?.providerWarning?<code>{meta.providerWarning}</code>:null}</section>}
  {!loading&&!providerAvailable&&<section className="providerWarning"><strong>Why only 8 ETFs?</strong><span>{fallbackReason}</span><code>Open http://localhost:3000/api/status to verify TWELVE_DATA_API_KEY and BUSINESSQUANT_API_KEY, then restart npm run dev.</code></section>}
  {providerAvailable?(rows.length?<><section className="panel liveScreener"><div className="liveTableHeader"><span>Fund</span><span>AUM</span><span>Expense</span><span>1Y Return</span><span>12M Flow</span><span>Top sector</span></div>{rows.map((r,i)=><Link href={`/etf/${r.ticker}`} className="liveTableRow" key={`${r.ticker}-${i}`}><div><b>{r.ticker}</b><small>{r.fundName}</small></div><span>{money(r.netAssetsUsd)}</span><span>{r.expenseRatioPct!==undefined?`${r.expenseRatioPct.toFixed(2)}%`:"—"}</span><span className={(r.return1yPct||0)>=0?"positive":"negative"}>{r.return1yPct!==undefined?`${r.return1yPct>0?"+":""}${r.return1yPct.toFixed(1)}%`:"—"}</span><span className={(r.netFlow12mUsd||0)>=0?"positive":"negative"}>{money(r.netFlow12mUsd)}</span><span>{r.topSector||"—"}{r.topSectorPct!==undefined?<small>{r.topSectorPct.toFixed(1)}%</small>:null}</span></Link>)}</section>{hasMore&&<div className="loadMoreWrap"><button className="primaryAction" onClick={loadMore} disabled={loadingMore}>{loadingMore?"Loading more…":"Load 100 more ETFs"}</button></div>}</>:<section className="panel emptyState"><h3>No ETFs matched</h3><p>Try another ticker, fund name, or category.</p></section>):<section className="panel explorerPanel"><ETFTable rows={fallbackRows}/></section>}
  </AppShell>;
}
