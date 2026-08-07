-- Two fixes:
--
-- 1. The `invoices` storage bucket had no read policy for the browser, so
--    clicking "Bewijs" on an order-income row (which points at that order's
--    invoice PDF) could never generate a signed URL. Admin (authenticated)
--    now gets read access, same as every other bucket.
--
-- 2. `income_entries` gains `proof_bucket` (a manual entry's proof always
--    lives in bookkeeping-proofs, but a snapshot of a deleted order's income
--    points at its original invoice PDF in the invoices bucket instead) and
--    `origin` (distinguishes a real manual entry from an automatic snapshot
--    taken when an order was deleted, so its income survives in the ledger).
--
-- Run this once in the Supabase SQL editor (or via `supabase db push`) against your project.

create policy "authenticated can read invoices bucket"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'invoices');

alter table income_entries
  add column if not exists proof_bucket text not null default 'bookkeeping-proofs'
    check (proof_bucket in ('bookkeeping-proofs', 'invoices'));

alter table income_entries
  add column if not exists origin text not null default 'manual'
    check (origin in ('manual', 'order_snapshot'));
