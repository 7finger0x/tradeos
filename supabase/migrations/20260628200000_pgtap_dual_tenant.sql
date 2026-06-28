-- Phase 8: dual-tenant membership for pgTAP regression tests

create or replace function tests.seed_two_tenant_fixture()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid_a uuid;
  uid_b uuid;
  uid_dual uuid;
  tid_a uuid;
  tid_b uuid;
  trade_a uuid;
  provider_a uuid;
  obs_a uuid;
  report_a uuid;
begin
  uid_a := tests.create_supabase_user('tenant_a_user');
  uid_b := tests.create_supabase_user('tenant_b_user');
  uid_dual := tests.create_supabase_user('dual_tenant_user');

  insert into public.tenants (name) values ('RLS Test Tenant A') returning id into tid_a;
  insert into public.tenants (name) values ('RLS Test Tenant B') returning id into tid_b;

  insert into public.tenant_members (tenant_id, user_id, role)
  values
    (tid_a, uid_a, 'tenant_admin'),
    (tid_b, uid_b, 'trader'),
    (tid_a, uid_dual, 'trader'),
    (tid_b, uid_dual, 'trader');

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
    'user_dual', uid_dual,
    'trade_a', trade_a,
    'obs_a', obs_a,
    'report_a', report_a
  );
end;
$$;
