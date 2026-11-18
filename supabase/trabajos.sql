-- Diego's job posts: the table, the photo bucket and the rules that protect them.
--
-- Run it in the Supabase SQL editor. It is safe to run again: it replaces its own rules.
-- Before running: create the users who may publish (Authentication → Users → Add user)
-- and write their emails in step 5.


-- 1. Who may publish.
-- The list lives in a schema the API does not expose, so nobody can read or change it from a browser.

create schema if not exists private;

create table if not exists private.autores (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table private.autores enable row level security;

-- True when the signed-in user is on the list. Runs with the owner's rights to read the list;
-- the empty search_path keeps a caller from swapping in a table of their own.
create or replace function private.es_autor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from private.autores where user_id = (select auth.uid())
  );
$$;

revoke all on function private.es_autor() from public;
grant usage on schema private to authenticated;
grant execute on function private.es_autor() to authenticated;


-- 2. The posts.

create table if not exists public.trabajos (
  id uuid primary key default gen_random_uuid(),
  creado timestamptz not null default now(),
  autor uuid not null default auth.uid() references auth.users (id),

  -- The kind of job, as the site names its services.
  tipo text not null check (tipo in ('interiores', 'exteriores', 'hierro-madera', 'grietas-humedad', 'arreglos')),

  -- Only the neighbourhood, never an address: digits are refused so a street number cannot slip in.
  barrio text not null check (char_length(btrim(barrio)) between 2 and 40 and barrio !~ '[0-9]'),

  texto text not null default '' check (char_length(texto) <= 600),

  -- Paths inside the "trabajos" bucket, in the order they are shown: <user id>/<photo id>.jpg.
  -- Anything else is refused, so a post can never point at a file outside the bucket.
  fotos text[] not null check (
    cardinality(fotos) between 1 and 10
    and array_to_string(fotos, ' ') ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg( [0-9a-f-]{36}/[0-9a-f-]{36}\.jpg)*$'
  )
);

alter table public.trabajos enable row level security;

-- Start from nothing, then give each role only what it needs. There is no update: a post is deleted and made again.
revoke all on public.trabajos from anon, authenticated;
grant select on public.trabajos to anon, authenticated;
grant insert, delete on public.trabajos to authenticated;

drop policy if exists "anyone reads the posts" on public.trabajos;
create policy "anyone reads the posts"
on public.trabajos for select
to anon, authenticated
using (true);

drop policy if exists "authors publish as themselves" on public.trabajos;
create policy "authors publish as themselves"
on public.trabajos for insert
to authenticated
with check ((select private.es_autor()) and autor = (select auth.uid()));

-- Any author may delete any post, so a post can be taken down without its author.
drop policy if exists "authors delete posts" on public.trabajos;
create policy "authors delete posts"
on public.trabajos for delete
to authenticated
using ((select private.es_autor()));


-- 3. The photos.
-- A public bucket: the site build downloads the photos by their public address.
-- The upload page shrinks every photo to a JPEG well under this limit.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('trabajos', 'trabajos', true, 2097152, array['image/jpeg'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- An author uploads only into the folder named after their own user id.
drop policy if exists "authors upload job photos" on storage.objects;
create policy "authors upload job photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'trabajos'
  and (select private.es_autor())
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Deleting a file needs to see it first, so authors get both.
drop policy if exists "authors see job photos" on storage.objects;
create policy "authors see job photos"
on storage.objects for select
to authenticated
using (bucket_id = 'trabajos' and (select private.es_autor()));

drop policy if exists "authors delete job photos" on storage.objects;
create policy "authors delete job photos"
on storage.objects for delete
to authenticated
using (bucket_id = 'trabajos' and (select private.es_autor()));


-- 4. (Nothing to run.) Switch off public sign-ups in the dashboard:
-- Authentication → Sign In / Providers → "Allow new users to sign up".
-- The list in step 1 already stops a stranger from publishing; this stops them from creating an account at all.


-- 5. The people who may publish. Replace the two emails with the real ones before running.

insert into private.autores (user_id)
select id from auth.users
where email in ('MAIL-DE-DIEGO', 'MAIL-DE-LUCA')
on conflict do nothing;


-- 6. Check: this must list the emails from step 5. If it comes back empty, nobody can publish.

select u.email as puede_publicar
from private.autores a
join auth.users u on u.id = a.user_id
order by u.email;
