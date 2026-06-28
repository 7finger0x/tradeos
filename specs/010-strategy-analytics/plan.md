# Plan: Strategy + Advanced Analytics (Phase 10)

## Constitution Check

| Principle | Status |
|-----------|--------|
| III Deterministic risk | ✅ Analytics only; no trade execution |
| IV Tenant isolation | ✅ API uses session tenant/user scope |
| VI Testing | ✅ Unit tests for pure functions |
| VII MVP focus | ✅ Builds on journal trades + setups |

## Technical Approach

- Extend `packages/core/analytics` with deterministic grouped metrics
- Single read API aggregating trades + setups
- Client dashboard reusing Hermes tab shell patterns
- No new DB tables — compute on read from `trades` + `setups`

## Artifacts

- `research.md` — metric definitions
- `data-model.md` — API payload shape
- `quickstart.md` — validation steps
