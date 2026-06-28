-- Phase 6: Hermes durable backend repositories

create type public.hermes_agent_status as enum (
  'idle',
  'running',
  'error',
  'paused'
);

create type public.hermes_provider_type as enum (
  'rpc',
  'indexer',
  'oracle',
  'mock'
);

create type public.hermes_provider_status as enum (
  'active',
  'degraded',
  'offline'
);

create type public.hermes_operator_action_status as enum (
  'pending',
  'completed',
  'failed'
);

-- Registered liquidity data providers per tenant
create table public.hermes_providers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  provider_key text not null,
  provider_type public.hermes_provider_type not null default 'mock',
  chain_id text not null,
  display_name text not null,
  endpoint_url text,
  status public.hermes_provider_status not null default 'active',
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, provider_key)
);

create index hermes_providers_tenant_idx on public.hermes_providers (tenant_id, chain_id);

create trigger hermes_providers_updated_at
  before update on public.hermes_providers
  for each row execute function public.set_updated_at();

-- Agent runtime state
create table public.hermes_agent_state (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  agent_name text not null,
  status public.hermes_agent_status not null default 'idle',
  last_run_at timestamptz,
  last_error text,
  config jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, agent_name)
);

create trigger hermes_agent_state_updated_at
  before update on public.hermes_agent_state
  for each row execute function public.set_updated_at();

-- Provider health time series
create table public.hermes_provider_health (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  provider_id uuid not null references public.hermes_providers (id) on delete cascade,
  recorded_at timestamptz not null default now(),
  latency_ms integer not null default 0,
  success_rate numeric(5, 4) not null default 1,
  error_rate numeric(5, 4) not null default 0,
  staleness_seconds integer not null default 0,
  quorum_eligible boolean not null default true,
  metrics jsonb not null default '{}'::jsonb
);

create index hermes_provider_health_provider_idx
  on public.hermes_provider_health (provider_id, recorded_at desc);

-- Liquidity observations
create table public.hermes_liquidity_observations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  provider_id uuid not null references public.hermes_providers (id) on delete cascade,
  chain_id text not null,
  pool_address text not null,
  token_pair text not null,
  liquidity_usd numeric(20, 2) not null,
  volume_24h_usd numeric(20, 2),
  spread_bps numeric(10, 4),
  depth_score numeric(8, 4),
  quality_score numeric(8, 4) not null default 0,
  quorum_passed boolean not null default false,
  observed_at timestamptz not null default now(),
  raw_payload jsonb not null default '{}'::jsonb
);

create index hermes_liquidity_obs_tenant_time_idx
  on public.hermes_liquidity_observations (tenant_id, observed_at desc);

create index hermes_liquidity_obs_pool_idx
  on public.hermes_liquidity_observations (tenant_id, chain_id, pool_address, observed_at desc);

-- Operator-configured liquidity risk thresholds
create table public.hermes_risk_thresholds (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  threshold_key text not null,
  label text not null,
  value numeric(20, 6) not null,
  unit text not null default 'usd',
  severity text not null default 'medium',
  enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, threshold_key)
);

create trigger hermes_risk_thresholds_updated_at
  before update on public.hermes_risk_thresholds
  for each row execute function public.set_updated_at();

-- Replay / validation evidence
create table public.hermes_replay_evidence (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  observation_id uuid references public.hermes_liquidity_observations (id) on delete set null,
  replay_id text not null,
  scenario_name text not null,
  expected_outcome text not null,
  actual_outcome text not null,
  passed boolean not null,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index hermes_replay_evidence_tenant_idx
  on public.hermes_replay_evidence (tenant_id, created_at desc);

-- Operator action log (Hermes-specific; complements audit_events)
create table public.hermes_operator_actions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  operator_id uuid not null references public.profiles (id) on delete cascade,
  action_type text not null,
  target_type text,
  target_id uuid,
  payload jsonb not null default '{}'::jsonb,
  status public.hermes_operator_action_status not null default 'completed',
  created_at timestamptz not null default now()
);

create index hermes_operator_actions_tenant_idx
  on public.hermes_operator_actions (tenant_id, created_at desc);

-- RLS
alter table public.hermes_providers enable row level security;
alter table public.hermes_agent_state enable row level security;
alter table public.hermes_provider_health enable row level security;
alter table public.hermes_liquidity_observations enable row level security;
alter table public.hermes_risk_thresholds enable row level security;
alter table public.hermes_replay_evidence enable row level security;
alter table public.hermes_operator_actions enable row level security;

-- Helper: operator roles for Hermes writes
create or replace function public.user_is_hermes_operator(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tenant_members tm
    where tm.user_id = auth.uid()
      and tm.tenant_id = p_tenant_id
      and tm.role in ('operator', 'risk_admin', 'compliance_admin', 'tenant_admin', 'system_admin')
  );
$$;

-- Read: any tenant member
create policy "hermes_providers_select_tenant"
  on public.hermes_providers for select
  using (tenant_id in (select public.user_tenant_ids()));

create policy "hermes_agent_state_select_tenant"
  on public.hermes_agent_state for select
  using (tenant_id in (select public.user_tenant_ids()));

create policy "hermes_provider_health_select_tenant"
  on public.hermes_provider_health for select
  using (tenant_id in (select public.user_tenant_ids()));

create policy "hermes_liquidity_obs_select_tenant"
  on public.hermes_liquidity_observations for select
  using (tenant_id in (select public.user_tenant_ids()));

create policy "hermes_thresholds_select_tenant"
  on public.hermes_risk_thresholds for select
  using (tenant_id in (select public.user_tenant_ids()));

create policy "hermes_replay_select_tenant"
  on public.hermes_replay_evidence for select
  using (tenant_id in (select public.user_tenant_ids()));

create policy "hermes_operator_actions_select_tenant"
  on public.hermes_operator_actions for select
  using (tenant_id in (select public.user_tenant_ids()));

-- Write: operators only
create policy "hermes_providers_insert_operator"
  on public.hermes_providers for insert
  with check (public.user_is_hermes_operator(tenant_id));

create policy "hermes_providers_update_operator"
  on public.hermes_providers for update
  using (public.user_is_hermes_operator(tenant_id));

create policy "hermes_agent_state_insert_operator"
  on public.hermes_agent_state for insert
  with check (public.user_is_hermes_operator(tenant_id));

create policy "hermes_agent_state_update_operator"
  on public.hermes_agent_state for update
  using (public.user_is_hermes_operator(tenant_id));

create policy "hermes_provider_health_insert_operator"
  on public.hermes_provider_health for insert
  with check (public.user_is_hermes_operator(tenant_id));

create policy "hermes_liquidity_obs_insert_operator"
  on public.hermes_liquidity_observations for insert
  with check (public.user_is_hermes_operator(tenant_id));

create policy "hermes_thresholds_insert_operator"
  on public.hermes_risk_thresholds for insert
  with check (public.user_is_hermes_operator(tenant_id));

create policy "hermes_thresholds_update_operator"
  on public.hermes_risk_thresholds for update
  using (public.user_is_hermes_operator(tenant_id));

create policy "hermes_replay_insert_operator"
  on public.hermes_replay_evidence for insert
  with check (public.user_is_hermes_operator(tenant_id));

create policy "hermes_operator_actions_insert_operator"
  on public.hermes_operator_actions for insert
  with check (
    public.user_is_hermes_operator(tenant_id)
    and operator_id = auth.uid()
  );
