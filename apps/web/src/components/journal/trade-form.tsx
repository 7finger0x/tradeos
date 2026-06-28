"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

type Setup = { id: string; name: string };

export function TradeForm() {
  const router = useRouter();
  const [setups, setSetups] = useState<Setup[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetch("/api/setups")
      .then((r) => r.json())
      .then((d) => setSetups(d.setups ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      symbol: String(form.get("symbol")),
      direction: String(form.get("direction")),
      entry_time: new Date(String(form.get("entry_time"))).toISOString(),
      exit_time: form.get("exit_time")
        ? new Date(String(form.get("exit_time"))).toISOString()
        : null,
      entry_price: Number(form.get("entry_price")),
      exit_price: form.get("exit_price") ? Number(form.get("exit_price")) : null,
      quantity: Number(form.get("quantity")),
      fees: Number(form.get("fees") || 0),
      risk_amount: form.get("risk_amount") ? Number(form.get("risk_amount")) : null,
      setup_id: form.get("setup_id") || null,
      notes: form.get("notes") || null,
      emotion: form.get("emotion") || null,
      conviction: form.get("conviction") ? Number(form.get("conviction")) : null,
      discipline_score: form.get("discipline_score")
        ? Number(form.get("discipline_score"))
        : null,
      broker: "manual",
    };

    const res = await fetch("/api/trades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to save trade");
      return;
    }

    router.push("/dashboard/journal");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="trade-form card">
      <div className="form-grid">
        <label>
          Symbol
          <input name="symbol" required placeholder="AAPL" />
        </label>
        <label>
          Direction
          <select name="direction" required defaultValue="long">
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
        </label>
        <label>
          Entry time
          <input name="entry_time" type="datetime-local" required />
        </label>
        <label>
          Exit time
          <input name="exit_time" type="datetime-local" />
        </label>
        <label>
          Entry price
          <input name="entry_price" type="number" step="0.01" required />
        </label>
        <label>
          Exit price
          <input name="exit_price" type="number" step="0.01" />
        </label>
        <label>
          Quantity
          <input name="quantity" type="number" step="0.0001" required />
        </label>
        <label>
          Fees
          <input name="fees" type="number" step="0.01" defaultValue="0" />
        </label>
        <label>
          Risk amount ($)
          <input name="risk_amount" type="number" step="0.01" />
        </label>
        <label>
          Setup
          <select name="setup_id" defaultValue="">
            <option value="">None</option>
            {setups.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Emotion
          <input name="emotion" placeholder="calm, anxious, confident…" />
        </label>
        <label>
          Conviction (1–10)
          <input name="conviction" type="number" min="1" max="10" />
        </label>
        <label>
          Discipline (1–10)
          <input name="discipline_score" type="number" min="1" max="10" />
        </label>
      </div>
      <label className="full-width">
        Notes
        <textarea name="notes" rows={3} />
      </label>
      {error ? <p className="error">{error}</p> : null}
      <div className="form-actions">
        <button type="submit" className="button" disabled={loading}>
          {loading ? "Saving…" : "Save trade"}
        </button>
        <Link href="/dashboard/journal" className="muted">
          Cancel
        </Link>
      </div>
    </form>
  );
}
