-- Cross-tenant RLS isolation tests (constitution §IV)
begin;
select plan(11);

select has_schema('tests', 'tests schema exists');
select has_function('tests', 'authenticate_as', array['text'], 'authenticate_as helper exists');

create temp table _rls_fixture as
select tests.seed_two_tenant_fixture() as data;

-- User A sees own tenant trade
select tests.authenticate_as('tenant_a_user');
select isnt_empty(
  $$ select id from public.trades where symbol = 'AAPL' $$,
  'Tenant A user can read own trades'
);

-- User B cannot see Tenant A trade
select tests.authenticate_as('tenant_b_user');
select is_empty(
  $$
    select t.id
    from public.trades t
    where t.id = (select (data->>'trade_a')::uuid from _rls_fixture)
  $$,
  'Tenant B user cannot read Tenant A trades'
);

-- User B cannot see Tenant A Hermes observations
select is_empty(
  $$
    select o.id
    from public.hermes_liquidity_observations o
    where o.id = (select (data->>'obs_a')::uuid from _rls_fixture)
  $$,
  'Tenant B user cannot read Tenant A liquidity observations'
);

-- User B cannot see Tenant A coaching reports
select is_empty(
  $$
    select r.id
    from public.coaching_reports r
    where r.id = (select (data->>'report_a')::uuid from _rls_fixture)
  $$,
  'Tenant B user cannot read Tenant A coaching reports'
);

-- User B cannot insert trades into Tenant A
select throws_ok(
  format(
    $sql$
      insert into public.trades (
        tenant_id, user_id, symbol, direction, entry_time, entry_price, quantity, trade_fingerprint
      )
      values (
        %L::uuid,
        auth.uid(),
        'HACK',
        'long',
        now(),
        1,
        1,
        'rls-cross-tenant-write-block'
      )
    $sql$,
    (select data->>'tenant_a' from _rls_fixture)
  ),
  '42501',
  'Tenant B user cannot write Tenant A trades'
);

-- User B cannot update Tenant A trade
select throws_ok(
  format(
    $sql$
      update public.trades
      set symbol = 'HACKED'
      where id = %L::uuid
    $sql$,
    (select data->>'trade_a' from _rls_fixture)
  ),
  '42501',
  'Tenant B user cannot update Tenant A trades'
);

-- User B cannot delete Tenant A trade
select throws_ok(
  format(
    $sql$
      delete from public.trades
      where id = %L::uuid
    $sql$,
    (select data->>'trade_a' from _rls_fixture)
  ),
  '42501',
  'Tenant B user cannot delete Tenant A trades'
);

-- User B cannot update Tenant A coaching report
select throws_ok(
  format(
    $sql$
      update public.coaching_reports
      set summary_text = 'HACKED'
      where id = %L::uuid
    $sql$,
    (select data->>'report_a' from _rls_fixture)
  ),
  '42501',
  'Tenant B user cannot update Tenant A coaching reports'
);

-- Dual-tenant member cannot read another user's trade in shared tenant
select tests.authenticate_as('dual_tenant_user');
select is_empty(
  $$
    select t.id
    from public.trades t
    where t.id = (select (data->>'trade_a')::uuid from _rls_fixture)
  $$,
  'Dual-tenant user cannot read another user trade in shared tenant'
);

select * from finish();
rollback;
