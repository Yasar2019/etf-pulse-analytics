import { SeriesPoint } from "@/lib/analytics";

export default function LineChart({ data, compact=false }: { data: SeriesPoint[]; compact?: boolean }) {
  const w = 720, h = compact ? 150 : 260, padX = 18, padY = 18;
  const min = Math.min(...data.map(d => d.value));
  const max = Math.max(...data.map(d => d.value));
  const range = Math.max(max - min, 1);
  const pts = data.map((d,i) => ({
    ...d,
    x: padX + (i / Math.max(data.length - 1, 1)) * (w - padX * 2),
    y: h - padY - ((d.value - min) / range) * (h - padY * 2),
  }));
  const points = pts.map(p => `${p.x},${p.y}`).join(" ");
  const area = `${padX},${h-padY} ${points} ${w-padX},${h-padY}`;
  return <div className={`lineChart ${compact ? "compact" : ""}`}>
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Performance chart">
      {[.25,.5,.75].map(v => <line key={v} x1={padX} x2={w-padX} y1={h*v} y2={h*v} className="chartGrid" />)}
      <polygon points={area} className="chartArea" />
      <polyline points={points} className="chartLine" fill="none" />
      {pts.map((p,i) => <circle key={i} cx={p.x} cy={p.y} r="4" className="chartDot" />)}
    </svg>
    {!compact && <div className="chartLabels">{data.map(d => <span key={d.label}>{d.label}</span>)}</div>}
  </div>;
}
