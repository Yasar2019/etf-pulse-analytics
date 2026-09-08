import { SeriesPoint } from "@/lib/analytics";
export default function FlowBars({ data }: { data: SeriesPoint[] }) {
  const max = Math.max(...data.map(d=>Math.abs(d.value)),1);
  return <div className="flowBars">{data.map(d=><div className="flowBar" key={d.label}><div className="flowValue">${d.value}B</div><div className="barRail"><i style={{height:`${Math.max(Math.abs(d.value)/max*100,8)}%`}}/></div><span>{d.label}</span></div>)}</div>;
}
