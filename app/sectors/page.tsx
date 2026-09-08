import AppShell from "@/components/AppShell";
import SectionHeader from "@/components/SectionHeader";
import { screenBusinessQuantFunds } from "@/lib/providers/businessQuant";
import { etfProvider } from "@/lib/provider";

const sectorProxies = [
  ["Technology","XLK"],["Financials","XLF"],["Health Care","XLV"],["Industrials","XLI"],["Energy","XLE"],
  ["Consumer Discretionary","XLY"],["Consumer Staples","XLP"],["Utilities","XLU"],["Communication Services","XLC"],["Real Estate","XLRE"],
] as const;

type Concentration={name:string;funds:number;aum:number;flow:number};
function money(n:number){const a=Math.abs(n);const sign=n<0?"-":"";if(a>=1e12)return `${sign}$${(a/1e12).toFixed(1)}T`;if(a>=1e9)return `${sign}$${(a/1e9).toFixed(1)}B`;if(a>=1e6)return `${sign}$${(a/1e6).toFixed(0)}M`;return `${sign}$${a.toFixed(0)}`}

export default async function SectorsPage(){
  const performance = await Promise.all(sectorProxies.map(async ([name,ticker])=>{
    try {
      const stats=await etfProvider.getPerformanceStats(ticker);
      return {name,ticker,returnPct:stats.oneYearReturn,ytd:stats.ytdReturn,volatility:stats.annualizedVolatility,live:stats.source==="twelve-data"};
    } catch {
      return {name,ticker,returnPct:0,ytd:0,volatility:0,live:false};
    }
  }));

  let screened=null;try{screened=await screenBusinessQuantFunds({limit:100,sort:"net_assets_usd",sortDir:"desc"})}catch{screened=null}
  const agg=new Map<string,Concentration>();
  if(screened){for(const r of screened.rows){if(!r.topSector)continue;const cur=agg.get(r.topSector)||{name:r.topSector,funds:0,aum:0,flow:0};cur.funds++;cur.aum+=r.netAssetsUsd||0;cur.flow+=r.netFlow12mUsd||0;agg.set(r.topSector,cur)}}
  const concentration=[...agg.values()].sort((a,b)=>b.aum-a.aum).slice(0,10);
  const livePerformance=performance.some(x=>x.live);

  return <AppShell><SectionHeader eyebrow="SECTOR INTELLIGENCE" title="Sector performance and ETF capital concentration." description="Performance uses sector-proxy ETFs; concentration uses the dominant-sector composition of the screened ETF universe."/>
  <div className="sectionSource"><span className={livePerformance?"liveChip":"demoChip"}>{livePerformance?"LIVE SECTOR PROXIES":"PRICE DATA FALLBACK"}</span><small>Performance and capital concentration are intentionally shown as separate signals.</small></div>
  <section className="sectorCards">{performance.sort((a,b)=>b.returnPct-a.returnPct).map((s,i)=><article className="sectorCard" key={s.ticker}><span>#{i+1} · {s.ticker}</span><h3>{s.name}</h3><strong className={s.returnPct>=0?"positive":"negative"}>{s.returnPct>=0?"+":""}{s.returnPct.toFixed(1)}%</strong><small>1Y sector-proxy return</small><div className="miniTrack"><i style={{width:`${Math.min(Math.max(Math.abs(s.returnPct)*3,8),100)}%`}}/></div><div className="sectorStats"><span>YTD <b className={s.ytd>=0?"positive":"negative"}>{s.ytd>=0?"+":""}{s.ytd.toFixed(1)}%</b></span><span>Volatility <b>{s.volatility.toFixed(1)}%</b></span></div></article>)}</section>
  <section className="panel concentrationPanel"><div className="panelHeader"><div><span className="eyebrow">CAPITAL CONCENTRATION</span><h2>Where ETF assets cluster by dominant sector</h2></div><span className={concentration.length?"liveChip":"demoChip"}>{concentration.length?"BUSINESSQUANT":"UNAVAILABLE"}</span></div>{concentration.length?<div className="concentrationList">{concentration.map((s,i)=><div key={s.name}><span>#{i+1}</span><b>{s.name}</b><strong>{money(s.aum)}</strong><small>{s.funds} funds</small><em className={s.flow>=0?"positive":"negative"}>{money(s.flow)} 12M flow</em></div>)}</div>:<div className="emptyState"><h3>Capital concentration unavailable</h3><p>Configure BusinessQuant to populate this view.</p></div>}</section>
  </AppShell>}
