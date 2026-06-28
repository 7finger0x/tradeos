"use client";

import { useEffect, useState } from "react";

type Grade = {
  overall_grade: string;
  setup_quality: number;
  execution_quality: number;
  risk_management: number;
  discipline: number;
  emotional_control: number;
  data_completeness: number;
  feedback_text: string;
};

export function TradeGradeCard({ tradeId }: { tradeId: string }) {
  const [grade, setGrade] = useState<Grade | null>(null);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);

  async function loadGrade() {
    const res = await fetch(`/api/coach/grades/${tradeId}`);
    const json = await res.json();
    setGrade(json.grade ?? null);
    setLoading(false);
  }

  useEffect(() => {
    void loadGrade();
  }, [tradeId]);

  async function handleGrade() {
    setGrading(true);
    const res = await fetch(`/api/coach/grades/${tradeId}`, { method: "POST" });
    const json = await res.json();
    if (res.ok) setGrade(json.grade);
    setGrading(false);
  }

  if (loading) return <p className="muted">Loading grade…</p>;

  return (
    <section className="card trade-grade-card">
      <div className="trade-grade-header">
        <h2>Trade grade</h2>
        {grade ? (
          <span className="grade-badge">{grade.overall_grade}</span>
        ) : (
          <button type="button" className="button button-sm" onClick={() => void handleGrade()} disabled={grading}>
            {grading ? "Grading…" : "Grade trade"}
          </button>
        )}
      </div>
      {grade ? (
        <>
          <div className="grade-factors">
            <Factor label="Setup" value={grade.setup_quality} />
            <Factor label="Execution" value={grade.execution_quality} />
            <Factor label="Risk" value={grade.risk_management} />
            <Factor label="Discipline" value={grade.discipline} />
            <Factor label="Emotion" value={grade.emotional_control} />
            <Factor label="Journal" value={grade.data_completeness} />
          </div>
          <p className="muted">{grade.feedback_text}</p>
          <button type="button" className="button button-sm" onClick={() => void handleGrade()} disabled={grading}>
            Re-grade
          </button>
        </>
      ) : (
        <p className="muted">No grade yet — coach will score setup, risk, discipline, and journaling.</p>
      )}
    </section>
  );
}

function Factor({ label, value }: { label: string; value: number }) {
  return (
    <div className="grade-factor">
      <span className="stat-label">{label}</span>
      <div className="grade-bar">
        <div className="grade-bar-fill" style={{ width: `${value * 10}%` }} />
      </div>
      <span>{value}/10</span>
    </div>
  );
}
