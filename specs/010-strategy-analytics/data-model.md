# Data Model: Phase 10 (API Payload)

No new tables. Reads `trades` and `setups` (existing Phase 2 schema).

## GET /api/strategy/analytics

```json
{
  "overview": "TradeAnalytics",
  "advanced": {
    "equity_curve": [{ "date", "cumulative_pnl", "trade_index" }],
    "drawdown": { "max_drawdown", "max_drawdown_pct", "peak_equity" },
    "streaks": { "current_streak", "current_streak_type", "longest_win_streak", "longest_loss_streak" }
  },
  "setups": [{ "key", "label", "trade_count", "analytics" }],
  "symbols": [{ "key", "label", "trade_count", "analytics" }],
  "weekdays": [{ "key", "label", "trade_count", "analytics" }],
  "emotions": [{ "key", "label", "trade_count", "analytics" }],
  "insights": "string",
  "disclaimer": "string"
}
```

Scoped by `tenant_id` + `user_id` from session.
