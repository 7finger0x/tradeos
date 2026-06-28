# Feature Specification: Hermes Durable Backend (Phase 6)

**Feature Branch**: `006-hermes-backend` | **Created**: 2026-06-28

## User Stories

### P1 — Durable Liquidity Repositories
As an operator, liquidity observations, provider health, and agent state persist in Supabase with tenant isolation.

### P1 — Provider Ingestion
As an operator, I can ingest mock multi-provider liquidity snapshots and see quorum evaluation results.

### P2 — Risk Thresholds
As an operator, I configure Hermes liquidity risk thresholds per tenant.

### P2 — Operator Actions Audit
As an operator, sensitive Hermes actions are recorded in `hermes_operator_actions` and `audit_events`.

## Exit Criteria

- [x] Hermes tables: agents, providers, health, observations, thresholds, replay evidence, operator actions
- [x] RLS on all tenant-scoped Hermes tables
- [x] Deterministic quorum + observation quality scoring
- [x] Mock liquidity provider adapter
- [x] Ingest API with operator RBAC
- [x] Hermes status UI (backend proof, not full ops dashboard)
- [x] Unit tests + pgTAP RLS smoke test
