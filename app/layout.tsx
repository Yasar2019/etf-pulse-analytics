import type { Metadata } from "next";
import "./globals.css";
import "./v03.css";
import "./v04.css";
import "./v05.css";
import "./v06.css";

export const metadata: Metadata = {
  title: "ETF Pulse — Market Intelligence",
  description: "A modern ETF analytics dashboard for sectors, asset classes, themes, flows and fund discovery."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
