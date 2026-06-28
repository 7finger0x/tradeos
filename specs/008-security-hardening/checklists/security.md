# Security Checklist: Security Hardening (Phase 8)

**Purpose**: Validate requirements quality for lockout audit and extended tenant isolation proof.
**Created**: 2026-06-28 | **Reviewed**: 2026-06-28
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md) | [constitution §III–IV](../../../.specify/memory/constitution.md)

**Note**: Items test requirement quality — not implementation behavior.

## Requirement Completeness

- [x] CHK001 Is lockout audit trigger condition explicitly defined (`risk_state = lockout`)? [Completeness, Spec FR-001, contract]
- [x] CHK002 Are audit field requirements documented beyond action name? [Completeness, contracts/audit-risk-lockout.md]
- [x] CHK003 Are cross-tenant mutation tables and operations enumerated? [Completeness, Spec FR-002 table in data-model.md]
- [x] CHK004 Is dual-tenant membership scenario defined with expected outcome? [Completeness, Spec FR-003]
- [x] CHK005 Is scope boundary documented (no new tables/RLS changes)? [Completeness, Spec FR-004, plan Constraints]
- [x] CHK006 Are non-lockout 403 paths explicitly excluded from audit? [Completeness, contract §Out of scope]

## Requirement Clarity

- [x] CHK007 Is `resource_type: risk_lockout` distinguished from `hermes_operator`? [Clarity, Spec FR-001, data-model.md]
- [x] CHK008 Are pgTAP pass criteria quantified (assertion count, SQLSTATE)? [Clarity, quickstart.md, Spec exit criteria]
- [x] CHK009 Is `reduce_size` block vs lockout block unambiguous? [Clarity, research.md Decision 1]
- [x] CHK010 Are fixture keys for dual-tenant user documented? [Clarity, data-model.md]

## Requirement Consistency

- [x] CHK011 Do US1–US3 map to FR-001–FR-004 without orphans? [Consistency, Spec]
- [x] CHK012 Does Phase 8 spec align with Phase 7 deferred items? [Consistency, Spec header + Phase 7 §Out of Scope]
- [x] CHK013 Do plan phases A–C match user stories? [Consistency, plan.md Implementation Phases]
- [x] CHK014 Is constitution §III (deterministic risk) preserved in requirements? [Consistency, plan Constitution Check]

## Acceptance Criteria Quality

- [x] CHK015 Can lockout audit success be verified with named route and query? [Measurability, quickstart.md §4]
- [x] CHK016 Can pgTAP suite success be verified with file name and assertion table? [Measurability, quickstart.md §3]
- [x] CHK017 Is negative acceptance defined (no audit on non-lockout 403)? [Measurability, quickstart.md §5]
- [x] CHK018 Are CI validation commands specified? [Measurability, quickstart.md, tasks.md]

## Scenario Coverage

- [x] CHK019 Are cross-tenant UPDATE and DELETE both in requirements for `trades`? [Coverage, Spec FR-002]
- [x] CHK020 Is coaching_reports UPDATE covered while DELETE intentionally omitted? [Coverage, Spec FR-002, data-model.md]
- [x] CHK021 Is Hermes observations mutation out of scope explained? [Coverage, data-model.md — no user UPDATE policy]
- [x] CHK022 Is dual-tenant cross-user read scenario specified? [Coverage, Spec FR-003]

## Edge Case Coverage

- [x] CHK023 Is missing `actor_id` behavior inherited from Phase 7 contract? [Edge Case, recordDeniedAccess skip — unchanged]
- [x] CHK024 Is audit insert failure behavior defined? [Edge Case, Phase 7 fail-open pattern applies]
- [x] CHK025 Are pgTAP transaction isolation requirements noted? [Edge Case, `begin`/`rollback` in test file]

## Non-Functional Requirements

- [x] CHK026 Are performance/rate-limit requirements intentionally out of scope? [NFR, plan — audit-only change]
- [x] CHK027 Is PII in `after_state.warnings` acknowledged? [NFR, Gap acceptable — trade warnings only]

## Dependencies & Assumptions

- [x] CHK028 Is dependency on Phase 7 `recordDeniedAccess` documented? [Dependency, plan Technical Context]
- [x] CHK029 Is `42501` RLS error code assumption documented? [Assumption, research.md Decision 5]
- [x] CHK030 Is Docker/CI prerequisite for pgTAP documented? [Dependency, quickstart.md Prerequisites]

## Ambiguities & Conflicts

- [x] CHK031 Is lockout vs sizing 403 conflict resolved in spec? [Resolved, FR-001 + contract §Out of scope]
- [x] CHK032 Does FR-004 ("extend contract doc") conflict with "no schema changes"? [Resolved, FR-004 = contract only]

## Notes

- All 32 items pass — spec, plan, contracts, data-model, quickstart, and research align.
- Implementation complete (T001–T009). pgTAP local run pending Docker; CI `supabase` job is acceptance path.
