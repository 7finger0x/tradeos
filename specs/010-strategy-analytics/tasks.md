# Tasks: Strategy + Advanced Analytics (Phase 10)

**Feature**: 010-strategy-analytics

## Phase 1: User Story 1 — Strategy Overview Dashboard (P1)

- [x] T001 [US1] Add `advanced-metrics.ts` — equity curve, drawdown, streaks in `packages/core/src/analytics/`
- [x] T002 [US1] Add `computeTradeAnalytics` integration in `GET /api/strategy/analytics`
- [x] T003 [US1] Add `StrategyOverviewPanel` in `apps/web/src/components/strategy/strategy-dashboard.tsx`
- [x] T004 [US1] Unit tests for advanced metrics in `packages/core/src/analytics/advanced-metrics.test.ts`

## Phase 2: User Story 2 — Setup / Playbook Leaderboard (P1)

- [x] T005 [US2] Add `setup-analytics.ts` — setup leaderboard groupings
- [x] T006 [US2] Add `StrategySetupsPanel` with expectancy-sorted table
- [x] T007 [US2] Unit tests for setup/symbol/weekday groupings in `setup-analytics.test.ts`

## Phase 3: User Story 3 — Symbol & Timing Breakdowns (P2)

- [x] T008 [US3] Add symbol, weekday, and emotion breakdowns in API + `StrategyBreakdownPanel`
- [x] T009 [US3] Wire breakdown tables in Breakdown tab

## Phase 4: User Story 4 — Strategy Insights Summary (P2)

- [x] T010 [US4] Add `strategy-insights.ts` with `STRATEGY_ANALYTICS_DISCLAIMER`
- [x] T011 [US4] Surface insights + disclaimer on Overview tab
- [x] T012 [US4] Unit tests for insights in `packages/core/src/analytics/strategy-insights.test.ts`

## Phase 5: API & Shell (P1)

- [x] T013 Add `GET /api/strategy/analytics` in `apps/web/src/app/api/strategy/analytics/route.ts`
- [x] T014 Add tabbed `StrategyDashboard` (Overview | Setups | Breakdown)
- [x] T015 Add `/dashboard/strategy` page + sidebar + dashboard widget links

## Phase 6: Polish

- [x] T016 Add strategy styles in `apps/web/src/app/globals.css`
- [x] T017 Update spec exit criteria, `quickstart.md`, README, `.specify/feature.json`
- [x] T018 Run unit tests + web build

## Phase 7: Validation

- [x] T019 Automated: `@tradeos/core` unit tests (40/40) + web build pass
- [ ] T020 Manual smoke-test `/dashboard/strategy` per `quickstart.md` (blocked without `.env.local` + local Supabase + seeded closed trades; API returns 500 when Supabase env missing, not 401)
