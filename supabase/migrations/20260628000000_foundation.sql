-- Phase 1 Foundation: tenants, profiles, RBAC, audit, risk_rules scaffold
-- AI Trading OS & Hermes Protocol

-- Extensions
create extension if not exists "pgcrypto";

-- Enums
create type public.app_role as enum (
  'viewer',
  'trader',
  'analyst',
  'operator',
  'risk_admin',
  'compliance_admin',
  'tenant_admin',
  'system_admin'
);

create type public.tenant_status as enum (
  'active',
  'suspended',
  'archived'
);

-- Updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Tenants
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan_type text not null default 'free',
  status public.tenant_status not null default 'active',
  data_retention_policy jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tenants_updated_at
  before update on public.tenants
  for each row execute function public.set_updated_at();

-- Profiles (linked to auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  timezone text not null default 'UTC',
  risk_profile jsonb not null default '{}'::jsonb,
  trading_style text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Tenant membership + RBAC
create table public.tenant_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null default 'trader',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create index tenant_members_tenant_id_idx on public.tenant_members (tenant_id);
create index tenant_members_user_id_idx on public.tenant_members (user_id);

create trigger tenant_members_updated_at
  before update on public.tenant_members
  for each row execute function public.set_updated_at();

-- Audit events
create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants (id) on delete set null,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  before_state jsonb,
  after_state jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index audit_events_tenant_created_idx on public.audit_events (tenant_id, created_at desc);
create index audit_events_actor_created_idx on public.audit_events (actor_id, created_at desc);

-- Risk rules (schema only — enforcement in Phase 3)
create table public.risk_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  max_daily_loss numeric(18, 4),
  max_weekly_loss numeric(18, 4),
  max_position_risk numeric(18, 4),
  max_open_positions integer,
  max_trades_per_day integer,
  cooldown_after_loss_minutes integer,
  block_trading_conditions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index risk_rules_tenant_user_idx on public.risk_rules (tenant_id, user_id);

create trigger risk_rules_updated_at
  before update on public.risk_rules
  for each row execute function public.set_updated_at();

-- Helper: current user's tenant IDs
create or replace function public.user_tenant_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.tenant_members where user_id = auth.uid();
$$;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    coalesce(new.email, new.raw_user_meta_data ->> 'email', ''),
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.tenant_members enable row level security;
alter table public.audit_events enable row level security;
alter table public.risk_rules enable row level security;

-- Profiles: users read/update own profile
create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid());

-- Tenants: members can read their tenants
create policy "tenants_select_member"
  on public.tenants for select
  using (id in (select public.user_tenant_ids()));

-- Tenant members: users see memberships for their tenants
create policy "tenant_members_select_same_tenant"
  on public.tenant_members for select
  using (tenant_id in (select public.user_tenant_ids()));

create policy "tenant_members_insert_admin"
  on public.tenant_members for insert
  with check (
    tenant_id in (
      select tm.tenant_id from public.tenant_members tm
      where tm.user_id = auth.uid()
        and tm.role in ('tenant_admin', 'system_admin')
    )
  );

-- Audit events: tenant members can read their tenant audit log
create policy "audit_events_select_tenant"
  on public.audit_events for select
  using (
    tenant_id is null
    or tenant_id in (select public.user_tenant_ids())
  );

create policy "audit_events_insert_authenticated"
  on public.audit_events for insert
  with check (actor_id = auth.uid());

-- Risk rules: users manage own rules within tenant
create policy "risk_rules_select_tenant"
  on public.risk_rules for select
  using (
    tenant_id in (select public.user_tenant_ids())
    and (user_id = auth.uid() or exists (
      select 1 from public.tenant_members tm
      where tm.user_id = auth.uid()
        and tm.tenant_id = risk_rules.tenant_id
        and tm.role in ('risk_admin', 'tenant_admin', 'system_admin')
    ))
  );

create policy "risk_rules_insert_own"
  on public.risk_rules for insert
  with check (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );

create policy "risk_rules_update_own_or_admin"
  on public.risk_rules for update
  using (
    tenant_id in (select public.user_tenant_ids())
    and (
      user_id = auth.uid()
      or exists (
        select 1 from public.tenant_members tm
        where tm.user_id = auth.uid()
          and tm.tenant_id = risk_rules.tenant_id
          and tm.role in ('risk_admin', 'tenant_admin', 'system_admin')
      )
    )
  );

-- Storage buckets (screenshots, imports) — policies in app layer Phase 2
insert into storage.buckets (id, name, public)
values
  ('trade-screenshots', 'trade-screenshots', false),
  ('trade-imports', 'trade-imports', false)
on conflict (id) do nothing;
