"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type TradeRow = {
  id: string;
  symbol: string;
  direction: string;
  entry_time: string;
  net_pnl: number | null;
  r_multiple: number | null;
  setups?: { name: string } | null;
};

export function TradeTable() {
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/trades?limit=100");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to load trades");
        setLoading(false);
        return;
      }
      setTrades(data.trades ?? []);
      setLoading(false);
    }
    void load();
  }, []);

  if (loading) return <p className="muted">Loading trades…</p>;
  if (error) return <p className="error">{error}</p>;
  if (trades.length === 0) {
    return (
      <div className="card empty-state">
        <p>No trades yet.</p>
        <p className="muted">Import a CSV or log your first trade manually.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap card">
      <table className="trade-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Symbol</th>
            <th>Dir</th>
            <th>Setup</th>
            <th>P/L</th>
            <th>R</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => (
            <tr key={t.id}>
              <td>{new Date(t.entry_time).toLocaleDateString()}</td>
              <td>{t.symbol}</td>
              <td>{t.direction}</td>
              <td>{t.setups?.name ?? "—"}</td>
              <td className={(t.net_pnl ?? 0) >= 0 ? "positive" : "negative"}>
                {t.net_pnl !== null ? `$${t.net_pnl.toFixed(2)}` : "—"}
              </td>
              <td>{t.r_multiple ?? "—"}</td>
              <td>
                <Link href={`/dashboard/journal/${t.id}`}>View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
