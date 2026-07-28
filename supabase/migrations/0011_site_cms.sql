-- CMS for the public site's own copy/photos, so Sophie can edit every page's
-- text, images and workshops from /admin without touching code. Reuses the
-- existing `product-images` bucket for photos (already public with
-- authenticated write policies) under new folders (site/, workshops/).
-- Run this once in the Supabase SQL editor (or via `supabase db push`) against your project.

-- ---------------------------------------------------------------------------
-- Singleton page copy, one JSON blob per page. Shape is owned by the app
-- layer (see src/lib/supabase/types.ts) — keeping it schemaless here avoids a
-- migration for every small wording tweak to a page's fields.
-- ---------------------------------------------------------------------------

create table if not exists page_content (
  page_key    text primary key,
  content     jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

drop trigger if exists page_content_set_updated_at on page_content;
create trigger page_content_set_updated_at
  before update on page_content
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Small editable lists: trust badges (shown on Home + Over mij), the "Zo
-- werkt het" order steps (Bestellen), and workshops (their own page).
-- ---------------------------------------------------------------------------

create table if not exists trust_badges (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  detail      text not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists order_steps (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists workshops (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  event_date   date,
  time_range   text not null default '',
  location     text not null default '',
  price        numeric(10,2),
  description  text not null default '',
  cta_text     text not null default '',
  spots_note   text not null default '',
  image_url    text,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists trust_badges_sort_order_idx on trust_badges(sort_order);
create index if not exists order_steps_sort_order_idx on order_steps(sort_order);
create index if not exists workshops_event_date_idx on workshops(event_date);

drop trigger if exists workshops_set_updated_at on workshops;
create trigger workshops_set_updated_at
  before update on workshops
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security — this is the live site's own copy, so the public
-- storefront needs to read all of it; only authenticated (admin) can write.
-- ---------------------------------------------------------------------------

alter table page_content enable row level security;
alter table trust_badges enable row level security;
alter table order_steps enable row level security;
alter table workshops enable row level security;

create policy "public can read page content"
  on page_content for select to anon, authenticated using (true);
create policy "authenticated can insert page content"
  on page_content for insert to authenticated with check (true);
create policy "authenticated can update page content"
  on page_content for update to authenticated using (true) with check (true);

create policy "public can read trust badges"
  on trust_badges for select to anon, authenticated using (true);
create policy "authenticated can insert trust badges"
  on trust_badges for insert to authenticated with check (true);
create policy "authenticated can update trust badges"
  on trust_badges for update to authenticated using (true) with check (true);
create policy "authenticated can delete trust badges"
  on trust_badges for delete to authenticated using (true);

create policy "public can read order steps"
  on order_steps for select to anon, authenticated using (true);
create policy "authenticated can insert order steps"
  on order_steps for insert to authenticated with check (true);
create policy "authenticated can update order steps"
  on order_steps for update to authenticated using (true) with check (true);
create policy "authenticated can delete order steps"
  on order_steps for delete to authenticated using (true);

create policy "public can read workshops"
  on workshops for select to anon, authenticated using (true);
create policy "authenticated can insert workshops"
  on workshops for insert to authenticated with check (true);
create policy "authenticated can update workshops"
  on workshops for update to authenticated using (true) with check (true);
create policy "authenticated can delete workshops"
  on workshops for delete to authenticated using (true);
