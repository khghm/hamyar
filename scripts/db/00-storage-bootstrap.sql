-- Local validation environment only -- NOT part of the repo migrations.
--
-- The stock supabase/postgres image ships a minimal `storage.buckets` stub
-- (id, name, owner, created_at, updated_at). A real Supabase project has the
-- extra columns below because the Storage service adds them on boot. We add
-- them so the local environment matches production before migration 004
-- creates policies and buckets against this table.
alter table storage.buckets
  add column if not exists public boolean default false,
  add column if not exists file_size_limit bigint,
  add column if not exists allowed_mime_types text[],
  add column if not exists file_cache_ttl integer;

select 'storage.buckets extended' as result;