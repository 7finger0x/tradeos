# Quickstart: Phase 10 Validation

```bash
npm run test --workspace=@tradeos/core
npm run build --workspace=apps/web
npm run dev --workspace=apps/web
```

## Seed data

1. Sign in as a trader with journal access.
2. Create playbook setups (Journal → setups or `POST /api/setups`):
   - e.g. `Breakout`, `Pullback`
3. Log **closed** trades with `net_pnl`, `symbol`, `entry_time`, and optional `setup_id` / `emotion`.
   - At least 2 trades per setup unlocks leaderboard insight branches.
   - Mix assigned and unassigned `setup_id` to verify tagging nudges.
4. Optional: include a losing symbol with ≥2 trades to trigger worst-symbol insight.

## API shape

`GET /api/strategy/analytics` (session-scoped `tenant_id` + `user_id`):

```json
{
  "overview": { "trade_count", "win_rate", "total_net_pnl", "expectancy", "..." },
  "advanced": {
    "equity_curve": [{ "date", "cumulative_pnl", "trade_index" }],
    "drawdown": { "max_drawdown", "max_drawdown_pct", "peak_equity" },
    "streaks": { "current_streak", "current_streak_type", "longest_win_streak", "longest_loss_streak" }
  },
  "setups": [{ "key", "label", "trade_count", "analytics" }],
  "symbols": [{ "key", "label", "trade_count", "analytics" }],
  "weekdays": [{ "key", "label", "trade_count", "analytics" }],
  "emotions": [{ "key", "label", "trade_count", "analytics" }],
  "insights": "multi-line deterministic text",
  "disclaimer": "Historical performance does not guarantee future results..."
}
```

Unauthenticated requests return 401. Empty journal returns zeroed metrics and the empty-trade insight message.

## UI verification

1. Open `/dashboard/strategy` (sidebar **Strategy** or dashboard widget).
2. **Overview** — stat cards (win rate, net P/L, expectancy, max drawdown, loss streak); equity bar chart when closed trades exist; insights block + disclaimer footer.
3. **Setups** — leaderboard table sorted by expectancy; `Unassigned` row when trades lack `setup_id`.
4. **Breakdown** — symbol and weekday (UTC) tables; emotion table when trades are emotion-tagged.
5. Tab state persists client-side; switching tabs does not refetch.

## Empty states

| Condition | Expected |
|-----------|----------|
| No trades | Overview insights: "Log closed trades…"; equity curve muted message |
| Open trades only (`net_pnl` null) | Insights: "Close open positions…" |
| No setups tagged | Setups tab: muted prompt to tag journal trades |
