import type { BehavioralScoreInput, BehavioralScoreOutput } from "../schemas/coaching";

const EMOTION_RISK_TAGS = new Set(["revenge_trade", "fomo", "oversize"]);

export function computeBehavioralScore(input: BehavioralScoreInput): BehavioralScoreOutput {
  const { trades } = input;
  if (trades.length === 0) {
    return {
      discipline_avg: 5,
      emotion_stability: 5,
      revenge_trade_risk: 3,
      journaling_completeness: 0,
      overall_behavioral_score: 4,
      evidence: { trade_count: 0 },
    };
  }

  const disciplineScores = trades
    .map((t) => t.discipline_score)
    .filter((d): d is number => d !== null && d !== undefined);
  const discipline_avg =
    disciplineScores.length > 0
      ? disciplineScores.reduce((a, b) => a + b, 0) / disciplineScores.length
      : trades.filter((t) => (t.mistake_tags?.length ?? 0) === 0).length / trades.length * 10;

  const emotionLogged = trades.filter((t) => t.emotion).length / trades.length;
  const revengeCount = trades.filter((t) =>
    t.mistake_tags?.some((tag) => EMOTION_RISK_TAGS.has(tag)),
  ).length;
  const revenge_trade_risk = Math.min(10, (revengeCount / trades.length) * 10);

  const completeFields = trades.map((t) => {
    let fields = 0;
    if (t.notes && t.notes.length > 5) fields++;
    if (t.emotion) fields++;
    if (t.setup_id) fields++;
    if (t.discipline_score) fields++;
    return fields / 4;
  });
  const journaling_completeness =
    (completeFields.reduce((a, b) => a + b, 0) / trades.length) * 10;

  const emotion_stability = Math.max(
    1,
    Math.min(10, emotionLogged * 5 + (10 - revenge_trade_risk) * 0.5),
  );

  const overall =
    discipline_avg * 0.3 +
    emotion_stability * 0.25 +
    (10 - revenge_trade_risk) * 0.25 +
    journaling_completeness * 0.2;

  return {
    discipline_avg: Number(discipline_avg.toFixed(2)),
    emotion_stability: Number(emotion_stability.toFixed(2)),
    revenge_trade_risk: Number(revenge_trade_risk.toFixed(2)),
    journaling_completeness: Number(journaling_completeness.toFixed(2)),
    overall_behavioral_score: Number(overall.toFixed(2)),
    evidence: {
      trade_count: trades.length,
      emotion_logged_pct: Number((emotionLogged * 100).toFixed(1)),
      revenge_trade_count: revengeCount,
    },
  };
}
