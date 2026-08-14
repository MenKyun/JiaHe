create extension if not exists pgcrypto;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create table if not exists public.products (
  id text primary key,
  name text not null,
  display_name text not null,
  category text not null,
  brand text not null default 'TR.tw',
  price integer not null default 0 check (price >= 0),
  original_price integer not null default 0 check (original_price >= 0),
  badge text not null default 'TR 精選',
  description text not null default '',
  mark text not null default 'TR',
  source_product_id text,
  source_category text,
  images jsonb not null default '[]'::jsonb check (jsonb_typeof(images) = 'array'),
  detail_images jsonb not null default '[]'::jsonb check (jsonb_typeof(detail_images) = 'array'),
  videos jsonb not null default '[]'::jsonb check (jsonb_typeof(videos) = 'array'),
  variants jsonb not null default '[]'::jsonb check (jsonb_typeof(variants) = 'array'),
  active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_content (
  id text primary key default 'default',
  content jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('TR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  customer jsonb not null default '{}'::jsonb,
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) > 0),
  total integer not null check (total >= 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists site_content_set_updated_at on public.site_content;
create trigger site_content_set_updated_at before update on public.site_content
for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders
for each row execute function public.set_updated_at();

alter table public.products enable row level security;
alter table public.site_content enable row level security;
alter table public.orders enable row level security;

create policy "Public reads active products" on public.products
for select to anon, authenticated using (active or public.is_admin());
create policy "Admins create products" on public.products
for insert to authenticated with check (public.is_admin());
create policy "Admins update products" on public.products
for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete products" on public.products
for delete to authenticated using (public.is_admin());

create policy "Public reads site content" on public.site_content
for select to anon, authenticated using (true);
create policy "Admins create site content" on public.site_content
for insert to authenticated with check (public.is_admin());
create policy "Admins update site content" on public.site_content
for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Anyone creates an order" on public.orders
for insert to anon, authenticated with check (status = 'pending' and total >= 0);
create policy "Admins read orders" on public.orders
for select to authenticated using (public.is_admin());
create policy "Admins update orders" on public.orders
for update to authenticated using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Public reads media" on storage.objects
for select to anon, authenticated using (bucket_id = 'media');
create policy "Admins upload media" on storage.objects
for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
create policy "Admins update media" on storage.objects
for update to authenticated using (bucket_id = 'media' and public.is_admin()) with check (bucket_id = 'media' and public.is_admin());
create policy "Admins delete media" on storage.objects
for delete to authenticated using (bucket_id = 'media' and public.is_admin());
