-- Phase 5: AI Trading Coach MVP

create type public.coach_report_type as enum ('weekly', 'session', 'trade_review');
create type public.coach_action_category as enum ('stop', 'improve', 'repeat');
create type public.coach_action_status as enum ('open', 'done', 'dismissed');
create type public.coach_action_priority as enum ('low', 'medium', 'high');
create type public.behavioral_period as enum ('daily', 'weekly');

create table public.mistake_library (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text not null,
  category text not null default 'discipline',
  typical_cost_hint text,
  created_at timestamptz not null default now()
);

create table public.trade_grades (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  trade_id uuid not null references public.trades (id) on delete cascade,
  overall_grade text not null,
  setup_quality smallint not null check (setup_quality between 1 and 10),
  execution_quality smallint not null check (execution_quality between 1 and 10),
  risk_management smallint not null check (risk_management between 1 and 10),
  discipline smallint not null check (discipline between 1 and 10),
  emotional_control smallint not null check (emotional_control between 1 and 10),
  data_completeness smallint not null check (data_completeness between 1 and 10),
  feedback_text text not null,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trade_id)
);

create index trade_grades_tenant_user_idx on public.trade_grades (tenant_id, user_id, created_at desc);

create trigger trade_grades_updated_at
  before update on public.trade_grades
  for each row execute function public.set_updated_at();

create table public.coaching_reports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  report_type public.coach_report_type not null default 'weekly',
  period_start date not null,
  period_end date not null,
  strengths text[] not null default '{}',
  weaknesses text[] not null default '{}',
  highest_cost_mistake text,
  repeated_patterns jsonb not null default '[]'::jsonb,
  emotional_triggers text[] not null default '{}',
  stop_actions text[] not null default '{}',
  improve_actions text[] not null default '{}',
  repeat_actions text[] not null default '{}',
  next_week_focus text,
  confidence_score numeric(4, 3) not null default 0.75,
  evidence jsonb not null default '{}'::jsonb,
  summary_text text not null,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id, report_type, period_start)
);

create index coaching_reports_user_period_idx
  on public.coaching_reports (tenant_id, user_id, period_start desc);

create table public.coaching_action_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  report_id uuid not null references public.coaching_reports (id) on delete cascade,
  category public.coach_action_category not null,
  title text not null,
  description text,
  status public.coach_action_status not null default 'open',
  priority public.coach_action_priority not null default 'medium',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index coaching_action_items_report_idx on public.coaching_action_items (report_id, status);

create table public.behavioral_scores (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  score_date date not null,
  period_type public.behavioral_period not null default 'weekly',
  discipline_avg numeric(5, 2),
  emotion_stability numeric(5, 2),
  revenge_trade_risk numeric(5, 2),
  journaling_completeness numeric(5, 2),
  overall_behavioral_score numeric(5, 2) not null,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id, score_date, period_type)
);

-- RLS
alter table public.mistake_library enable row level security;
alter table public.trade_grades enable row level security;
alter table public.coaching_reports enable row level security;
alter table public.coaching_action_items enable row level security;
alter table public.behavioral_scores enable row level security;

create policy "mistake_library_read_authenticated"
  on public.mistake_library for select
  to authenticated
  using (true);

create policy "trade_grades_select_own"
  on public.trade_grades for select
  using (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );

create policy "trade_grades_insert_own"
  on public.trade_grades for insert
  with check (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );

create policy "trade_grades_update_own"
  on public.trade_grades for update
  using (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );

create policy "coaching_reports_select_own"
  on public.coaching_reports for select
  using (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );

create policy "coaching_reports_insert_own"
  on public.coaching_reports for insert
  with check (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );

create policy "coaching_reports_update_own"
  on public.coaching_reports for update
  using (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );

create policy "coaching_action_items_select_own"
  on public.coaching_action_items for select
  using (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );

create policy "coaching_action_items_insert_own"
  on public.coaching_action_items for insert
  with check (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );

create policy "coaching_action_items_update_own"
  on public.coaching_action_items for update
  using (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );

create policy "behavioral_scores_select_own"
  on public.behavioral_scores for select
  using (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );

create policy "behavioral_scores_insert_own"
  on public.behavioral_scores for insert
  with check (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );

create policy "behavioral_scores_update_own"
  on public.behavioral_scores for update
  using (
    tenant_id in (select public.user_tenant_ids())
    and user_id = auth.uid()
  );

-- Seed mistake library (reference data)
insert into public.mistake_library (code, title, description, category, typical_cost_hint)
values
  ('revenge_trade', 'Revenge trade', 'Entering to recover losses without a valid setup', 'emotion', 'High — often compounds drawdown'),
  ('oversize', 'Oversized position', 'Risk per trade exceeded planned size', 'risk', 'High — amplifies losses'),
  ('no_stop', 'No stop defined', 'Trade entered without a planned stop loss', 'risk', 'High — unbounded downside'),
  ('chased_entry', 'Chased entry', 'Entered after extended move without pullback', 'execution', 'Medium — poor R/R'),
  ('held_loser', 'Held loser too long', 'Failed to cut when invalidation hit', 'discipline', 'Medium — bleeds expectancy'),
  ('early_exit', 'Early exit', 'Took profit before planned target without reason', 'execution', 'Low — caps winners'),
  ('fomo', 'FOMO entry', 'Fear of missing out drove entry', 'emotion', 'Medium — low-quality setups'),
  ('outside_playbook', 'Outside playbook', 'Trade did not match any defined setup', 'discipline', 'High — breaks process');
