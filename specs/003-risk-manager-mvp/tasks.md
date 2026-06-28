# Phase 3 — Risk Manager MVP — Tasks

**Feature**: 003-risk-manager-mvp | **Status**: Complete

## Database
- [x] risk_events table
- [x] risk_cooldowns table
- [x] max_consecutive_losses + is_active on risk_rules
- [x] RLS policies

## Core
- [x] Deterministic risk engine (normal/caution/reduce_size/lockout)
- [x] Green/Yellow/Orange/Red UI mapping
- [x] Metrics from trades (daily/weekly P/L, streaks)
- [x] Pre-trade risk check
- [x] 6 unit tests

## API
- [x] GET/PUT `/api/risk/rules`
- [x] GET `/api/risk/status`
- [x] POST `/api/risk/check`
- [x] GET `/api/risk/events`
- [x] Trade POST blocked on lockout (403)
- [x] Audit on rule updates

## UI
- [x] Risk console (`/dashboard/risk`)
- [x] Status card, rules form, event history
- [x] Dashboard risk widget

## Next Phase
Phase 4 — Market Open Briefing MVP
