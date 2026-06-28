# Contract: Denied Access Audit

## Trigger

Hermes operator routes return HTTP 403 when `canAccessOperatorActions(role)` is false.

**Routes**: `POST /api/hermes/ingest`, `PUT /api/hermes/thresholds`

**Operator roles**: `operator`, `risk_admin`, `compliance_admin`, `tenant_admin`, `system_admin`

## Side effect

`recordDeniedAccess(supabase, input)` inserts into `audit_events`:

```typescript
{
  tenant_id: string | null;
  actor_id: string;          // required — skipped if missing; 403 still returned
  action: "access.denied";
  resource_type: "hermes_operator";
  resource_id: null;
  after_state: {
    denied: true;
    reason: string;
    role?: string;
    required?: string;
  };
}
```

If audit insert fails, the API still returns 403 (fail-open on audit persistence).

## Out of scope (Phase 7)

Risk lockout 403 on `POST /api/trades` — deferred to Phase 8 (`resource_type: risk_lockout`).

## Consumers

- Compliance review / audit log UI (future)
- CI: manual verification via operator route with `trader` role
