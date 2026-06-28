"use client";

import { useState } from "react";

export function SetupQuickAdd() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/setups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, tags: [] }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Failed to create setup");
      return;
    }
    setMessage(`Setup "${name}" created`);
    setName("");
  }

  return (
    <form onSubmit={handleAdd} className="card setup-quick-add">
      <h2>Setups</h2>
      <p className="muted">Tag trades by playbook setup</p>
      <div className="inline-form">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Opening range breakout"
          required
        />
        <button type="submit" className="button button-secondary">
          Add setup
        </button>
      </div>
      {message ? <p className="muted">{message}</p> : null}
    </form>
  );
}
