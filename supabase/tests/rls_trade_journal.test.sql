-- Trade journal RLS tests
begin;
select plan(4);

select has_table('public', 'trades', 'trades table exists');
select has_table('public', 'setups', 'setups table exists');
select has_table('public', 'import_batches', 'import_batches table exists');

select row_eq(
  $$ select relrowsecurity from pg_class where relname = 'trades' $$,
  row(true::boolean),
  'RLS enabled on trades'
);

select * from finish();
rollback;
