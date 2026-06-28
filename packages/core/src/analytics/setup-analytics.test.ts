import { describe, expect, it } from "vitest";
import {
  computeSetupLeaderboard,
  computeSymbolBreakdown,
  computeWeekdayBreakdown,
} from "../analytics/setup-analytics";

describe("setup analytics", () => {
  const setups = [
    { id: "a", name: "Breakout" },
    { id: "b", name: "Pullback" },
  ];

  const trades = [
    {
      net_pnl: 100,
      r_multiple: 2,
      setup_id: "a",
      symbol: "AAPL",
      entry_time: "2026-06-02T14:00:00Z",
    },
    {
      net_pnl: -40,
      r_multiple: -1,
      setup_id: "b",
      symbol: "MSFT",
      entry_time: "2026-06-03T14:00:00Z",
    },
    {
      net_pnl: 60,
      r_multiple: 1,
      setup_id: "a",
      symbol: "AAPL",
      entry_time: "2026-06-04T14:00:00Z",
    },
    {
      net_pnl: -20,
      r_multiple: -0.5,
      setup_id: null,
      symbol: "TSLA",
      entry_time: "2026-06-05T14:00:00Z",
    },
  ];

  it("ranks setups by expectancy", () => {
    const leaderboard = computeSetupLeaderboard(trades, setups);
    expect(leaderboard[0]?.label).toBe("Breakout");
    expect(leaderboard[0]?.analytics.expectancy).toBeGreaterThan(0);
    expect(leaderboard.some((row) => row.label === "Unassigned")).toBe(true);
  });

  it("groups symbol performance", () => {
    const symbols = computeSymbolBreakdown(trades);
    expect(symbols[0]?.label).toBe("AAPL");
    expect(symbols[0]?.analytics.total_net_pnl).toBe(160);
  });

  it("groups weekday performance", () => {
    const weekdays = computeWeekdayBreakdown(trades);
    expect(weekdays.length).toBeGreaterThan(0);
    expect(weekdays.every((row) => row.trade_count > 0)).toBe(true);
  });
});
