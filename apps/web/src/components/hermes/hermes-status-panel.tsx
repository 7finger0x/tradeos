"use client";

import { useEffect, useState } from "react";
import { useTenant } from "@/components/tenant-provider";
import { canAccessOperatorActions, type AppRole } from "@tradeos/core";

type HermesStatus = {
  summary: {
    agent_status: string;
    last_run_at: string | null;
    provider_count: number;
    healthy_providers: number;
    observation_count_24h: number;
    quorum_pass_rate: number;
    threshold_alerts: number;
  };
  alerts: Array<{ label: string; message: string; severity: string }>;
  providers: Array<{ provider_key: string; status: string; chain_id: string }>;
  recent_observations: Array<{
    pool_address: string;
    token_pair: string;
    liquidity_usd: number;
    quorum_passed: boolean;
    quality_score: number;
    observed_at: string;
  }>;
};

export function HermesStatusPanel() {
  const { role } = useTenant();
  const isOperator = role ? canAccessOperatorActions(role as AppRole) : false;

  const [data, setData] = useState<HermesStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/hermes/status");
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Failed to load");
      setLoading(false);
      return;
    }
    setData(json);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleIngest() {
    setIngesting(true);
    setError(null);
    const res = await fetch("/api/hermes/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chain_id: "ethereum-mainnet" }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Ingest failed");
      setIngesting(false);
      return;
    }
    await load();
    setIngesting(false);
  }

  if (loading) return <p className="muted">Loading Hermes status…</p>;

  const summary = data?.summary;

  return (
    <div className="hermes-layout">
      {isOperator ? (
        <div className="briefing-actions">
          <button
            type="button"
            className="button"
            onClick={() => void handleIngest()}
            disabled={ingesting}
          >
            {ingesting ? "Ingesting…" : "Run liquidity ingest"}
          </button>
          <p className="muted briefing-hint">
            Polls mock multi-provider RPC cluster, evaluates quorum, and persists observations.
          </p>
        </div>
      ) : (
        <p className="muted">Operator role required to run ingest. You can view status below.</p>
      )}

      {error ? <p className="error">{error}</p> : null}

      {summary ? (
        <div className="hermes-stats card">
          <div className="hermes-stat-grid">
            <Stat label="Agent" value={summary.agent_status} />
            <Stat label="Providers" value={`${summary.healthy_providers}/${summary.provider_count} healthy`} />
            <Stat label="Observations (24h)" value={String(summary.observation_count_24h)} />
            <Stat label="Quorum pass rate" value={`${summary.quorum_pass_rate}%`} />
            <Stat label="Threshold alerts" value={String(summary.threshold_alerts)} />
          </div>
          {summary.last_run_at ? (
            <p className="muted">Last ingest: {new Date(summary.last_run_at).toLocaleString()}</p>
          ) : null}
        </div>
      ) : null}

      {data?.alerts && data.alerts.length > 0 ? (
        <section>
          <h2 className="section-title">Threshold alerts</h2>
          <ul className="hermes-alerts">
            {data.alerts.map((a) => (
              <li key={a.label + a.message} className={`alert-${a.severity}`}>
                <strong>{a.label}</strong> — {a.message}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data?.providers && data.providers.length > 0 ? (
        <section>
          <h2 className="section-title">Providers</h2>
          <div className="provider-grid">
            {data.providers.map((p) => (
              <article key={p.provider_key} className="card provider-card">
                <strong>{p.provider_key}</strong>
                <p className="muted">{p.chain_id}</p>
                <span className="regime-badge">{p.status}</span>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {data?.recent_observations && data.recent_observations.length > 0 ? (
        <section>
          <h2 className="section-title">Recent observations</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Pool</th>
                <th>Pair</th>
                <th>Liquidity</th>
                <th>Quality</th>
                <th>Quorum</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_observations.map((o, i) => (
                <tr key={`${o.pool_address}-${i}`}>
                  <td className="mono">{o.pool_address.slice(0, 10)}…</td>
                  <td>{o.token_pair}</td>
                  <td>${Number(o.liquidity_usd).toLocaleString()}</td>
                  <td>{Number(o.quality_score).toFixed(2)}</td>
                  <td>{o.quorum_passed ? "✓" : "✗"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <div className="card">
          <p>No observations yet. {isOperator ? "Run ingest to populate durable repositories." : ""}</p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="stat-label">{label}</span>
      <p className="hermes-stat-value">{value}</p>
    </div>
  );
}
