import type { CoachingReportInput, CoachingReportOutput } from "../schemas/coaching";

export function generateCoachingReport(input: CoachingReportInput): CoachingReportOutput {
  const { analytics, mistake_costs, behavioral, grade_summary } = input;

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (analytics.win_rate >= 50) strengths.push(`Win rate at ${analytics.win_rate}% — above break-even threshold`);
  if (analytics.expectancy > 0) strengths.push(`Positive expectancy ($${analytics.expectancy.toFixed(2)}/trade)`);
  if (behavioral.discipline_avg >= 7) strengths.push("Discipline scores trending strong");
  if (grade_summary.high_grade_count > 0) {
    strengths.push(`${grade_summary.high_grade_count} A/B graded trades this period`);
  }
  if (behavioral.journaling_completeness >= 7) {
    strengths.push("Solid journaling completeness — coaching has good evidence");
  }

  if (analytics.expectancy < 0) weaknesses.push("Negative expectancy — tighten setup selectivity");
  if (analytics.profit_factor < 1 && analytics.trade_count > 0) {
    weaknesses.push("Profit factor below 1.0 — losses exceed wins");
  }
  if (behavioral.revenge_trade_risk >= 5) {
    weaknesses.push("Elevated revenge/FOMO pattern risk detected");
  }
  if (grade_summary.low_grade_count > 0) {
    weaknesses.push(`${grade_summary.low_grade_count} trades graded D or below`);
  }
  if (behavioral.journaling_completeness < 5) {
    weaknesses.push("Incomplete trade logs limit coaching accuracy");
  }

  if (strengths.length === 0) strengths.push("Consistent logging — foundation for improvement is in place");
  if (weaknesses.length === 0) weaknesses.push("No major weaknesses flagged — maintain process discipline");

  const highest_cost_mistake =
    mistake_costs.length > 0
      ? `${mistake_costs[0].title} ($${mistake_costs[0].total_cost.toFixed(2)} total cost, ${mistake_costs[0].occurrence_count}x)`
      : null;

  const repeated_patterns = mistake_costs
    .filter((m) => m.occurrence_count >= 2)
    .map((m) => ({ pattern: m.title, count: m.occurrence_count }));

  const stop_actions: string[] = [];
  const improve_actions: string[] = [];
  const repeat_actions: string[] = [];

  if (behavioral.revenge_trade_risk >= 5) {
    stop_actions.push("Stop trading after 2 consecutive losses without a break");
  }
  if (mistake_costs.some((m) => m.code === "no_stop")) {
    stop_actions.push("Stop entering trades without a defined stop loss");
  }
  if (mistake_costs.some((m) => m.code === "outside_playbook")) {
    stop_actions.push("Stop taking setups outside your playbook");
  }

  if (behavioral.journaling_completeness < 6) {
    improve_actions.push("Log emotion and setup on every trade before market close");
  }
  if (analytics.average_r < 1 && analytics.trade_count > 3) {
    improve_actions.push("Let winners run closer to planned targets (avg R below 1)");
  }
  if (grade_summary.average_overall < 6) {
    improve_actions.push("Review lowest-graded trades and write one process fix per mistake");
  }

  if (analytics.win_rate >= 50 && analytics.expectancy > 0) {
    repeat_actions.push("Repeat pre-market briefing + risk check before first trade");
  }
  if (behavioral.discipline_avg >= 7) {
    repeat_actions.push("Repeat disciplined sizing from your best-graded trades");
  }
  if (strengths.some((s) => s.includes("journaling"))) {
    repeat_actions.push("Repeat end-of-day journal review habit");
  }

  if (stop_actions.length === 0) stop_actions.push("No new stop rules — maintain current guardrails");
  if (improve_actions.length === 0) improve_actions.push("Pick one setup to master next week");
  if (repeat_actions.length === 0) repeat_actions.push("Repeat your highest-graded trade process");

  const next_week_focus = buildNextWeekFocus(analytics, behavioral, mistake_costs);

  const confidence = computeConfidence(analytics.trade_count, behavioral.journaling_completeness);

  const summary = [
    `## Weekly Coaching Report (${input.period_start} → ${input.period_end})`,
    "",
    `**Trades:** ${analytics.trade_count} | **Win rate:** ${analytics.win_rate}% | **Net P/L:** $${analytics.total_net_pnl.toFixed(2)}`,
    `**Behavioral score:** ${behavioral.overall_behavioral_score}/10 | **Avg trade grade:** ${grade_summary.average_overall.toFixed(1)}/10`,
    "",
    "### Strengths",
    ...strengths.map((s) => `- ${s}`),
    "",
    "### Weaknesses",
    ...weaknesses.map((w) => `- ${w}`),
    "",
    highest_cost_mistake ? `### Highest-cost mistake\n${highest_cost_mistake}` : "",
    "",
    `### Next week focus\n${next_week_focus}`,
    "",
    "*Educational decision support — not financial advice. Risk rules remain deterministic.*",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    strengths,
    weaknesses,
    highest_cost_mistake,
    repeated_patterns,
    emotional_triggers: input.emotional_triggers,
    stop_actions,
    improve_actions,
    repeat_actions,
    next_week_focus,
    confidence_score: confidence,
    evidence: {
      analytics,
      behavioral,
      mistake_costs: mistake_costs.slice(0, 5),
      grade_summary,
    },
    summary_text: summary,
  };
}

function buildNextWeekFocus(
  analytics: CoachingReportInput["analytics"],
  behavioral: CoachingReportInput["behavioral"],
  mistakes: CoachingReportInput["mistake_costs"],
): string {
  if (mistakes.length > 0 && mistakes[0].total_cost > 0) {
    return `Eliminate ${mistakes[0].title} — it cost $${mistakes[0].total_cost.toFixed(2)} this period`;
  }
  if (behavioral.revenge_trade_risk >= 5) {
    return "Emotional control — mandatory break after losses";
  }
  if (analytics.expectancy < 0) {
    return "Setup selectivity — fewer trades, higher quality";
  }
  return "Execute A/B setups at planned risk with full journaling";
}

function computeConfidence(tradeCount: number, journalingCompleteness: number): number {
  const sample = Math.min(1, tradeCount / 10);
  const journal = Math.min(1, journalingCompleteness / 10);
  return Number((0.5 + sample * 0.25 + journal * 0.25).toFixed(3));
}
