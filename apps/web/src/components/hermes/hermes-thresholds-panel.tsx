"use client";

import { useEffect, useState } from "react";
import { canAccessOperatorActions, type AppRole } from "@tradeos/core";

type Threshold = {
  id: string;
  threshold_key: string;
  label: string;
  value: number;
  unit: string;
  severity: string;
  enabled: boolean;
};

type Props = {
  role: AppRole | null;
};

export function HermesThresholdsPanel({ role }: Props) {
  const isOperator = role ? canAccessOperatorActions(role) : false;
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/hermes/thresholds");
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Failed to load thresholds");
      setLoading(false);
      return;
    }
    const rows = (json.thresholds ?? []) as Threshold[];
    setThresholds(rows);
    setDrafts(
      Object.fromEntries(rows.map((t) => [t.threshold_key, String(t.value)])),
    );
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(key: string) {
    if (!isOperator) return;
    const value = Number(drafts[key]);
    if (Number.isNaN(value)) {
      setError("Invalid threshold value");
      return;
    }
    setSaving(key);
    setError(null);
    const res = await fetch("/api/hermes/thresholds", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threshold_key: key, value }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Update failed");
      setSaving(null);
      return;
    }
    await load();
    setSaving(null);
  }

  if (loading) return <p className="muted">Loading thresholds…</p>;

  return (
    <section className="hermes-layout">
      {!isOperator ? (
        <p className="muted">Operator role required to edit thresholds. View-only below.</p>
      ) : null}
      {error ? <p className="error">{error}</p> : null}
      <div className="threshold-grid">
        {thresholds.map((t) => (
          <article key={t.threshold_key} className="card threshold-card">
            <h3 className="section-title">{t.label}</h3>
            <p className="muted">
              {t.threshold_key} · {t.severity} · {t.unit}
            </p>
            <div className="threshold-row">
              <input
                type="number"
                step="any"
                className="input"
                value={drafts[t.threshold_key] ?? String(t.value)}
                onChange={(e) =>
                  setDrafts((d) => ({ ...d, [t.threshold_key]: e.target.value }))
                }
                disabled={!isOperator || saving === t.threshold_key}
              />
              {isOperator ? (
                <button
                  type="button"
                  className="button button-sm"
                  disabled={saving === t.threshold_key}
                  onClick={() => void save(t.threshold_key)}
                >
                  {saving === t.threshold_key ? "Saving…" : "Save"}
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      {thresholds.length === 0 ? (
        <p className="muted">No thresholds configured. Run liquidity ingest to seed defaults.</p>
      ) : null}
    </section>
  );
}
