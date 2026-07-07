-- Storage buckets for avatars and memory-vault photos.
-- Files are stored under a folder named after the owner's user id, which is
-- what the policies below enforce.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('vault-photos', 'vault-photos', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "storage: public read"
  on storage.objects for select
  using (bucket_id in ('avatars', 'vault-photos'));

create policy "storage: users upload to own folder"
  on storage.objects for insert
  with check (
    bucket_id in ('avatars', 'vault-photos')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "storage: users update own files"
  on storage.objects for update
  using (
    bucket_id in ('avatars', 'vault-photos')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "storage: users delete own files"
  on storage.objects for delete
  using (
    bucket_id in ('avatars', 'vault-photos')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
