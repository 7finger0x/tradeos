# Data Model: Phase 8 (no new production tables)

Phase 8 extends audit behavior and pgTAP coverage. No new application tables.

## Production entities (unchanged schema)

### `audit_events` — risk lockout denial

| Field | Value on lockout 403 |
|-------|----------------------|
| `action` | `access.denied` |
| `resource_type` | `risk_lockout` |
| `actor_id` | Authenticated user attempting trade |
| `tenant_id` | Session tenant |
| `after_state` | `{ denied, reason, risk_state, warnings }` |

See [contracts/audit-risk-lockout.md](./contracts/audit-risk-lockout.md).

### RLS-scoped tables under extended pgTAP proof

| Table | Policies | Phase 8 pgTAP coverage |
|-------|----------|------------------------|
| `trades` | `tenant_id` + `user_id` | SELECT, INSERT, **UPDATE**, **DELETE** cross-tenant |
| `coaching_reports` | `tenant_id` + `user_id` | SELECT (Phase 7), **UPDATE** cross-tenant |
| `hermes_liquidity_observations` | `tenant_id` (select) | SELECT only (Phase 7; no user UPDATE policy) |

## Test fixture entities (pgTAP)

| Entity | Phase 8 change |
|--------|----------------|
| `tests.seed_two_tenant_fixture()` | Adds `dual_tenant_user` member of tenants A and B |
| `dual_tenant_user` | Regression: membership in both tenants does not bypass `user_id` RLS |

## Fixture JSON keys (`seed_two_tenant_fixture` return)

| Key | Description |
|-----|-------------|
| `tenant_a`, `tenant_b` | Tenant UUIDs |
| `user_a`, `user_b` | Single-tenant users |
| `user_dual` | Dual-tenant member |
| `trade_a`, `obs_a`, `report_a` | Tenant A sample row IDs |

## API surface

| Route | Phase 8 behavior |
|-------|------------------|
| `POST /api/trades` | On lockout 403 → `recordDeniedAccess` (`risk_lockout`) |

## Relationships to Phase 7

| Phase 7 artifact | Phase 8 extension |
|----------------|-------------------|
| `recordDeniedAccess` | Reused for `risk_lockout` |
| `rls_cross_tenant.test.sql` | 7 → 11 assertions |
| `audit-denied-access.md` (`hermes_operator`) | Sibling contract `audit-risk-lockout.md` |
