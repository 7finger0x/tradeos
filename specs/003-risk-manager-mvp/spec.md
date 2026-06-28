# Feature Specification: Risk Manager MVP (Phase 3)

**Feature Branch**: `003-risk-manager-mvp` | **Created**: 2026-06-28

## User Stories

### P1 — Configure Risk Rules
As a trader, I define max daily loss, max position risk, max trades per day, and cooldown so the system enforces my discipline.

### P1 — Risk Status Dashboard
As a trader, I see Green/Yellow/Orange/Red status with daily P/L vs limits and allowed risk per trade.

### P1 — Pre-Trade Warning
As a trader, I receive warnings when a new trade would violate risk rules; lockout blocks new trades.

### P2 — Risk Event History
As a trader, I review risk events and cooldown status with audit trail.

## Risk States (UI mapping)

| Engine State | UI Label | Size Multiplier |
|--------------|----------|-----------------|
| normal | Green | 1.0x |
| caution | Yellow | 0.5x |
| reduce_size | Orange | 0.25x |
| lockout | Red | 0x |

## Exit Criteria

- [x] Risk rules CRUD
- [x] Deterministic status from trade data
- [x] Cooldown after violations
- [x] Risk events persisted
- [x] Trade creation blocked/warned on lockout
- [x] Unit tests for all four states
