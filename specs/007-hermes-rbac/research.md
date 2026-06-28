# Research: Hermes RBAC & Tenant Isolation (Phase 7)

## Decision: pgTAP helpers in `tests` schema via migration

**Rationale**: Constitution §IV requires real cross-tenant tests with authenticated
`auth.uid()` simulation. A migration-backed `tests` schema keeps helpers versioned with
schema and available in CI (`supabase test db`) without external dbdev/network deps.

**Alternatives considered**:
- `basejump-supabase_test_helpers` via database.dev — rejected (network + pg_tle in CI)
- Application-only integration tests — rejected (does not prove RLS at DB layer)

## Decision: `auth.identities` + `provider_id` on test user creation

**Rationale**: Newer Supabase GoTrue images require identity rows; omitting them breaks
`authenticate_as()` / `auth.uid()` in pgTAP.

**Alternatives considered**:
- Minimal `auth.users` insert only — fails on current Supabase CLI images

## Decision: `recordDeniedAccess()` in `@tradeos/core`

**Rationale**: Shared audit shape for denied operator access; Hermes routes call it on 403.
Risk lockout 403 audit **deferred to Phase 8** — see spec §Out of Scope.

**Alternatives considered**:
- Inline insert in route handler — duplicates audit contract

## Decision: CI `unit-tests` job separate from `supabase` job

**Rationale**: Fast Vitest feedback without Docker; pgTAP remains in `supabase` job per
constitution test discipline.
