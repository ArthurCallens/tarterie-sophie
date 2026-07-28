-- Orders phase 2: reference photos, an 'archived' status, and price-gated acceptance.
-- Run this once in the Supabase SQL editor (or via `supabase db push`) against your project.

-- ---------------------------------------------------------------------------
-- Reference photo
-- ---------------------------------------------------------------------------

alter table orders add column if not exists reference_photo_url text;

-- ---------------------------------------------------------------------------
-- Widen the status check constraint to allow 'archived'
-- ---------------------------------------------------------------------------

alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check
  check (status in ('pending', 'accepted', 'declined', 'archived'));

-- ---------------------------------------------------------------------------
-- Storage bucket for customer-submitted reference photos
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('order-references', 'order-references', true)
on conflict (id) do nothing;

create policy "public can read order-references bucket"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'order-references');

create policy "public can upload to order-references bucket"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'order-references');

create policy "authenticated can delete from order-references bucket"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'order-references');
