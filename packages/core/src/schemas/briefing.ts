import { z } from "zod";

export const MarketRegimeSchema = z.enum([
  "trend_up",
  "trend_down",
  "range_bound",
  "high_volatility",
  "low_volatility",
  "risk_on",
  "risk_off",
]);

export type MarketRegime = z.infer<typeof MarketRegimeSchema>;

export const WatchlistCandidateSchema = z.object({
  symbol: z.string(),
  score: z.number(),
  rank: z.number(),
  reason: z.string(),
  setup_fit: z.string().optional(),
  caution_notes: z.string().optional(),
  relative_volume: z.number(),
  momentum_score: z.number(),
  catalyst_score: z.number(),
  user_edge_score: z.number(),
});

export type WatchlistCandidate = z.infer<typeof WatchlistCandidateSchema>;

export const BriefingInputSchema = z.object({
  briefing_date: z.string(),
  market_snapshot: z.object({
    as_of: z.string(),
    indices: z.array(
      z.object({
        symbol: z.string(),
        name: z.string(),
        change_pct: z.number(),
      }),
    ),
    vix: z.number(),
    vix_change_pct: z.number(),
    regime: MarketRegimeSchema,
    sector_leaders: z.array(z.string()),
    sector_laggards: z.array(z.string()),
  }),
  economic_events: z.array(
    z.object({
      title: z.string(),
      impact: z.string(),
      event_time: z.string().optional().nullable(),
    }),
  ),
  earnings_events: z.array(
    z.object({
      symbol: z.string(),
      company_name: z.string().optional().nullable(),
      timing: z.string().optional().nullable(),
    }),
  ),
  watchlist: z.array(WatchlistCandidateSchema),
  risk_overlay: z.object({
    ui_label: z.string(),
    size_multiplier: z.number(),
    allowed_risk_per_trade: z.number().nullable(),
    reasons: z.array(z.string()),
    daily_pnl: z.number().optional(),
  }),
  trader_context: z
    .object({
      top_symbols: z.array(z.string()).default([]),
      recent_win_rate: z.number().optional(),
    })
    .optional(),
});

export type BriefingInput = z.infer<typeof BriefingInputSchema>;

export const BriefingOutputSchema = z.object({
  market_regime: MarketRegimeSchema,
  ai_summary: z.string(),
  process_goal: z.string(),
  avoid_conditions: z.array(z.string()),
  sections: z.object({
    overnight_summary: z.string(),
    index_context: z.string(),
    volatility_notes: z.string(),
    economic_calendar: z.string(),
    earnings_today: z.string(),
    sector_rotation: z.string(),
    watchlist_summary: z.string(),
    risk_posture: z.string(),
    trader_reminders: z.string(),
  }),
});

export type BriefingOutput = z.infer<typeof BriefingOutputSchema>;
