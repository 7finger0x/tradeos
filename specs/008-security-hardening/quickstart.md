# Quickstart: Phase 8 Validation

## Prerequisites

- Docker Desktop (local pgTAP) or rely on CI `supabase` job
- Node 20+, `npm ci`

## 1. Unit tests (FR-004 via Phase 7 CI gate)

```bash
npm run test --workspace=@tradeos/core
```

**Expected**: 25 tests pass.

## 2. Build

```bash
npm run build --workspace=apps/web
```

## 3. Cross-tenant RLS (extended suite)

```bash
npx supabase start
npx supabase db reset
npx supabase test db
```

**Expected**: `rls_cross_tenant.test.sql` passes **11** assertions:

| # | Assertion |
|---|-----------|
| 1–2 | Helpers exist |
| 3 | Tenant A reads own trade |
| 4–6 | Tenant B cannot read Tenant A trades / Hermes obs / coaching reports |
| 7 | Tenant B cannot INSERT into Tenant A trades |
| 8–9 | Tenant B cannot UPDATE/DELETE Tenant A trades |
| 10 | Tenant B cannot UPDATE Tenant A coaching report |
| 11 | Dual-tenant user cannot read another user's trade |

## 4. Risk lockout audit (manual)

1. Configure rules so test user enters `lockout` state.
2. `POST /api/trades` with session cookie.
3. Expect HTTP 403.
4. Query `audit_events` where `action = 'access.denied'` and `resource_type = 'risk_lockout'`.

## 5. Negative check

`POST /api/trades` blocked by `reduce_size` (not lockout) must **not** create `risk_lockout` audit row.
