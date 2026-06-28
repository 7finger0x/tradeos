# Tasks: Security Hardening (Phase 8)

**Input**: `specs/008-security-hardening/` (spec.md, plan.md, research.md, data-model.md, contracts/, quickstart.md)

**Prerequisites**: Phase 7 complete (`recordDeniedAccess`, pgTAP helpers, CI jobs)

## Phase 1: User Story 1 — Risk Lockout Audit (P1) 🎯 MVP

**Goal**: Lockout-blocked trade creation writes `access.denied` / `risk_lockout` audit events.

**Independent Test**: Lockout state → `POST /api/trades` → 403 + `audit_events.resource_type = risk_lockout`

- [x] T001 [US1] Add lockout audit contract in `specs/008-security-hardening/contracts/audit-risk-lockout.md`
- [x] T002 [US1] Wire `recordDeniedAccess` on lockout 403 in `apps/web/src/app/api/trades/route.ts`

**Checkpoint**: FR-001 satisfied; `reduce_size` 403s do not audit (per contract §Out of scope)

---

## Phase 2: User Story 2 — Cross-Tenant Mutation Proof (P1)

**Goal**: pgTAP proves cross-tenant UPDATE/DELETE blocked on mutable tables.

**Independent Test**: `npx supabase test db` — assertions 8–10 in `rls_cross_tenant.test.sql`

- [x] T003 [US2] Add cross-tenant UPDATE/DELETE assertions in `supabase/tests/rls_cross_tenant.test.sql`
- [x] T004 [P] [US2] Bump `plan()` count to 11 in `supabase/tests/rls_cross_tenant.test.sql`

**Checkpoint**: FR-002 satisfied for `trades` and `coaching_reports`

---

## Phase 3: User Story 3 — Multi-Tenant Membership Regression (P2)

**Goal**: Dual-tenant membership does not bypass `user_id` RLS.

**Independent Test**: Assertion 11 — `dual_tenant_user` cannot read `tenant_a_user` trade

- [x] T005 [US3] Extend `tests.seed_two_tenant_fixture()` in `supabase/migrations/20260628200000_pgtap_dual_tenant.sql`
- [x] T006 [US3] Add dual-member read isolation assertion in `supabase/tests/rls_cross_tenant.test.sql`

**Checkpoint**: FR-003 satisfied

---

## Phase 4: Polish & Cross-Cutting

**Purpose**: Feature pointer, validation, documentation sync

- [x] T007 Update `.specify/feature.json` to `specs/008-security-hardening`
- [x] T008 [P] Run `npm run test --workspace=@tradeos/core` and `npm run build --workspace=apps/web`
- [x] T009 [P] Document validation steps in `specs/008-security-hardening/quickstart.md` (11 assertions + negative check)

---

## Dependencies & Execution Order

```text
US1 (T001→T002) ──┐
                  ├──► Polish (T007–T009)
US2 (T003→T004) ──┤
US3 (T005→T006) ──┘
```

- **US2 ∥ US3**: After US1 contract exists, pgTAP work can proceed in parallel (T003–T006 touch different migration vs test sections but same test file — run T005 before T006, T003 after T005)
- **Recommended sequence**: T001 → T002 → T005 → T003 → T006 → T004 → T007–T009

### User Story Dependencies

| Story | Depends on | Independent deliverable |
|-------|------------|----------------------|
| US1 | Phase 7 `recordDeniedAccess` | Lockout audit on one route |
| US2 | Phase 7 pgTAP helpers | Mutation assertions only |
| US3 | T005 fixture extension | Dual-tenant regression assertion |

## Parallel Example

```bash
# After T001 completes:
T002  # trades route audit
T005  # dual-tenant fixture migration (parallel with T002)

# After T005:
T003 + T006  # mutation + dual assertions in test file
```

## Implementation Strategy

1. **MVP (US1)**: Contract + route wiring — closes compliance gap from Phase 7 deferral
2. **US2 + US3**: Extend single pgTAP file (constitution C1 surface)
3. **Polish**: CI validation + quickstart documentation

## Validation Commands

```bash
npm run test --workspace=@tradeos/core
npm run build --workspace=apps/web
npx supabase db reset && npx supabase test db
```
