# Feature Specification: Screenshot + Replay Intelligence (Phase 11)

**Feature Branch**: `011-screenshot-replay` | **Created**: 2026-06-28

**Charter alignment**: Track A — Phase 11 — Screenshot Recognition + Trade Replay

**Status**: Kickoff — run `/speckit-plan` and `/speckit-tasks` to finalize before implementation

## User Stories

### P1 — Secure Screenshot Upload & Privacy
As a trader, I upload chart screenshots tied to journal trades with a privacy warning (redact account IDs, balances) and tenant-scoped storage.

### P1 — Screenshot AI Review (Educational)
As a trader, I receive structured screenshot analysis (setup detection, entry/exit quality, confluence, mistakes) with confidence, evidence, and limitations — no buy/sell instructions or performance guarantees.

### P1 — Trade Replay Session
As a trader, I step through a closed trade replay with entry/exit markers, notes timeline, screenshot timeline, and decision-point questions for training review (not live execution).

### P2 — Replay Scoring & Summary
As a trader, I answer replay questions, receive stored decision scores, and see a replay summary linked to the trade.

## Functional Requirements (Draft)

- **FR-001**: Secure upload to `trade-screenshots` bucket; URLs stored on `trades.screenshot_urls` (field exists; upload flow not built)
- **FR-002**: `POST /api/screenshots/analyze` — vision agent returns structured schema: `detected_setup`, `chart_context`, `entry_quality`, `exit_quality`, `confluence_factors`, `missing_confirmation`, `risk_reward_notes`, `mistakes`, `confidence`, `evidence`, `privacy_warnings`
- **FR-003**: Replay tables: `replay_sessions`, `replay_events`, `replay_answers` (tenant + user scoped, RLS)
- **FR-004**: `GET/POST /api/replay/sessions` — create session from trade, list events, submit answers
- **FR-005**: `/dashboard/replay` or trade-detail replay panel — timeline UI, privacy banner before upload
- **FR-006**: All AI outputs include disclaimers; educational review only per constitution V

## Existing Foundation

| Asset | Status |
|-------|--------|
| `trades.screenshot_urls` | ✅ Schema |
| `trade-screenshots` storage bucket | ✅ Bucket defined (policies TBD) |
| Screenshot upload UI | ❌ Deferred from Phase 2 |
| Replay domain (Track A) | ❌ Not started |
| `hermes_replay_evidence` | ✅ Hermes-only; not Track A trade replay |

## Out of Scope (Deferred)

- Live execution or broker order placement
- OHLCV backtest engine (Phase 11+ / separate workflow)
- Automated regime detection

## Exit Criteria

- [ ] Privacy warning before screenshot upload
- [ ] Tenant-isolated screenshot storage + analyze API with Zod-validated AI output
- [ ] Replay session reconstructs sample trade with scoring stored
- [ ] Unit + RLS tests; web build pass
- [ ] `.specify/feature.json` → `011-screenshot-replay`
