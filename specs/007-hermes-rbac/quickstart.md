# Quickstart: Phase 7 Validation

## Prerequisites

- Docker Desktop running (for local pgTAP)
- Node 20+, `npm ci`

## 1. Cross-tenant RLS (constitution C1)

```bash
npx supabase start
npx supabase db reset
npx supabase test db
```

**Expected**: `rls_cross_tenant.test.sql` passes 11 assertions including:
- Tenant A reads own trade
- Tenant B cannot read/write Tenant A trades, Hermes observations, or coaching reports

## 2. Unit tests (FR-004)

```bash
npm run test --workspace=@tradeos/core
```

**Expected**: 25 tests pass.

## 3. Build

```bash
npm run build --workspace=apps/web
```

## 4. Denied-access audit (manual)

1. Sign in as a user with `trader` role (not in `OPERATOR_ROLES`).
2. `POST /api/hermes/ingest` or `PUT /api/hermes/thresholds` with session cookie.
3. Expect HTTP 403.
4. Query `audit_events` where `action = 'access.denied'` and `resource_type = 'hermes_operator'`.
