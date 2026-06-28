# Implementation Plan: Hermes Operator Dashboard (Phase 9)

**Branch**: `009-operator-dashboard` | **Spec**: [spec.md](./spec.md)

## Summary

Upgrade Phase 6 Hermes status proof into a production-style operator command center with
threshold editing, operator action history, and compliance audit visibility.

## Technical Context

**Stack**: Next.js 15 App Router, existing Hermes APIs, Supabase RLS

**Dependencies**: Phase 6 backend, Phase 7 operator RBAC, Phase 8 security hardening

**Constraints**: No new DB tables; read APIs for any tenant member; writes operator-gated

## Constitution Check

| Gate | Status |
|------|--------|
| IV. RBAC | ✅ Operator-only threshold PUT + ingest |
| V. Structured outputs | ✅ Deterministic status/alerts from core |
| VI. Test discipline | ✅ Unit + build + existing pgTAP |

## Project Structure

```text
apps/web/src/app/api/hermes/operator-actions/route.ts
apps/web/src/app/api/hermes/compliance/route.ts
apps/web/src/components/hermes/hermes-operator-dashboard.tsx
apps/web/src/components/hermes/hermes-thresholds-panel.tsx
apps/web/src/components/hermes/hermes-operator-actions-panel.tsx
apps/web/src/components/hermes/hermes-compliance-panel.tsx
apps/web/src/app/dashboard/hermes/page.tsx
```

## Design Artifacts

| Artifact | Path |
|----------|------|
| Research | [research.md](./research.md) |
| Data model | [data-model.md](./data-model.md) |
| Quickstart | [quickstart.md](./quickstart.md) |
