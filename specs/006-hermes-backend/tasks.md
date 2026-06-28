# Phase 6 Tasks: Hermes Durable Backend

**Spec**: [spec.md](./spec.md)

## Completed

- [x] Migration `20260628180000_hermes_backend.sql`
- [x] Tables: providers, agent_state, provider_health, liquidity_observations, risk_thresholds, replay_evidence, operator_actions
- [x] RLS + `user_is_hermes_operator()` helper
- [x] Quorum evaluator + threshold evaluator (`@tradeos/core`)
- [x] Mock multi-provider liquidity adapter (`@tradeos/integrations`)
- [x] Ingest service with audit trail
- [x] API: `/api/hermes/status`, `/ingest`, `/observations`, `/thresholds`
- [x] `/dashboard/hermes` status UI
- [x] Unit tests + pgTAP RLS smoke test

## Validation

```bash
npm run test --workspace=@tradeos/core
npm run build --workspace=apps/web
npx supabase db reset
```

## Next Phase

Phase 7 — Hermes RBAC + tenant isolation hardening (`007-hermes-rbac`)
