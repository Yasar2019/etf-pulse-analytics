import AppShell from "@/components/AppShell";
import SectionHeader from "@/components/SectionHeader";
import ETFTable from "@/components/ETFTable";
import { etfs, sectors as demoSectors } from "@/lib/demoData";
import { screenBusinessQuantFunds } from "@/lib/providers/businessQuant";

type SectorAgg={name:string;funds:number;aum:number;flow:number;weightedReturn:number;weightBase:number};

function money(n:number){const a=Math.abs(n);if(a>=1e12)return `$${(n/1e12).toFixed(1)}T`;if(a>=1e9)return `$${(n/1e9).toFixed(1)}B`;if(a>=1e6)return `$${(n/1e6).toFixed(0)}M`;return `$${n.toFixed(0)}`}

export default async function SectorsPage(){
 let live=null;try{live=await screenBusinessQuantFunds({limit:100,sort:"net_assets_usd"})}catch{live=null}
 const agg=new Map<string,SectorAgg>();
 if(live){for(const r of live.rows){if(!r.topSector)continue;const cur=agg.get(r.topSector)||{name:r.topSector,funds:0,aum:0,flow:0,weightedReturn:0,weightBase:0};const aum=r.netAssetsUsd||0;cur.funds++;cur.aum+=aum;cur.flow+=r.netFlow12mUsd||0;if(r.return1yPct!==undefined){const w=Math.max(aum,1);cur.weightedReturn+=r.return1yPct*w;cur.weightBase+=w}agg.set(r.topSector,cur)}}
 const rows=[...agg.values()].map(s=>({...s,returnPct:s.weightBase?s.weightedReturn/s.weightBase:0})).sort((a,b)=>b.returnPct-a.returnPct).slice(0,10);
 const isLive=rows.length>0;
 return <AppShell><SectionHeader eyebrow="SECTOR INTELLIGENCE" title="See where ETF capital is concentrated." description="Live sector leadership is aggregated from the dominant sector of screened ETFs when BusinessQuant is connected."/>
 <div className="sectionSource"><span className={isLive?"liveChip":"demoChip"}>{isLive?"LIVE FUND UNIVERSE":"DEMO FALLBACK"}</span></div>
 <section className="sectorCards">{isLive?rows.map((s,i)=><article className="sectorCard" key={s.name}><span>#{i+1}</span><h3>{s.name}</h3><strong className={s.returnPct>=0?"positive":"negative"}>{s.returnPct>=0?"+":""}{s.returnPct.toFixed(1)}%</strong><small>AUM-weighted 1Y return</small><div className="miniTrack"><i style={{width:`${Math.min(Math.max(Math.abs(s.returnPct)*3,8),100)}%`}}/></div><div className="sectorStats"><span>ETF AUM <b>{money(s.aum)}</b></span><span>12M Flow <b className={s.flow>=0?"positive":"negative"}>{money(s.flow)}</b></span><span>Funds <b>{s.funds}</b></span></div></article>):demoSectors.map((s,i)=><article className="sectorCard" key={s.name}><span>#{i+1}</span><h3>{s.name}</h3><strong>+{s.returnPct}%</strong><small>Demo YTD return</small><div className="miniTrack"><i style={{width:`${s.score}%`}}/></div><div className="sectorStats"><span>30D Flow <b>{s.flow>=0?"+":""}${s.flow}B</b></span><span>Momentum <b>{s.score}/100</b></span></div></article>)}</section>
 <section className="panel explorerPanel"><div className="panelHeader"><div><span className="eyebrow">SECTOR FUNDS</span><h2>Featured exposure</h2></div></div><ETFTable rows={etfs.filter(e=>["Technology","Financials"].includes(e.sector))}/></section></AppShell>}
