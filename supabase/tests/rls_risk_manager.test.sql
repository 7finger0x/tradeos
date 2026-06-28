-- Risk manager RLS tests
begin;
select plan(3);

select has_table('public', 'risk_events', 'risk_events table exists');
select has_table('public', 'risk_cooldowns', 'risk_cooldowns table exists');

select row_eq(
  $$ select relrowsecurity from pg_class where relname = 'risk_events' $$,
  row(true::boolean),
  'RLS enabled on risk_events'
);

select * from finish();
rollback;
