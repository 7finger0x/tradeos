# Unified AI Trading OS & Hermes Protocol — Data Model (Phase 1)

**Feature**: 001-platform-foundation | **Date**: 2026-06-28

## Enums

```sql
-- app_role: RBAC roles for tenant_members and authorization checks
-- tenant_status: active | suspended | archived
-- audit_action: login | logout | create | update | delete | access_denied | export | ...
```

## Core Tables (Phase 1)

### tenants

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text | Workspace display name |
| plan_type | text | free, pro, enterprise |
| status | text | active, suspended, archived |
| data_retention_policy | jsonb | Retention rules |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### profiles

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | FK → auth.users |
| email | text | |
| display_name | text | |
| timezone | text | IANA timezone |
| risk_profile | jsonb | Default risk preferences |
| trading_style | text | discretionary, swing, day, etc. |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### tenant_members

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id | uuid FK | → tenants |
| user_id | uuid FK | → profiles |
| role | app_role | viewer … system_admin |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Unique: (tenant_id, user_id)

### audit_events

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id | uuid FK | nullable for system events |
| actor_id | uuid FK | → profiles |
| action | text | |
| resource_type | text | |
| resource_id | uuid | nullable |
| before_state | jsonb | |
| after_state | jsonb | |
| ip_address | inet | |
| user_agent | text | |
| created_at | timestamptz | |

### risk_rules (schema only — logic in Phase 3)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id | uuid FK | |
| user_id | uuid FK | |
| max_daily_loss | numeric | |
| max_weekly_loss | numeric | |
| max_position_risk | numeric | |
| max_open_positions | int | |
| max_trades_per_day | int | |
| cooldown_after_loss_minutes | int | |
| block_trading_conditions | jsonb | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

## Future Tables (Phase 2+)

trades, journal_entries, setups, market_briefings, strategy_backtests,
hermes_liquidity_observations, provider_health_records — see production paper §5.

## RLS Policy Pattern

```text
tenant_members.user_id = auth.uid()
AND tenant_members.tenant_id = <table>.tenant_id
```

Service role bypasses RLS only in trusted backend workers—not client.

## Indexes

- tenant_members: (tenant_id), (user_id), unique (tenant_id, user_id)
- audit_events: (tenant_id, created_at DESC), (actor_id, created_at DESC)
- risk_rules: (tenant_id, user_id)
