"use client";

import { useEffect, useState } from "react";

type Rules = {
  max_daily_loss: number | null;
  max_weekly_loss: number | null;
  max_position_risk: number | null;
  max_trades_per_day: number | null;
  max_consecutive_losses: number | null;
  max_open_positions: number | null;
  cooldown_after_loss_minutes: number | null;
};

export function RiskRulesForm() {
  const [rules, setRules] = useState<Rules>({
    max_daily_loss: 500,
    max_weekly_loss: 1500,
    max_position_risk: 100,
    max_trades_per_day: 5,
    max_consecutive_losses: 3,
    max_open_positions: 3,
    cooldown_after_loss_minutes: 30,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetch("/api/risk/rules")
      .then((r) => r.json())
      .then((d) => {
        if (d.rules) {
          setRules({
            max_daily_loss: d.rules.max_daily_loss ? Number(d.rules.max_daily_loss) : null,
            max_weekly_loss: d.rules.max_weekly_loss ? Number(d.rules.max_weekly_loss) : null,
            max_position_risk: d.rules.max_position_risk ? Number(d.rules.max_position_risk) : null,
            max_trades_per_day: d.rules.max_trades_per_day,
            max_consecutive_losses: d.rules.max_consecutive_losses,
            max_open_positions: d.rules.max_open_positions,
            cooldown_after_loss_minutes: d.rules.cooldown_after_loss_minutes,
          });
        }
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await fetch("/api/risk/rules", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rules),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setMessage(data.error ?? "Failed to save rules");
      return;
    }
    setMessage("Risk rules saved");
  }

  function update(field: keyof Rules, value: string) {
    setRules((prev) => ({
      ...prev,
      [field]: value === "" ? null : Number(value),
    }));
  }

  return (
    <form onSubmit={handleSubmit} className="card trade-form">
      <h2>Risk rules</h2>
      <p className="muted">Deterministic limits — AI cannot override these</p>
      <div className="form-grid">
        <label>
          Max daily loss ($)
          <input
            type="number"
            value={rules.max_daily_loss ?? ""}
            onChange={(e) => update("max_daily_loss", e.target.value)}
          />
        </label>
        <label>
          Max weekly loss ($)
          <input
            type="number"
            value={rules.max_weekly_loss ?? ""}
            onChange={(e) => update("max_weekly_loss", e.target.value)}
          />
        </label>
        <label>
          Max risk per trade ($)
          <input
            type="number"
            value={rules.max_position_risk ?? ""}
            onChange={(e) => update("max_position_risk", e.target.value)}
          />
        </label>
        <label>
          Max trades per day
          <input
            type="number"
            value={rules.max_trades_per_day ?? ""}
            onChange={(e) => update("max_trades_per_day", e.target.value)}
          />
        </label>
        <label>
          Max consecutive losses
          <input
            type="number"
            value={rules.max_consecutive_losses ?? ""}
            onChange={(e) => update("max_consecutive_losses", e.target.value)}
          />
        </label>
        <label>
          Max open positions
          <input
            type="number"
            value={rules.max_open_positions ?? ""}
            onChange={(e) => update("max_open_positions", e.target.value)}
          />
        </label>
        <label>
          Cooldown after lockout (min)
          <input
            type="number"
            value={rules.cooldown_after_loss_minutes ?? ""}
            onChange={(e) => update("cooldown_after_loss_minutes", e.target.value)}
          />
        </label>
      </div>
      {message ? <p className="muted">{message}</p> : null}
      <button type="submit" className="button" disabled={loading}>
        {loading ? "Saving…" : "Save risk rules"}
      </button>
    </form>
  );
}
