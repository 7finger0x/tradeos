import { describe, expect, it } from "vitest";
import { generateMarketBriefing } from "../briefing/briefing-generator";
import { rankWatchlistCandidates, scoreWatchlistCandidate } from "../briefing/watchlist-scorer";

describe("watchlist scorer", () => {
  it("ranks higher momentum symbols first", () => {
    const a = scoreWatchlistCandidate({
      symbol: "NVDA",
      change_pct: 2.5,
      relative_volume: 1.8,
      momentum_score: 4.5,
      has_earnings_today: true,
      user_historical_win_rate: 60,
      user_trade_count: 10,
    });
    const b = scoreWatchlistCandidate({
      symbol: "XLU",
      change_pct: -0.2,
      relative_volume: 0.7,
      momentum_score: -0.14,
      has_earnings_today: false,
    });
    const ranked = rankWatchlistCandidates([b, a]);
    expect(ranked[0]?.symbol).toBe("NVDA");
    expect(ranked[0]?.rank).toBe(1);
  });
});

describe("briefing generator", () => {
  it("includes risk overlay and watchlist in summary", () => {
    const output = generateMarketBriefing({
      briefing_date: "2026-06-28",
      market_snapshot: {
        as_of: "2026-06-28T13:00:00Z",
        indices: [
          { symbol: "SPY", name: "S&P 500", change_pct: 0.4 },
          { symbol: "QQQ", name: "Nasdaq", change_pct: 0.6 },
        ],
        vix: 16.2,
        vix_change_pct: -2,
        regime: "risk_on",
        sector_leaders: ["Tech"],
        sector_laggards: ["Utilities"],
      },
      economic_events: [{ title: "Jobless Claims", impact: "high" }],
      earnings_events: [{ symbol: "NVDA", company_name: "NVIDIA", timing: "AMC" }],
      watchlist: [
        {
          symbol: "NVDA",
          score: 2.1,
          rank: 1,
          reason: "earnings catalyst",
          relative_volume: 1.5,
          momentum_score: 1.2,
          catalyst_score: 1.5,
          user_edge_score: 0.6,
        },
      ],
      risk_overlay: {
        ui_label: "Yellow",
        size_multiplier: 0.5,
        allowed_risk_per_trade: 50,
        reasons: ["Daily loss at 50% of max"],
        daily_pnl: -250,
      },
    });

    expect(output.ai_summary).toContain("Risk overlay");
    expect(output.ai_summary).toContain("NVDA");
    expect(output.process_goal).toContain("half risk");
    expect(output.avoid_conditions.length).toBeGreaterThan(0);
  });
});
