-- Hermes backend RLS tests
begin;
select plan(6);

select has_table('public', 'hermes_liquidity_observations', 'liquidity observations table exists');
select has_table('public', 'hermes_providers', 'hermes providers table exists');
select has_table('public', 'hermes_agent_state', 'agent state table exists');

select row_eq(
  $$ select relrowsecurity from pg_class where relname = 'hermes_liquidity_observations' $$,
  row(true::boolean),
  'RLS enabled on hermes_liquidity_observations'
);

select has_function(
  'public',
  'user_is_hermes_operator',
  array['uuid'],
  'hermes operator helper exists'
);

select policies_are(
  'public',
  'hermes_liquidity_observations',
  array['hermes_liquidity_obs_select_tenant', 'hermes_liquidity_obs_insert_operator'],
  'liquidity observations has tenant read + operator write policies'
);

select * from finish();
rollback;
