-- Trade screenshot storage policy tests
begin;
select plan(4);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'trade_screenshots_insert_own'
  ),
  'trade_screenshots_insert_own policy exists'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'trade_screenshots_select_own'
  ),
  'trade_screenshots_select_own policy exists'
);

select has_function(
  'public',
  'trade_screenshot_tenant_id',
  array['text'],
  'trade_screenshot_tenant_id helper exists'
);

select is(
  public.trade_screenshot_tenant_id('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/cccccccc-cccc-cccc-cccc-cccccccccccc/file.png'::text)::text,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'tenant id parsed from storage path'
);

select * from finish();
rollback;
