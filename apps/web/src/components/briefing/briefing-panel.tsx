"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type BriefingSummary = {
  id: string;
  briefing_date: string;
  market_regime: string;
  ai_summary: string;
  process_goal?: string | null;
  avoid_conditions?: string[];
  risk_overlay?: {
    ui_label?: string;
    size_multiplier?: number;
    allowed_risk_per_trade?: number | null;
    reasons?: string[];
  };
  sections?: Record<string, string>;
  created_at: string;
};

type WatchlistItem = {
  symbol: string;
  rank: number;
  score: number;
  reason: string;
  setup_fit?: string | null;
  caution_notes?: string | null;
};

type BriefingResponse = {
  today: BriefingSummary | null;
  history: Array<{
    id: string;
    briefing_date: string;
    market_regime: string;
    ai_summary: string;
    created_at: string;
  }>;
};

const RISK_CLASS: Record<string, string> = {
  Green: "risk-green",
  Yellow: "risk-yellow",
  Orange: "risk-orange",
  Red: "risk-red",
};

export function BriefingWidget({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<BriefingResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/briefing")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="muted">Loading briefing…</p>;

  const today = data?.today;
  if (!today) {
    return (
      <div className="card">
        <p className="muted">No briefing for today yet.</p>
        <Link href="/dashboard/briefing" className="widget-link">
          Generate briefing →
        </Link>
      </div>
    );
  }

  const riskLabel = today.risk_overlay?.ui_label ?? "Green";
  const riskCls = RISK_CLASS[riskLabel] ?? "risk-green";

  return (
    <div className={`card briefing-widget ${riskCls}`}>
      <div className="briefing-widget-header">
        <span className="regime-badge">{today.market_regime.replace(/_/g, " ")}</span>
        <span className="risk-badge">{riskLabel}</span>
      </div>
      {today.process_goal ? (
        <p className="briefing-focus">{today.process_goal}</p>
      ) : null}
      {!compact && today.sections?.overnight_summary ? (
        <p className="muted briefing-snippet">{today.sections.overnight_summary}</p>
      ) : null}
      <Link href="/dashboard/briefing" className="widget-link">
        Open full briefing →
      </Link>
    </div>
  );
}

export function BriefingPanel() {
  const [data, setData] = useState<BriefingResponse | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadBriefing() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/briefing");
    const json = (await res.json()) as BriefingResponse & { error?: string };
    if (!res.ok) {
      setError(json.error ?? "Failed to load briefing");
      setLoading(false);
      return;
    }
    setData(json);
    if (json.today?.id) {
      const detail = await fetch(`/api/briefing/${json.today.id}`);
      const detailJson = (await detail.json()) as {
        watchlist_symbols?: WatchlistItem[];
      };
      setWatchlist(detailJson.watchlist_symbols ?? []);
    } else {
      setWatchlist([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    void loadBriefing();
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    const res = await fetch("/api/briefing", { method: "POST" });
    const json = (await res.json()) as { error?: string; watchlist?: WatchlistItem[] };
    if (!res.ok) {
      setError(json.error ?? "Generation failed");
      setGenerating(false);
      return;
    }
    if (json.watchlist) setWatchlist(json.watchlist);
    await loadBriefing();
    setGenerating(false);
  }

  const today = data?.today;

  if (loading) return <p className="muted">Loading briefing…</p>;

  return (
    <div className="briefing-layout">
      <div className="briefing-actions">
        <button
          type="button"
          className="button"
          onClick={() => void handleGenerate()}
          disabled={generating}
        >
          {generating ? "Generating…" : today ? "Regenerate briefing" : "Generate briefing"}
        </button>
        <p className="muted briefing-hint">
          Uses mock market data, calendar events, your journal edge, and risk overlay.
        </p>
      </div>

      {error ? <p className="error">{error}</p> : null}

      {!today ? (
        <div className="card">
          <p>No briefing yet for today. Generate one to get your market plan.</p>
        </div>
      ) : (
        <>
          <div className="briefing-meta card">
            <div className="briefing-widget-header">
              <span className="regime-badge">{today.market_regime.replace(/_/g, " ")}</span>
              {today.risk_overlay?.ui_label ? (
                <span className="risk-badge">{today.risk_overlay.ui_label}</span>
              ) : null}
            </div>
            <p className="briefing-focus">
              <strong>Today&apos;s focus:</strong> {today.process_goal}
            </p>
            {today.avoid_conditions && today.avoid_conditions.length > 0 ? (
              <div className="avoid-list">
                <span className="stat-label">Avoid</span>
                <ul>
                  {today.avoid_conditions.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {watchlist.length > 0 ? (
            <section>
              <h2 className="section-title">Watchlist</h2>
              <div className="watchlist-grid">
                {watchlist.map((w) => (
                  <article key={w.symbol} className="card watchlist-card">
                    <div className="watchlist-rank">#{w.rank}</div>
                    <strong>{w.symbol}</strong>
                    <p className="muted">{w.reason}</p>
                    {w.setup_fit ? (
                      <p className="watchlist-fit">Fit: {w.setup_fit}</p>
                    ) : null}
                    {w.caution_notes ? (
                      <p className="caution-note">{w.caution_notes}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {today.sections ? (
            <section className="briefing-sections">
              <h2 className="section-title">Briefing sections</h2>
              <div className="sections-grid">
                {Object.entries(today.sections).map(([key, value]) => (
                  <article key={key} className="card section-card">
                    <h3>{formatSectionTitle(key)}</h3>
                    <pre className="section-body">{value}</pre>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <section className="card briefing-summary-card">
            <h2 className="section-title">Full summary</h2>
            <pre className="briefing-summary">{today.ai_summary}</pre>
          </section>
        </>
      )}

      {data?.history && data.history.length > 1 ? (
        <section>
          <h2 className="section-title">History</h2>
          <ul className="briefing-history">
            {data.history
              .filter((h) => h.id !== today?.id)
              .map((h) => (
                <li key={h.id}>
                  <span>{h.briefing_date}</span>
                  <span className="muted">{h.market_regime.replace(/_/g, " ")}</span>
                </li>
              ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function formatSectionTitle(key: string): string {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
