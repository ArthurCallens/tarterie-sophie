-- Bookkeeping: manual income/expense ledger entries, plus a private storage
-- bucket for proofs (receipts, invoices, scanned photos). Order-based income
-- is derived directly from `orders`/`invoices` in the app layer — not
-- duplicated here — so this only covers what isn't already tracked: manual
-- income and all expenses (variable, e.g. ingredients, or fixed, e.g. a mixer).
-- Run this once in the Supabase SQL editor (or via `supabase db push`) against your project.

create table if not exists income_entries (
  id                  uuid primary key default gen_random_uuid(),
  amount              numeric(10,2) not null check (amount > 0),
  description         text not null,
  entry_date          date not null default current_date,
  proof_storage_path  text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists expense_entries (
  id                  uuid primary key default gen_random_uuid(),
  expense_type        text not null check (expense_type in ('variable', 'fixed')),
  amount              numeric(10,2) not null check (amount > 0),
  description         text not null,
  entry_date          date not null default current_date,
  proof_storage_path  text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists income_entries_entry_date_idx on income_entries(entry_date);
create index if not exists expense_entries_entry_date_idx on expense_entries(entry_date);
create index if not exists expense_entries_type_idx on expense_entries(expense_type);

drop trigger if exists income_entries_set_updated_at on income_entries;
create trigger income_entries_set_updated_at
  before update on income_entries
  for each row execute function set_updated_at();

drop trigger if exists expense_entries_set_updated_at on expense_entries;
create trigger expense_entries_set_updated_at
  before update on expense_entries
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security — financial records, admin-only. No anon policies.
-- ---------------------------------------------------------------------------

alter table income_entries enable row level security;
alter table expense_entries enable row level security;

create policy "authenticated can read income entries"
  on income_entries for select to authenticated using (true);
create policy "authenticated can insert income entries"
  on income_entries for insert to authenticated with check (true);
create policy "authenticated can update income entries"
  on income_entries for update to authenticated using (true) with check (true);
create policy "authenticated can delete income entries"
  on income_entries for delete to authenticated using (true);

create policy "authenticated can read expense entries"
  on expense_entries for select to authenticated using (true);
create policy "authenticated can insert expense entries"
  on expense_entries for insert to authenticated with check (true);
create policy "authenticated can update expense entries"
  on expense_entries for update to authenticated using (true) with check (true);
create policy "authenticated can delete expense entries"
  on expense_entries for delete to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Private storage bucket for proofs (receipts/invoices as photo or PDF).
-- Never public — viewed via short-lived signed URLs from the admin dashboard.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('bookkeeping-proofs', 'bookkeeping-proofs', false)
on conflict (id) do nothing;

create policy "authenticated can read bookkeeping-proofs bucket"
  on storage.objects for select to authenticated using (bucket_id = 'bookkeeping-proofs');
create policy "authenticated can upload to bookkeeping-proofs bucket"
  on storage.objects for insert to authenticated with check (bucket_id = 'bookkeeping-proofs');
create policy "authenticated can delete from bookkeeping-proofs bucket"
  on storage.objects for delete to authenticated using (bucket_id = 'bookkeeping-proofs');
