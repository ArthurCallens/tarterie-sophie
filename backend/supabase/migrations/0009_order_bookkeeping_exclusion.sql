-- Lets Sophie remove a wrongly-priced order from the Boekhouding ledger
-- without touching the order itself (it stays exactly as-is in Archief).
-- Run this once in the Supabase SQL editor (or via `supabase db push`) against your project.

alter table orders
  add column if not exists excluded_from_bookkeeping boolean not null default false;
