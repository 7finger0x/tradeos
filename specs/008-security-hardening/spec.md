# Feature Specification: Security Hardening (Phase 8)

**Feature Branch**: `008-security-hardening` | **Created**: 2026-06-28

**Carries forward**: Phase 7 §Out of Scope items

## User Stories

### P1 — Risk Lockout Audit
As a compliance reviewer, when the risk manager blocks a new trade (lockout), an `access.denied` audit event is recorded.

### P1 — Cross-Tenant Mutation Proof
As a platform owner, pgTAP tests prove tenant B users cannot UPDATE or DELETE tenant A rows on mutable tables.

### P2 — Multi-Tenant Membership Regression
As a platform owner, a user who belongs to two tenants still cannot read another user's rows via RLS.

## Functional Requirements

- **FR-001**: `POST /api/trades` MUST write `audit_events` when blocked due to `risk_state = lockout`:
  - `action`: `access.denied`
  - `resource_type`: `risk_lockout`
  - Contract: [contracts/audit-risk-lockout.md](./contracts/audit-risk-lockout.md)

- **FR-002**: Extend `supabase/tests/rls_cross_tenant.test.sql` with cross-tenant **UPDATE** and **DELETE** on:
  - `trades` — UPDATE and DELETE blocked (SQLSTATE `42501`)
  - `coaching_reports` — UPDATE blocked (SQLSTATE `42501`)

- **FR-003**: pgTAP MUST include dual-tenant membership case: user in tenants A and B cannot read tenant A trade owned by another user.

- **FR-004**: Extend denied-access contract doc; no new tables or RLS policy changes.

## Exit Criteria

- [x] Risk lockout 403 writes `access.denied` / `risk_lockout`
- [x] pgTAP cross-tenant UPDATE/DELETE assertions pass (11 total; CI `supabase` job)
- [x] Dual-tenant membership regression assertion passes
- [x] Unit tests + web build pass
- [x] `.specify/feature.json` points to `008-security-hardening`
