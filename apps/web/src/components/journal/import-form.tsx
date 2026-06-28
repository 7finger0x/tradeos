"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export function ImportForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/trades/import", { method: "POST", body: form });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Import failed");
      return;
    }

    setResult(
      `Imported ${data.imported} trades (${data.duplicates} duplicates, ${data.errors} errors). Format: ${data.format}`,
    );
    router.refresh();
  }

  return (
    <div className="import-panel">
      <form onSubmit={handleSubmit} className="card trade-form">
        <label>
          CSV format
          <select name="format" defaultValue="">
            <option value="">Auto-detect</option>
            <option value="generic">Generic</option>
            <option value="thinkorswim">Thinkorswim-style</option>
          </select>
        </label>
        <label>
          CSV file
          <input name="file" type="file" accept=".csv,text/csv" required />
        </label>
        {error ? <p className="error">{error}</p> : null}
        {result ? <p className="positive">{result}</p> : null}
        <div className="form-actions">
          <button type="submit" className="button" disabled={loading}>
            {loading ? "Importing…" : "Import trades"}
          </button>
          <Link href="/dashboard/journal" className="muted">
            Back to journal
          </Link>
        </div>
      </form>
      <section className="card help-card">
        <h2>Supported formats</h2>
        <p className="muted">
          <strong>Generic:</strong> symbol, direction, entry_time, entry_price, quantity,
          exit_price, fees, net_pnl
        </p>
        <p className="muted">
          <strong>Thinkorswim:</strong> Exec Time, Symbol, Side, Qty, Price, Net Price, Order ID
        </p>
      </section>
    </div>
  );
}
