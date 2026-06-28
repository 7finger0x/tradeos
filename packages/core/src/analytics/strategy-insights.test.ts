import { describe, expect, it } from "vitest";
import {
  generateStrategyInsights,
  STRATEGY_ANALYTICS_DISCLAIMER,
} from "../analytics/strategy-insights";
import type { AdvancedTradeMetrics } from "../analytics/advanced-metrics";
import type { GroupedAnalyticsRow } from "../analytics/setup-analytics";
import type { TradeAnalytics } from "../analytics/trade-analytics";

const emptyAdvanced: AdvancedTradeMetrics = {
  equity_curve: [],
  drawdown: { max_drawdown: 0, max_drawdown_pct: 0, peak_equity: 0 },
  streaks: {
    current_streak: 0,
    current_streak_type: "none",
    longest_win_streak: 0,
    longest_loss_streak: 0,
  },
};

function makeOverview(overrides: Partial<TradeAnalytics> = {}): TradeAnalytics {
  return {
    trade_count: 0,
    win_count: 0,
    loss_count: 0,
    breakeven_count: 0,
    win_rate: 0,
    total_net_pnl: 0,
    average_win: 0,
    average_loss: 0,
    average_r: 0,
    expectancy: 0,
    profit_factor: 0,
    largest_win: 0,
    largest_loss: 0,
    ...overrides,
  };
}

function makeRow(
  key: string,
  label: string,
  tradeCount: number,
  analytics: Partial<TradeAnalytics>,
): GroupedAnalyticsRow {
  return {
    key,
    label,
    trade_count: tradeCount,
    analytics: makeOverview(analytics),
  };
}

describe("strategy insights", () => {
  it("returns empty-trade message when no trades logged", () => {
    const result = generateStrategyInsights({
      overview: makeOverview(),
      advanced: emptyAdvanced,
      setups: [],
      symbols: [],
    });

    expect(result).toBe(
      "Log closed trades to unlock strategy analytics and setup comparisons.",
    );
    expect(result).not.toContain(STRATEGY_ANALYTICS_DISCLAIMER);
  });

  it("returns open-position message when trades exist but none are closed", () => {
    const result = generateStrategyInsights({
      overview: makeOverview({ trade_count: 2 }),
      advanced: emptyAdvanced,
      setups: [],
      symbols: [],
    });

    expect(result).toBe(
      "Close open positions or log exit prices to compute expectancy and drawdown.",
    );
    expect(result).not.toContain(STRATEGY_ANALYTICS_DISCLAIMER);
  });

  it("includes disclaimer on closed-trade insights", () => {
    const result = generateStrategyInsights({
      overview: makeOverview({
        trade_count: 1,
        win_count: 1,
        expectancy: 50,
        win_rate: 100,
        total_net_pnl: 50,
      }),
      advanced: emptyAdvanced,
      setups: [],
      symbols: [],
    });

    expect(result).toContain(STRATEGY_ANALYTICS_DISCLAIMER);
    expect(result).toContain("⚠");
  });

  it("highlights positive expectancy", () => {
    const result = generateStrategyInsights({
      overview: makeOverview({
        trade_count: 2,
        win_count: 2,
        expectancy: 25.5,
        win_rate: 100,
        total_net_pnl: 51,
      }),
      advanced: emptyAdvanced,
      setups: [],
      symbols: [],
    });

    expect(result).toContain("Positive expectancy ($25.50 per trade)");
  });

  it("highlights negative expectancy", () => {
    const result = generateStrategyInsights({
      overview: makeOverview({
        trade_count: 2,
        loss_count: 2,
        expectancy: -15.25,
        win_rate: 0,
        total_net_pnl: -30.5,
      }),
      advanced: emptyAdvanced,
      setups: [],
      symbols: [],
    });

    expect(result).toContain("Negative expectancy ($-15.25 per trade)");
  });

  it("reports drawdown and loss streaks", () => {
    const result = generateStrategyInsights({
      overview: makeOverview({
        trade_count: 4,
        loss_count: 4,
        expectancy: -10,
        win_rate: 0,
        total_net_pnl: -40,
      }),
      advanced: {
        ...emptyAdvanced,
        drawdown: { max_drawdown: 120, max_drawdown_pct: 60, peak_equity: 200 },
        streaks: {
          current_streak: 3,
          current_streak_type: "loss",
          longest_win_streak: 0,
          longest_loss_streak: 4,
        },
      },
      setups: [],
      symbols: [],
    });

    expect(result).toContain("Peak-to-trough drawdown: $120.00 (60% of equity peak)");
    expect(result).toContain("Longest losing streak: 4 trades");
  });

  it("surfaces top setup and unassigned tagging gap", () => {
    const result = generateStrategyInsights({
      overview: makeOverview({
        trade_count: 4,
        win_count: 3,
        loss_count: 1,
        expectancy: 20,
        win_rate: 75,
        total_net_pnl: 80,
      }),
      advanced: emptyAdvanced,
      setups: [
        makeRow("setup-a", "Breakout", 2, { expectancy: 45, win_rate: 100 }),
        makeRow("__unassigned__", "Unassigned", 2, { expectancy: -5, win_rate: 50 }),
      ],
      symbols: [],
    });

    expect(result).toContain("Top setup by expectancy: Breakout (+$45.00 expectancy, 2 trades)");
    expect(result).toContain("50% of trades lack a playbook setup");
  });

  it("flags worst-performing symbol", () => {
    const result = generateStrategyInsights({
      overview: makeOverview({
        trade_count: 3,
        win_count: 1,
        loss_count: 2,
        expectancy: -5,
        win_rate: 33.33,
        total_net_pnl: -15,
      }),
      advanced: emptyAdvanced,
      setups: [],
      symbols: [
        makeRow("AAPL", "AAPL", 2, { total_net_pnl: -80, expectancy: -40 }),
        makeRow("MSFT", "MSFT", 1, { total_net_pnl: 65, expectancy: 65 }),
      ],
    });

    expect(result).toContain("Largest drag by symbol: AAPL ($-80.00 net, 2 trades)");
  });

  it("falls back to journaling prompt when no specific signals fire", () => {
    const result = generateStrategyInsights({
      overview: makeOverview({
        trade_count: 1,
        win_count: 1,
        expectancy: 0,
        win_rate: 100,
        total_net_pnl: 0,
      }),
      advanced: emptyAdvanced,
      setups: [makeRow("solo", "Solo setup", 1, { expectancy: 0 })],
      symbols: [makeRow("AAPL", "AAPL", 1, { total_net_pnl: 0 })],
    });

    expect(result).toContain("Continue journaling with setup tags to sharpen strategy comparisons.");
    expect(result).toContain(STRATEGY_ANALYTICS_DISCLAIMER);
  });
});
