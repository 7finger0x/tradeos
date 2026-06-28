# Phase 5 Tasks: AI Trading Coach MVP

**Spec**: [spec.md](./spec.md)

## Completed

- [x] Migration `20260628160000_ai_coach.sql`
- [x] Deterministic trade grader (6 factors + letter grade)
- [x] Mistake cost analyzer + seeded mistake library
- [x] Behavioral scorer + weekly coaching report generator
- [x] API: `/api/coach/reports`, `/api/coach/reports/[id]`, `/api/coach/mistakes`, `/api/coach/grades/[tradeId]`
- [x] `/dashboard/coach` UI + dashboard widget + trade detail grade card
- [x] Unit tests + pgTAP RLS smoke test

## Validation

```bash
npm run test --workspace=@tradeos/core
npm run build --workspace=apps/web
```

## Next Phase

Phase 6 — Hermes durable backend (`006-hermes-backend`)
