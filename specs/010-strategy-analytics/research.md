# Research: Phase 10 Analytics

## Decisions

| Topic | Decision | Rationale |
|-------|----------|-----------|
| Storage | Compute on read | Matches journal analytics pattern; no migration risk |
| AI insights | Rule-based text | Constitution III — deterministic, auditable |
| Backtesting | Deferred | OHLCV engine is Phase 11+ scope |
| Grouping | Setup, symbol, weekday, emotion | Charter setup analytics + behavioral tracking |

## Metrics

- **Drawdown**: peak-to-trough on cumulative closed-trade P/L
- **Streaks**: consecutive wins/losses on closed trades by entry order
- **Expectancy**: reused from `computeTradeAnalytics`
