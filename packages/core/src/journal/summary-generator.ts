import type { TradeAnalytics } from "../analytics/trade-analytics";

export function generateJournalSummary(
  analytics: TradeAnalytics,
  periodLabel: string,
): string {
  const lines: string[] = [
    `## ${periodLabel} Journal Summary`,
    "",
    `You logged **${analytics.trade_count}** trades with **${analytics.win_rate}%** win rate.`,
    `Net P/L: **$${analytics.total_net_pnl.toFixed(2)}** | Expectancy: **$${analytics.expectancy.toFixed(2)}** per trade.`,
    "",
  ];

  if (analytics.trade_count === 0) {
    lines.push("No trades recorded for this period. Import CSV or add manual entries to begin tracking.");
    lines.push("");
    lines.push("*Decision support only — not financial advice.*");
    return lines.join("\n");
  }

  if (analytics.win_rate >= 55 && analytics.expectancy > 0) {
    lines.push("**Pattern:** Positive expectancy with solid win rate. Focus on repeating your best setups.");
  } else if (analytics.win_rate < 45 || analytics.expectancy < 0) {
    lines.push("**Pattern:** Win rate or expectancy is below target. Review losing trades for repeated mistakes.");
  } else {
    lines.push("**Pattern:** Mixed results. Tighten setup selectivity before increasing size.");
  }

  if (analytics.average_loss < 0 && Math.abs(analytics.average_loss) > analytics.average_win) {
    lines.push("**Risk note:** Average loss exceeds average win — cut losers faster or reduce size on marginal setups.");
  }

  if (analytics.profit_factor > 0 && analytics.profit_factor < 1) {
    lines.push("**Alert:** Profit factor below 1.0 — gross losses exceed gross wins.");
  }

  lines.push("");
  lines.push(
    `Largest win: $${analytics.largest_win.toFixed(2)} | Largest loss: $${analytics.largest_loss.toFixed(2)} | Avg R: ${analytics.average_r}`,
  );
  lines.push("");
  lines.push("*Generated from your trade data. See Coach for weekly reports. Not financial advice.*");

  return lines.join("\n");
}
