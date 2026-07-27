-- Product management foundation for Tarterie Sophie
-- Run this once in the Supabase SQL editor (or via `supabase db push`) against your project.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  price       numeric(10,2) not null,
  category    text not null check (category in ('klassieker', 'klein-gebak')),
  allergens   text[] not null default '{}',
  in_stock    boolean not null default true,
  active      boolean not null default true,
  featured    boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  image_url  text not null,
  alt_text   text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists custom_cake_offer (
  id         smallint primary key default 1 check (id = 1),
  intro      text not null,
  price      numeric(10,2) not null,
  price_unit text not null default 'EUR/pp',
  detail     text not null,
  fillings   text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists custom_cake_gallery_images (
  id         uuid primary key default gen_random_uuid(),
  offer_id   smallint not null default 1 references custom_cake_offer(id) on delete cascade,
  image_url  text not null,
  alt_text   text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_id_idx on product_images(product_id);
create index if not exists custom_cake_gallery_images_offer_id_idx on custom_cake_gallery_images(offer_id);
create index if not exists products_category_idx on products(category);
create index if not exists products_featured_idx on products(featured) where featured = true;

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on products;
create trigger products_set_updated_at
  before update on products
  for each row execute function set_updated_at();

drop trigger if exists custom_cake_offer_set_updated_at on custom_cake_offer;
create trigger custom_cake_offer_set_updated_at
  before update on custom_cake_offer
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table products enable row level security;
alter table product_images enable row level security;
alter table custom_cake_offer enable row level security;
alter table custom_cake_gallery_images enable row level security;

-- Public storefront reads
create policy "public can read active products"
  on products for select
  to anon, authenticated
  using (active = true);

create policy "authenticated can read all products"
  on products for select
  to authenticated
  using (true);

create policy "public can read product images"
  on product_images for select
  to anon, authenticated
  using (true);

create policy "public can read custom cake offer"
  on custom_cake_offer for select
  to anon, authenticated
  using (true);

create policy "public can read custom cake gallery"
  on custom_cake_gallery_images for select
  to anon, authenticated
  using (true);

-- Admin (authenticated) writes
create policy "authenticated can insert products"
  on products for insert to authenticated with check (true);
create policy "authenticated can update products"
  on products for update to authenticated using (true) with check (true);
create policy "authenticated can delete products"
  on products for delete to authenticated using (true);

create policy "authenticated can insert product images"
  on product_images for insert to authenticated with check (true);
create policy "authenticated can update product images"
  on product_images for update to authenticated using (true) with check (true);
create policy "authenticated can delete product images"
  on product_images for delete to authenticated using (true);

create policy "authenticated can update custom cake offer"
  on custom_cake_offer for update to authenticated using (true) with check (true);

create policy "authenticated can insert custom cake gallery"
  on custom_cake_gallery_images for insert to authenticated with check (true);
create policy "authenticated can update custom cake gallery"
  on custom_cake_gallery_images for update to authenticated using (true) with check (true);
create policy "authenticated can delete custom cake gallery"
  on custom_cake_gallery_images for delete to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Storage bucket
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "public can read product-images bucket"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'product-images');

create policy "authenticated can upload to product-images bucket"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images');

create policy "authenticated can update product-images bucket"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images')
  with check (bucket_id = 'product-images');

create policy "authenticated can delete from product-images bucket"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images');
