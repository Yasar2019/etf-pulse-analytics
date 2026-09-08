import AppShell from "@/components/AppShell";
import SectionHeader from "@/components/SectionHeader";
import LineChart from "@/components/LineChart";
import FlowBars from "@/components/FlowBars";
import { breadth, flowLeaders, marketPerformance, monthlyFlows, marketSignals } from "@/lib/analytics";

export default function InsightsPage(){return <AppShell>
  <SectionHeader eyebrow="MARKET INTELLIGENCE" title="Read the ETF market in one screen." description="Breadth, flows, leadership and risk signals translated into a cleaner market narrative." />
  <section className="insightHeroGrid">
    <article className="panel chartPanel"><div className="panelHeader"><div><span className="eyebrow">MARKET REGIME</span><h2>ETF market pulse</h2></div><span className="liveChip">● DEMO FEED</span></div><LineChart data={marketPerformance}/><div className="chartSummary"><b>+21.4%</b><span>Composite ETF pulse YTD</span></div></article>
    <article className="panel"><div className="panelHeader"><div><span className="eyebrow">CAPITAL FLOWS</span><h2>Monthly net creations</h2></div></div><FlowBars data={monthlyFlows}/></article>
  </section>
  <section className="insightGrid">
    <article className="panel"><div className="panelHeader"><div><span className="eyebrow">BREADTH</span><h2>Participation</h2></div></div><div className="breadthList">{breadth.map(b=><div key={b.label}><div><span>{b.label}</span><b>{b.value}%</b></div><div className="breadthRail"><i className={b.tone} style={{width:`${b.value}%`}}/></div></div>)}</div></article>
    <article className="panel"><div className="panelHeader"><div><span className="eyebrow">FLOW LEADERS</span><h2>Where money is going</h2></div></div><div className="leaderList">{flowLeaders.map((f,i)=><div key={f.symbol}><span className="rank">{String(i+1).padStart(2,"0")}</span><div><b>{f.symbol}</b><small>{f.name}</small></div><strong>+${f.value}B</strong></div>)}</div></article>
  </section>
  <section className="signalGrid">{marketSignals.map(s=><article key={s.label} className="signalCard"><span>{s.label}</span><b>{s.value}</b><p>{s.detail}</p></article>)}</section>
</AppShell>}
