-- Orders: customers submit via the storefront order form, Sophie manages them from the admin dashboard.
-- Run this once in the Supabase SQL editor (or via `supabase db push`) against your project.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

create table if not exists orders (
  id             uuid primary key default gen_random_uuid(),
  status         text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  customer_name  text not null,
  customer_email text not null,
  occasion       text not null,
  servings       integer not null,
  flavor         text not null,
  allergens      text[] not null default '{}',
  pickup_date    date not null,
  message        text,
  price          numeric(10,2),
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists orders_status_idx on orders(status);
create index if not exists orders_pickup_date_idx on orders(pickup_date);

-- ---------------------------------------------------------------------------
-- updated_at trigger (reuses set_updated_at() from 0001_products_foundation.sql)
-- ---------------------------------------------------------------------------

drop trigger if exists orders_set_updated_at on orders;
create trigger orders_set_updated_at
  before update on orders
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table orders enable row level security;

-- Storefront: anyone can submit an order, nobody can read/list orders back.
create policy "public can submit orders"
  on orders for insert
  to anon, authenticated
  with check (true);

-- Admin (authenticated) manage.
create policy "authenticated can read orders"
  on orders for select
  to authenticated
  using (true);

create policy "authenticated can update orders"
  on orders for update
  to authenticated
  using (true) with check (true);

create policy "authenticated can delete orders"
  on orders for delete
  to authenticated
  using (true);
