-- Phase 2: Trade Journal MVP
-- setups, trades, import batches, import rows, mistake tags

create type public.asset_class as enum (
  'equity',
  'option',
  'future',
  'crypto',
  'forex',
  'other'
);

create type public.trade_direction as enum ('long', 'short');

create type public.import_row_status as enum (
  'pending',
  'imported',
  'duplicate',
  'error',
  'skipped'
);

create type public.import_batch_status as enum (
  'processing',
  'completed',
  'failed'
);

-- Playbook / setup definitions
create table public.setups (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index setups_tenant_user_idx on public.setups (tenant_id, user_id);
create unique index setups_tenant_user_name_idx on public.setups (tenant_id, user_id, name);

create trigger setups_updated_at
  before update on public.setups
  for each row execute function public.set_updated_at();

-- Import tracking
create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  filename text not null,
  broker text not null default 'unknown',
  format text not null default 'generic',
  row_count integer not null default 0,
  imported_count integer not null default 0,
  duplicate_count integer not null default 0,
  error_count integer not null default 0,
  status public.import_batch_status not null default 'processing',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index import_batches_tenant_user_idx on public.import_batches (tenant_id, user_id, created_at desc);

create trigger import_batches_updated_at
  before update on public.import_batches
  for each row execute function public.set_updated_at();

create table public.import_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.import_batches (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  row_number integer not null,
  raw_data jsonb not null,
  status public.import_row_status not null default 'pending',
  trade_id uuid,
  error_message text,
  fingerprint text,
  created_at timestamptz not null default now()
);

create index import_rows_batch_idx on public.import_rows (batch_id);
create index import_rows_fingerprint_idx on public.import_rows (tenant_id, fingerprint);

-- Trades (canonical journal record)
create table public.trades (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  setup_id uuid references public.setups (id) on delete set null,
  symbol text not null,
  asset_class public.asset_class not null default 'equity',
  direction public.trade_direction not null,
  entry_time timestamptz not null,
  exit_time timestamptz,
  entry_price numeric(18, 6) not null,
  exit_price numeric(18, 6),
  quantity numeric(18, 6) not null,
  fees numeric(18, 4) not null default 0,
  gross_pnl numeric(18, 4),
  net_pnl numeric(18, 4),
  r_multiple numeric(10, 4),
  stop_loss numeric(18, 6),
  target_price numeric(18, 6),
  risk_amount numeric(18, 4),
  notes text,
  emotion text,
  conviction integer check (conviction >= 1 and conviction <= 10),
  discipline_score integer check (discipline_score >= 1 and discipline_score <= 10),
  mistake_tags text[] not null default '{}',
  screenshot_urls text[] not null default '{}',
  broker text not null default 'manual',
  broker_trade_id text,
  import_batch_id uuid references public.import_batches (id) on delete set null,
  trade_fingerprint text not null,
  trade_date date generated always as ((entry_time at time zone 'UTC')::date) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index trades_tenant_user_idx on public.trades (tenant_id, user_id, entry_time desc);
create index trades_tenant_symbol_idx on public.trades (tenant_id, symbol);
create index trades_tenant_setup_idx on public.trades (tenant_id, setup_id);
create index trades_tenant_date_idx on public.trades (tenant_id, trade_date desc);
create unique index trades_tenant_fingerprint_idx on public.trades (tenant_id, user_id, trade_fingerprint);

create trigger trades_updated_at
  before update on public.trades
  for each row execute function public.set_updated_at();

alter table public.import_rows
  add constraint import_rows_trade_id_fkey
  foreign key (trade_id) references public.trades (id) on delete set null;

-- Journal summaries (daily/weekly AI-style reports — deterministic MVP)
create table public.journal_summaries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  period_type text not null check (period_type in ('daily', 'weekly')),
  period_start date not null,
  period_end date not null,
  metrics jsonb not null default '{}'::jsonb,
  summary_text text not null,
  created_at timestamptz not null default now()
);

create unique index journal_summaries_period_idx
  on public.journal_summaries (tenant_id, user_id, period_type, period_start);

-- RLS
alter table public.setups enable row level security;
alter table public.import_batches enable row level security;
alter table public.import_rows enable row level security;
alter table public.trades enable row level security;
alter table public.journal_summaries enable row level security;

-- Setups: tenant members manage own setups
create policy "setups_select_tenant"
  on public.setups for select
  using (tenant_id in (select public.user_tenant_ids()));

create policy "setups_insert_own"
  on public.setups for insert
  with check (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );

create policy "setups_update_own"
  on public.setups for update
  using (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );

create policy "setups_delete_own"
  on public.setups for delete
  using (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );

-- Import batches
create policy "import_batches_select_tenant"
  on public.import_batches for select
  using (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );

create policy "import_batches_insert_own"
  on public.import_batches for insert
  with check (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );

create policy "import_batches_update_own"
  on public.import_batches for update
  using (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );

-- Import rows (via batch ownership)
create policy "import_rows_select_own"
  on public.import_rows for select
  using (
    tenant_id in (select public.user_tenant_ids())
    and exists (
      select 1 from public.import_batches b
      where b.id = import_rows.batch_id and b.user_id = auth.uid()
    )
  );

create policy "import_rows_insert_own"
  on public.import_rows for insert
  with check (
    tenant_id in (select public.user_tenant_ids())
    and exists (
      select 1 from public.import_batches b
      where b.id = import_rows.batch_id and b.user_id = auth.uid()
    )
  );

create policy "import_rows_update_own"
  on public.import_rows for update
  using (
    tenant_id in (select public.user_tenant_ids())
    and exists (
      select 1 from public.import_batches b
      where b.id = import_rows.batch_id and b.user_id = auth.uid()
    )
  );

-- Trades
create policy "trades_select_tenant"
  on public.trades for select
  using (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );

create policy "trades_insert_own"
  on public.trades for insert
  with check (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );

create policy "trades_update_own"
  on public.trades for update
  using (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );

create policy "trades_delete_own"
  on public.trades for delete
  using (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );

-- Journal summaries
create policy "journal_summaries_select_own"
  on public.journal_summaries for select
  using (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );

create policy "journal_summaries_insert_own"
  on public.journal_summaries for insert
  with check (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );

create policy "journal_summaries_update_own"
  on public.journal_summaries for update
  using (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );
