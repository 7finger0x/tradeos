# TradeOS / Hermes — AI Trading Operating System

Unified platform for retail trader performance (Track A) and Hermes liquidity intelligence (Track B).

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Start Supabase locally (requires Supabase CLI)
npx supabase start

# Run migrations
npx supabase db reset

# Start web app
npm run dev --workspace=apps/web
```

## Spec-Driven Development

This project uses [GitHub Spec Kit](https://github.com/github/spec-kit). Key commands in Cursor:

- `/speckit-constitution` — project principles
- `/speckit-specify` — feature specifications
- `/speckit-plan` — implementation plans
- `/speckit-tasks` — actionable task breakdown
- `/speckit-implement` — execute tasks

## Repository Structure

```text
apps/web          Next.js dashboard
apps/api          API service (Phase 2+)
apps/workers      Background jobs (Phase 2+)
packages/core     Domain types and pure functions
packages/ai       Agent schemas
packages/ui       Shared UI components
packages/integrations  External adapters
supabase/         Migrations and RLS tests
docs/             Architecture and product docs
specs/            Feature specifications
```

## Current Phase

**Phase 11 — Screenshot + Replay Intelligence** (`011-screenshot-replay`) — kickoff

- Charter: secure screenshot upload, educational AI chart review, trade replay sessions
- Foundation: `trades.screenshot_urls`, `trade-screenshots` bucket (upload/replay not built)

**Previous:** Phase 10 — Strategy + Advanced Analytics (`010-strategy-analytics`) ✅

See [specs/011-screenshot-replay/spec.md](./specs/011-screenshot-replay/spec.md) and [specs/010-strategy-analytics/quickstart.md](./specs/010-strategy-analytics/quickstart.md).

## Governance

Read `.specify/memory/constitution.md` before contributing. Risk controls are deterministic;
AI is decision support only; live execution is disabled.
