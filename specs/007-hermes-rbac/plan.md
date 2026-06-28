# Implementation Plan: Hermes RBAC & Tenant Isolation (Phase 7)

**Branch**: `007-hermes-rbac` | **Date**: 2026-06-28 | **Spec**: [spec.md](./spec.md)

## Summary

Close constitution gaps from `/speckit-analyze`: real cross-tenant RLS tests with
authenticated user simulation, audit logging for denied operator access, and CI unit
test gate.

## Technical Context

**Language**: TypeScript 5.x, SQL (pgTAP)

**Testing**: pgTAP + `tests` schema helpers; Vitest in CI

**Constraints**: Read-only analysis artifacts; minimal API surface changes

## Constitution Check

| Gate | Status |
|------|--------|
| IV. Tenant isolation | ✅ Cross-tenant pgTAP suite |
| IV. Endpoint RBAC audit | ✅ Denied access events |
| VI. Test discipline | ✅ CI runs unit tests |

## Project Structure

```text
supabase/migrations/20260628190000_pgtap_test_helpers.sql
supabase/tests/rls_cross_tenant.test.sql
packages/core/src/audit/record-denied-access.ts
apps/web/src/lib/hermes/require-operator.ts
.github/workflows/ci.yml
```

## Design Artifacts

| Artifact | Path |
|----------|------|
| Research | [research.md](./research.md) |
| Data model | [data-model.md](./data-model.md) |
| Contracts | [contracts/audit-denied-access.md](./contracts/audit-denied-access.md) |
| Quickstart | [quickstart.md](./quickstart.md) |
