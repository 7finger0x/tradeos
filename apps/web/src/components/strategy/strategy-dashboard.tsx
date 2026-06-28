"use client";

import { useEffect, useState } from "react";

type Analytics = {
  trade_count: number;
  win_rate: number;
  total_net_pnl: number;
  expectancy: number;
  profit_factor: number;
  average_r: number;
};

type StrategyPayload = {
  overview: Analytics;
  advanced: {
    equity_curve: { date: string; cumulative_pnl: number; trade_index: number }[];
    drawdown: { max_drawdown: number; max_drawdown_pct: number; peak_equity: number };
    streaks: {
      current_streak: number;
      current_streak_type: string;
      longest_win_streak: number;
      longest_loss_streak: number;
    };
  };
  setups: {
    key: string;
    label: string;
    trade_count: number;
    analytics: Analytics;
  }[];
  symbols: {
    key: string;
    label: string;
    trade_count: number;
    analytics: Analytics;
  }[];
  weekdays: {
    key: string;
    label: string;
    trade_count: number;
    analytics: Analytics;
  }[];
  emotions: {
    key: string;
    label: string;
    trade_count: number;
    analytics: Analytics;
  }[];
  insights: string;
  disclaimer: string;
};

export function StrategyOverviewPanel({ data }: { data: StrategyPayload }) {
  const { overview, advanced } = data;

  return (
    <section className="strategy-layout">
      <div className="stat-grid">
        <div className="card stat-card">
          <span className="stat-label">Closed trades</span>
          <strong>{overview.trade_count}</strong>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Win rate</span>
          <strong>{overview.win_rate}%</strong>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Net P/L</span>
          <strong className={overview.total_net_pnl >= 0 ? "positive" : "negative"}>
            ${overview.total_net_pnl.toFixed(2)}
          </strong>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Expectancy</span>
          <strong>${overview.expectancy.toFixed(2)}</strong>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Max drawdown</span>
          <strong className="negative">${advanced.drawdown.max_drawdown.toFixed(2)}</strong>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Longest loss streak</span>
          <strong>{advanced.streaks.longest_loss_streak}</strong>
        </div>
      </div>

      {advanced.equity_curve.length > 0 ? (
        <section className="card">
          <h2 className="section-title">Equity curve</h2>
          <div className="equity-chart" role="img" aria-label="Cumulative P/L by trade">
            {advanced.equity_curve.map((point) => {
              const maxAbs = Math.max(
                ...advanced.equity_curve.map((p) => Math.abs(p.cumulative_pnl)),
                1,
              );
              const height = Math.round((Math.abs(point.cumulative_pnl) / maxAbs) * 100);
              return (
                <div
                  key={point.trade_index}
                  className={`equity-bar${point.cumulative_pnl >= 0 ? " equity-bar-positive" : " equity-bar-negative"}`}
                  style={{ height: `${Math.max(height, 4)}%` }}
                  title={`Trade ${point.trade_index}: $${point.cumulative_pnl}`}
                />
              );
            })}
          </div>
        </section>
      ) : (
        <p className="muted">No closed trades yet — equity curve appears after exits are logged.</p>
      )}

      <section className="card summary-card">
        <h2 className="section-title">Strategy insights</h2>
        <pre className="summary-text">{data.insights}</pre>
        <p className="muted disclaimer">{data.disclaimer}</p>
      </section>
    </section>
  );
}

export function StrategySetupsPanel({ data }: { data: StrategyPayload }) {
  if (data.setups.length === 0) {
    return <p className="muted">No setup data yet. Tag trades with playbook setups in the journal.</p>;
  }

  return (
    <section className="strategy-table-wrap">
      <table className="strategy-table">
        <thead>
          <tr>
            <th>Setup</th>
            <th>Trades</th>
            <th>Win %</th>
            <th>Net P/L</th>
            <th>Expectancy</th>
            <th>Avg R</th>
          </tr>
        </thead>
        <tbody>
          {data.setups.map((row) => (
            <tr key={row.key}>
              <td>{row.label}</td>
              <td>{row.trade_count}</td>
              <td>{row.analytics.win_rate}%</td>
              <td className={row.analytics.total_net_pnl >= 0 ? "positive" : "negative"}>
                ${row.analytics.total_net_pnl.toFixed(2)}
              </td>
              <td>${row.analytics.expectancy.toFixed(2)}</td>
              <td>{row.analytics.average_r}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function BreakdownTable({
  rows,
  emptyMessage,
}: {
  rows: StrategyPayload["symbols"];
  emptyMessage: string;
}) {
  if (rows.length === 0) return <p className="muted">{emptyMessage}</p>;

  return (
    <table className="strategy-table">
      <thead>
        <tr>
          <th>Group</th>
          <th>Trades</th>
          <th>Win %</th>
          <th>Net P/L</th>
          <th>Expectancy</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key}>
            <td>{row.label}</td>
            <td>{row.trade_count}</td>
            <td>{row.analytics.win_rate}%</td>
            <td className={row.analytics.total_net_pnl >= 0 ? "positive" : "negative"}>
              ${row.analytics.total_net_pnl.toFixed(2)}
            </td>
            <td>${row.analytics.expectancy.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function StrategyBreakdownPanel({ data }: { data: StrategyPayload }) {
  return (
    <section className="strategy-breakdown">
      <div className="card">
        <h2 className="section-title">By symbol</h2>
        <BreakdownTable rows={data.symbols} emptyMessage="No symbol breakdown available." />
      </div>
      <div className="card">
        <h2 className="section-title">By weekday (UTC)</h2>
        <BreakdownTable rows={data.weekdays} emptyMessage="No weekday breakdown available." />
      </div>
      <div className="card">
        <h2 className="section-title">By emotion</h2>
        <BreakdownTable
          rows={data.emotions}
          emptyMessage="Tag trades with emotion in the journal to see behavioral performance."
        />
      </div>
    </section>
  );
}

export function StrategyDashboard() {
  const [data, setData] = useState<StrategyPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "setups" | "breakdown">("overview");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/strategy/analytics");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to load strategy analytics");
        setLoading(false);
        return;
      }
      setData(json as StrategyPayload);
      setLoading(false);
    }
    void load();
  }, []);

  if (loading) return <p className="muted">Loading strategy analytics…</p>;
  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">No analytics available.</p>;

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "setups" as const, label: "Setups" },
    { id: "breakdown" as const, label: "Breakdown" },
  ];

  return (
    <div className="strategy-dashboard">
      <nav className="hermes-tabs" aria-label="Strategy analytics sections">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`hermes-tab${tab === t.id ? " hermes-tab-active" : ""}`}
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? "page" : undefined}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <div className="hermes-tab-panel">
        {tab === "overview" ? <StrategyOverviewPanel data={data} /> : null}
        {tab === "setups" ? <StrategySetupsPanel data={data} /> : null}
        {tab === "breakdown" ? <StrategyBreakdownPanel data={data} /> : null}
      </div>
    </div>
  );
}
