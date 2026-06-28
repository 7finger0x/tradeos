-- Seed helper for local dev: creates tenant + membership after manual signup
-- Usage: run after creating a user via Supabase Auth

create or replace function public.bootstrap_user_tenant(
  p_user_id uuid,
  p_tenant_name text default 'My Trading Desk'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
begin
  insert into public.tenants (name)
  values (p_tenant_name)
  returning id into v_tenant_id;

  insert into public.tenant_members (tenant_id, user_id, role)
  values (v_tenant_id, p_user_id, 'tenant_admin');

  return v_tenant_id;
end;
$$;

revoke all on function public.bootstrap_user_tenant(uuid, text) from public;
grant execute on function public.bootstrap_user_tenant(uuid, text) to service_role;
