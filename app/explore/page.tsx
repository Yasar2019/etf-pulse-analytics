"use client";
import { useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import SectionHeader from "@/components/SectionHeader";
import ETFTable from "@/components/ETFTable";
import { etfs, taxonomy } from "@/lib/demoData";

export default function ExplorePage(){
 const [query,setQuery]=useState(""); const [asset,setAsset]=useState("All"); const [issuer,setIssuer]=useState("All");
 const rows=useMemo(()=>etfs.filter(e=>`${e.symbol} ${e.name} ${e.category} ${e.theme}`.toLowerCase().includes(query.toLowerCase())&&(asset==="All"||e.assetClass===asset)&&(issuer==="All"||e.issuer===issuer)),[query,asset,issuer]);
 return <AppShell><SectionHeader eyebrow="ETF SCREENER" title="Find the signal. Skip the spreadsheet." description="Search and filter ETFs by the dimensions that actually matter."/>
 <section className="panel filterPanel"><div className="searchBar"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search ticker, fund, theme or category…"/><kbd>⌘ K</kbd></div><div className="filterGrid"><label>Asset class<select value={asset} onChange={e=>setAsset(e.target.value)}><option>All</option>{taxonomy.assetClasses.map(x=><option key={x}>{x}</option>)}</select></label><label>Issuer<select value={issuer} onChange={e=>setIssuer(e.target.value)}><option>All</option>{taxonomy.issuers.map(x=><option key={x}>{x}</option>)}</select></label><label>Geography<select><option>All</option>{taxonomy.geographies.map(x=><option key={x}>{x}</option>)}</select></label><label>Theme<select><option>All</option>{taxonomy.themes.map(x=><option key={x}>{x}</option>)}</select></label></div><div className="resultMeta"><b>{rows.length}</b> funds matched <button onClick={()=>{setQuery("");setAsset("All");setIssuer("All")}}>Reset filters</button></div></section>
 <section className="panel explorerPanel"><ETFTable rows={rows}/></section></AppShell>;
}
