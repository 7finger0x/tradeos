-- Market briefing RLS tests
begin;
select plan(5);

select has_table('public', 'market_briefings', 'market_briefings table exists');
select has_table('public', 'watchlists', 'watchlists table exists');
select has_table('public', 'economic_events', 'economic_events table exists');

select row_eq(
  $$ select relrowsecurity from pg_class where relname = 'market_briefings' $$,
  row(true::boolean),
  'RLS enabled on market_briefings'
);

select row_eq(
  $$ select relrowsecurity from pg_class where relname = 'watchlists' $$,
  row(true::boolean),
  'RLS enabled on watchlists'
);

select * from finish();
rollback;
