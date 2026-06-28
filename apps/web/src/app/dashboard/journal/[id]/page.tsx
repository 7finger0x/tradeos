"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { TradeGradeCard } from "@/components/coach/trade-grade-card";
import {
  TradeScreenshotGallery,
  type TradeScreenshot,
} from "@/components/journal/trade-screenshot-gallery";

export default function TradeDetailPage() {
  const params = useParams<{ id: string }>();
  const [trade, setTrade] = useState<Record<string, unknown> | null>(null);
  const [screenshots, setScreenshots] = useState<TradeScreenshot[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`/api/trades/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else {
          setTrade(d.trade);
          setScreenshots(d.screenshots ?? []);
        }
      });
  }, [params.id]);

  if (error) return <p className="error">{error}</p>;
  if (!trade) return <p className="muted">Loading trade…</p>;

  return (
    <>
      <div className="page-header">
        <h1>
          {String(trade.symbol)} — {String(trade.direction)}
        </h1>
        <Link href="/dashboard/journal" className="muted">
          ← Journal
        </Link>
      </div>
      <div className="card detail-grid">
        <div>
          <span className="stat-label">Entry</span>
          <p>{new Date(String(trade.entry_time)).toLocaleString()}</p>
        </div>
        <div>
          <span className="stat-label">Net P/L</span>
          <p className={Number(trade.net_pnl) >= 0 ? "positive" : "negative"}>
            {trade.net_pnl !== null ? `$${Number(trade.net_pnl).toFixed(2)}` : "—"}
          </p>
        </div>
        <div>
          <span className="stat-label">R-multiple</span>
          <p>{trade.r_multiple !== null ? String(trade.r_multiple) : "—"}</p>
        </div>
        <div>
          <span className="stat-label">Emotion</span>
          <p>{trade.emotion ? String(trade.emotion) : "—"}</p>
        </div>
        <div>
          <span className="stat-label">Discipline</span>
          <p>{trade.discipline_score ? String(trade.discipline_score) : "—"}</p>
        </div>
        <div>
          <span className="stat-label">Setup</span>
          <p>
            {(trade.setups as { name?: string } | null)?.name ?? "—"}
          </p>
        </div>
      </div>
      {trade.notes ? (
        <section className="card">
          <h2>Notes</h2>
          <p>{String(trade.notes)}</p>
        </section>
      ) : null}
      <TradeScreenshotGallery tradeId={params.id} initialScreenshots={screenshots} />
      <TradeGradeCard tradeId={params.id} />
    </>
  );
}
