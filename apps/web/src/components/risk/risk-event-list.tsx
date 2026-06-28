"use client";

import { useEffect, useState } from "react";

type RiskEvent = {
  id: string;
  risk_state: string;
  message: string;
  daily_pnl: number | null;
  size_multiplier: number;
  created_at: string;
};

export function RiskEventList() {
  const [events, setEvents] = useState<RiskEvent[]>([]);

  useEffect(() => {
    void fetch("/api/risk/events")
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []));
  }, []);

  if (events.length === 0) {
    return (
      <div className="card empty-state">
        <p>No risk events yet.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap card">
      <table className="trade-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>State</th>
            <th>Message</th>
            <th>Multiplier</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id}>
              <td>{new Date(e.created_at).toLocaleString()}</td>
              <td>{e.risk_state}</td>
              <td>{e.message}</td>
              <td>{e.size_multiplier}x</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
