# Plan: Screenshot + Replay Intelligence (Phase 11)

## Constitution Check (Preliminary)

| Principle | Status |
|-----------|--------|
| III Deterministic risk | ✅ Review/replay only; no execution |
| IV Tenant isolation | ⚠️ Requires RLS on replay tables + storage policies |
| V Structured AI | ⚠️ Vision output must use Zod schema + confidence + limitations |
| VII MVP focus | ✅ Builds on journal trades + existing screenshot URL field |

## Technical Approach (Draft)

1. **Storage** — Supabase Storage upload API with tenant path prefix; wire `screenshot_urls` on trades
2. **Vision agent** — `packages/ai` structured screenshot analyzer; server action or API route
3. **Replay domain** — New migration for `replay_sessions`, `replay_events`, `replay_answers`; pure functions in `packages/core`
4. **UI** — Replay timeline on trade detail or `/dashboard/replay/[sessionId]`; reuse tab/timeline patterns from strategy/Hermes dashboards

## Next Speckit Steps

1. `/speckit-clarify` — confirm MVP scope (upload-only vs full replay first)
2. `/speckit-plan` — finalize architecture + migration design
3. `/speckit-tasks` — story-ordered implementation tasks
4. `/speckit-implement` — first story: storage upload + privacy banner (smallest vertical slice)
