# Phase 2 — Trade Journal MVP — Tasks

**Feature**: 002-trade-journal-mvp | **Status**: Complete

## Database
- [x] Migration: trades, setups, import_batches, import_rows, journal_summaries
- [x] RLS policies on all journal tables
- [x] pgTAP tests for trades RLS

## Core Package
- [x] Trade + setup Zod schemas
- [x] CSV parser (generic + Thinkorswim)
- [x] Trade fingerprint + duplicate detection
- [x] Analytics: win rate, expectancy, profit factor
- [x] Journal summary generator
- [x] Unit tests (8 passing)

## API
- [x] GET/POST `/api/trades`
- [x] POST `/api/trades/import`
- [x] GET `/api/trades/[id]`
- [x] GET/POST `/api/setups`
- [x] GET `/api/journal/analytics`
- [x] Audit events on create/import

## UI
- [x] Journal dashboard with stats + summary
- [x] Trade table with detail view
- [x] Manual trade form
- [x] CSV import wizard
- [x] Setup quick-add

## Exit Criteria
- [x] CSV import (2 formats)
- [x] Manual trade entry
- [x] Setup tagging
- [x] Daily analytics + summary
- [ ] Screenshot upload to storage (URL field only — upload in 2b)
- [ ] Live Supabase validation (requires local stack)

## Next Phase
Phase 3 — Risk Manager MVP
