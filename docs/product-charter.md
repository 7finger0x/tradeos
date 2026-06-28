# Product Charter

**Unified AI Trading Operating System & Hermes Protocol Production Paper**

> A professional AI trading operations platform combining trader performance analytics,
> disciplined risk management, AI coaching, market intelligence, and liquidity
> infrastructure into one production-grade command center.

## Document Index

This charter consolidates the full project direction. Detailed implementation specs live in:

| Artifact | Location |
|----------|----------|
| Constitution (governance) | `.specify/memory/constitution.md` |
| Phase 1 spec | `specs/001-platform-foundation/spec.md` |
| Phase 1 plan | `specs/001-platform-foundation/plan.md` |
| Data model | `specs/001-platform-foundation/data-model.md` |
| Architecture | `docs/architecture.md` |

## Two Product Tracks

### Track A — AI Trading Operating System

Professional AI trading desk for active retail traders: journaling, coaching, market
intelligence, execution discipline, risk management, setup analytics, emotional tracking,
strategy improvement, and performance optimization.

**MVP workflows (priority order)**:
1. Trade Journal Analyzer
2. Risk Manager
3. Market Open Briefing
4. AI Trading Coach

**Full workflow catalog (16)**: Journal Analyzer, Market Briefing, Risk Manager, AI Coach,
Backtesting, Regime Detection, Screenshot Recognition, Trade Replay, Probability Engine,
Playbook Builder, Trade Grading, Emotional Tracking, Risk Scaling, Smart Watchlist,
Broker Integration (read-only), Strategy Discovery.

### Track B — Hermes Protocol

Agentic multi-chain liquidity intelligence and operations: market-data ingestion,
provider quorum, Supabase-backed repositories, operator workflows, RBAC, testing,
deployment evidence, production readiness.

**Hermes MVP priorities**:
1. Durable Supabase repositories
2. Endpoint-level RBAC
3. Real tenant-isolation tests
4. Provider adapters + quality/quorum logic
5. Operator dashboard
6. Audit trail + compliance evidence

## Core Product Promise

Give active traders and market operators a disciplined AI command center that improves
decision quality, protects capital, detects behavioral drift, analyzes market conditions,
and continuously improves strategies through data-driven feedback.

## Implementation Phases (14)

| Phase | Focus |
|-------|-------|
| 1 | Foundation — schema, auth, tenant, RBAC, dashboard shell, CI |
| 2 | Trade Journal MVP |
| 3 | Risk Manager MVP |
| 4 | Market Open Briefing MVP |
| 5 | AI Trading Coach |
| 6 | Hermes durable backend |
| 7 | Hermes RBAC + tenant isolation |
| 8 | Provider adapters + quorum |
| 9 | Operator dashboard |
| 10 | Strategy + advanced analytics |
| 11 | Screenshot + replay intelligence |
| 12 | Broker integration (read-only) |
| 13 | Production hardening |
| 14 | Legal, compliance, training, sign-off |

## Non-Negotiables

- Deterministic risk controls outrank AI suggestions
- Tenant isolation with real RLS tests
- AI as decision support with disclaimers and confidence scores
- Live trade execution DISABLED; broker integrations read-only
- Production evidence before declaring readiness

## Agent Workstreams (Parallel)

1. Product Architecture
2. Backend Infrastructure
3. AI/ML
4. Risk and Analytics
5. Market Data
6. Frontend/UI
7. Security/RBAC
8. Testing/QA
9. DevOps/Production
10. Compliance/Operations

## Success Metrics

**Trader**: improved R-multiple, reduced rule violations, reduced revenge trades, improved
consistency and journaling completion.

**Product**: DAU, trades imported, briefing open rate, coach usage, risk warning acceptance.

**Hermes**: provider uptime, quorum pass rate, alert precision, incident resolution time.

**Production**: deployment frequency, change failure rate, MTTR, test coverage, E2E pass rate.

---

*Full production paper sections 1–22 provided at project kickoff (2026-06-28). This index
anchors the repo; expand sections in phase-specific specs as implementation proceeds.*
