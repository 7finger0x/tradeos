"use client";

import { useEffect, useState } from "react";

type AuditEvent = {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  after_state: Record<string, unknown> | null;
  created_at: string;
};

export function HermesCompliancePanel() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch("/api/hermes/compliance?limit=40");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to load compliance feed");
        setLoading(false);
        return;
      }
      setEvents(json.events ?? []);
      setLoading(false);
    }
    void load();
  }, []);

  if (loading) return <p className="muted">Loading compliance audit feed…</p>;
  if (error) return <p className="error">{error}</p>;

  if (events.length === 0) {
    return (
      <p className="muted">
        No Hermes audit events yet. Operator actions and denied access attempts appear here.
      </p>
    );
  }

  return (
    <section>
      <h2 className="section-title">Compliance audit feed</h2>
      <p className="muted briefing-hint">
        Hermes operator actions and denied operator access attempts for this tenant.
      </p>
      <ul className="hermes-timeline">
        {events.map((e) => (
          <li key={e.id} className="card hermes-timeline-item">
            <div className="hermes-timeline-header">
              <strong>
                {e.action}
                {e.resource_type ? ` · ${e.resource_type}` : ""}
              </strong>
              <span className="muted">{new Date(e.created_at).toLocaleString()}</span>
            </div>
            {e.after_state ? (
              <pre className="hermes-payload mono">
                {JSON.stringify(e.after_state, null, 2)}
              </pre>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
