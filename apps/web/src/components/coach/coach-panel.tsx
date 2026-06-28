"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ActionItem = {
  id: string;
  category: string;
  title: string;
  status: string;
  priority: string;
};

type Report = {
  id: string;
  period_start: string;
  period_end: string;
  next_week_focus?: string | null;
  confidence_score?: number;
  strengths?: string[];
  weaknesses?: string[];
  stop_actions?: string[];
  improve_actions?: string[];
  repeat_actions?: string[];
  summary_text?: string;
  highest_cost_mistake?: string | null;
};

type MistakeCost = {
  code: string;
  title: string;
  occurrence_count: number;
  total_cost: number;
};

export function CoachWidget({ compact = false }: { compact?: boolean }) {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/coach/reports")
      .then((r) => r.json())
      .then((d) => {
        setReport(d.current_week);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="muted">Loading coach notes…</p>;

  if (!report) {
    return (
      <div className="card">
        <p className="muted">No weekly report yet.</p>
        <Link href="/dashboard/coach" className="widget-link">
          Generate coaching report →
        </Link>
      </div>
    );
  }

  return (
    <div className="card coach-widget">
      <p className="briefing-focus">{report.next_week_focus}</p>
      {!compact && report.highest_cost_mistake ? (
        <p className="muted coach-cost">Top mistake: {report.highest_cost_mistake}</p>
      ) : null}
      <Link href="/dashboard/coach" className="widget-link">
        Open coach →
      </Link>
    </div>
  );
}

export function CoachPanel() {
  const [report, setReport] = useState<Report | null>(null);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [mistakes, setMistakes] = useState<MistakeCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const [reportsRes, mistakesRes] = await Promise.all([
      fetch("/api/coach/reports"),
      fetch("/api/coach/mistakes"),
    ]);
    const reportsJson = await reportsRes.json();
    const mistakesJson = await mistakesRes.json();

    if (!reportsRes.ok) {
      setError(reportsJson.error ?? "Failed to load");
      setLoading(false);
      return;
    }

    setReport(reportsJson.current_week);
    setMistakes(mistakesJson.costs ?? []);

    if (reportsJson.current_week?.id) {
      const detail = await fetch(`/api/coach/reports/${reportsJson.current_week.id}`);
      const detailJson = await detail.json();
      setActions(detailJson.action_items ?? []);
    } else {
      setActions([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    const res = await fetch("/api/coach/reports", { method: "POST" });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Generation failed");
      setGenerating(false);
      return;
    }
    setReport(json.report);
    setActions(json.action_items ?? []);
    setMistakes(json.mistake_costs ?? mistakes);
    setGenerating(false);
  }

  if (loading) return <p className="muted">Loading coaching data…</p>;

  return (
    <div className="coach-layout">
      <div className="briefing-actions">
        <button
          type="button"
          className="button"
          onClick={() => void handleGenerate()}
          disabled={generating}
        >
          {generating ? "Generating…" : report ? "Regenerate weekly report" : "Generate weekly report"}
        </button>
        <p className="muted briefing-hint">
          Deterministic coaching from your journal — grades trades, analyzes mistakes, and sets action items.
        </p>
      </div>

      {error ? <p className="error">{error}</p> : null}

      {!report ? (
        <div className="card">
          <p>Generate your first weekly coaching report from journal data.</p>
        </div>
      ) : (
        <>
          <div className="card coach-focus-card">
            <h2 className="section-title">This week&apos;s focus</h2>
            <p className="briefing-focus">{report.next_week_focus}</p>
            {report.confidence_score !== undefined ? (
              <p className="muted">
                Confidence: {(report.confidence_score * 100).toFixed(0)}% (based on sample size & journaling)
              </p>
            ) : null}
          </div>

          <div className="coach-grid">
            <section className="card">
              <h3>Strengths</h3>
              <ul className="coach-list">
                {(report.strengths ?? []).map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </section>
            <section className="card">
              <h3>Weaknesses</h3>
              <ul className="coach-list">
                {(report.weaknesses ?? []).map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </section>
          </div>

          {actions.length > 0 ? (
            <section>
              <h2 className="section-title">Action items</h2>
              <div className="action-grid">
                {actions.map((a) => (
                  <article key={a.id} className={`card action-card action-${a.category}`}>
                    <span className="action-category">{a.category}</span>
                    <p>{a.title}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {mistakes.length > 0 ? (
            <section>
              <h2 className="section-title">Mistake costs</h2>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mistake</th>
                    <th>Count</th>
                    <th>Total cost</th>
                  </tr>
                </thead>
                <tbody>
                  {mistakes.slice(0, 8).map((m) => (
                    <tr key={m.code}>
                      <td>{m.title}</td>
                      <td>{m.occurrence_count}</td>
                      <td className="negative">${m.total_cost.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : null}

          {report.summary_text ? (
            <section className="card">
              <h2 className="section-title">Full report</h2>
              <pre className="briefing-summary">{report.summary_text}</pre>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
