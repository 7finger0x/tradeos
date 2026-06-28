# Feature Specification: Hermes RBAC & Tenant Isolation Hardening (Phase 7)

**Feature Branch**: `007-hermes-rbac` | **Created**: 2026-06-28

## User Stories

### P1 — Cross-Tenant Isolation Proof
As a platform owner, I have database tests proving tenant A users cannot read or write tenant B data on in-scope tables.

### P1 — Failed Access Audit (Hermes Operator)
As a compliance reviewer, denied **Hermes operator** actions are recorded in `audit_events` with action `access.denied`.

### P2 — CI Test Gate
As a developer, unit tests run in CI on every PR.

## Functional Requirements

### Tenant isolation (pgTAP)

- **FR-001**: pgTAP helpers MUST simulate authenticated users via `auth.uid()` using:
  - `tests.create_supabase_user(identifier)` — inserts `auth.users` + `auth.identities` (with `provider_id`)
  - `tests.authenticate_as(identifier)` — sets JWT `sub` claim and `authenticated` role
  - `tests.seed_two_tenant_fixture()` — two tenants with sample rows for isolation tests
  - See `research.md` for GoTrue identity requirement.

- **FR-002**: Cross-tenant isolation MUST be proven for these bounded tables:

  | Table | Read isolation | Write isolation (Phase 7) |
  |-------|----------------|---------------------------|
  | `trades` | Tenant B `SELECT` returns empty for Tenant A rows | Tenant B `INSERT` into Tenant A blocked (SQLSTATE `42501`) |
  | `hermes_liquidity_observations` | Tenant B `SELECT` returns empty | Not pgTAP-tested (RLS enforced; UPDATE/DELETE deferred) |
  | `coaching_reports` | Tenant B `SELECT` returns empty | Not pgTAP-tested (RLS enforced; UPDATE/DELETE deferred) |

  **Pass criteria** (`supabase/tests/rls_cross_tenant.test.sql`): 11 pgTAP assertions — see Phase 8 for UPDATE/DELETE/dual-tenant tests.

  **Out of scope**: Cross-tenant UPDATE/DELETE pgTAP tests (deferred Phase 8).

### Denied-access audit (Hermes operator)

- **FR-003**: Routes guarded by `requireOperatorSession()` / `canAccessOperatorActions()` MUST on HTTP 403 write `audit_events` per [contracts/audit-denied-access.md](./contracts/audit-denied-access.md).

  **In-scope routes**:
  - `POST /api/hermes/ingest`
  - `PUT /api/hermes/thresholds`

  **Operator-capable roles** (`OPERATOR_ROLES`): `operator`, `risk_admin`, `compliance_admin`, `tenant_admin`, `system_admin`. All other roles receive 403 + audit.

  **Audit contract**: `action = access.denied`, `resource_type = hermes_operator`, `after_state.denied = true`. If `actor_id` is missing, audit write is skipped (403 still returned).

### CI test discipline

- **FR-004**: CI MUST run:
  - `unit-tests` job → `npm run test --workspace=@tradeos/core`
  - `supabase` job → `supabase db reset` + `supabase test db` (includes cross-tenant suite)

## Out of Scope / Deferred (Phase 8+)

| Item | Reason |
|------|--------|
| Risk lockout 403 audit on `POST /api/trades` | US2 lockout path; separate from Hermes operator RBAC |
| Cross-tenant UPDATE/DELETE pgTAP | INSERT + SELECT proof sufficient for constitution C1 this phase |
| Multi-tenant user membership regression | Single-tenant-per-user fixture adequate for Phase 7 |
| Audit write failure handling | 403 returned even if audit insert fails (fail-open on audit) |
| NFR: audit rate limits, PII retention on `after_state` | Compliance policy pass, not hardening scope |

## Exit Criteria

- [x] Test helpers installed via migration
- [x] Cross-tenant pgTAP tests pass — `rls_cross_tenant.test.sql`, 7 assertions (CI `supabase` job)
- [x] Denied-access audit on Hermes operator routes (`ingest`, `thresholds` PUT)
- [x] CI `unit-tests` job added (FR-004)
- [x] `.specify/feature.json` points to active phase
- [x] Phase 2–3 spec exit criteria synced — items marked `[x]` only when implementation exists; gaps documented in phase spec
