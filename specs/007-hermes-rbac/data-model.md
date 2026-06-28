# Data Model: Phase 7 (no new tables)

Phase 7 does not introduce new tables. It validates and hardens existing tenant-scoped
entities.

## Test fixture entities (ephemeral, pgTAP only)

| Entity | Purpose |
|--------|---------|
| `tests.create_supabase_user` | Simulated auth user + identity |
| `tests.authenticate_as` | JWT claim + `authenticated` role |
| `tests.seed_two_tenant_fixture` | Two tenants, users, sample rows |

## Validated tenant-scoped tables

| Table | RLS key | Cross-tenant test |
|-------|---------|-------------------|
| `trades` | `tenant_id` + `user_id` | Read + write blocked |
| `hermes_liquidity_observations` | `tenant_id` | Read blocked |
| `coaching_reports` | `tenant_id` + `user_id` | Read blocked |

## Audit events (denied access)

| Field | Value on operator 403 |
|-------|----------------------|
| `action` | `access.denied` |
| `resource_type` | `hermes_operator` |
| `after_state` | `{ denied: true, reason, role, required }` |
