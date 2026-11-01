-- LUMIÈRE: catalog, admin access and lamp photo storage.
--
-- Run once on a Supabase project: paste into the SQL editor, or `supabase db push`. Then run supabase/seed.sql.
-- Safe to re-run: every statement is written to be idempotent.
--
-- Security model
--   * Visitors (anon) and signed-in users can read collections and PUBLISHED products only.
--   * Only administrators can add or edit products, and upload, replace or remove lamp photos. Admin rights end the moment
--     the administrator signs out, even though their last access token would otherwise stay valid until it expires.
--   * Administrators are listed in public.admin_users. Through the API a signed-in user can see only their own row (that is,
--     whether they are an administrator), and nobody can add or change rows: a new account is never an admin until someone
--     adds it from the SQL editor (see docs/ADMIN.md, "Create your administrator").
--   * Nothing grants delete on products: hide a product by unpublishing it.

-- ---------------------------------------------------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------------------------------------------------

create table if not exists public.collections (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(id) <= 60),
  name text not null check (char_length(name) between 1 and 60),
  description text not null default '' check (char_length(description) <= 240),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  -- Stable ID shared by carts and orders. Never changes once created.
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(id) <= 64),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  name text not null check (char_length(name) between 1 and 60),
  finish text not null check (char_length(finish) between 1 and 40),
  collection_id text not null references public.collections (id) on update cascade on delete restrict,
  -- Price in minor units (cents for USD).
  price_cents integer not null check (price_cents between 0 and 10000000),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  stock integer not null default 0 check (stock between 0 and 100000),
  diameter_cm numeric(5, 1) not null check (diameter_cm > 0 and diameter_cm <= 500),
  summary text not null check (char_length(summary) between 1 and 200),
  description text not null check (char_length(description) between 1 and 2000),
  highlights text[] not null default '{}' check (cardinality(highlights) <= 6),
  specs jsonb not null default '[]' check (jsonb_typeof(specs) = 'array' and jsonb_array_length(specs) <= 12),
  -- Paired lamp photos, as paths served by the site: /lamps/<id>-off.webp for the original demo pairs,
  -- /lamps/uploads/<storage path> for photos uploaded through the admin (proxied from the lamp-photos bucket).
  image_off text not null check (image_off ~ '^/lamps/[A-Za-z0-9/_.-]+\.(webp|png)$'),
  image_on text not null check (image_on ~ '^/lamps/[A-Za-z0-9/_.-]+\.(webp|png)$'),
  image_alt text not null check (char_length(image_alt) between 1 and 200),
  image_width integer not null check (image_width between 200 and 4000),
  image_height integer not null check (image_height between 300 and 6000),
  -- Cord length on the rail: longer cords hang lower and swing more slowly.
  cord_drop numeric(3, 2) not null default 0.75 check (cord_drop between 0.3 and 1.2),
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_collection_idx on public.products (collection_id);
create index if not exists products_published_sort_idx on public.products (is_published, sort_order);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------------------------------------------------
-- Functions and triggers
-- ---------------------------------------------------------------------------------------------------------------------

-- Signing out ends a session, but its access token stays valid until it expires (an hour by default). Admin rights therefore
-- also require the token's session to still exist, so signing out ends them at once: in the admin, the Data API and Storage.
-- SECURITY DEFINER because only the database owner can read auth.sessions. It lives in the private schema, which the Data API
-- doesn't expose: policies can use it, but it can't be called over HTTP, and it only ever answers for the caller's own session.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.session_is_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from auth.sessions
    where id = nullif((select auth.jwt()) ->> 'session_id', '')::uuid
      and user_id = (select auth.uid())
      and (not_after is null or not_after > now())
  );
$$;

revoke all on function private.session_is_active() from public, anon;
grant execute on function private.session_is_active() to authenticated;

-- True when the signed-in user is listed in admin_users and their session is still active. It runs with the caller's own
-- rights (SECURITY INVOKER): the admin_users policy below lets each user see only their own row, which is all this check
-- needs. The empty search_path keeps the function safe from schema tricks.
create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()))
     and (select private.session_is_active());
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Keeps updated_at current and makes id and created_at immutable.
create or replace function public.products_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'Product IDs cannot change (% -> %)', old.id, new.id using errcode = 'check_violation';
  end if;
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.products_before_update() from public, anon, authenticated;

drop trigger if exists products_before_update on public.products;
create trigger products_before_update
before update on public.products
for each row execute function public.products_before_update();

-- ---------------------------------------------------------------------------------------------------------------------
-- Grants: start from nothing, then allow exactly what the policies below cover.
-- ---------------------------------------------------------------------------------------------------------------------

revoke all on table public.collections, public.products, public.admin_users from anon, authenticated;
grant select on table public.collections, public.products to anon, authenticated;
grant insert, update on table public.products to authenticated;
grant select on table public.admin_users to authenticated;

-- ---------------------------------------------------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------------------------------------------------

alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "Users can see their own admin row" on public.admin_users;
create policy "Users can see their own admin row"
  on public.admin_users for select
  to authenticated
  using (user_id = (select auth.uid()));
-- No insert, update or delete policies (and no such grants): the list can only be changed from the SQL editor.

drop policy if exists "Collections are public" on public.collections;
create policy "Collections are public"
  on public.collections for select
  to anon, authenticated
  using (true);

drop policy if exists "Published products are public" on public.products;
create policy "Published products are public"
  on public.products for select
  to anon
  using (is_published);

-- One read policy per role: signed-in users see what visitors see, and administrators see every product.
drop policy if exists "Signed-in users see published products, admins see all" on public.products;
create policy "Signed-in users see published products, admins see all"
  on public.products for select
  to authenticated
  using (is_published or (select public.is_admin()));

drop policy if exists "Admins can add products" on public.products;
create policy "Admins can add products"
  on public.products for insert
  to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Admins can edit products" on public.products;
create policy "Admins can edit products"
  on public.products for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------------------------------------------------
-- Storage: lamp photo pairs
-- ---------------------------------------------------------------------------------------------------------------------

-- Public bucket: anyone can download a photo by its URL, which the storefront needs. Uploads are limited to WebP and PNG
-- up to 4 MB, and only administrators can add, replace, list or remove files.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lamp-photos', 'lamp-photos', true, 4194304, array['image/webp', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins can list lamp photos" on storage.objects;
create policy "Admins can list lamp photos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'lamp-photos' and (select public.is_admin()));

drop policy if exists "Admins can upload lamp photos" on storage.objects;
create policy "Admins can upload lamp photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'lamp-photos' and (select public.is_admin()));

drop policy if exists "Admins can replace lamp photos" on storage.objects;
create policy "Admins can replace lamp photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'lamp-photos' and (select public.is_admin()))
  with check (bucket_id = 'lamp-photos' and (select public.is_admin()));

drop policy if exists "Admins can remove lamp photos" on storage.objects;
create policy "Admins can remove lamp photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'lamp-photos' and (select public.is_admin()));
