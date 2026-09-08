"use client";

import { useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import SectionHeader from "@/components/SectionHeader";

type InputHolding={ticker:string;weight:number};
type Analysis={
  error?:string; totalInputWeight?:number;
  holdings?:Array<{ticker:string;inputWeight:number;normalizedWeight:number;fundName?:string;expenseRatioPct?:number;annualizedVolatility?:number}>;
  metrics?:{weightedExpenseRatioPct:number;expenseCoveragePct:number;weightedVolatilityPct:number;riskCoveragePct:number;risk:string;diversificationScore:number;averagePairOverlapPct:number};
  sectorExposure?:Array<{bucket:string;weightPct:number}>;
  countryExposure?:Array<{bucket:string;weightPct:number}>;
  underlyingHoldings?:Array<{key:string;ticker?:string;name:string;weightPct:number}>;
  pairwiseOverlaps?:Array<{a:string;b:string;overlapPct:number}>;
  methodology?:string;
};

const STARTER:InputHolding[]=[{ticker:"VOO",weight:40},{ticker:"QQQ",weight:25},{ticker:"SCHD",weight:20},{ticker:"XLK",weight:15}];

export default function PortfolioPage(){
  const [holdings,setHoldings]=useState<InputHolding[]>(STARTER);
  const [analysis,setAnalysis]=useState<Analysis|null>(null);
  const [loading,setLoading]=useState(false);

  const total=useMemo(()=>holdings.reduce((s,h)=>s+(Number(h.weight)||0),0),[holdings]);

  function update(i:number,key:keyof InputHolding,value:string){
    setHoldings(prev=>prev.map((h,idx)=>idx===i?{...h,[key]:key==="weight"?Number(value):value.toUpperCase()}:h));
  }
  function add(){if(holdings.length<10)setHoldings(prev=>[...prev,{ticker:"",weight:0}])}
  function remove(i:number){setHoldings(prev=>prev.filter((_,idx)=>idx!==i))}
  async function analyze(){
    setLoading(true);setAnalysis(null);
    try{
      const r=await fetch("/api/portfolio/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({holdings})});
      setAnalysis(await r.json());
    }catch{setAnalysis({error:"Portfolio analysis request failed"})}finally{setLoading(false)}
  }

  const score=analysis?.metrics?.diversificationScore;
  return <AppShell><SectionHeader eyebrow="PORTFOLIO ANALYZER" title="See what your ETF portfolio really owns." description="Analyze fees, risk, sector and geographic concentration, hidden ETF overlap and underlying holdings across your portfolio."/>
  <section className="portfolioBuilder panel">
    <div className="panelHeader"><div><span className="eyebrow">YOUR ALLOCATION</span><h2>Enter up to 10 ETFs</h2></div><span className={Math.abs(total-100)<.01?"liveChip":"demoChip"}>{total.toFixed(1)}% entered</span></div>
    <div className="portfolioInputs">{holdings.map((h,i)=><div className="portfolioInputRow" key={i}><span>{i+1}</span><input value={h.ticker} onChange={e=>update(i,"ticker",e.target.value)} placeholder="Ticker"/><input type="number" min="0" step="1" value={h.weight} onChange={e=>update(i,"weight",e.target.value)}/><b>%</b><button onClick={()=>remove(i)}>Remove</button></div>)}</div>
    <div className="portfolioBuilderActions"><button onClick={add} disabled={holdings.length>=10}>+ Add ETF</button><button className="primaryAction" onClick={analyze} disabled={loading}>{loading?"Analyzing portfolio…":"Analyze portfolio"}</button></div>
    <p className="helperText">Weights do not need to total exactly 100%; ETF Pulse normalizes them before analysis.</p>
  </section>

  {analysis?.error&&<section className="providerWarning"><strong>Analysis unavailable</strong><span>{analysis.error}</span></section>}

  {analysis?.metrics&&<>
    <section className="portfolioScoreGrid">
      <article className="portfolioScoreCard hero"><span>Diversification score</span><b>{score}/100</b><div className="scoreRail"><i style={{width:`${score}%`}}/></div><small>{(score??0)>=80?"Broadly diversified":(score??0)>=60?"Moderately diversified":(score??0)>=40?"Concentrated":"Highly concentrated"}</small></article>
      <article className="portfolioScoreCard"><span>Weighted expense ratio</span><b>{analysis.metrics.weightedExpenseRatioPct.toFixed(3)}%</b><small>{analysis.metrics.expenseCoveragePct.toFixed(0)}% data coverage</small></article>
      <article className="portfolioScoreCard"><span>Portfolio volatility</span><b>{analysis.metrics.weightedVolatilityPct.toFixed(2)}%</b><small>{analysis.metrics.risk} risk · {analysis.metrics.riskCoveragePct.toFixed(0)}% coverage</small></article>
      <article className="portfolioScoreCard"><span>Average ETF overlap</span><b>{analysis.metrics.averagePairOverlapPct.toFixed(1)}%</b><small>Average pairwise holdings overlap</small></article>
    </section>

    <section className="portfolioAnalysisGrid">
      <article className="panel"><div className="panelHeader"><div><span className="eyebrow">ALLOCATION</span><h2>Normalized ETF weights</h2></div></div><div className="portfolioMetricList">{analysis.holdings?.map(h=><div key={h.ticker}><div><b>{h.ticker}</b><span>{h.normalizedWeight.toFixed(1)}%</span></div><div className="sectorRail"><i style={{width:`${h.normalizedWeight}%`}}/></div><small>{h.fundName||"ETF"}{h.expenseRatioPct!==undefined?` · ${h.expenseRatioPct.toFixed(2)}% fee`:""}</small></div>)}</div></article>
      <article className="panel"><div className="panelHeader"><div><span className="eyebrow">SECTOR EXPOSURE</span><h2>Look-through sectors</h2></div></div><div className="portfolioMetricList">{analysis.sectorExposure?.slice(0,10).map(s=><div key={s.bucket}><div><b>{s.bucket}</b><span>{s.weightPct.toFixed(1)}%</span></div><div className="sectorRail"><i style={{width:`${Math.min(s.weightPct,100)}%`}}/></div></div>)}</div></article>
      <article className="panel"><div className="panelHeader"><div><span className="eyebrow">GEOGRAPHY</span><h2>Country exposure</h2></div></div><div className="portfolioMetricList">{analysis.countryExposure?.slice(0,10).map(s=><div key={s.bucket}><div><b>{s.bucket}</b><span>{s.weightPct.toFixed(1)}%</span></div><div className="sectorRail"><i style={{width:`${Math.min(s.weightPct,100)}%`}}/></div></div>)}</div></article>
      <article className="panel"><div className="panelHeader"><div><span className="eyebrow">ETF OVERLAP</span><h2>Most redundant pairs</h2></div></div><div className="pairOverlapList">{analysis.pairwiseOverlaps?.slice(0,10).map(p=><div key={`${p.a}-${p.b}`}><b>{p.a} × {p.b}</b><span>{p.overlapPct.toFixed(1)}%</span><div className="sectorRail"><i style={{width:`${Math.min(p.overlapPct,100)}%`}}/></div></div>)}</div></article>
    </section>

    <section className="panel underlyingPanel"><div className="panelHeader"><div><span className="eyebrow">LOOK-THROUGH HOLDINGS</span><h2>Your biggest underlying positions</h2></div></div><div className="underlyingTable"><div className="underlyingHeader"><span>Holding</span><span>Effective portfolio weight</span></div>{analysis.underlyingHoldings?.slice(0,20).map(h=><div className="underlyingRow" key={h.key}><div><b>{h.ticker||h.name}</b><small>{h.name}</small></div><strong>{h.weightPct.toFixed(2)}%</strong></div>)}</div></section>
    <p className="methodologyNote">{analysis.methodology}</p>
  </>}
  </AppShell>
}
