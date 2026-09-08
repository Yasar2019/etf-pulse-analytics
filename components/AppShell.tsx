"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

const nav = [
  ["Overview", "/", "⌁"],
  ["ETF Explorer", "/explore", "◫"],
  ["Sectors", "/sectors", "◈"],
  ["Compare", "/compare", "⇄"],
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return <main className="shell">
    <aside className="sidebar">
      <Link href="/" className="brand"><div className="brandMark">P</div><div><strong>ETF Pulse</strong><span>Market intelligence</span></div></Link>
      <nav>{nav.map(([label, href, icon]) => <Link key={href} href={href} className={`navItem ${pathname === href ? "active" : ""}`}><span>{icon}</span>{label}</Link>)}</nav>
      <div className="navDivider" />
      <div className="navLabel">DISCOVER</div>
      <div className="navItem muted"><span>✦</span>Themes <i>Soon</i></div>
      <div className="navItem muted"><span>↗</span>Fund Flows <i>Soon</i></div>
      <div className="navItem muted"><span>☆</span>Watchlist <i>Soon</i></div>
      <div className="sideCard"><span className="eyebrow">DATA STATUS</span><div className="statusLine"><i />Demo dataset online</div><small>Provider layer prepared for licensed live ETF data.</small></div>
    </aside>
    <section className="workspace">{children}<footer>ETF Pulse · Demo analytics only · Not investment advice</footer></section>
  </main>;
}
