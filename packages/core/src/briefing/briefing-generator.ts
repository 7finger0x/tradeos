import type { BriefingInput, BriefingOutput } from "../schemas/briefing";

export function generateMarketBriefing(input: BriefingInput): BriefingOutput {
  const { market_snapshot: snap, risk_overlay: risk, watchlist } = input;

  const spy = snap.indices.find((i) => i.symbol === "SPY");
  const qqq = snap.indices.find((i) => i.symbol === "QQQ");

  const overnight = [
    `SPY ${formatPct(spy?.change_pct)} | QQQ ${formatPct(qqq?.change_pct)}`,
    `VIX at ${snap.vix.toFixed(1)} (${formatPct(snap.vix_change_pct)})`,
    `Regime: ${snap.regime.replace(/_/g, " ")}`,
  ].join(". ");

  const indexContext =
    snap.regime === "trend_up"
      ? "Index tone is constructive but watch extension — prefer pullbacks to planned levels."
      : snap.regime === "trend_down"
        ? "Index tone is weak — reduce chase behavior and demand higher-quality setups."
        : snap.regime === "high_volatility"
          ? "Volatility is elevated — widen awareness of gap risk and reduce size per risk overlay."
          : "Mixed index tone — let leaders confirm before committing size.";

  const volNotes =
    snap.vix >= 20
      ? "Volatility above 20 — expect wider ranges and faster reversals."
      : snap.vix <= 13
        ? "Compressed volatility — breakouts may be slower; avoid forcing trades."
        : "Volatility in normal range for planned setups.";

  const economic =
    input.economic_events.length > 0
      ? input.economic_events
          .map((e) => `• ${e.title} (${e.impact} impact)${e.event_time ? ` @ ${e.event_time}` : ""}`)
          .join("\n")
      : "No major economic events on calendar.";

  const earnings =
    input.earnings_events.length > 0
      ? input.earnings_events
          .map(
            (e) =>
              `• ${e.symbol}${e.company_name ? ` (${e.company_name})` : ""}${e.timing ? ` ${e.timing}` : ""}`,
          )
          .join("\n")
      : "No major earnings on today's calendar.";

  const sectors = `Leaders: ${snap.sector_leaders.join(", ")}. Laggards: ${snap.sector_laggards.join(", ")}.`;

  const watchlistSummary =
    watchlist.length > 0
      ? watchlist
          .map((w) => `${w.rank}. ${w.symbol} — ${w.reason}${w.caution_notes ? ` (${w.caution_notes})` : ""}`)
          .join("\n")
      : "No watchlist candidates ranked.";

  const riskPosture = [
    `Risk status: ${risk.ui_label} (${risk.size_multiplier}x size)`,
    risk.allowed_risk_per_trade !== null
      ? `Max risk per trade: $${risk.allowed_risk_per_trade.toFixed(2)}`
      : "Configure risk rules for precise limits",
    ...risk.reasons.slice(0, 2),
  ].join(". ");

  const traderReminders = buildTraderReminders(input);

  const avoid = buildAvoidConditions(snap.regime, risk.ui_label);

  const processGoal = buildProcessGoal(risk.ui_label, snap.regime);

  const summary = [
    `## Market Open Briefing — ${input.briefing_date}`,
    "",
    overnight,
    "",
    indexContext,
    "",
    `**Risk overlay:** ${riskPosture}`,
    "",
    `**Today's focus:** ${processGoal}`,
    "",
    "**Watchlist top picks:**",
    watchlistSummary,
    "",
    "*Educational decision support — not financial advice.*",
  ].join("\n");

  return {
    market_regime: snap.regime,
    ai_summary: summary,
    process_goal: processGoal,
    avoid_conditions: avoid,
    sections: {
      overnight_summary: overnight,
      index_context: indexContext,
      volatility_notes: volNotes,
      economic_calendar: economic,
      earnings_today: earnings,
      sector_rotation: sectors,
      watchlist_summary: watchlistSummary,
      risk_posture: riskPosture,
      trader_reminders: traderReminders,
    },
  };
}

function formatPct(value?: number): string {
  if (value === undefined) return "n/a";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function buildProcessGoal(riskLabel: string, regime: string): string {
  if (riskLabel === "Red") return "Stand down — review journal and wait for cooldown.";
  if (riskLabel === "Orange") return "A+ setups only with reduced size.";
  if (riskLabel === "Yellow") return "Trade planned setups only at half risk.";
  if (regime === "high_volatility") return "One clean setup max — prioritize capital protection.";
  return "Execute A/B setups from playbook with full planned risk.";
}

function buildAvoidConditions(regime: string, riskLabel: string): string[] {
  const conditions: string[] = [];
  if (riskLabel === "Red" || riskLabel === "Orange") {
    conditions.push("No revenge trades");
    conditions.push("No size increases");
  }
  if (regime === "high_volatility") {
    conditions.push("Avoid opening range chase without volume confirmation");
  }
  if (regime === "trend_down") {
    conditions.push("Avoid counter-trend knife catches");
  }
  conditions.push("No trades outside playbook");
  return conditions;
}

function buildTraderReminders(input: BriefingInput): string {
  const parts: string[] = [];
  if (input.trader_context?.top_symbols?.length) {
    parts.push(`Historical strength: ${input.trader_context.top_symbols.join(", ")}`);
  }
  if (input.trader_context?.recent_win_rate !== undefined) {
    parts.push(`Recent win rate: ${input.trader_context.recent_win_rate}%`);
  }
  if (input.risk_overlay.daily_pnl !== undefined) {
    parts.push(`Daily P/L so far: $${input.risk_overlay.daily_pnl.toFixed(2)}`);
  }
  return parts.length ? parts.join(". ") : "Log emotions before first trade.";
}
