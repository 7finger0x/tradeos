-- Expanded RLS foundation tests
-- Run: npx supabase test db

begin;
select plan(10);

select has_table('public', 'tenants', 'tenants table exists');
select has_table('public', 'tenant_members', 'tenant_members table exists');
select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'audit_events', 'audit_events table exists');
select has_table('public', 'risk_rules', 'risk_rules table exists');

select row_eq(
  $$ select relrowsecurity from pg_class where relname = 'tenants' $$,
  row(true::boolean),
  'RLS enabled on tenants'
);

select row_eq(
  $$ select relrowsecurity from pg_class where relname = 'tenant_members' $$,
  row(true::boolean),
  'RLS enabled on tenant_members'
);

select row_eq(
  $$ select relrowsecurity from pg_class where relname = 'profiles' $$,
  row(true::boolean),
  'RLS enabled on profiles'
);

select policies_are(
  'public',
  'tenant_members',
  array['tenant_members_select_same_tenant', 'tenant_members_insert_admin'],
  'tenant_members has tenant-scoped policies'
);

select has_function(
  'public',
  'user_tenant_ids',
  array[]::text[],
  'user_tenant_ids helper exists for tenant scoping'
);

select has_enum('public', 'app_role', 'app_role enum exists');

select * from finish();
rollback;
