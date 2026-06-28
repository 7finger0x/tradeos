-- Phase 3: Risk Manager MVP — risk_events + rule extensions

create type public.risk_state as enum (
  'normal',
  'caution',
  'reduce_size',
  'lockout'
);

alter table public.risk_rules
  add column if not exists max_consecutive_losses integer,
  add column if not exists is_active boolean not null default true;

-- Only one active rule set per user per tenant
create unique index if not exists risk_rules_active_user_idx
  on public.risk_rules (tenant_id, user_id)
  where is_active = true;

create table public.risk_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  risk_state public.risk_state not null,
  previous_state public.risk_state,
  triggered_rules text[] not null default '{}',
  message text not null,
  daily_pnl numeric(18, 4),
  weekly_pnl numeric(18, 4),
  trades_today integer,
  consecutive_losses integer,
  size_multiplier numeric(4, 2) not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index risk_events_tenant_user_created_idx
  on public.risk_events (tenant_id, user_id, created_at desc);

-- Cooldown tracking
create table public.risk_cooldowns (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index risk_cooldowns_active_idx
  on public.risk_cooldowns (tenant_id, user_id, ends_at desc)
  where active = true;

alter table public.risk_events enable row level security;
alter table public.risk_cooldowns enable row level security;

create policy "risk_events_select_own"
  on public.risk_events for select
  using (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );

create policy "risk_events_insert_own"
  on public.risk_events for insert
  with check (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );

create policy "risk_cooldowns_select_own"
  on public.risk_cooldowns for select
  using (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );

create policy "risk_cooldowns_insert_own"
  on public.risk_cooldowns for insert
  with check (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );

create policy "risk_cooldowns_update_own"
  on public.risk_cooldowns for update
  using (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );
