import type { TradeAnalytics } from "./trade-analytics";
import type { AdvancedTradeMetrics } from "./advanced-metrics";
import type { GroupedAnalyticsRow } from "./setup-analytics";

export const STRATEGY_ANALYTICS_DISCLAIMER =
  "Historical performance does not guarantee future results. These insights are decision support only—not investment advice.";

export function generateStrategyInsights(input: {
  overview: TradeAnalytics;
  advanced: AdvancedTradeMetrics;
  setups: GroupedAnalyticsRow[];
  symbols: GroupedAnalyticsRow[];
}): string {
  const lines: string[] = [];
  const { overview, advanced, setups, symbols } = input;

  if (overview.trade_count === 0) {
    return "Log closed trades to unlock strategy analytics and setup comparisons.";
  }

  const closedCount = overview.win_count + overview.loss_count + overview.breakeven_count;
  if (closedCount === 0) {
    return "Close open positions or log exit prices to compute expectancy and drawdown.";
  }

  if (overview.expectancy > 0) {
    lines.push(
      `Positive expectancy ($${overview.expectancy.toFixed(2)} per trade) — prioritize repeating your best-defined setups.`,
    );
  } else if (overview.expectancy < 0) {
    lines.push(
      `Negative expectancy ($${overview.expectancy.toFixed(2)} per trade) — reduce size and tighten setup selectivity before adding frequency.`,
    );
  }

  if (advanced.drawdown.max_drawdown > 0) {
    lines.push(
      `Peak-to-trough drawdown: $${advanced.drawdown.max_drawdown.toFixed(2)} (${advanced.drawdown.max_drawdown_pct}% of equity peak).`,
    );
  }

  if (advanced.streaks.longest_loss_streak >= 3) {
    lines.push(
      `Longest losing streak: ${advanced.streaks.longest_loss_streak} trades — review risk rules and cooldown settings.`,
    );
  }

  const bestSetup = setups.find((s) => s.key !== "__unassigned__" && s.trade_count >= 2);
  const unassigned = setups.find((s) => s.key === "__unassigned__");
  if (bestSetup) {
    lines.push(
      `Top setup by expectancy: ${bestSetup.label} (${bestSetup.analytics.expectancy >= 0 ? "+" : ""}$${bestSetup.analytics.expectancy.toFixed(2)} expectancy, ${bestSetup.trade_count} trades).`,
    );
  }
  if (unassigned && unassigned.trade_count > 0) {
    const pct = Math.round((unassigned.trade_count / overview.trade_count) * 100);
    lines.push(
      `${pct}% of trades lack a playbook setup — tagging improves coach and strategy feedback.`,
    );
  }

  const worstSymbol = symbols.find((s) => s.analytics.total_net_pnl < 0 && s.trade_count >= 2);
  if (worstSymbol) {
    lines.push(
      `Largest drag by symbol: ${worstSymbol.label} ($${worstSymbol.analytics.total_net_pnl.toFixed(2)} net, ${worstSymbol.trade_count} trades).`,
    );
  }

  if (lines.length === 0) {
    lines.push("Continue journaling with setup tags to sharpen strategy comparisons.");
  }

  lines.push("");
  lines.push(`⚠ ${STRATEGY_ANALYTICS_DISCLAIMER}`);

  return lines.join("\n");
}
