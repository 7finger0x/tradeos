# Feature Specification: Hermes Operator Dashboard (Phase 9)

**Feature Branch**: `009-operator-dashboard` | **Created**: 2026-06-28

**Charter alignment**: Track B priority #5 — Operator dashboard

## User Stories

### P1 — Ops Command Center
As an operator, I see agent health, providers, quorum metrics, and threshold alerts in one dashboard with ingest controls.

### P1 — Threshold Management UI
As an operator, I view and update Hermes liquidity risk thresholds with audit trail.

### P1 — Operator Actions Log
As an operator, I review recent `hermes_operator_actions` (ingest, threshold updates).

### P2 — Compliance Audit Feed
As a compliance reviewer, I see Hermes-related `audit_events` (ingest, threshold changes, denied access).

## Functional Requirements

- **FR-001**: `/dashboard/hermes` MUST present tabbed operator dashboard: Overview | Thresholds | Actions | Compliance
- **FR-002**: `GET /api/hermes/operator-actions` — paginated recent operator actions for tenant
- **FR-003**: `GET /api/hermes/compliance` — Hermes-related audit events (`hermes.*`, `access.denied` + `hermes_operator`)
- **FR-004**: Threshold panel MUST use existing `GET/PUT /api/hermes/thresholds` (operator-only writes)
- **FR-005**: Non-operators see read-only overview; operator controls hidden

## Exit Criteria

- [x] Tabbed operator dashboard at `/dashboard/hermes`
- [x] Operator actions API + UI timeline
- [x] Compliance audit API + UI feed
- [x] Threshold editor UI wired to PUT endpoint
- [x] Unit tests + build pass
- [x] `.specify/feature.json` → `009-operator-dashboard`
