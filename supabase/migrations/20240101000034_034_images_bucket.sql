-- =========================================================================
-- 34. STORAGE BUCKET: images (public) ======================================
-- =========================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('images', 'images', true, 5242880,
        ARRAY['image/jpeg','image/png','image/jpg','image/webp','image/gif'])
on conflict (id) do nothing;

-- Storage path convention: <folder>/<uuid>.<ext>
-- Public bucket - anyone can read, authenticated users can upload
create policy "storage_images_read" on storage.objects
  for select using (
    bucket_id = 'images'
  );

create policy "storage_images_upload" on storage.objects
  for insert with check (
    bucket_id = 'images'
    and auth.role() = 'authenticated'
  );

create policy "storage_images_update" on storage.objects
  for update using (
    bucket_id = 'images'
    and auth.role() = 'authenticated'
  )
  with check (
    bucket_id = 'images'
    and auth.role() = 'authenticated'
  );

create policy "storage_images_delete" on storage.objects
  for delete using (
    bucket_id = 'images'
    and auth.role() = 'authenticated'
  );