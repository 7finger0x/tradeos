# Feature Specification: Trade Journal MVP

**Feature Branch**: `002-trade-journal-mvp`

**Created**: 2026-06-28

**Status**: In Progress

## User Stories

### P1 — CSV Import
As a trader, I import trades from CSV so I can review performance without manual entry.

**Acceptance**: Two broker-like formats parse; duplicates flagged; trades appear in journal.

### P1 — Manual Trade Entry
As a trader, I manually log a trade with setup tags and notes.

**Acceptance**: Trade persists with tenant isolation; visible in trade list.

### P1 — Trade List & Analytics
As a trader, I see my trades with win rate, expectancy, avg R, and P/L summary.

**Acceptance**: Daily/weekly stats compute correctly from stored trades.

### P2 — Emotional Logging
As a trader, I record mood and discipline on a trade.

**Acceptance**: Emotion fields persist and appear on trade detail.

### P2 — Journal Summary
As a trader, I receive a daily/weekly AI-style summary of performance patterns.

**Acceptance**: Summary generated from analytics with limitations disclaimer.

## Functional Requirements

- FR-001: Normalize imports into canonical `trades` schema
- FR-002: Detect duplicate imports via broker_trade_id or fingerprint
- FR-003: Setup tags via `setups` table
- FR-004: RLS tenant isolation on all journal tables
- FR-005: Audit events on import and trade mutations
- FR-006: Screenshot URL field (storage upload Phase 2b — URL field only for MVP)

## Exit Criteria

- [x] CSV import works for generic + Thinkorswim-style formats
- [x] Manual trade entry works
- [x] Trade table with filters
- [x] Setup tagging works
- [x] Daily/weekly analytics display
- [x] Journal summary generated
- [x] Cross-tenant access blocked
