import Link from "next/link";
import { ETF } from "@/lib/types";

export default function ETFTable({ rows }: { rows: ETF[] }) {
  return <div className="tableWrap"><table><thead><tr><th>ETF</th><th>Asset class</th><th>Category</th><th>AUM</th><th>Expense</th><th>YTD</th><th>30D flow</th><th>Risk</th></tr></thead><tbody>
    {rows.map(etf => <tr key={etf.symbol}><td><Link href={`/etf/${etf.symbol}`} className="tickerCell"><span>{etf.symbol.slice(0,1)}</span><div><b>{etf.symbol}</b><small>{etf.name}</small></div></Link></td><td>{etf.assetClass}</td><td>{etf.category}</td><td>{etf.aum}</td><td>{etf.expense}</td><td className={etf.ytd >= 0 ? "positive" : "negative"}>{etf.ytd >= 0 ? "+" : ""}{etf.ytd}%</td><td className={etf.flowBn >= 0 ? "positive" : "negative"}>{etf.flow}</td><td><span className={`risk ${etf.risk.toLowerCase()}`}>{etf.risk}</span></td></tr>)}
  </tbody></table></div>;
}
