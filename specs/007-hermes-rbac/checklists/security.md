# Security Checklist: Hermes RBAC & Tenant Isolation (Phase 7)

**Purpose**: Validate requirements quality for tenant isolation, RBAC, and denied-access audit before release sign-off.
**Created**: 2026-06-28 | **Reviewed**: 2026-06-28
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md) | [constitution §IV](../../../.specify/memory/constitution.md)

**Note**: Items test whether requirements are complete, clear, and measurable — not whether code passes tests.

## Requirement Completeness

- [x] CHK001 Are all tenant-scoped tables in scope for cross-tenant proof explicitly listed or bounded? [Completeness, Spec FR-002 table]
- [x] CHK002 Does FR-002 specify both read and write isolation expectations for each covered table? [Completeness, Spec FR-002]
- [x] CHK003 Are pgTAP helper capabilities documented as requirements? [Completeness, Spec FR-001]
- [x] CHK004 Are denied-access audit fields specified beyond FR-003's action name? [Completeness, contracts/audit-denied-access.md]
- [x] CHK005 Are all Hermes operator routes in scope enumerated? [Completeness, Spec FR-003 routes list]
- [x] CHK006 Does the spec define which CI jobs constitute the test gate? [Completeness, Spec FR-004]

## Requirement Clarity

- [x] CHK007 Is authenticated user simulation mechanism defined? [Clarity, Spec FR-001 + research.md]
- [x] CHK008 Are cross-tenant pass/fail criteria quantified per table? [Clarity, Spec FR-002 pass criteria]
- [x] CHK009 Is `access.denied` distinguished with a stable schema contract? [Clarity, contracts/audit-denied-access.md]
- [x] CHK010 Are operator 403 responses scoped to roles and routes? [Clarity, Spec FR-003]

## Requirement Consistency

- [x] CHK011 Do user stories align with FR-001–FR-004? [Consistency, Spec — US2 narrowed to Hermes operator]
- [x] CHK012 Does US2 align with FR-003? [Consistency, Spec — lockout deferred §Out of Scope]
- [x] CHK013 Do exit criteria match FR acceptance language? [Consistency, Spec Exit Criteria]
- [x] CHK014 Is constitution §IV reflected in spec, plan, and quickstart? [Consistency]

## Acceptance Criteria Quality

- [x] CHK015 Can pgTAP pass be verified with named file and assertion count? [Measurability, 7 assertions in FR-002]
- [x] CHK016 Can CI unit gate be verified with named job and command? [Measurability, FR-004 `unit-tests` job]
- [x] CHK017 Are denied-access audit criteria measurable? [Measurability, quickstart.md §4]

## Scenario Coverage

- [x] CHK018 Are cross-tenant UPDATE/DELETE in scope or excluded? [Coverage, Spec FR-002 — INSERT+SELECT; UPDATE/DELETE deferred Phase 8]
- [x] CHK019 Multi-tenant membership requirements? [Coverage, deferred Phase 8 per spec §Out of Scope]
- [x] CHK020 Operator-capable roles vs trader denial defined? [Coverage, Spec FR-003 OPERATOR_ROLES]
- [x] CHK021 Missing `actor_id` behavior defined? [Coverage, contracts/audit-denied-access.md]

## Edge Case Coverage

- [x] CHK022 Service-role / anon vs authenticated test contexts? [Edge Case, FR-001 helpers + pgTAP rollback isolation]
- [x] CHK023 Test fixture cleanup between pgTAP runs? [Edge Case, `begin`/`rollback` in test file]
- [x] CHK024 Audit insert failure during 403? [Edge Case, fail-open documented in contract + spec §Out of Scope]

## Non-Functional Requirements

- [x] CHK025 Audit write rate limits? [NFR, deferred — spec §Out of Scope]
- [x] CHK026 PII retention on `after_state`? [NFR, deferred — spec §Out of Scope]

## Dependencies & Assumptions

- [x] CHK027 `auth.identities` assumption documented? [Assumption, FR-001 + research.md]
- [x] CHK028 Docker/CI prerequisites for pgTAP documented? [Dependency, quickstart.md + FR-004]
- [x] CHK029 Phase 7 scope boundary (no new tables/RLS changes)? [Assumption, plan.md Constraints]

## Ambiguities & Conflicts

- [x] CHK030 Lockout denied-access gap tracked? [Resolved, spec §Out of Scope → Phase 8]
- [x] CHK031 Phase 2–3 sync acceptance rules defined? [Clarity, Spec Exit Criteria last bullet]

## Notes

- All items resolved 2026-06-28 via spec.md, contract, and quickstart updates.
- Phase 8 follow-up: risk lockout `access.denied` on `POST /api/trades`, UPDATE/DELETE pgTAP.
