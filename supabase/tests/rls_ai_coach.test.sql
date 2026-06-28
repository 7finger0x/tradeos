-- AI coach RLS tests
begin;
select plan(5);

select has_table('public', 'trade_grades', 'trade_grades table exists');
select has_table('public', 'coaching_reports', 'coaching_reports table exists');
select has_table('public', 'mistake_library', 'mistake_library table exists');

select row_eq(
  $$ select relrowsecurity from pg_class where relname = 'trade_grades' $$,
  row(true::boolean),
  'RLS enabled on trade_grades'
);

select row_eq(
  $$ select relrowsecurity from pg_class where relname = 'coaching_reports' $$,
  row(true::boolean),
  'RLS enabled on coaching_reports'
);

select * from finish();
rollback;
