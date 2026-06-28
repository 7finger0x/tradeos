# Architecture — AI Trading OS & Hermes Protocol

**Version**: 1.0 | **Date**: 2026-06-28

## Unified Platform

Two complementary tracks sharing common infrastructure:

| Track | Focus |
|-------|-------|
| **A — AI Trading OS** | Retail trader performance: journal, coaching, risk, briefing, analytics |
| **B — Hermes Protocol** | Multi-chain liquidity intelligence, provider quality, operator RBAC, production evidence |

## Layer Model

```text
┌─────────────────────────────────────────────────────────────┐
│  UI: Trader Dashboard │ Journal │ Risk │ Coach │ Hermes Ops │
├─────────────────────────────────────────────────────────────┤
│  Services: Journal │ Coaching │ Risk │ Market Intel │ Hermes│
├─────────────────────────────────────────────────────────────┤
│  Agents: Analyst │ Briefing │ Risk Officer │ Coach │ Liquidity│
├─────────────────────────────────────────────────────────────┤
│  Data: Supabase │ Storage │ Vectors │ Cache │ Event Bus │ Audit│
├─────────────────────────────────────────────────────────────┤
│  External: Brokers (read-only) │ Market Data │ Chain RPCs    │
└─────────────────────────────────────────────────────────────┘
```

## Monorepo Layout

| Path | Responsibility |
|------|----------------|
| `apps/web` | Next.js dashboard, auth, trader + operator shells |
| `apps/api` | REST/GraphQL API (Phase 2+) |
| `apps/workers` | Async jobs: imports, AI analysis, provider polling |
| `packages/core` | Domain types, Zod schemas, pure analytics/risk functions |
| `packages/ai` | Agent definitions, structured output validators |
| `packages/ui` | shadcn-based shared components |
| `packages/integrations` | Broker, market-data, chain adapters |
| `supabase/` | Migrations, RLS tests, local config |

## Security Model

1. **Auth**: Supabase Auth (email/OAuth)
2. **Tenant scope**: Every query filtered by `tenant_id` via RLS
3. **RBAC**: Role on `tenant_members`; endpoint checks in API layer
4. **Audit**: Append-only `audit_events` for sensitive mutations
5. **AI**: Structured outputs only; no trade execution; deterministic risk wins

## MVP Sequence

1. Foundation (Phase 1) ← current
2. Trade Journal MVP
3. Risk Manager MVP
4. Market Open Briefing MVP
5. AI Trading Coach MVP
6. Hermes durable backend + RBAC + provider quorum
7. Advanced analytics, backtesting, broker sync, production hardening

## Technology Stack

- **Frontend**: Next.js, TypeScript, Tailwind, shadcn/ui, Recharts
- **Backend**: Node.js API + Python workers (hybrid as needed)
- **Database**: Supabase Postgres with RLS
- **AI**: LLM orchestration, agent router, prompt registry, eval harness
- **Observability**: Structured logs, metrics, agent execution audit

See [product-charter.md](./product-charter.md) for full production paper.
