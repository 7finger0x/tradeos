# Research: Operator Dashboard (Phase 9)

## Decision: Tabbed single page vs nested routes

**Rationale**: `/dashboard/hermes` with client-side tabs reuses Phase 6 status panel as Overview tab; avoids layout duplication.

**Alternatives**: `/dashboard/hermes/ops` sub-route — deferred; tabs sufficient for MVP.

## Decision: Compliance feed filters audit_events in API

**Rationale**: `audit_events` is tenant-scoped; filter `hermes.%` actions and `access.denied` + `hermes_operator` server-side to keep UI thin.

## Decision: Reuse existing threshold PUT with inline editor

**Rationale**: Phase 6 already writes `hermes_operator_actions` + audit on PUT; UI only needs form + refresh.

## Decision: No WebSocket live updates

**Rationale**: Manual refresh + post-ingest reload adequate for MVP; matches other dashboard panels.
