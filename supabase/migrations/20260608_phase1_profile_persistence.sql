alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists quote text,
  add column if not exists age integer,
  add column if not exists backstory text,
  add column if not exists personality text,
  add column if not exists appearance text,
  add column if not exists updated_at timestamptz default now();

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public read avatars'
  ) then
    create policy "Public read avatars"
    on storage.objects
    for select
    to public
    using (bucket_id = 'avatars');
  end if;
end $$;
