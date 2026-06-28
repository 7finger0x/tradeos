# Research: Security Hardening (Phase 8)

## Decision: Audit only on `risk_state = lockout` (not all trade 403s)

**Rationale**: `checkProposedTradeRisk` can return `allowed: false` for `reduce_size` +
exceeded position risk — that is a sizing warning path, not a compliance lockout. FR-001
scopes audit to deterministic capital-protection lockout only.

**Alternatives considered**:
- Audit every `POST /api/trades` 403 — rejected (noise, conflates sizing with lockout)
- Separate `risk.denied` action — rejected (reuse `access.denied` + `resource_type` discriminator)

## Decision: Reuse `recordDeniedAccess()` with `resource_type: risk_lockout`

**Rationale**: Same audit pipeline as Phase 7 Hermes operator denials; compliance queries
filter by `resource_type`. No new audit table or mutation.

**Alternatives considered**:
- `recordAuditEvent` with custom action — rejected (loses denied-access semantics)

## Decision: Extend existing pgTAP file rather than new test suite

**Rationale**: `rls_cross_tenant.test.sql` is the constitution C1 proof surface; UPDATE/DELETE
and dual-tenant cases belong in the same transactional fixture for consistency.

**Alternatives considered**:
- Separate `rls_cross_tenant_mutations.test.sql` — rejected (duplicate fixture setup)

## Decision: Dual-tenant user via `seed_two_tenant_fixture()` replacement migration

**Rationale**: Phase 8 adds `dual_tenant_user` memberships without altering production RLS.
Replacing the seed function in `20260628200000_pgtap_dual_tenant.sql` keeps one fixture API.

**Alternatives considered**:
- Second seed function called from test — acceptable but adds orchestration; merged into one

## Decision: `throws_ok(..., '42501')` for cross-tenant mutations

**Rationale**: Postgres RLS violations on INSERT/UPDATE/DELETE raise insufficient_privilege
(`42501`). Matches Phase 7 INSERT proof pattern.

**Alternatives considered**:
- Assert zero rows affected — weaker (silent no-op vs explicit denial)

## Decision: No production schema changes

**Rationale**: Existing RLS policies on `trades` and `coaching_reports` already enforce
tenant + user scope. Phase 8 proves behavior; does not redefine policies.

**Alternatives considered**:
- New RLS policies — unnecessary; would widen blast radius
