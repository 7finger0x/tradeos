"use client";

import { useEffect, useState } from "react";

type OperatorAction = {
  id: string;
  action_type: string;
  target_type: string | null;
  status: string;
  payload: Record<string, unknown>;
  created_at: string;
};

export function HermesOperatorActionsPanel() {
  const [actions, setActions] = useState<OperatorAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch("/api/hermes/operator-actions?limit=30");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to load actions");
        setLoading(false);
        return;
      }
      setActions(json.actions ?? []);
      setLoading(false);
    }
    void load();
  }, []);

  if (loading) return <p className="muted">Loading operator actions…</p>;
  if (error) return <p className="error">{error}</p>;

  if (actions.length === 0) {
    return (
      <p className="muted">
        No operator actions yet. Run liquidity ingest or update a threshold.
      </p>
    );
  }

  return (
    <section>
      <h2 className="section-title">Operator action log</h2>
      <ul className="hermes-timeline">
        {actions.map((a) => (
          <li key={a.id} className="card hermes-timeline-item">
            <div className="hermes-timeline-header">
              <strong>{a.action_type}</strong>
              <span className="muted">{new Date(a.created_at).toLocaleString()}</span>
            </div>
            {a.target_type ? (
              <p className="muted">
                Target: {a.target_type} · {a.status}
              </p>
            ) : null}
            {a.payload && Object.keys(a.payload).length > 0 ? (
              <pre className="hermes-payload mono">
                {JSON.stringify(a.payload, null, 2)}
              </pre>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
