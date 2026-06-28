# Phase 1 Foundation — Tasks

**Feature**: 001-platform-foundation | **Generated**: 2026-06-28

## Setup

- [x] T001 Ratify constitution in `.specify/memory/constitution.md`
- [x] T002 Create product charter and architecture docs
- [x] T003 Initialize monorepo workspace in `package.json`
- [x] T004 Create Supabase foundation migration
- [x] T005 Add `.env.example` with Supabase URL/anon key placeholders
- [ ] T006 Initialize git repository and first commit

## Foundational

- [x] T010 Scaffold `apps/web`, `apps/api`, `apps/workers` package.json files
- [x] T011 Scaffold `packages/core`, `packages/ui`, `packages/ai`, `packages/integrations`
- [x] T012 Implement Supabase client in `packages/core/src/supabase/`
- [x] T013 Add Zod schemas for Tenant, Profile, AuditEvent in `packages/core`

## Web Shell

- [x] T020 Bootstrap Next.js 15 in `apps/web` (shell; shadcn/ui in next pass)
- [x] T021 Auth middleware and `/login`, `/auth/callback` routes
- [x] T022 Dashboard layout with nav: Briefing, Journal, Risk, Coach, Settings
- [x] T023 Tenant context provider (active tenant from membership)
- [x] T024 Placeholder widgets: risk status, recent activity, coach notes

## Security & RBAC

- [x] T030 RLS policies on foundation tables
- [x] T031 Expand pgTAP tests with RLS policy and helper validation
- [x] T032 Server-side role check helper in `packages/core/src/auth/rbac.ts`
- [x] T033 Audit helper: `recordAuditEvent()` in `packages/core`

## CI/CD

- [x] T040 GitHub Actions: lint, typecheck, unit test
- [x] T041 GitHub Actions: Supabase migration validate + db test
- [x] T042 Dependabot configured for npm weekly updates

## Exit Criteria (Phase 1)

- [ ] Cross-tenant RLS tests pass
- [ ] Authenticated dashboard shell loads
- [ ] CI green on main branch
- [ ] All foundation tables migrated locally

## Next Phase Dependency

Phase 2 (Trade Journal MVP) requires T012–T013, T020–T024, T031–T033 complete.
