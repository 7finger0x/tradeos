-- Phase 4: Market Open Briefing MVP

create type public.market_regime as enum (
  'trend_up',
  'trend_down',
  'range_bound',
  'high_volatility',
  'low_volatility',
  'risk_on',
  'risk_off'
);

create table public.economic_events (
  id uuid primary key default gen_random_uuid(),
  event_date date not null,
  event_time timestamptz,
  country text not null default 'US',
  title text not null,
  impact text not null default 'medium',
  actual text,
  forecast text,
  previous text,
  source text not null default 'mock',
  created_at timestamptz not null default now()
);

create index economic_events_date_idx on public.economic_events (event_date);

create table public.earnings_events (
  id uuid primary key default gen_random_uuid(),
  event_date date not null,
  symbol text not null,
  company_name text,
  timing text,
  eps_estimate numeric(10, 4),
  source text not null default 'mock',
  created_at timestamptz not null default now()
);

create index earnings_events_date_symbol_idx on public.earnings_events (event_date, symbol);

create table public.watchlists (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null default 'Today',
  briefing_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id, briefing_date, name)
);

create trigger watchlists_updated_at
  before update on public.watchlists
  for each row execute function public.set_updated_at();

create table public.watchlist_symbols (
  id uuid primary key default gen_random_uuid(),
  watchlist_id uuid not null references public.watchlists (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  symbol text not null,
  rank integer not null,
  score numeric(8, 4) not null,
  reason text not null,
  setup_fit text,
  caution_notes text,
  relative_volume numeric(8, 4),
  momentum_score numeric(8, 4),
  catalyst_score numeric(8, 4),
  user_edge_score numeric(8, 4),
  created_at timestamptz not null default now()
);

create index watchlist_symbols_watchlist_idx on public.watchlist_symbols (watchlist_id, rank);

create table public.market_briefings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  briefing_date date not null,
  market_regime public.market_regime not null,
  index_context jsonb not null default '{}'::jsonb,
  volatility_context jsonb not null default '{}'::jsonb,
  economic_events jsonb not null default '[]'::jsonb,
  earnings_events jsonb not null default '[]'::jsonb,
  watchlist_id uuid references public.watchlists (id) on delete set null,
  risk_overlay jsonb not null default '{}'::jsonb,
  ai_summary text not null,
  sections jsonb not null default '{}'::jsonb,
  process_goal text,
  avoid_conditions text[] not null default '{}',
  data_source text not null default 'mock',
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id, briefing_date)
);

create index market_briefings_user_date_idx
  on public.market_briefings (tenant_id, user_id, briefing_date desc);

-- RLS: events are readable by authenticated users (reference data)
alter table public.economic_events enable row level security;
alter table public.earnings_events enable row level security;
alter table public.watchlists enable row level security;
alter table public.watchlist_symbols enable row level security;
alter table public.market_briefings enable row level security;

create policy "economic_events_read_authenticated"
  on public.economic_events for select
  to authenticated
  using (true);

create policy "earnings_events_read_authenticated"
  on public.earnings_events for select
  to authenticated
  using (true);

create policy "watchlists_select_own"
  on public.watchlists for select
  using (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );

create policy "watchlists_insert_own"
  on public.watchlists for insert
  with check (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );

create policy "watchlists_update_own"
  on public.watchlists for update
  using (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );

create policy "watchlist_symbols_select_own"
  on public.watchlist_symbols for select
  using (
    tenant_id in (select public.user_tenant_ids())
    and exists (
      select 1 from public.watchlists w
      where w.id = watchlist_symbols.watchlist_id and w.user_id = auth.uid()
    )
  );

create policy "watchlist_symbols_insert_own"
  on public.watchlist_symbols for insert
  with check (
    tenant_id in (select public.user_tenant_ids())
    and exists (
      select 1 from public.watchlists w
      where w.id = watchlist_symbols.watchlist_id and w.user_id = auth.uid()
    )
  );

create policy "market_briefings_select_own"
  on public.market_briefings for select
  using (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );

create policy "market_briefings_insert_own"
  on public.market_briefings for insert
  with check (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );

create policy "market_briefings_update_own"
  on public.market_briefings for update
  using (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );

-- Seed mock economic + earnings for demo (today + tomorrow UTC)
insert into public.economic_events (event_date, event_time, title, impact, forecast, previous)
values
  (current_date, (current_date + time '13:30') at time zone 'UTC', 'Initial Jobless Claims', 'high', '220K', '218K'),
  (current_date, (current_date + time '15:00') at time zone 'UTC', 'Existing Home Sales', 'medium', '4.10M', '4.08M'),
  (current_date + 1, (current_date + 1 + time '14:00') at time zone 'UTC', 'Consumer Sentiment Prelim', 'medium', '68.5', '67.8');

insert into public.earnings_events (event_date, symbol, company_name, timing, eps_estimate)
values
  (current_date, 'NVDA', 'NVIDIA Corp', 'AMC', 0.89),
  (current_date, 'CRM', 'Salesforce', 'AMC', 2.44),
  (current_date, 'COST', 'Costco', 'BMO', 4.12),
  (current_date + 1, 'AAPL', 'Apple Inc', 'AMC', 1.62);
