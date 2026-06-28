<!--
Sync Impact Report
Version change: (template) → 1.0.0
Modified principles: Initial ratification from Unified Production Paper
Added sections: Core Principles (7), Security & Compliance, AI Safety, Architecture, Governance
Templates: plan-template.md ✅ aligned | spec-template.md ✅ aligned | tasks-template.md pending Phase 1 tasks
Follow-up: Phase 1 implementation tasks in specs/001-platform-foundation/
-->

# AI Trading Operating System & Hermes Protocol Constitution

## Core Principles

### I. Diagnosis-First, Evidence-Based Delivery

All changes MUST follow diagnose → validate → implement → verify. No speculative fixes,
especially for trading behavior, risk controls, or production data paths. Production
evidence (tests, replay, audit, sign-off) is required before declaring readiness.

**Rationale**: Capital, tenant data, and operator trust depend on provable correctness.

### II. Modular Operating System, Not Monolith

Each capability MUST exist as a separate domain service sharing common infrastructure:
auth, authorization, storage, event logging, AI orchestration, audit trails, observability,
risk rules, tenant isolation, and market-data ingestion.

**Rationale**: Track A (Retail Trading OS) and Track B (Hermes Protocol) evolve independently
while sharing foundations.

### III. Deterministic Risk Outranks AI (NON-NEGOTIABLE)

Risk rules, lockouts, cooldowns, and position limits MUST be enforced deterministically.
AI agents MAY explain, classify, summarize, and coach—they MUST NOT execute trades,
bypass risk limits, or override guardrails. Fail closed on invalid auth, missing tenant_id,
invalid AI JSON, or unsafe input.

**Rationale**: AI is decision support; capital protection is non-negotiable.

### IV. Tenant Isolation & RBAC (NON-NEGOTIABLE)

Every tenant-owned table MUST include `tenant_id`, enable Row Level Security, and prove
cross-tenant isolation with real database-backed tests—not migration-text-only checks.
Sensitive operator actions MUST enforce endpoint-level RBAC with audit events.

**Rationale**: Multi-tenant trading and operator data require provable isolation.

### V. Structured Agents, Not Loose Chatbots

Each AI agent MUST have a defined role, allowed tools, structured input/output schemas,
confidence scores, audit logs, deterministic fallbacks, evaluation tests, and prompt/version
tracking. Outputs MUST include limitations and evidence basis.

**Rationale**: Predictable, auditable AI behavior for financial decision support.

### VI. Test-First Production Discipline

Unit, integration, contract, E2E, load, soak, and staging chaos tests are required per
domain. CI MUST include lint, typecheck, migration validation, dependency/SAST/container
scanning, and staging smoke tests before production promotion.

**Rationale**: Production readiness is measured by evidence, not intent.

### VII. Scope Discipline & MVP Focus

Build only the requested phase. MVP priority order:
1. Trade Journal Analyzer
2. Risk Manager
3. Market Open Briefing
4. AI Trading Coach
5. Hermes durable backend, RBAC, provider quality, operator dashboard

**Rationale**: Breadth without focus produces fragile systems.

## Security & Compliance Requirements

- Authentication with MFA where possible
- Encrypted secrets and broker credentials (read-only broker integrations only)
- Audit logs for login, trade edits, risk changes, RBAC changes, threshold changes, exports
- Rate limiting, secure uploads, dependency/SAST/container scanning
- Legal positioning as decision support—not guaranteed investment advice
- Required docs: ToS, Privacy Policy, Risk Disclosure, Financial Disclaimer, AI Limitations

## AI Safety & Financial Guardrails

AI outputs MUST NOT guarantee profits or present backtests as future guarantees.
AI outputs MUST include confidence level, evidence basis, limitations, and risk reminders.
Live trade execution remains DISABLED unless explicitly approved in a future amendment.

## Architecture Standards

**Stack**: TypeScript, Next.js, React, Tailwind, shadcn/ui, Supabase/Postgres, modular monorepo.

**Structure**: `apps/web`, `apps/api`, `apps/workers`, `packages/core`, `packages/ai`,
`packages/ui`, `packages/integrations`, `supabase/migrations`, `supabase/tests`, `docs`,
`infrastructure`.

**Hermes repositories**: agent_state, provider_health, liquidity_observation, risk_threshold,
replay_evidence, operator_action, audit_event, tenant—all Supabase-backed and tenant-scoped.

## Development Workflow

1. Restate scope, files, assumptions, and risks before coding
2. Constitution Check in every implementation plan
3. Pure functions for analytics, risk, grading, probability, backtesting
4. Structured JSON schemas for all AI outputs
5. Summarize changes, test commands, validation checklist, and next safe step after coding

## Governance

This constitution supersedes ad-hoc practices. Amendments require documented rationale,
version bump (semver), and propagation to dependent templates and specs.

All PRs MUST verify compliance with principles III (risk), IV (tenant/RBAC), and VI (testing).

**Version**: 1.0.0 | **Ratified**: 2026-06-28 | **Last Amended**: 2026-06-28
