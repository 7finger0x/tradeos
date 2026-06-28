# Tasks: Hermes RBAC & Tenant Isolation (Phase 7)

**Input**: `specs/007-hermes-rbac/` (spec.md, plan.md, research.md, data-model.md, contracts/)

**Prerequisites**: Phases 1–6 complete

## Phase 1: Setup

**Purpose**: pgTAP test infrastructure

- [x] T001 Create pgTAP helpers migration in `supabase/migrations/20260628190000_pgtap_test_helpers.sql`

---

## Phase 2: User Story 1 — Cross-Tenant Isolation Proof (P1) 🎯 MVP

**Goal**: Database tests prove tenant A users cannot read or write tenant B data.

**Independent Test**: `npx supabase test db` — `rls_cross_tenant.test.sql` passes

- [x] T002 [US1] Add cross-tenant RLS tests in `supabase/tests/rls_cross_tenant.test.sql`

**Checkpoint**: Constitution C1 resolved — authenticated cross-tenant isolation proven

---

## Phase 3: User Story 2 — Failed Access Audit (P1)

**Goal**: Operator 403 responses persist `access.denied` audit events.

**Independent Test**: Trader role receives 403 on Hermes ingest; audit row exists

- [x] T003 [US2] Add `recordDeniedAccess()` in `packages/core/src/audit/record-denied-access.ts`
- [x] T004 [US2] Wire denied-access audit in `apps/web/src/lib/hermes/require-operator.ts`
- [x] T005 [P] [US2] Export audit helper from `packages/core/src/index.ts`

---

## Phase 4: User Story 3 — CI Test Gate (P2)

**Goal**: Unit tests run on every PR.

**Independent Test**: CI `unit-tests` job green

- [x] T006 [US3] Add unit test job to `.github/workflows/ci.yml`

---

## Phase 5: Polish & Cross-Cutting

**Purpose**: Spec hygiene and feature pointer sync

- [x] T007 Update `.specify/feature.json` to `specs/007-hermes-rbac`
- [x] T008 [P] Sync exit criteria in `specs/002-trade-journal-mvp/spec.md`
- [x] T009 [P] Sync exit criteria in `specs/003-risk-manager-mvp/spec.md`
- [x] T010 Run quickstart validation per `specs/007-hermes-rbac/quickstart.md`

---

## Dependencies & Execution Order

1. **Phase 1** (T001) → blocks US1
2. **US1** (T002) — MVP / C1 blocker
3. **US2** (T003–T005) — parallel with US3 after US1
4. **US3** (T006) — independent
5. **Polish** (T007–T010) — after implementation

## Parallel Example

```bash
# After T001 completes:
T002  # cross-tenant tests
T003 + T006  # audit helper + CI job in parallel
```

## Implementation Strategy

1. Land pgTAP helpers + cross-tenant suite (closes constitution gap)
2. Add audit + CI gate
3. Sync spec exit criteria and feature pointer
