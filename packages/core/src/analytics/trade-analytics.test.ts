import { describe, expect, it } from "vitest";
import { computeTradeAnalytics } from "../analytics/trade-analytics";

describe("computeTradeAnalytics", () => {
  it("computes win rate and expectancy", () => {
    const analytics = computeTradeAnalytics([
      { net_pnl: 100, r_multiple: 2, entry_time: "2026-06-01T10:00:00Z" },
      { net_pnl: -50, r_multiple: -1, entry_time: "2026-06-01T11:00:00Z" },
      { net_pnl: 50, r_multiple: 1, entry_time: "2026-06-01T12:00:00Z" },
    ]);

    expect(analytics.trade_count).toBe(3);
    expect(analytics.win_count).toBe(2);
    expect(analytics.win_rate).toBe(66.67);
    expect(analytics.total_net_pnl).toBe(100);
  });
});
