"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Analytics = {
  trade_count: number;
  win_rate: number;
  total_net_pnl: number;
  expectancy: number;
  profit_factor: number;
  average_r: number;
};

export function JournalStats() {
  const [daily, setDaily] = useState<Analytics | null>(null);
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/journal/analytics?period=daily");
      const data = await res.json();
      setDaily(data.period ?? null);
      setSummary(data.summary ?? "");
      setLoading(false);
    }
    void load();
  }, []);

  if (loading) {
    return <p className="muted">Loading analytics…</p>;
  }

  return (
    <div className="journal-stats">
      <div className="stat-grid">
        <div className="card stat-card">
          <span className="stat-label">Trades today</span>
          <strong>{daily?.trade_count ?? 0}</strong>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Win rate</span>
          <strong>{daily?.win_rate ?? 0}%</strong>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Net P/L</span>
          <strong className={ (daily?.total_net_pnl ?? 0) >= 0 ? "positive" : "negative" }>
            ${(daily?.total_net_pnl ?? 0).toFixed(2)}
          </strong>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Expectancy</span>
          <strong>${(daily?.expectancy ?? 0).toFixed(2)}</strong>
        </div>
      </div>
      {summary ? (
        <section className="card summary-card">
          <h2>Journal summary</h2>
          <pre className="summary-text">{summary}</pre>
        </section>
      ) : null}
    </div>
  );
}

export function JournalActions() {
  return (
    <div className="journal-actions">
      <Link href="/dashboard/journal/new" className="button">
        Log trade
      </Link>
      <Link href="/dashboard/journal/import" className="button button-secondary">
        Import CSV
      </Link>
    </div>
  );
}
