"use client";

import { useEffect, useState } from "react";

type RiskStatus = {
  evaluation: {
    risk_state: string;
    ui_label: string;
    size_multiplier: number;
    allowed_risk_per_trade: number | null;
    reasons: string[];
    in_cooldown: boolean;
    cooldown_ends_at: string | null;
  };
  metrics: {
    daily_pnl: number;
    weekly_pnl: number;
    trades_today: number;
    consecutive_losses: number;
  };
};

const STATE_CLASS: Record<string, string> = {
  Green: "risk-green",
  Yellow: "risk-yellow",
  Orange: "risk-orange",
  Red: "risk-red",
};

export function RiskStatusCard({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<RiskStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/risk/status")
      .then((r) => r.json())
      .then((d) => {
        setStatus(d);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="muted">Loading risk status…</p>;
  if (!status?.evaluation) return <p className="muted">Risk status unavailable</p>;

  const { evaluation, metrics } = status;
  const cls = STATE_CLASS[evaluation.ui_label] ?? "risk-green";

  return (
    <div className={`card risk-status-card ${cls}`}>
      <div className="risk-header">
        <span className="risk-badge">{evaluation.ui_label}</span>
        <strong>{evaluation.risk_state.replace("_", " ")}</strong>
      </div>
      {!compact ? (
        <>
          <p className="risk-metric">
            Daily P/L:{" "}
            <span className={metrics.daily_pnl >= 0 ? "positive" : "negative"}>
              ${metrics.daily_pnl.toFixed(2)}
            </span>
          </p>
          <p className="risk-metric">
            Allowed risk/trade:{" "}
            <strong>
              {evaluation.allowed_risk_per_trade !== null
                ? `$${evaluation.allowed_risk_per_trade.toFixed(2)}`
                : "—"}
            </strong>{" "}
            ({evaluation.size_multiplier}x)
          </p>
          <p className="muted risk-reason">{evaluation.reasons[0]}</p>
          {evaluation.in_cooldown && evaluation.cooldown_ends_at ? (
            <p className="error">
              Cooldown until {new Date(evaluation.cooldown_ends_at).toLocaleString()}
            </p>
          ) : null}
        </>
      ) : (
        <p className="muted">
          {evaluation.allowed_risk_per_trade !== null
            ? `$${evaluation.allowed_risk_per_trade} max/trade`
            : "Configure rules"}
        </p>
      )}
    </div>
  );
}
