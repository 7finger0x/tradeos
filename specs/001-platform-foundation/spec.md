# Feature Specification: Unified Platform Foundation (Phase 1)

**Feature Branch**: `001-platform-foundation`

**Created**: 2026-06-28

**Status**: Approved

**Input**: Unified AI Trading Operating System & Hermes Protocol Production Paper

## User Scenarios & Testing

### User Story 1 - Tenant Workspace Bootstrap (Priority: P1)

As a platform administrator, I can create an isolated tenant workspace with auth and
RBAC so that traders and operators access only their organization's data.

**Why this priority**: All downstream workflows depend on tenant isolation and identity.

**Independent Test**: Create two tenants; verify user A cannot read tenant B rows via API
or direct DB queries under RLS.

**Acceptance Scenarios**:

1. **Given** a new user signs up, **When** they complete onboarding, **Then** a tenant and
   profile are created with default `trader` role.
2. **Given** two tenants with data, **When** user from tenant A queries trades, **Then**
   only tenant A rows are returned.
3. **Given** an operator with `risk_admin` role, **When** they access a protected endpoint,
   **Then** access succeeds and an audit event is recorded.

---

### User Story 2 - Audit Trail Foundation (Priority: P1)

As a compliance reviewer, I can view audit events for sensitive actions so that operational
changes are traceable.

**Why this priority**: Hermes and retail OS both require audit evidence for production sign-off.

**Independent Test**: Perform a risk-rule change; verify audit row with actor, tenant, before/after.

**Acceptance Scenarios**:

1. **Given** a user updates a risk rule, **When** the change persists, **Then** an audit_event
   row captures actor_id, action, resource_type, and timestamp.
2. **Given** a failed RBAC attempt, **When** access is denied, **Then** a failed-access audit
   event is logged.

---

### User Story 3 - Base Dashboard Shell (Priority: P2)

As a trader, I can open a dashboard shell showing navigation placeholders for journal, risk,
briefing, and coach so that MVP modules plug in without UI rework.

**Why this priority**: Provides integration surface for Phase 2–5 workflows.

**Independent Test**: Load dashboard; verify auth gate, nav sections, and tenant context display.

**Acceptance Scenarios**:

1. **Given** an authenticated trader, **When** they open `/dashboard`, **Then** they see
   risk status placeholder, recent activity placeholder, and primary nav.
2. **Given** an unauthenticated visitor, **When** they open `/dashboard`, **Then** they are
   redirected to login.

---

### User Story 4 - CI Pipeline Gate (Priority: P2)

As a developer, I can run lint, typecheck, unit tests, and migration validation in CI so
that foundation changes cannot merge broken.

**Why this priority**: Production discipline starts at foundation.

**Independent Test**: Push branch; CI runs and reports pass/fail for configured jobs.

**Acceptance Scenarios**:

1. **Given** a PR with schema migration, **When** CI runs, **Then** migration lint/validate passes.
2. **Given** RLS tests exist, **When** CI runs integration job, **Then** cross-tenant tests fail
   if RLS is disabled.

---

### Edge Cases

- User belongs to multiple tenants → active tenant selection required in session
- Service-role backend access → restricted to trusted server paths only, never exposed to client
- Migration rollback → forward-fix strategy documented when rollback unsafe

## Requirements

### Functional Requirements

- **FR-001**: System MUST support multi-tenant workspaces with `tenants`, `profiles`, and
  `tenant_members` entities.
- **FR-002**: System MUST enforce Row Level Security on all tenant-owned tables.
- **FR-003**: System MUST implement RBAC roles: viewer, trader, analyst, operator, risk_admin,
  compliance_admin, tenant_admin, system_admin.
- **FR-004**: System MUST record audit events for sensitive actions (risk changes, RBAC changes,
  failed access, exports).
- **FR-005**: System MUST provide authenticated dashboard shell with modular navigation slots.
- **FR-006**: System MUST configure Supabase auth integration for web app.
- **FR-007**: System MUST define object storage buckets for screenshots and imports (policy only in Phase 1).
- **FR-008**: CI MUST run lint, typecheck, unit tests, and migration validation.
- **FR-009**: Database tests MUST prove tenant A cannot access tenant B data.
- **FR-010**: Broker integrations MUST remain read-only; live execution DISABLED.

### Key Entities

- **Tenant**: Isolated workspace with plan_type, status, data_retention_policy
- **Profile**: User identity linked to auth.users with timezone, risk_profile, trading_style
- **TenantMember**: User-to-tenant membership with role
- **AuditEvent**: Security and operational traceability record
- **RiskRule**: User-scoped trading constraints (schema only in Phase 1)

## Success Criteria

- **SC-001**: Cross-tenant RLS tests pass with 100% failure rate for unauthorized access
- **SC-002**: Dashboard loads for authenticated users in under 3 seconds (local/staging)
- **SC-003**: CI pipeline completes foundation checks on every PR
- **SC-004**: All 10 Phase 1 deliverables from production paper Section 15 Phase 1 are scaffolded

## Assumptions

- Supabase is the primary persistence and auth provider
- Monorepo uses npm/pnpm workspaces with TypeScript strict mode
- MVP targets single-region deployment initially
- Market data and broker adapters deferred to Phase 4+
