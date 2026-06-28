# Phase 4 Tasks: Market Open Briefing MVP

**Spec**: [spec.md](./spec.md)

## Completed

- [x] Migration `20260628140000_market_briefing.sql` — events, watchlists, briefings + RLS
- [x] Mock market provider (`@tradeos/integrations`)
- [x] Briefing schemas, watchlist scorer, briefing generator (`@tradeos/core`)
- [x] Unit tests for scorer + generator
- [x] `GET/POST /api/briefing`, `GET /api/briefing/[id]`
- [x] `/dashboard/briefing` UI + dashboard widget
- [x] pgTAP RLS smoke test

## Validation

```bash
npm run test --workspace=@tradeos/core
npm run typecheck
npm run build --workspace=apps/web
npx supabase test db
```

## Next Phase

Phase 5 — AI Trading Coach MVP (`005-ai-coach-mvp`)
