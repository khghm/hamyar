-- Reset helper for the local validation environment.
--
-- Storage policies live on storage.objects, outside the public schema, so
-- `drop schema public cascade` leaves them behind and migration 004 then
-- collides with its own leftovers on a re-run.
do $$
declare
  p text;
begin
  for p in select policyname from pg_policies where schemaname = 'storage' loop
    execute format('drop policy if exists %I on storage.objects', p);
  end loop;
end $$;

delete from storage.buckets where id = 'order-documents';