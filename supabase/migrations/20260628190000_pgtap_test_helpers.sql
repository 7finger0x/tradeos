-- pgTAP test helpers for authenticated RLS testing
-- Used by supabase/tests/rls_cross_tenant.test.sql

create schema if not exists tests;

create or replace function tests.create_supabase_user(
  identifier text,
  email text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  user_id uuid := gen_random_uuid();
  user_email text := coalesce(email, identifier || '@test.local');
begin
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    user_id,
    'authenticated',
    'authenticated',
    user_email,
    crypt('password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('test_identifier', identifier),
    now(),
    now()
  );

  -- Required for GoTrue / auth.uid() in newer Supabase images
  insert into auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values (
    gen_random_uuid(),
    user_id,
    user_id::text,
    jsonb_build_object('sub', user_id::text, 'email', user_email),
    'email',
    now(),
    now(),
    now()
  );

  return user_id;
end;
$$;

create or replace function tests.get_supabase_uid(identifier text)
returns uuid
language sql
security definer
set search_path = public, auth
stable
as $$
  select id
  from auth.users
  where raw_user_meta_data ->> 'test_identifier' = identifier
  limit 1;
$$;

create or replace function tests.authenticate_as(identifier text)
returns void
language plpgsql
as $$
declare
  uid uuid;
begin
  uid := tests.get_supabase_uid(identifier);
  if uid is null then
    raise exception 'Test user % not found', identifier;
  end if;

  perform set_config('request.jwt.claim.sub', uid::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  set local role authenticated;
end;
$$;

create or replace function tests.clear_authentication()
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claim.role', 'anon', true);
  set local role anon;
end;
$$;

-- Seeds two isolated tenants with one trade on tenant A
create or replace function tests.seed_two_tenant_fixture()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid_a uuid;
  uid_b uuid;
  tid_a uuid;
  tid_b uuid;
  trade_a uuid;
  provider_a uuid;
  obs_a uuid;
  report_a uuid;
begin
  uid_a := tests.create_supabase_user('tenant_a_user');
  uid_b := tests.create_supabase_user('tenant_b_user');

  insert into public.tenants (name) values ('RLS Test Tenant A') returning id into tid_a;
  insert into public.tenants (name) values ('RLS Test Tenant B') returning id into tid_b;

  insert into public.tenant_members (tenant_id, user_id, role)
  values
    (tid_a, uid_a, 'tenant_admin'),
    (tid_b, uid_b, 'trader');

  insert into public.trades (
    tenant_id, user_id, symbol, direction, entry_time, entry_price, quantity, trade_fingerprint
  )
  values (tid_a, uid_a, 'AAPL', 'long', now(), 150, 1, 'rls-test-trade-a')
  returning id into trade_a;

  insert into public.hermes_providers (
    tenant_id, provider_key, provider_type, chain_id, display_name, status
  )
  values (tid_a, 'test-provider', 'mock', 'ethereum-mainnet', 'Test Provider', 'active')
  returning id into provider_a;

  insert into public.hermes_liquidity_observations (
    tenant_id, provider_id, chain_id, pool_address, token_pair,
    liquidity_usd, quality_score, quorum_passed
  )
  values (tid_a, provider_a, 'ethereum-mainnet', '0xabc', 'USDC/WETH', 500000, 0.9, true)
  returning id into obs_a;

  insert into public.coaching_reports (
    tenant_id, user_id, report_type, period_start, period_end, summary_text
  )
  values (tid_a, uid_a, 'weekly', current_date - 7, current_date, 'RLS test report')
  returning id into report_a;

  return jsonb_build_object(
    'tenant_a', tid_a,
    'tenant_b', tid_b,
    'user_a', uid_a,
    'user_b', uid_b,
    'trade_a', trade_a,
    'obs_a', obs_a,
    'report_a', report_a
  );
end;
$$;
