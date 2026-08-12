-- Portfolio — Supabase Storage setup (run once)
-- Supabase → Storage → New bucket, OR SQL Editor → paste → Run

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-images',
  'portfolio-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read portfolio images" on storage.objects;

create policy "Public read portfolio images"
on storage.objects
for select
to public
using (bucket_id = 'portfolio-images');
