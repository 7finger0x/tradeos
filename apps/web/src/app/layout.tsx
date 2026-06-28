import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TradeOS — AI Trading Operating System",
  description:
    "Professional AI trading desk: journal, risk, briefing, coaching, and Hermes intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
