# Feature Specification: Strategy + Advanced Analytics (Phase 10)

**Feature Branch**: `010-strategy-analytics` | **Created**: 2026-06-28

**Charter alignment**: Track A — Phase 10 — Strategy + advanced analytics

## User Stories

### P1 — Strategy Overview Dashboard
As a trader, I see all-time performance metrics, drawdown, streaks, and equity curve summary so I understand my edge and risk profile.

### P1 — Setup / Playbook Leaderboard
As a trader, I compare win rate, expectancy, and P/L by playbook setup to know which strategies to repeat or retire.

### P2 — Symbol & Timing Breakdowns
As a trader, I see performance by symbol and weekday to spot concentration risk and timing patterns.

### P2 — Strategy Insights Summary
As a trader, I receive deterministic insight text with financial disclaimers (not AI guarantees) highlighting top setups and behavioral gaps.

## Functional Requirements

- **FR-001**: `/dashboard/strategy` MUST present tabbed strategy dashboard: Overview | Setups | Breakdowns
- **FR-002**: `GET /api/strategy/analytics` — returns overview, advanced metrics, setup leaderboard, symbol/weekday breakdowns, insights
- **FR-003**: Setup management MUST reuse existing `GET/POST /api/setups`
- **FR-004**: Insights MUST include `STRATEGY_ANALYTICS_DISCLAIMER`; no profit guarantees
- **FR-005**: All data scoped by `tenant_id` + `user_id` via existing RLS

## Out of Scope (Deferred)

- Full backtest engine and `strategy_backtests` table
- AI-generated strategy discovery
- Live execution or broker sync

## Exit Criteria

- [x] Tabbed strategy dashboard at `/dashboard/strategy`
- [x] Strategy analytics API wired to core pure functions
- [x] Nav link from dashboard shell
- [x] Unit tests + build pass
- [x] `.specify/feature.json` → `010-strategy-analytics`
