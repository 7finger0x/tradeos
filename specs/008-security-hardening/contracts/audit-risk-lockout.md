# Contract: Risk Lockout Denied Access Audit

## Trigger

`POST /api/trades` returns HTTP 403 when `evaluation.risk_state === 'lockout'` and `checkProposedTradeRisk` disallows the trade.

## Side effect

`recordDeniedAccess(supabase, input)` inserts into `audit_events`:

```typescript
{
  tenant_id: string;
  actor_id: string;
  action: "access.denied";
  resource_type: "risk_lockout";
  resource_id: null;
  after_state: {
    denied: true;
    reason: "Trade blocked by risk lockout";
    risk_state: "lockout";
    warnings: string[];
  };
}
```

## Out of scope

403 from `reduce_size` position-risk block (not lockout) — no `access.denied` audit in Phase 8.
