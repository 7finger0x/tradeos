import { describe, expect, it } from "vitest";
import {
  buildEquityCurve,
  computeDrawdown,
  computeStreaks,
} from "../analytics/advanced-metrics";

describe("advanced metrics", () => {
  const trades = [
    { net_pnl: 100, r_multiple: 1, entry_time: "2026-06-01T10:00:00Z" },
    { net_pnl: -50, r_multiple: -0.5, entry_time: "2026-06-02T10:00:00Z" },
    { net_pnl: -30, r_multiple: -0.3, entry_time: "2026-06-03T10:00:00Z" },
    { net_pnl: 80, r_multiple: 0.8, entry_time: "2026-06-04T10:00:00Z" },
  ];

  it("builds cumulative equity curve", () => {
    const curve = buildEquityCurve(trades);
    expect(curve).toHaveLength(4);
    expect(curve[3]?.cumulative_pnl).toBe(100);
  });

  it("computes max drawdown from peak", () => {
    const drawdown = computeDrawdown(trades);
    expect(drawdown.peak_equity).toBe(100);
    expect(drawdown.max_drawdown).toBe(80);
    expect(drawdown.max_drawdown_pct).toBe(80);
  });

  it("computes win and loss streaks", () => {
    const streaks = computeStreaks(trades);
    expect(streaks.longest_win_streak).toBe(1);
    expect(streaks.longest_loss_streak).toBe(2);
    expect(streaks.current_streak_type).toBe("win");
    expect(streaks.current_streak).toBe(1);
  });
});
