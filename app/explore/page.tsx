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

function money(n?:number){if(n===undefined)return "—";const a=Math.abs(n);const sign=n<0?"-":"";if(a>=1e12)return `${sign}$${(a/1e12).toFixed(1)}T`;if(a>=1e9)return `${sign}$${(a/1e9).toFixed(1)}B`;if(a>=1e6)return `${sign}$${(a/1e6).toFixed(0)}M`;return `${sign}$${a.toFixed(0)}`}

export default function ExplorePage(){
  const [query,setQuery]=useState("");
  const [sort,setSort]=useState("net_assets_usd");
  const [data,setData]=useState<ApiResult|null>(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    const controller=new AbortController();
    const timer=setTimeout(async()=>{
      setLoading(true);
      try{
        const dir=sort==="net_expense_ratio_pct"?"asc":"desc";
        const p=new URLSearchParams({limit:"60",sort,dir});
        if(query.trim())p.set("q",query.trim());
        const r=await fetch(`/api/funds/screener?${p}`,{signal:controller.signal});
        const payload=await r.json();
        setData(payload);
      }catch(error){
        if((error as Error)?.name!=="AbortError") setData({mode:"fallback",rows:[],error:"Live screener request failed"});
      }finally{
        if(!controller.signal.aborted)setLoading(false);
      }
    },350);
    return()=>{clearTimeout(timer);controller.abort()}
  },[query,sort]);

  const providerAvailable=data?.mode==="live";
  const fallbackRows=useMemo(()=>etfs.filter(e=>`${e.symbol} ${e.name} ${e.category} ${e.theme}`.toLowerCase().includes(query.toLowerCase())),[query]);

  return <AppShell><SectionHeader eyebrow="ETF SCREENER" title="Search the ETF universe." description="Live fund discovery when BusinessQuant is connected, with automatic curated fallback."/>
  <section className="panel filterPanel"><div className="searchBar"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search ticker, fund name or category…"/><span className={providerAvailable?"liveChip":"demoChip"}>{providerAvailable?"LIVE UNIVERSE":"CURATED FALLBACK"}</span></div><div className="filterGrid"><label>Sort by<select value={sort} onChange={e=>setSort(e.target.value)}><option value="net_assets_usd">Largest AUM</option><option value="return_1y_pct">Best 1Y return</option><option value="net_flow_12m_usd">Largest 12M net flow</option><option value="net_expense_ratio_pct">Lowest expense ratio</option></select></label></div><div className="resultMeta">{loading?"Loading…":providerAvailable?<><b>{data?.rows.length??0}</b> shown · {data?.totalMatched??0} matched across {data?.universeTotal??0} funds</>:<><b>{fallbackRows.length}</b> curated funds{data?.error?<span className="errorInline"> · {data.error}</span>:null}</>}</div></section>
  {providerAvailable?(data?.rows.length?<section className="panel liveScreener"><div className="liveTableHeader"><span>Fund</span><span>AUM</span><span>Expense</span><span>1Y Return</span><span>12M Flow</span><span>Top sector</span></div>{data.rows.map(r=><Link href={`/etf/${r.ticker}`} className="liveTableRow" key={r.ticker}><div><b>{r.ticker}</b><small>{r.fundName}</small></div><span>{money(r.netAssetsUsd)}</span><span>{r.expenseRatioPct!==undefined?`${r.expenseRatioPct.toFixed(2)}%`:"—"}</span><span className={(r.return1yPct||0)>=0?"positive":"negative"}>{r.return1yPct!==undefined?`${r.return1yPct>0?"+":""}${r.return1yPct.toFixed(1)}%`:"—"}</span><span className={(r.netFlow12mUsd||0)>=0?"positive":"negative"}>{money(r.netFlow12mUsd)}</span><span>{r.topSector||"—"}{r.topSectorPct!==undefined?<small>{r.topSectorPct.toFixed(1)}%</small>:null}</span></Link>)}</section>:<section className="panel emptyState"><h3>No ETFs matched</h3><p>Try another ticker, fund name, or category.</p></section>):<section className="panel explorerPanel"><ETFTable rows={fallbackRows}/></section>}
  </AppShell>;
}
