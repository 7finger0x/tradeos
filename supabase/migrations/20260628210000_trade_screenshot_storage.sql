-- Phase 11: trade-screenshots storage RLS
-- Object path: {tenant_id}/{user_id}/{trade_id}/{uuid}.{ext}

create or replace function public.trade_screenshot_tenant_id(object_name text)
returns uuid
language sql
immutable
as $$
  select nullif(split_part(object_name, '/', 1), '')::uuid;
$$;

create or replace function public.trade_screenshot_user_id(object_name text)
returns uuid
language sql
immutable
as $$
  select nullif(split_part(object_name, '/', 2), '')::uuid;
$$;

create policy "trade_screenshots_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'trade-screenshots'
    and public.trade_screenshot_tenant_id(name) in (select public.user_tenant_ids())
    and public.trade_screenshot_user_id(name) = auth.uid()
  );

create policy "trade_screenshots_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'trade-screenshots'
    and public.trade_screenshot_tenant_id(name) in (select public.user_tenant_ids())
    and public.trade_screenshot_user_id(name) = auth.uid()
  );

create policy "trade_screenshots_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'trade-screenshots'
    and public.trade_screenshot_tenant_id(name) in (select public.user_tenant_ids())
    and public.trade_screenshot_user_id(name) = auth.uid()
  )
  with check (
    bucket_id = 'trade-screenshots'
    and public.trade_screenshot_tenant_id(name) in (select public.user_tenant_ids())
    and public.trade_screenshot_user_id(name) = auth.uid()
  );

create policy "trade_screenshots_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'trade-screenshots'
    and public.trade_screenshot_tenant_id(name) in (select public.user_tenant_ids())
    and public.trade_screenshot_user_id(name) = auth.uid()
  );
