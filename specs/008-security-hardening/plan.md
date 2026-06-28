# Implementation Plan: Security Hardening (Phase 8)

**Branch**: `008-security-hardening` | **Date**: 2026-06-28 | **Spec**: [spec.md](./spec.md)

## Summary

Close Phase 7 deferred items: risk lockout denied-access audit on trade creation and
extended cross-tenant pgTAP (UPDATE/DELETE + dual-tenant membership regression).

## Technical Context

**Language**: TypeScript 5.x, SQL (pgTAP)

**Primary dependencies**: Phase 7 `recordDeniedAccess`, pgTAP `tests` schema helpers

**Testing**: pgTAP (`rls_cross_tenant.test.sql`, 11 assertions); Vitest; CI `supabase` + `unit-tests` jobs

**Constraints**: No production RLS or table changes; single-route API change (`POST /api/trades`)

## Constitution Check (pre-design)

| Gate | Requirement | Plan |
|------|-------------|------|
| III. Deterministic risk | Lockout blocks trades | Audit only; enforcement unchanged |
| IV. Tenant isolation | Real DB-backed tests | Extended pgTAP mutations |
| IV. Endpoint RBAC audit | Denied actions logged | `risk_lockout` audit events |
| VI. Test discipline | CI proof | `supabase test db` + unit tests |

## Constitution Check (post-design)

| Gate | Status |
|------|--------|
| III. Deterministic risk | ✅ No AI/risk logic changes |
| IV. Tenant isolation | ✅ 11-assertion pgTAP suite |
| IV. Endpoint RBAC audit | ✅ Lockout + Phase 7 operator audits |
| VI. Test discipline | ✅ quickstart.md validation path |

## Project Structure

```text
apps/web/src/app/api/trades/route.ts
supabase/migrations/20260628200000_pgtap_dual_tenant.sql
supabase/tests/rls_cross_tenant.test.sql
specs/008-security-hardening/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── tasks.md
└── contracts/
    └── audit-risk-lockout.md
```

## Design Artifacts

| Artifact | Path |
|----------|------|
| Research | [research.md](./research.md) |
| Data model | [data-model.md](./data-model.md) |
| Contracts | [contracts/audit-risk-lockout.md](./contracts/audit-risk-lockout.md) |
| Quickstart | [quickstart.md](./quickstart.md) |

## Implementation Phases

### Phase A — Risk lockout audit (US1)
Wire `recordDeniedAccess` when `evaluation.risk_state === 'lockout'` on `POST /api/trades` 403.

### Phase B — pgTAP extensions (US2 + US3)
Replace `seed_two_tenant_fixture` with dual-member variant; add UPDATE/DELETE/dual-read assertions.

### Phase C — Validation
Unit tests, web build, `supabase test db` (local or CI).

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Audit noise from non-lockout 403s | Gate audit on `risk_state === 'lockout'` only |
| pgTAP flake on RLS error codes | Standardize on SQLSTATE `42501` |
| Dual-tenant false positive | Assert `user_id = auth.uid()` still blocks cross-user reads |
